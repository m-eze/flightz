"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { formatPrice, formatDuration, formatTime, formatDate, generateBookingReference } from "@/lib/utils";

interface FlightDetail {
  id: string;
  flightNumber: string;
  airline: { name: string; iata: string | null; logo: string | null };
  origin: { code: string; name: string; city: string };
  destination: { code: string; name: string; city: string };
  departureTime: string;
  arrivalTime: string;
  duration: number;
  price: number;
  currency: string;
  availableSeats: number;
  aircraft: string | null;
  status: string;
}

export default function BookPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pax = parseInt(searchParams.get("pax") || "1");

  const [flight, setFlight] = useState<FlightDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [success, setSuccess] = useState(false);
  const [bookingRef, setBookingRef] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch(`/api/flights/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) router.push("/flights");
        else setFlight(data);
      })
      .catch(() => router.push("/flights"))
      .finally(() => setLoading(false));
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = "Full name is required";
    if (!form.email.trim() || !form.email.includes("@")) newErrors.email = "Valid email is required";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setBooking(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flightId: id,
          passengerName: form.name,
          passengerEmail: form.email,
          passengerPhone: form.phone || null,
          passengers: pax,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setErrors({ submit: data.error });
      } else {
        setBookingRef(data.bookingReference);
        setSuccess(true);
      }
    } catch {
      setErrors({ submit: "Booking failed. Please try again." });
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full" />
      </div>
    );
  }

  if (success) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold mb-2">Booking Confirmed!</h1>
          <p className="text-gray-500 mb-6">
            Your flight has been booked successfully. Reference: <strong className="text-indigo-600">{bookingRef}</strong>
          </p>
          {flight && (
            <div className="bg-gray-50 rounded-lg p-4 text-left text-sm mb-6">
              <p className="font-medium">{flight.airline.name} · {flight.flightNumber}</p>
              <p className="text-gray-500 mt-1">
                {flight.origin.city} ({flight.origin.code}) → {flight.destination.city} ({flight.destination.code})
              </p>
              <p className="text-gray-500">
                {formatDate(flight.departureTime)} · {formatTime(flight.departureTime)} — {formatTime(flight.arrivalTime)} · {formatDuration(flight.duration)}
              </p>
              <p className="text-gray-500">{pax} passenger{pax > 1 ? "s" : ""} · {formatPrice(flight.price * pax)}</p>
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={() => router.push("/")} className="flex-1 bg-gray-100 hover:bg-gray-200 py-2 rounded-lg text-sm transition">
              New Search
            </button>
            <button onClick={() => router.push("/dashboard")} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm transition">
              My Bookings
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!flight) return null;

  const totalPrice = flight.price * pax;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-3">
          <a href="/" className="text-xl font-bold text-indigo-600">✈️ NFlightz</a>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-6">Complete Your Booking</h1>

        {/* Flight Summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold mb-3">Flight Details</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{flight.airline.name}</p>
              <p className="text-sm text-gray-500">{flight.flightNumber} · {flight.aircraft}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-indigo-600">{formatPrice(totalPrice)}</p>
              <p className="text-xs text-gray-400">for {pax} passenger{pax > 1 ? "s" : ""}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
            <div>
              <p className="text-xl font-bold">{formatTime(flight.departureTime)}</p>
              <p className="text-sm text-gray-500">{flight.origin.code} · {flight.origin.city}</p>
            </div>
            <div className="flex-1 text-center">
              <p className="text-xs text-gray-400">{formatDuration(flight.duration)}</p>
              <div className="flex items-center gap-1 justify-center">
                <div className="w-12 h-px bg-gray-300" />
                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                <div className="w-12 h-px bg-gray-300" />
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold">{formatTime(flight.arrivalTime)}</p>
              <p className="text-sm text-gray-500">{flight.destination.code} · {flight.destination.city}</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">{formatDate(flight.departureTime)} · {flight.availableSeats} seats remaining</p>
        </div>

        {/* Passenger Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold mb-4">Passenger Details</h2>
          {errors.submit && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{errors.submit}</div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={`w-full rounded-lg border ${errors.name ? "border-red-400" : "border-gray-200"} px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                placeholder="John Doe" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={`w-full rounded-lg border ${errors.email ? "border-red-400" : "border-gray-200"} px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                placeholder="john@example.com" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone (optional)</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="+234 800 000 0000" />
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-bold text-indigo-600">{formatPrice(totalPrice)}</p>
            </div>
            <button type="submit" disabled={booking}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold px-8 py-3 rounded-lg transition">
              {booking ? "Booking..." : "Confirm Booking"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
