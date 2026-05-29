"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { formatPrice, formatDuration, formatTime } from "@/lib/utils";

interface Airline {
  id: string;
  name: string;
  iata: string | null;
  logo: string | null;
}

interface Flight {
  id: string;
  flightNumber: string;
  airline: Airline;
  origin: { code: string; city: string };
  destination: { code: string; city: string };
  departureTime: string;
  arrivalTime: string;
  duration: number;
  price: number;
  currency: string;
  availableSeats: number;
  aircraft: string | null;
}

interface SearchResults {
  flights: Flight[];
  airlines: Airline[];
  total: number;
}

const airportNames: Record<string, string> = {
  LOS: "Lagos", ABV: "Abuja", KAN: "Kano", PHC: "Port Harcourt",
  ENU: "Enugu", QUO: "Uyo", CBQ: "Calabar", BNI: "Benin City",
  QOW: "Owerri", ILR: "Ilorin", IBA: "Ibadan", JOS: "Jos",
  KAD: "Kaduna", AKR: "Akure", ABB: "Asaba", MDG: "Maiduguri",
  SKO: "Sokoto", YOL: "Yola", WAR: "Warri", GMO: "Gombe",
  BCU: "Bauchi", DKA: "Katsina",
};

export default function FlightsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [data, setData] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState("price");
  const [airlineFilter, setAirlineFilter] = useState("");

  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const depart = searchParams.get("depart") || "";
  const pax = searchParams.get("pax") || "1";

  useEffect(() => {
    async function fetchFlights() {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ from, to, depart, pax });
        if (sortBy) params.set("sort", sortBy);
        if (airlineFilter) params.set("airline", airlineFilter);
        const res = await fetch(`/api/flights/search?${params}`);
        const json = await res.json();
        if (json.error) setError(json.error);
        else setData(json);
      } catch {
        setError("Failed to load flights");
      } finally {
        setLoading(false);
      }
    }
    fetchFlights();
  }, [from, to, depart, pax, sortBy, airlineFilter]);

  const handleBook = (flightId: string) => {
    router.push(`/flights/${flightId}/book?pax=${pax}`);
  };

  const departDate = new Date(depart + "T00:00:00");

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <a href="/" className="text-xl font-bold text-indigo-600">✈️ Flightz</a>
          <div className="text-sm text-gray-500">
            <span className="font-medium text-gray-900">{airportNames[from] || from}</span>
            {" → "}
            <span className="font-medium text-gray-900">{airportNames[to] || to}</span>
            {" · "}
            {departDate.toLocaleDateString("en-NG", { weekday: "short", month: "short", day: "numeric" })}
            {" · "}
            {pax} passenger{Number(pax) > 1 ? "s" : ""}
          </div>
          <button onClick={() => router.push("/")} className="text-sm text-indigo-600 hover:underline">New Search</button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 flex gap-6">
        {/* Sidebar Filters */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-20">
            <h3 className="font-semibold text-sm mb-3">Sort by</h3>
            <div className="space-y-2 mb-6">
              {[
                { value: "price", label: "Price (lowest)" },
                { value: "duration", label: "Duration (shortest)" },
                { value: "departure", label: "Departure (earliest)" },
              ].map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" name="sort" value={opt.value} checked={sortBy === opt.value} onChange={(e) => setSortBy(e.target.value)} className="text-indigo-600" />
                  {opt.label}
                </label>
              ))}
            </div>

            <h3 className="font-semibold text-sm mb-3">Airlines</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" name="airline" value="" checked={airlineFilter === ""} onChange={(e) => setAirlineFilter(e.target.value)} className="text-indigo-600" />
                All Airlines
              </label>
              {data?.airlines?.map((a) => (
                <label key={a.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" name="airline" value={a.id} checked={airlineFilter === a.id} onChange={(e) => setAirlineFilter(e.target.value)} className="text-indigo-600" />
                  {a.name}
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Results */}
        <div className="flex-1">
          {loading && (
            <div className="text-center py-20">
              <div className="animate-spin inline-block w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full" />
              <p className="mt-4 text-gray-500">Searching flights...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <p className="text-red-600">{error}</p>
              <button onClick={() => router.push("/")} className="mt-3 text-sm text-indigo-600 hover:underline">Back to search</button>
            </div>
          )}

          {!loading && !error && data && (
            <>
              <p className="text-sm text-gray-500 mb-4">
                {data.total} flight{data.total !== 1 ? "s" : ""} found
              </p>

              {data.flights.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <p className="text-4xl mb-3">🔍</p>
                  <h3 className="text-lg font-semibold mb-2">No flights found</h3>
                  <p className="text-gray-500 mb-4">Try different dates or airports</p>
                  <button onClick={() => router.push("/")} className="text-indigo-600 hover:underline text-sm">New search</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.flights.map((flight) => (
                    <div key={flight.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:border-indigo-300 hover:shadow-md transition cursor-pointer" onClick={() => handleBook(flight.id)}>
                      <div className="flex items-center justify-between">
                        {/* Left: Times + Route */}
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <p className="text-xl font-bold">{formatTime(flight.departureTime)}</p>
                            <p className="text-xs text-gray-500">{flight.origin.code}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-400">{formatDuration(flight.duration)}</p>
                            <div className="flex items-center gap-1">
                              <div className="w-16 h-px bg-gray-300" />
                              <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                              <div className="w-16 h-px bg-gray-300" />
                            </div>
                            <p className="text-xs text-gray-400">direct</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xl font-bold">{formatTime(flight.arrivalTime)}</p>
                            <p className="text-xs text-gray-500">{flight.destination.code}</p>
                          </div>
                        </div>

                        {/* Middle: Airline */}
                        <div className="text-center">
                          <p className="font-medium text-sm">{flight.airline.name}</p>
                          <p className="text-xs text-gray-400">{flight.flightNumber}</p>
                          {flight.aircraft && <p className="text-xs text-gray-400">{flight.aircraft}</p>}
                        </div>

                        {/* Right: Price */}
                        <div className="text-right">
                          <p className="text-2xl font-bold text-indigo-600">{formatPrice(flight.price)}</p>
                          <p className="text-xs text-gray-400">{flight.availableSeats} seats left</p>
                          <button className="mt-2 bg-indigo-600 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-indigo-700 transition">
                            Select
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
