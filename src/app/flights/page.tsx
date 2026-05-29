"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { formatPrice, formatDuration, formatTime, formatDate } from "@/lib/utils";

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

interface LegResult {
  label: string;
  from: string;
  to: string;
  date: string;
  flights: Flight[];
  selected: string | null;
}

const airportNames: Record<string, string> = {
  LOS: "Lagos", ABV: "Abuja", KAN: "Kano", PHC: "Port Harcourt",
  ENU: "Enugu", QUO: "Uyo", CBQ: "Calabar", BNI: "Benin City",
  QOW: "Owerri", ILR: "Ilorin", IBA: "Ibadan", JOS: "Jos",
  KAD: "Kaduna", AKR: "Akure", ABB: "Asaba", MDG: "Maiduguri",
  SKO: "Sokoto", YOL: "Yola", WAR: "Warri", GMO: "Gombe",
  BCU: "Bauchi", DKA: "Katsina",
};

function FlightCard({ flight, selected, onSelect }: { flight: Flight; selected: boolean; onSelect: () => void }) {
  return (
    <div
      onClick={onSelect}
      className={`bg-white rounded-xl border-2 p-5 hover:shadow-md transition cursor-pointer ${
        selected ? "border-indigo-500 bg-indigo-50/30" : "border-gray-200 hover:border-indigo-200"
      }`}
    >
      <div className="flex items-center justify-between">
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
        <div className="text-center">
          <p className="font-medium text-sm">{flight.airline.name}</p>
          <p className="text-xs text-gray-400">{flight.flightNumber}</p>
          {flight.aircraft && <p className="text-xs text-gray-400">{flight.aircraft}</p>}
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-indigo-600">{formatPrice(flight.price)}</p>
          <p className="text-xs text-gray-400">{flight.availableSeats} seats left</p>
        </div>
      </div>
    </div>
  );
}

export function FlightsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tripType = searchParams.get("trip") || "oneway";
  const pax = searchParams.get("pax") || "1";

  const [legResults, setLegResults] = useState<LegResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState("price");
  const [airlineFilter, setAirlineFilter] = useState("");
  const [allAirlines, setAllAirlines] = useState<Airline[]>([]);

  // Build leg queries based on trip type
  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      setError("");

      try {
        let queries: { label: string; from: string; to: string; date: string }[] = [];

        if (tripType === "oneway") {
          const from = searchParams.get("from") || "";
          const to = searchParams.get("to") || "";
          const depart = searchParams.get("depart") || "";
          queries = [{ label: `${airportNames[from] || from} → ${airportNames[to] || to}`, from, to, date: depart }];
        } else if (tripType === "return") {
          const from = searchParams.get("from") || "";
          const to = searchParams.get("to") || "";
          const depart = searchParams.get("depart") || "";
          const ret = searchParams.get("return") || "";
          queries = [
            { label: `Outbound: ${airportNames[from] || from} → ${airportNames[to] || to}`, from, to, date: depart },
            { label: `Return: ${airportNames[to] || to} → ${airportNames[from] || from}`, from: to, to: from, date: ret },
          ];
        } else if (tripType === "multistop") {
          const legCodes = (searchParams.get("legs") || "").split(",");
          const legDates = (searchParams.get("dates") || "").split(",");
          queries = legCodes.map((codes, i) => {
            const [from, to] = codes.split("-");
            return {
              label: `Leg ${i + 1}: ${airportNames[from] || from} → ${airportNames[to] || to}`,
              from, to, date: legDates[i] || "",
            };
          });
        }

        // Fetch all legs in parallel
        const results = await Promise.all(
          queries.map(async (q) => {
            const params = new URLSearchParams({ from: q.from, to: q.to, depart: q.date, pax });
            if (sortBy) params.set("sort", sortBy);
            if (airlineFilter) params.set("airline", airlineFilter);
            const res = await fetch(`/api/flights/search?${params}`);
            const json = await res.json();
            return {
              label: q.label,
              from: q.from,
              to: q.to,
              date: q.date,
              flights: json.flights || [],
              selected: null as string | null,
              airlines: json.airlines || [],
            };
          })
        );

        setLegResults(results);
        if (results.length > 0 && results[0].airlines) {
          setAllAirlines(results[0].airlines);
        }
      } catch {
        setError("Failed to load flights");
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, [tripType, searchParams, pax, sortBy, airlineFilter, router]);

  const selectFlight = (legIdx: number, flightId: string) => {
    setLegResults((prev) =>
      prev.map((leg, i) =>
        i === legIdx ? { ...leg, selected: leg.selected === flightId ? null : flightId } : leg
      )
    );
  };

  const allSelected = (tripType === "oneway" && legResults.every((l) => l.selected !== null)) ||
    ((tripType === "return" || tripType === "multistop") && legResults.length > 0 && legResults.every((l) => l.selected !== null));

  const handleContinue = () => {
    const selectedIds = legResults.map((l) => l.selected!).join(",");
    const type = tripType;

    router.push(`/flights/book?ids=${selectedIds}&trip=${type}&pax=${pax}`);
  };

  const totalPrice = legResults.reduce((sum, leg) => {
    if (!leg.selected) return sum;
    const flight = leg.flights.find((f) => f.id === leg.selected);
    return sum + (flight?.price || 0);
  }, 0);

  const departDate = legResults[0]?.date ? new Date(legResults[0].date + "T00:00:00") : null;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 sticky top-12 z-20">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {tripType === "oneway" && legResults[0] && (
              <span>{legResults[0].label} · {departDate?.toLocaleDateString("en-NG", { weekday: "short", month: "short", day: "numeric" })}</span>
            )}
            {tripType === "return" && (
              <span>Return trip · {departDate?.toLocaleDateString("en-NG", { weekday: "short", month: "short", day: "numeric" })}</span>
            )}
            {tripType === "multistop" && (
              <span>Multi-city · {legResults.length} legs</span>
            )}
            <span> · {pax} pax</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 flex gap-6">
        {/* Sidebar */}
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
              {allAirlines.map((a) => (
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

          {!loading && !error && (
            <>
              {legResults.map((leg, legIdx) => (
                <div key={legIdx} className="mb-8">
                  <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      legIdx === 0 ? "bg-indigo-100 text-indigo-700" :
                      legIdx === 1 ? "bg-amber-100 text-amber-700" :
                      "bg-green-100 text-green-700"
                    }`}>
                      {tripType === "return" ? (legIdx === 0 ? "OUTBOUND" : "RETURN") : `LEG ${legIdx + 1}`}
                    </span>
                    {leg.label}
                  </h2>

                  {leg.flights.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                      <p className="text-gray-500">No flights found for this leg</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {leg.flights.map((flight) => (
                        <FlightCard
                          key={flight.id}
                          flight={flight}
                          selected={leg.selected === flight.id}
                          onSelect={() => selectFlight(legIdx, flight.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {/* Bottom bar with total and continue */}
          {!loading && !error && allSelected && (
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-30">
              <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">
                    {tripType === "return" ? "Return trip" : tripType === "multistop" ? `${legResults.length}-leg trip` : "One-way"}
                    {" · "}{legResults.length} flight{legResults.length > 1 ? "s" : ""} selected
                  </p>
                  <p className="text-2xl font-bold text-indigo-600">{formatPrice(totalPrice * parseInt(pax))}</p>
                  <p className="text-xs text-gray-400">for {pax} passenger{parseInt(pax) > 1 ? "s" : ""}</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => router.push("/")} className="px-4 py-3 text-sm text-gray-500 hover:text-gray-700">
                    Cancel
                  </button>
                  <button onClick={handleContinue}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-3 rounded-lg transition">
                    Continue Booking
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Padding for fixed bottom bar */}
          {allSelected && <div className="h-20" />}
        </div>
      </div>
    </main>
  );
}

export default function FlightsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full" />
      </div>
    }>
      <FlightsPageContent />
    </Suspense>
  );
}