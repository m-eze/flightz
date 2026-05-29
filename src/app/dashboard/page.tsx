"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice, formatDuration, formatTime, formatDate } from "@/lib/utils";

interface BookingItem {
  id: string;
  bookingReference: string;
  passengerName: string;
  passengerEmail: string;
  passengers: number;
  totalPrice: number;
  status: string;
  createdAt: string;
  flight: {
    flightNumber: string;
    departureTime: string;
    arrivalTime: string;
    duration: number;
    airline: { name: string };
    origin: { code: string; city: string };
    destination: { code: string; city: string };
  };
}

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

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBookings(searchRef);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <a href="/" className="text-xl font-bold text-indigo-600">✈️ Flightz</a>
          <button onClick={() => router.push("/")} className="text-sm text-indigo-600 hover:underline">Book a flight</button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-2">My Bookings</h1>
        <p className="text-gray-500 mb-6">View and manage your flight bookings</p>

        {/* Search by reference */}
        <form onSubmit={handleSearch} className="flex gap-3 mb-8">
          <input
            type="text"
            value={searchRef}
            onChange={(e) => setSearchRef(e.target.value)}
            placeholder="Search by booking reference (e.g. FLZ-ABC123)"
            className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button type="submit" className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm hover:bg-indigo-700 transition">
            Search
          </button>
          {searchRef && (
            <button type="button" onClick={() => { setSearchRef(""); fetchBookings(); }} className="text-sm text-gray-500 hover:underline">
              Clear
            </button>
          )}
        </form>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-600 text-sm">{error}</div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin inline-block w-6 h-6 border-4 border-indigo-200 border-t-indigo-600 rounded-full" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-4xl mb-3">📋</p>
            <h3 className="text-lg font-semibold mb-2">No bookings found</h3>
            <p className="text-gray-500 mb-4">
              {searchRef ? "No booking matches this reference" : "You haven't made any bookings yet"}
            </p>
            <button onClick={() => router.push("/")} className="text-indigo-600 hover:underline text-sm">Search flights</button>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => (
              <div key={b.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold">{b.bookingReference}</p>
                    <p className="text-xs text-gray-500">Booked {formatDate(b.createdAt)}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    b.status === "confirmed" ? "bg-green-100 text-green-700" :
                    b.status === "cancelled" ? "bg-red-100 text-red-700" :
                    "bg-gray-100 text-gray-700"
                  }`}>
                    {b.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{b.flight.airline.name}</p>
                    <p className="text-xs text-gray-500">{b.flight.flightNumber}</p>
                  </div>
                  <div className="flex-1 flex items-center justify-center gap-2">
                    <div className="text-right">
                      <p className="font-bold">{formatTime(b.flight.departureTime)}</p>
                      <p className="text-xs text-gray-500">{b.flight.origin.code}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-400">{formatDuration(b.flight.duration)}</p>
                      <div className="w-12 h-px bg-gray-300 mx-auto" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold">{formatTime(b.flight.arrivalTime)}</p>
                      <p className="text-xs text-gray-500">{b.flight.destination.code}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-indigo-600">{formatPrice(b.totalPrice)}</p>
                    <p className="text-xs text-gray-500">{b.passengers} pax</p>
                  </div>
                </div>
                <div className="mt-2 flex justify-between text-xs text-gray-500">
                  <span>{b.passengerName} · {b.passengerEmail}</span>
                  <span>{b.flight.origin.city} → {b.flight.destination.city}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
