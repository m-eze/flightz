"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice, formatDuration, formatTime, formatDate } from "@/lib/utils";

interface LegInfo {
  legType: string;
  legOrder: number;
  flight: {
    flightNumber: string;
    departureTime: string;
    arrivalTime: string;
    duration: number;
    airline: { name: string; logo: string | null };
    origin: { code: string; city: string };
    destination: { code: string; city: string };
  };
}

interface BookingItem {
  id: string;
  bookingReference: string;
  passengerName: string;
  passengerEmail: string;
  passengers: number;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  tripType: string;
  createdAt: string;
  legs: LegInfo[];
  flight: LegInfo["flight"] | null;
}

const tripIcons: Record<string, string> = { oneway: "→", return: "⇄", multistop: "↗" };

const statusStyle: Record<string, string> = {
  cancelled: "bg-red-50 text-red-700 border-red-200",
  paid: "bg-green-50 text-green-700 border-green-200",
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  unpaid: "bg-yellow-50 text-yellow-700 border-yellow-200",
};

export default function DashboardPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchRef, setSearchRef] = useState("");
  const [error, setError] = useState("");

  const fetchBookings = async (ref?: string) => {
    setLoading(true);
    setError("");
    try {
      const url = ref ? `/api/bookings?ref=${ref}` : "/api/bookings";
      const res = await fetch(url);
      const data = await res.json();
      if (data.error) setError(data.error);
      else setBookings(Array.isArray(data) ? data : []);
    } catch {
      setError("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBookings(searchRef);
  };

  const getStatus = (b: BookingItem) => {
    if (b.status === "cancelled") return "Cancelled";
    if (b.paymentStatus === "paid") return "Paid";
    return "Unpaid";
  };

  const statusClass = (b: BookingItem) => {
    if (b.status === "cancelled") return statusStyle.cancelled;
    if (b.paymentStatus === "paid") return statusStyle.paid;
    return statusStyle.unpaid;
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">My Bookings</h1>
            <p className="text-sm text-gray-500 mt-1">View and manage your flight bookings</p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex gap-3 mb-8">
          <input
            type="text"
            value={searchRef}
            onChange={(e) => setSearchRef(e.target.value)}
            placeholder="Search by reference (e.g. NFL-ABC123)"
            className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          />
          <button type="submit" className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition">
            Search
          </button>
          {searchRef && (
            <button type="button" onClick={() => { setSearchRef(""); fetchBookings(); }} className="text-sm text-gray-500 hover:underline px-2">
              Clear
            </button>
          )}
        </form>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-600 text-sm">{error}</div>
        )}

        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin inline-block w-6 h-6 border-4 border-indigo-200 border-t-indigo-600 rounded-full" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
            <div className="text-4xl mb-3">📋</div>
            <h3 className="text-lg font-semibold mb-2">No bookings found</h3>
            <p className="text-gray-500 mb-4 text-sm">
              {searchRef ? "No booking matches this reference" : "You haven't made any bookings yet"}
            </p>
            <button onClick={() => router.push("/")} className="text-indigo-600 hover:underline text-sm font-medium">
              Search flights →
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => (
              <div key={b.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold bg-gray-50 px-2.5 py-1 rounded">{b.bookingReference}</span>
                    <span className="text-xs text-gray-400">{tripIcons[b.tripType] || "→"} {b.tripType}</span>
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${statusClass(b)}`}>
                      {getStatus(b)}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-indigo-600">{formatPrice(b.totalPrice)}</p>
                  </div>
                </div>

                {/* Flight legs */}
                <div className="space-y-2 mb-3">
                  {b.legs && b.legs.length > 0 ? (
                    b.legs.map((leg, i) => {
                      const f = leg.flight;
                      return (
                        <div key={i} className="bg-gray-50 rounded-lg p-3 flex items-center gap-4">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            leg.legType === "outbound" ? "bg-indigo-100 text-indigo-700" :
                            leg.legType === "return" || leg.legType === "inbound" ? "bg-amber-100 text-amber-700" :
                            "bg-green-100 text-green-700"
                          }`}>
                            {leg.legType}
                          </span>
                          <div className="flex items-center gap-2">
                            {f.airline.logo && (
                              <img src={f.airline.logo} alt="" className="w-5 h-5 object-contain" />
                            )}
                            <span className="text-xs font-medium">{f.airline.name}</span>
                            <span className="text-xs text-gray-400">{f.flightNumber}</span>
                          </div>
                          <div className="flex-1 flex items-center justify-center gap-2">
                            <span className="text-sm font-bold">{formatTime(f.departureTime)}</span>
                            <span className="text-xs text-gray-400">{f.origin.code}</span>
                            <div className="w-6 h-px bg-gray-300" />
                            <svg className="w-3 h-3 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                            </svg>
                            <div className="w-6 h-px bg-gray-300" />
                            <span className="text-xs text-gray-400">{f.destination.code}</span>
                            <span className="text-sm font-bold">{formatTime(f.arrivalTime)}</span>
                          </div>
                          <span className="text-xs text-gray-400">{formatDate(f.departureTime)}</span>
                        </div>
                      );
                    })
                  ) : b.flight ? (
                    <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-4">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase bg-indigo-100 text-indigo-700">
                        flight
                      </span>
                      <div className="flex items-center gap-2">
                        {b.flight.airline.logo && (
                          <img src={b.flight.airline.logo} alt="" className="w-5 h-5 object-contain" />
                        )}
                        <span className="text-xs font-medium">{b.flight.airline.name}</span>
                        <span className="text-xs text-gray-400">{b.flight.flightNumber}</span>
                      </div>
                      <div className="flex-1 flex items-center justify-center gap-2">
                        <span className="text-sm font-bold">{formatTime(b.flight.departureTime)}</span>
                        <span className="text-xs text-gray-400">{b.flight.origin.code}</span>
                        <div className="w-6 h-px bg-gray-300" />
                        <svg className="w-3 h-3 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                        </svg>
                        <div className="w-6 h-px bg-gray-300" />
                        <span className="text-xs text-gray-400">{b.flight.destination.code}</span>
                        <span className="text-sm font-bold">{formatTime(b.flight.arrivalTime)}</span>
                      </div>
                      <span className="text-xs text-gray-400">{formatDate(b.flight.departureTime)}</span>
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                  <span>{b.passengerName} · {b.passengers} pax · Booked {formatDate(b.createdAt)}</span>
                  <button onClick={() => router.push(`/dashboard/${b.id}`)} className="text-indigo-600 hover:underline font-medium">
                    View →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
