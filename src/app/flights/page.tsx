"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState, useRef, useCallback } from "react";
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
          <div className="text-center min-w-[70px]">
            <p className="text-xl font-bold">{formatTime(flight.departureTime)}</p>
            <p className="text-xs text-gray-500">{flight.origin.code}</p>
          </div>
          <div className="text-center min-w-[80px]">
            <p className="text-xs text-gray-400">{formatDuration(flight.duration)}</p>
            <div className="flex items-center gap-1 my-1">
              <div className="w-10 h-px bg-gray-300" />
              <svg className="w-3 h-3 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
              <div className="w-10 h-px bg-gray-300" />
            </div>
            <p className="text-[10px] text-gray-400">Direct</p>
          </div>
          <div className="text-center min-w-[70px]">
            <p className="text-xl font-bold">{formatTime(flight.arrivalTime)}</p>
            <p className="text-xs text-gray-500">{flight.destination.code}</p>
          </div>
          <div className="flex items-center gap-3 ml-2">
            {flight.airline.logo && (
              <img src={flight.airline.logo} alt="" className="w-8 h-8 object-contain" />
            )}
            <div>
              <p className="font-medium text-sm">{flight.airline.name}</p>
              <p className="text-xs text-gray-400">{flight.flightNumber}</p>
            </div>
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

  // Read URL params once on mount
  const [urlParams] = useState(() => ({
    from: searchParams.get("from") || "",
    to: searchParams.get("to") || "",
    depart: searchParams.get("depart") || "",
    returnDate: searchParams.get("return") || "",
    tripType: searchParams.get("trip") || "oneway",
    pax: parseInt(searchParams.get("pax") || "1"),
  }));

  const { from, to, depart, returnDate, tripType, pax } = urlParams;

  const [legResults, setLegResults] = useState<LegResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState("price");
  const [airlineFilter, setAirlineFilter] = useState("");
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  const fetched = useRef(false);

  // Redirect handler
  useEffect(() => {
    if (redirectTo) {
      router.push(redirectTo);
    }
  }, [redirectTo, router]);

  // Fetch flights — only once on mount with URL params, or when sort/filter changes
  const fetchFlights = useCallback(async (sort: string, airline: string) => {
    if (!from || !to || !depart) return;

    setLoading(true);
    setError("");

    try {
      const outParams = new URLSearchParams();
      outParams.append("from", from);
      outParams.append("to", to);
      outParams.append("depart", depart);
      outParams.append("sort", sort);
      outParams.append("airline", airline);
      outParams.append("pax", pax.toString());

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
        from, to,
        date: formattedOutDate,
        flights: outboundFlights,
        selected: null,
      }];

      if (tripType === "return" && returnDate) {
        const retParams = new URLSearchParams();
        retParams.append("from", to);
        retParams.append("to", from);
        retParams.append("depart", returnDate);
        retParams.append("sort", sort);
        retParams.append("airline", airline);
        retParams.append("pax", pax.toString());

        const retRes = await fetch(`/api/flights/search?${retParams.toString()}`);
        const retData = await retRes.json();

        const returnFlights: Flight[] = retData.error ? [] : (retData.flights || []);
        const formattedRetDate = returnDate ? new Date(returnDate).toLocaleDateString("en-NG", {
          weekday: "short", month: "short", day: "numeric", year: "numeric"
        }) : "";

        legs.push({
          label: "Return",
          from: to, to: from,
          date: formattedRetDate,
          flights: returnFlights,
          selected: null,
        });
      }

      setLegResults(legs);
    } catch {
      setError("Failed to load flights");
      setLegResults([]);
    } finally {
      setLoading(false);
    }
  }, [from, to, depart, returnDate, tripType, pax]);

  // Initial fetch on mount
  useEffect(() => {
    if (!fetched.current) {
      fetched.current = true;
      fetchFlights(sortBy, airlineFilter);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch when sort or airline filter changes
  useEffect(() => {
    if (fetched.current) {
      fetchFlights(sortBy, airlineFilter);
    }
  }, [sortBy, airlineFilter, fetchFlights]);

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

  const allSelected = legResults.length > 0 && legResults.every(leg => leg.selected !== null);

  const handleContinue = () => {
    const selected = getSelectedFlights();
    if (!allSelected || selected.length === 0) return;

    if (tripType === "oneway") {
      setRedirectTo(`/flights/${selected[0].id}/book?pax=${pax}`);
    } else if (tripType === "return" && selected.length >= 2) {
      setRedirectTo(`/flights/${selected[0].id}/book?returnId=${selected[1].id}&pax=${pax}`);
    } else if (tripType === "multistop" && selected.length >= 2) {
      const ids = selected.map(f => f.id).join(",");
      setRedirectTo(`/flights/book?ids=${ids}&trip=multistop&pax=${pax}`);
    }
  };

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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center text-red-500">{error}</div>
      </div>
    );
  }

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
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    tripType === t
                      ? "bg-indigo-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {t === "oneway" ? "→ One Way" : t === "return" ? "⇄ Return" : "↗ Multi-City"}
                </button>
              ))}
            </div>

            {/* From / To / Dates */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">From</label>
                <div className="px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-sm font-medium">{from || "—"}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">To</label>
                <div className="px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-sm font-medium">{to || "—"}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
                  {tripType === "return" ? "Depart" : "Date"}
                </label>
                <div className="px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-sm font-medium">{depart || "—"}</div>
              </div>
              {tripType === "return" ? (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Return</label>
                  <div className="px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-sm font-medium">{returnDate || "—"}</div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Passengers</label>
                  <div className="px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-sm font-medium">{pax} passenger{pax > 1 ? "s" : ""}</div>
                </div>
              )}
            </div>

            {/* Sort + Passengers (return) + Airlines filter */}
            <div className="grid gap-4 sm:grid-cols-3 items-end">
              {tripType === "return" && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Passengers</label>
                  <div className="px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-sm font-medium">{pax} passenger{pax > 1 ? "s" : ""}</div>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Sort By</label>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
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
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                >
                  <option value="">All Airlines</option>
                  {allAirlines.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <p className="text-xs text-gray-400">
                {from && to && depart ? `${from} → ${to} · ${depart}` : "Enter search criteria above"}
              </p>
              <button
                onClick={() => fetchFlights(sortBy, airlineFilter)}
                disabled={loading}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium disabled:opacity-50"
              >
                {loading ? "Searching..." : "↻ Refresh results"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="py-16 text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full mx-auto" />
          <p className="text-sm text-gray-500 mt-3">Searching flights...</p>
        </div>
      )}

      {/* Results */}
      {!loading && legResults.length > 0 && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="space-y-8">
            {legResults.map((leg) => (
              <div key={leg.label} className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="bg-gray-50 px-5 py-3 border-b flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">{leg.label}</h2>
                    <p className="text-sm text-gray-500">{leg.date} · {leg.flights.length} flight{leg.flights.length !== 1 ? "s" : ""} found</p>
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
            <div className="sticky bottom-4 mt-8 bg-white rounded-xl shadow-lg border p-5 flex items-center justify-between z-20">
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
        </div>
      )}

      {/* No results */}
      {!loading && legResults.length === 0 && from && to && depart && (
        <div className="py-16 text-center">
          <div className="text-5xl text-gray-300 mb-4">✈️</div>
          <h2 className="text-2xl font-bold text-center mb-2">No flights found</h2>
          <p className="text-gray-500 max-w-md mx-auto">
            No flights match your criteria. Try changing dates, or select a different airline.
          </p>
        </div>
      )}

      {/* Empty state — no search yet */}
      {!loading && !from && (
        <div className="py-16 text-center">
          <div className="text-5xl text-gray-300 mb-4">✈️</div>
          <h2 className="text-2xl font-bold text-center mb-2">Search for flights</h2>
          <p className="text-gray-500 max-w-md mx-auto">
            Go back to the home page to search for flights.
          </p>
          <a href="/" className="text-indigo-600 hover:underline text-sm font-medium mt-4 inline-block">
            Go to home page →
          </a>
        </div>
      )}
    </main>
  );
}
