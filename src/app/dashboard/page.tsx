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
  flight: LegInfo["flight"] | null; // backward compat
}

const tripIcons: Record<string, string> = {
  oneway: "→",
  return: "⇄",
  multistop: "↗",
};

const legBadge = (type: string) => {
  if (type === "outbound") return "bg-indigo-100 text-indigo-700";
  if (type === "inbound") return "bg-amber-100 text-amber-700";
  return "bg-green-100 text-green-700";
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

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBookings(searchRef);
  };

  return (
    <main className="min-h-screen bg-gray-50 pt-2">


      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-2">My Bookings</h1>
        <p className="text-gray-500 mb-6">View and manage your flight bookings</p>

        <form onSubmit={handleSearch} className="flex gap-3 mb-8">
          <input type="text" value={searchRef} onChange={(e) => setSearchRef(e.target.value)}
            placeholder="Search by booking reference (e.g. NFL-ABC123)"
            className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <button type="submit" className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm hover:bg-indigo-700 transition">Search</button>
          {searchRef && (
            <button type="button" onClick={() => { setSearchRef(""); fetchBookings(); }} className="text-sm text-gray-500 hover:underline">Clear</button>
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
            <p className="text-gray-500 mb-4">{searchRef ? "No booking matches this reference" : "You haven't made any bookings yet"}</p>
            <button onClick={() => router.push("/")} className="text-indigo-600 hover:underline text-sm">Search flights</button>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => (
              <div key={b.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{b.bookingReference}</p>
                      <span className="text-xs text-gray-400">{tripIcons[b.tripType] || tripIcons.oneway} {b.tripType}</span>
                    </div>
                    <p className="text-xs text-gray-500">Booked {formatDate(b.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      b.status === "cancelled" ? "bg-red-100 text-red-700" :
                      b.paymentStatus === "paid" ? "bg-green-100 text-green-700" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>
                      {b.status === "cancelled" ? "CANCELLED" : b.paymentStatus === "paid" ? "PAID" : "UNPAID"}
                    </span>
                    <button onClick={() => router.push(`/dashboard/${b.id}`)}
                      className="text-xs text-indigo-600 hover:underline whitespace-nowrap">View →</button>
                  </div>
                </div>

                {/* Flight legs */}
                <div className="space-y-2">
                  {b.legs && b.legs.length > 0 ? (
                    b.legs.map((leg, i) => {
                      const f = leg.flight;
                      return (
                        <div className="p-3 bg-gray-50 rounded-lg flex items-center gap-4" key={i}>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${legBadge(leg.legType)}`}>
                            {leg.legType}
                          </span>
                          <div className="flex items-center space-x-3">
                            {f.airline.logo && (
                              <img
                                src={f.airline.logo}
                                alt={`${f.airline.name} logo`}
                                className="w-6 h-6 object-contain"
                              />
                            )}
                            <div>
                              <div className="font-medium text-sm">{f.airline.name}</div>
                              <div className="text-xs text-gray-500">{f.flightNumber}</div>
                            </div>
                          </div>
                          <div className="flex-1 flex items-center justify-center gap-2">
                            <div className="text-right">
                              <p className="font-bold text-sm">{formatTime(f.departureTime)}</p>
                              <p className="text-[10px] text-gray-500">{f.origin.code}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] text-gray-400">{formatDuration(f.duration)}</p>
                              <div className="w-10 h-px bg-gray-300 mx-auto" />
                            </div>
                            <div className="text-left">
                              <p className="font-bold text-sm">{formatTime(f.arrivalTime)}</p>
                              <p className="text-[10px] text-gray-500">{f.destination.code}</p>
                            </div>
                          </div>
                          <div className="text-xs text-gray-400">{formatDate(f.departureTime)}</div>
                        </div>
                      );
                    })
                  ) : b.flight ? (
                    /* Backward compat: single flight */
                    <div className="p-3 bg-gray-50 rounded-lg flex items-center gap-4">
                      <div className="flex items-center space-x-3">
                        {b.flight.airline.logo && (
                          <img
                            src={b.flight.airline.logo}
                            alt={`${b.flight.airline.name} logo`}
                            className="w-6 h-6 object-contain"
                          />
                        )}
                        <div>
                          <div className="font-medium text-sm">{b.flight.airline.name}</div>
                          <div className="text-xs text-gray-500">{b.flight.flightNumber}</div>
                        </div>
                      </div>
                      <div className="flex-1 flex items-center justify-center gap-2">
                        <div className="text-right">
                          <p className="font-bold text-sm">{formatTime(b.flight.departureTime)}</p>
                          <p className="text-[10px] text-gray-500">{b.flight.origin.code}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-gray-400">{formatDuration(b.flight.duration)}</p>
                          <div className="w-10 h-px bg-gray-300 mx-auto" />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-sm">{formatTime(b.flight.arrivalTime)}</p>
                          <p className="text-[10px] text-gray-500">{b.flight.destination.code}</p>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="mt-3 flex justify-between items-center">
                  <div className="text-xs text-gray-500">
                    {b.passengerName} · {b.passengerEmail}
                  </div>
                  <p className="font-bold text-indigo-600">{formatPrice(b.totalPrice)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}