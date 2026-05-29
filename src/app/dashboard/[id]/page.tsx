"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { formatPrice, formatDuration, formatTime, formatDate } from "@/lib/utils";

type FlightInfo = {
  id: string; flightNumber: string; departureTime: string; arrivalTime: string;
  duration: number; price: number; currency: string; aircraft: string | null;
  airline: { id: string; name: string; iata: string | null };
  origin: { code: string; name: string; city: string };
  destination: { code: string; name: string; city: string };
};

type LegInfo = { legType: string; legOrder: number; flight: FlightInfo };

type BookingDetail = {
  id: string; bookingReference: string; passengerName: string;
  passengerEmail: string; passengerPhone: string | null; passengers: number;
  totalPrice: number; status: string; paymentStatus: string;
  tripType: string; createdAt: string; legs: LegInfo[];
};

const legBadge = (t: string) =>
  t === "outbound" ? "bg-indigo-100 text-indigo-700" :
  t === "inbound" ? "bg-amber-100 text-amber-700" :
  "bg-green-100 text-green-700";

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/bookings");
        const data = await res.json();
        if (data.error) { setError(data.error); return; }
        const found = Array.isArray(data) ? data.find((b: any) => b.id === id) : null;
        if (found) setBooking(found); else setError("Booking not found");
      } catch { setError("Failed to load booking"); }
      finally { setLoading(false); }
    })();
  }, [id]);

  const handleCancel = async () => {
    if (!confirm("Cancel this booking?")) return;
    setCancelling(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "cancel" }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setBooking((p) => p ? { ...p, status: "cancelled" } : p);
    } catch { setError("Failed to cancel"); }
    finally { setCancelling(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full" /></div>;
  if (error || !booking) return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-xl border p-8 text-center max-w-md">
        <p className="text-4xl mb-3">😕</p>
        <h1 className="text-lg font-bold mb-2">Not Found</h1>
        <p className="text-gray-500 mb-4">{error || "Booking not found"}</p>
        <button onClick={() => router.push("/dashboard")} className="text-indigo-600 hover:underline text-sm">Back to Dashboard</button>
      </div>
    </main>
  );

  const cancelled = booking.status === "cancelled";
  const paid = booking.paymentStatus === "paid";

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-12 z-20">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <button onClick={() => router.push("/dashboard")} className="text-sm text-gray-500 hover:text-indigo-600">← Dashboard</button>
          <span className="text-sm"><span className="text-gray-400">Ref: </span><span className="font-mono font-semibold">{booking.bookingReference}</span></span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Status */}
        <div className={`rounded-xl p-4 mb-6 text-center ${
          cancelled ? "bg-red-50 border border-red-200" :
          paid ? "bg-green-50 border border-green-200" :
          "bg-yellow-50 border border-yellow-200"
        }`}>
          <p className={`text-lg font-bold ${cancelled ? "text-red-700" : paid ? "text-green-700" : "text-yellow-700"}`}>
            {cancelled ? "Booking Cancelled" : paid ? "Booking Confirmed" : "Payment Pending"}
          </p>
        </div>

        {/* Passenger */}
        <div className="bg-white rounded-xl border p-6 mb-6">
          <h2 className="font-semibold mb-3">Passenger Details</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-gray-500">Name</p><p className="font-medium">{booking.passengerName}</p></div>
            <div><p className="text-gray-500">Email</p><p className="font-medium">{booking.passengerEmail}</p></div>
            {booking.passengerPhone && <div><p className="text-gray-500">Phone</p><p className="font-medium">{booking.passengerPhone}</p></div>}
            <div><p className="text-gray-500">Passengers</p><p className="font-medium">{booking.passengers}</p></div>
            <div><p className="text-gray-500">Trip Type</p><p className="font-medium capitalize">{booking.tripType}</p></div>
            <div><p className="text-gray-500">Booked</p><p className="font-medium">{formatDate(booking.createdAt)}</p></div>
          </div>
        </div>

        {/* Legs */}
        <div className="bg-white rounded-xl border p-6 mb-6">
          <h2 className="font-semibold mb-4">Flights</h2>
          <div className="space-y-4">
            {booking.legs.map((leg, i) => {
              const f = leg.flight;
              return (
                <div key={i} className={`p-4 rounded-lg border ${cancelled ? "bg-gray-50 border-gray-100" : "bg-indigo-50/20 border-indigo-100"}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${legBadge(leg.legType)}`}>{leg.legType}</span>
                    <span className="font-medium">{f.airline.name}</span>
                    <span className="text-xs text-gray-500">{f.flightNumber}</span>
                    {f.aircraft && <span className="text-xs text-gray-400">{f.aircraft}</span>}
                  </div>
                  <div className="flex items-center gap-4">
                    <div><p className="text-xl font-bold">{formatTime(f.departureTime)}</p><p className="text-sm text-gray-500">{f.origin.code} · {f.origin.city}</p></div>
                    <div className="flex-1 text-center"><p className="text-xs text-gray-400">{formatDuration(f.duration)}</p><div className="flex items-center gap-1 justify-center"><div className="w-16 h-px bg-gray-300" /><div className="w-2 h-2 rounded-full bg-indigo-500" /><div className="w-16 h-px bg-gray-300" /></div></div>
                    <div className="text-right"><p className="text-xl font-bold">{formatTime(f.arrivalTime)}</p><p className="text-sm text-gray-500">{f.destination.code} · {f.destination.city}</p></div>
                    <div className="text-right ml-4"><p className="font-bold text-indigo-600">{formatPrice(f.price * booking.passengers)}</p><p className="text-xs text-gray-500">{booking.passengers} pax</p></div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">{formatDate(f.departureTime)}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Total + Cancel */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Price</p>
              <p className="text-3xl font-bold text-indigo-600">{formatPrice(booking.totalPrice)}</p>
              <p className="text-xs text-gray-400 mt-1">Payment: {paid ? "✅ Paid" : "⏳ Unpaid"}</p>
            </div>
            <div className="flex gap-3">
              {!cancelled && (
                <button onClick={handleCancel} disabled={cancelling}
                  className="px-6 py-3 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 transition">
                  {cancelling ? "Cancelling..." : "Cancel Booking"}
                </button>
              )}
              <button onClick={() => router.push("/dashboard")}
                className="px-6 py-3 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition">Dashboard</button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}