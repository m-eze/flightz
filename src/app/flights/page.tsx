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
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400">{flight.destination.code}</p>
          </div>
          <div className="flex flex-col items-center space-y-1">
            {flight.airline.logo && (
              <img
                src={flight.airline.logo}
                alt={`${flight.airline.name} logo`}
                className="w-8 h-8 object-contain"
              />
            )}
            <p className="font-medium text-sm">{flight.airline.name}</p>
            <p className="text-xs text-gray-400">{flight.flightNumber}</p>
            {flight.aircraft && <p className="text-xs text-gray-400">{flight.aircraft}</p>}
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-indigo-600">{formatPrice(flight.price)}</p>
          <p className="text-xs text-gray-400">{flight.availableSeats} seats left</p>
        </div>
      </div>
    </div>
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

function FlightsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tripType = searchParams.get("trip") || "oneway";
  const pax = parseInt(searchParams.get("pax") || "1");

  const [legResults, setLegResults] = useState<LegResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState("price");
  const [airlineFilter, setAirlineFilter] = useState("");
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  // Stable search key to avoid re-fetching on every render
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const depart = searchParams.get("depart") || "";
  const returnDate = searchParams.get("return") || "";
  const searchKey = `${from}-${to}-${depart}-${returnDate}-${sortBy}-${airlineFilter}-${pax}`;

  // Handle all redirects via useEffect to avoid "setState during render"
  useEffect(() => {
    if (redirectTo) {
      router.push(redirectTo);
    }
  }, [redirectTo, router]);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");

        // Build outbound search params
        const outParams = new URLSearchParams();
        outParams.append("from", from);
        outParams.append("to", to);
        outParams.append("depart", depart);
        outParams.append("sort", sortBy);
        outParams.append("airline", airlineFilter);
        outParams.append("pax", pax.toString());

        // Fetch outbound flights
        const outRes = await fetch(`/api/flights/search?${outParams.toString()}`);
        const outData = await outRes.json();

        if (outData.error) {
          setError(outData.error);
          setLegResults([]);
          return;
        }

        const outboundFlights: Flight[] = outData.flights || [];
        const formattedOutDate = depart ? new Date(depart).toLocaleDateString("en-NG", {
          weekday: "short", month: "short", day: "numeric", year: "numeric"
        }) : "";

        const legs: LegResult[] = [{
          label: "Outbound",
          from,
          to,
          date: formattedOutDate,
          flights: outboundFlights,
          selected: null,
        }];

        // For return trips, also fetch return flights
        if (tripType === "return" && returnDate) {
          const retParams = new URLSearchParams();
          retParams.append("from", to);       // reversed
          retParams.append("to", from);       // reversed
          retParams.append("depart", returnDate);
          retParams.append("sort", sortBy);
          retParams.append("airline", airlineFilter);
          retParams.append("pax", pax.toString());

          const retRes = await fetch(`/api/flights/search?${retParams.toString()}`);
          const retData = await retRes.json();

          const returnFlights: Flight[] = retData.error ? [] : (retData.flights || []);
          const formattedRetDate = returnDate ? new Date(returnDate).toLocaleDateString("en-NG", {
            weekday: "short", month: "short", day: "numeric", year: "numeric"
          }) : "";

          legs.push({
            label: "Return",
            from: to,
            to: from,
            date: formattedRetDate,
            flights: returnFlights,
            selected: null,
          });
        }

        setLegResults(legs);
      } catch (err) {
        setError("Failed to load flights");
        setLegResults([]);
      } finally {
        setLoading(false);
      }
    }

    const handler = setTimeout(load, 300);
    return () => clearTimeout(handler);
  }, [searchKey, tripType]);

  const handleSelectFlight = (legLabel: string, flightId: string) => {
    setLegResults(prev =>
      prev.map(l =>
        l.label === legLabel
          ? { ...l, selected: l.selected === flightId ? null : flightId }
          : l
      )
    );
  };

  const getSelectedFlights = (): Flight[] => {
    return legResults
      .map(leg => leg.flights.find(f => f.id === leg.selected))
      .filter((f): f is Flight => f !== undefined);
  };

  const allSelected = legResults.every(leg => leg.selected !== null);

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return date.toLocaleDateString("en-NG", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const handleContinue = () => {
    const selectedFlights = getSelectedFlights();
    if (!allSelected || selectedFlights.length === 0) {
      return;
    }

    if (tripType === "oneway") {
      const flight = selectedFlights[0];
      setRedirectTo(`/flights/${flight.id}/book?pax=${pax}`);
    } else if (tripType === "return") {
      if (selectedFlights.length >= 2) {
        const [outbound, inbound] = selectedFlights;
        setRedirectTo(
          `/flights/${outbound.id}/book?returnId=${inbound.id}&pax=${pax}`
        );
      }
    } else if (tripType === "multistop") {
      if (selectedFlights.length >= 2) {
        const ids = selectedFlights.map(f => f.id).join(",");
        setRedirectTo(`/flights/book?ids=${ids}&trip=multistop&pax=${pax}`);
      }
    }
  };

  const legBadge = (type: string) => {
    switch (type) {
      case "outbound":
        return "bg-indigo-100 text-indigo-700";
      case "return":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-green-100 text-green-700";
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center text-red-500">{error}</div>
      </div>
    );
  }

  // Get unique airlines for filter
  const allAirlines = legResults.length > 0
    ? Array.from(
        new Map(
          legResults
            .flatMap(leg => leg.flights)
            .filter((f): f is Flight & { airline: Airline } => f.airline !== null)
            .map(f => [f.airline.id, f.airline] as const)
        ).values()
      )
    : [];

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 pb-12">

        {/* Search Form */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-2xl font-bold text-center mb-6">Find Your Flight</h1>

            <form onSubmit={e => e.preventDefault()} className="space-y-5">

              {/* Trip Type */}
              <div className="flex justify-center gap-2">
                {(["oneway", "return", "multistop"] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      const url = new URL(window.location.href);
                      url.searchParams.set("trip", t);
                      if (t !== "return") url.searchParams.delete("return");
                      window.history.replaceState({}, "", url.toString());
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                      tripType === t
                        ? "bg-indigo-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {t === "oneway" ? "One Way" : t === "return" ? "Return" : "Multi-City"}
                  </button>
                ))}
              </div>

              {/* From / To / Dates */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">From</label>
                  <input
                    type="text"
                    value={from}
                    onChange={e => {
                      const url = new URL(window.location.href);
                      url.searchParams.set("from", e.target.value.toUpperCase());
                      window.history.replaceState({}, "", url.toString());
                    }}
                    placeholder="City or airport"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">To</label>
                  <input
                    type="text"
                    value={to}
                    onChange={e => {
                      const url = new URL(window.location.href);
                      url.searchParams.set("to", e.target.value.toUpperCase());
                      window.history.replaceState({}, "", url.toString());
                    }}
                    placeholder="City or airport"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
                    {tripType === "return" ? "Depart" : "Date"}
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    value={depart}
                    onChange={e => {
                      const url = new URL(window.location.href);
                      url.searchParams.set("depart", e.target.value);
                      window.history.replaceState({}, "", url.toString());
                    }}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-gray-50"
                  />
                </div>
                {tripType === "return" && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Return</label>
                    <input
                      type="date"
                      min={depart || new Date().toISOString().split("T")[0]}
                      value={returnDate}
                      onChange={e => {
                        const url = new URL(window.location.href);
                        url.searchParams.set("return", e.target.value);
                        window.history.replaceState({}, "", url.toString());
                      }}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-gray-50"
                    />
                  </div>
                )}
                {tripType !== "return" && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Passengers</label>
                    <select
                      value={pax}
                      onChange={e => {
                        const url = new URL(window.location.href);
                        url.searchParams.set("pax", e.target.value);
                        window.history.replaceState({}, "", url.toString());
                      }}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-gray-50"
                    >
                      {[1,2,3,4,5,6,7,8,9,10].map(n => (
                        <option key={n} value={n}>{n} passenger{n > 1 ? "s" : ""}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Sort + Passengers (return) + Airlines filter */}
              <div className="grid gap-4 sm:grid-cols-3 items-end">
                {tripType === "return" && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Passengers</label>
                    <select
                      value={pax}
                      onChange={e => {
                        const url = new URL(window.location.href);
                        url.searchParams.set("pax", e.target.value);
                        window.history.replaceState({}, "", url.toString());
                      }}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-gray-50"
                    >
                      {[1,2,3,4,5,6,7,8,9,10].map(n => (
                        <option key={n} value={n}>{n} passenger{n > 1 ? "s" : ""}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-gray-50"
                  >
                    <option value="price">Price (low to high)</option>
                    <option value="duration">Duration (shortest)</option>
                    <option value="departure">Departure (earliest)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Airline</label>
                  <select
                    value={airlineFilter}
                    onChange={e => setAirlineFilter(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-gray-50"
                  >
                    <option value="">All Airlines</option>
                    {allAirlines.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Results */}
        {legResults.length > 0 && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
            <div className="space-y-8">
              {legResults.map((leg) => (
                <div key={leg.label} className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="bg-gray-50 px-5 py-3 border-b flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold">{leg.label}</h2>
                      <p className="text-sm text-gray-500">{leg.date}</p>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase ${
                      leg.label === "Outbound" ? "bg-indigo-100 text-indigo-700" :
                      leg.label === "Return" ? "bg-amber-100 text-amber-700" :
                      "bg-green-100 text-green-700"
                    }`}>
                      {leg.from} → {leg.to}
                    </span>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {leg.flights.map((flight) => (
                      <FlightCard
                        key={flight.id}
                        flight={flight}
                        selected={flight.id === leg.selected}
                        onSelect={() => handleSelectFlight(leg.label, flight.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Continue */}
            {allSelected && (
              <div className="sticky bottom-0 mt-8 bg-white rounded-xl shadow-lg border p-5 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total for {pax} passenger{pax > 1 ? "s" : ""}</p>
                  <p className="text-2xl font-bold text-indigo-600">
                    {formatPrice(getSelectedFlights().reduce((sum, f) => sum + f.price, 0) * pax)}
                  </p>
                </div>
                <button
                  onClick={handleContinue}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-3 rounded-lg transition shadow-md"
                >
                  Continue to Booking
                </button>
              </div>
            )}
            {allSelected && <div className="h-4" />}
          </div>
        )}

        {/* Empty state */}
        {legResults.length === 0 && !loading && !error && (
          <div className="py-16 text-center">
            <div className="text-5xl text-gray-300 mb-4">✈️</div>
            <h2 className="text-2xl font-bold text-center mb-2">No flights found</h2>
            <p className="text-gray-500 max-w-md mx-auto">
              Try changing your search criteria, dates, or airline filter.
            </p>
          </div>
        )}
      </main>
    );
  }
}
