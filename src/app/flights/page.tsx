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

        const params = new URLSearchParams();
        params.append("from", searchParams.get("from") || "");
        params.append("to", searchParams.get("to") || "");
        params.append("depart", searchParams.get("depart") || "");
        params.append("sort", sortBy);
        params.append("airline", airlineFilter);
        params.append("pax", pax.toString());

        const res = await fetch(`/api/flights/search?${params.toString()}`);
        const data = await res.json();

        if (data.error) {
          setError(data.error);
          setLegResults([]);
        } else {
          // Transform flat flights API response into leg result format
          const flights: Flight[] = data.flights || [];
          const dateStr = searchParams.get("depart") || "";
          const formattedDate = dateStr ? new Date(dateStr).toLocaleDateString("en-NG", {
            weekday: "short", month: "short", day: "numeric", year: "numeric"
          }) : "";

          if (flights.length > 0) {
            setLegResults([{
              label: "Outbound",
              from: searchParams.get("from") || "",
              to: searchParams.get("to") || "",
              date: formattedDate,
              flights,
              selected: null,
            }]);
          } else {
            if (tripType === "return") {
              const retDateStr = searchParams.get("return") || "";
              setLegResults([
                {
                  label: "Outbound",
                  from: searchParams.get("from") || "",
                  to: searchParams.get("to") || "",
                  date: formattedDate,
                  flights: [],
                  selected: null,
                },
                {
                  label: "Return",
                  from: searchParams.get("to") || "",
                  to: searchParams.get("from") || "",
                  date: retDateStr ? new Date(retDateStr).toLocaleDateString("en-NG", {
                    weekday: "short", month: "short", day: "numeric", year: "numeric"
                  }) : "",
                  flights: [],
                  selected: null,
                },
              ]);
            } else {
              setLegResults([]);
            }
          }
        }
      } catch (err) {
        setError("Failed to load flights");
        setLegResults([]);
      } finally {
        setLoading(false);
      }
    }

    // Debounce the search
    const handler = setTimeout(load, 300);
    return () => clearTimeout(handler);
  }, [searchParams, sortBy, airlineFilter, pax, router]);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full" />
      </div>
    );
  }

  // Get unique airlines for filter
  const allAirlines = Array.from(
    new Map(
      legResults
        .flatMap(leg => leg.flights)
        .filter((f): f is Flight & { airline: Airline } => f.airline !== null)
        .map(f => [f.airline.id, f.airline] as const)
    ).values()
  );

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <a href="/" className="text-xl font-bold text-indigo-600">
                ✈️ NFlightz
              </a>
              <div className="hidden md:flex items-center space-x-4">
                <a href="/auth/login" className="text-gray-600 hover:text-indigo-600">
                  Login
                </a>
                <a href="/auth/register" className="text-gray-600 hover:text-indigo-600">
                  Sign Up
                </a>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <a href="/dashboard" className="text-gray-600 hover:text-indigo-600 hidden sm:inline">
                My Bookings
              </a>
              <button
                onClick={() => router.push("/auth/login")}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded transition"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Form */}
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h1 className="text-3xl font-bold text-center mb-6">
              Find Your Flight
            </h1>
            <form onSubmit={e => e.preventDefault()} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchParams.get("from") || ""}
                      onChange={e => {
                        const url = new URL(window.location.href);
                        url.searchParams.set("from", e.target.value);
                        window.history.replaceState({}, "", url.toString());
                      }}
                      placeholder="Enter airport or city"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                      {searchParams.get("from") && (
                        <button
                          onClick={() => {
                            const url = new URL(window.location.href);
                            url.searchParams.delete("from");
                            window.history.replaceState({}, "", url.toString());
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    To
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchParams.get("to") || ""}
                      onChange={e => {
                        const url = new URL(window.location.href);
                        url.searchParams.set("to", e.target.value);
                        window.history.replaceState({}, "", url.toString());
                      }}
                      placeholder="Enter airport or city"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                      {searchParams.get("to") && (
                        <button
                          onClick={() => {
                            const url = new URL(window.location.href);
                            url.searchParams.delete("to");
                            window.history.replaceState({}, "", url.toString());
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Departure Date
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    value={searchParams.get("depart") || ""}
                    onChange={e => {
                      const url = new URL(window.location.href);
                      url.searchParams.set("depart", e.target.value);
                      window.history.replaceState({}, "", url.toString());
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Passengers
                  </label>
                  <select
                    value={pax.toString()}
                    onChange={e => {
                      const url = new URL(window.location.href);
                      url.searchParams.set("pax", e.target.value);
                      window.history.replaceState("", "", url.toString());
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                      <option key={num} value={num.toString()}>
                        {num} passenger{num > 1 ? "s" : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={e => {
                      setSortBy(e.target.value as "price" | "duration" | "departure");
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="price">Price (low to high)</option>
                    <option value="duration">Duration (shortest first)</option>
                    <option value="departure">Departure time (earliest first)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h2 className="font-semibold text-sm mb-3">Airlines</h2>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="airline"
                      value=""
                      checked={airlineFilter === ""}
                      onChange={e => {
                        setAirlineFilter(e.target.value as string);
                      }}
                      className="text-indigo-600"
                    />
                    All Airlines
                  </label>
                  {allAirlines.map(a => (
                    <label key={a.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="airline"
                        value={a.id}
                        checked={airlineFilter === a.id}
                        onChange={e => {
                          setAirlineFilter(e.target.value as string);
                        }}
                        className="text-indigo-600"
                      />
                      <div className="flex items-center space-x-2">
                        {a.logo && (
                          <img
                            src={a.logo}
                            alt={`${a.name} logo`}
                            className="w-5 h-5 object-contain"
                          />
                        )}
                        <span>{a.name}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Results */}
      {legResults.length > 0 && (
        <div className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-6">
              {legResults.map((leg, index) => (
                <div key={leg.label} className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4">
                    <h2 className="text-lg font-semibold mb-2">
                      {leg.label}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {leg.date}
                    </p>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {leg.flights.map((flight, idx) => (
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

            {allSelected && legResults.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-center">
                    Total Price:
                  </h2>
                  <p className="text-3xl font-bold text-indigo-600 text-center">
                    {formatPrice(
                      getSelectedFlights().reduce((sum, f) => sum + f.price, 0) *
                        pax
                    )}
                  </p>
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={handleContinue}
                    disabled={!allSelected}
                    className={`bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-3 rounded-lg transition ${
                      !allSelected ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    Continue to Booking
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {legResults.length === 0 && !loading && !error && (
        <div className="py-12 text-center">
          <div className="max-w-2xl mx-auto px-4">
            <div className="text-5xl text-gray-300 mb-4">✈️</div>
            <h2 className="text-2xl font-bold text-center mb-2">
              No flights found
            </h2>
            <p className="text-lg text-gray-600 text-center mb-6">
              Try changing your search criteria or check back later for more flights.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => {
                  const url = new URL(window.location.href);
                  url.searchParams.delete("from");
                  url.searchParams.delete("to");
                  url.searchParams.delete("depart");
                  window.history.replaceState({}, "", url.toString());
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-sm rounded"
              >
                Clear Search
              </button>
              <button
                onClick={() => {
                  const url = new URL(window.location.href);
                  url.searchParams.set(
                    "from",
                    searchParams.get("to") || "LOS"
                  );
                  url.searchParams.set(
                    "to",
                    searchParams.get("from") || "ABV"
                  );
                  window.history.replaceState({}, "", url.toString());
                }}
                className="px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-600 text-sm rounded"
              >
                Swap Routes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Padding for fixed bottom bar on mobile */}
      {allSelected && <div className="h-20" />}
    </main>
  );
}