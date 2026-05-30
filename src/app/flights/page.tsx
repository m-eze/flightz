"use client";

import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState, useRef, useCallback } from "react";
import { formatPrice, formatDuration, formatTime } from "@/lib/utils";

interface Airline { id: string; name: string; iata: string | null; logo: string | null }
interface Flight {
  id: string; flightNumber: string; airline: Airline;
  origin: { code: string; city: string }; destination: { code: string; city: string };
  departureTime: string; arrivalTime: string; duration: number;
  price: number; currency: string; availableSeats: number; aircraft: string | null;
}
interface LegResult {
  label: string; from: string; to: string; date: string;
  flights: Flight[]; selected: string | null;
}

const AIRPORTS = [
  { code: "LOS", city: "Lagos" }, { code: "ABV", city: "Abuja" },
  { code: "KAN", city: "Kano" }, { code: "PHC", city: "Port Harcourt" },
  { code: "ENU", city: "Enugu" }, { code: "QUO", city: "Uyo" },
  { code: "CBQ", city: "Calabar" }, { code: "BNI", city: "Benin City" },
  { code: "QOW", city: "Owerri" }, { code: "ILR", city: "Ilorin" },
  { code: "IBA", city: "Ibadan" }, { code: "JOS", city: "Jos" },
  { code: "KAD", city: "Kaduna" }, { code: "AKR", city: "Akure" },
  { code: "ABB", city: "Asaba" }, { code: "MDG", city: "Maiduguri" },
  { code: "SKO", city: "Sokoto" }, { code: "YOL", city: "Yola" },
  { code: "WAR", city: "Warri" }, { code: "GMO", city: "Gombe" },
  { code: "BCU", city: "Bauchi" }, { code: "DKA", city: "Katsina" },
];

function FlightCard({ flight, selected, onSelect }: { flight: Flight; selected: boolean; onSelect: () => void }) {
  return (
    <div onClick={onSelect}
      className={`bg-white rounded-xl border-2 p-5 hover:shadow-md transition cursor-pointer ${selected ? "border-indigo-500 bg-indigo-50/30" : "border-gray-200 hover:border-indigo-200"}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-center min-w-[65px]">
            <p className="text-lg font-bold">{formatTime(flight.departureTime)}</p>
            <p className="text-xs text-gray-500">{flight.origin.code}</p>
          </div>
          <div className="text-center min-w-[70px]">
            <p className="text-[10px] text-gray-400">{formatDuration(flight.duration)}</p>
            <div className="flex items-center gap-1 my-0.5">
              <div className="w-8 h-px bg-gray-300" />
              <svg className="w-2.5 h-2.5 text-indigo-400" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
              <div className="w-8 h-px bg-gray-300" />
            </div>
          </div>
          <div className="text-center min-w-[65px]">
            <p className="text-lg font-bold">{formatTime(flight.arrivalTime)}</p>
            <p className="text-xs text-gray-500">{flight.destination.code}</p>
          </div>
          <div className="flex items-center gap-2 ml-1">
            {flight.airline.logo && <img src={flight.airline.logo} alt="" className="w-7 h-7 object-contain" />}
            <div>
              <p className="font-medium text-sm leading-tight">{flight.airline.name}</p>
              <p className="text-[10px] text-gray-400">{flight.flightNumber}</p>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-indigo-600">{formatPrice(flight.price)}</p>
          <p className="text-[10px] text-gray-400">{flight.availableSeats} seats</p>
        </div>
      </div>
    </div>
  );
}

export default function FlightsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full" /></div>}>
      <FlightsPageContent />
    </Suspense>
  );
}

function FlightsPageContent() {
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];

  // Editable form state
  const [tripType, setTripType] = useState<"oneway" | "return">("oneway");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [depart, setDepart] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [pax, setPax] = useState(1);
  const [sortBy, setSortBy] = useState("price");
  const [airlineFilter, setAirlineFilter] = useState("");

  const [legResults, setLegResults] = useState<LegResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  // Redirect handler
  useEffect(() => {
    if (redirectTo) router.push(redirectTo);
  }, [redirectTo, router]);

  // Parse URL params on mount to pre-fill form
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("from")) setFrom(params.get("from")!.toUpperCase());
    if (params.get("to")) setTo(params.get("to")!.toUpperCase());
    if (params.get("depart")) setDepart(params.get("depart") || "");
    if (params.get("return")) setReturnDate(params.get("return") || "");
    if (params.get("trip")) setTripType((params.get("trip") as any) || "oneway");
    if (params.get("pax")) setPax(parseInt(params.get("pax") || "1"));
  }, []);

  const doFetch = useCallback(async (params: {
    from: string; to: string; depart: string; returnDate: string;
    tripType: string; pax: number; sort: string; airline: string;
  }) => {
    if (!params.from || !params.to || !params.depart) return;
    setLoading(true);
    setError("");
    setLegResults([]);

    try {
      const outQ = new URLSearchParams({ from: params.from, to: params.to, depart: params.depart, sort: params.sort, airline: params.airline, pax: String(params.pax) });
      const outRes = await fetch(`/api/flights/search?${outQ}`);
      const outData = await outRes.json();
      if (outData.error) { setError(outData.error); return; }

      const legs: LegResult[] = [{
        label: "Outbound", from: params.from, to: params.to,
        date: params.depart ? new Date(params.depart).toLocaleDateString("en-NG", { weekday: "short", month: "short", day: "numeric", year: "numeric" }) : "",
        flights: outData.flights || [], selected: null,
      }];

      if (params.tripType === "return" && params.returnDate) {
        const retQ = new URLSearchParams({ from: params.to, to: params.from, depart: params.returnDate, sort: params.sort, airline: params.airline, pax: String(params.pax) });
        const retRes = await fetch(`/api/flights/search?${retQ}`);
        const retData = await retRes.json();
        legs.push({
          label: "Return", from: params.to, to: params.from,
          date: params.returnDate ? new Date(params.returnDate).toLocaleDateString("en-NG", { weekday: "short", month: "short", day: "numeric", year: "numeric" }) : "",
          flights: retData.error ? [] : (retData.flights || []), selected: null,
        });
      }
      setLegResults(legs);
    } catch {
      setError("Failed to load flights");
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-search when all required fields are filled
  useEffect(() => {
    const timer = setTimeout(() => {
      if (from && to && depart) {
        doFetch({ from, to, depart, returnDate, tripType, pax, sort: sortBy, airline: airlineFilter });
        fetchedRef.current = true;
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [from, to, depart, returnDate, tripType, pax, sortBy, airlineFilter, doFetch]);

  const handleSearch = () => {
    doFetch({ from, to, depart, returnDate, tripType, pax, sort: sortBy, airline: airlineFilter });
  };

  const swapAirports = () => { const f = from; setFrom(to); setTo(f); };

  const handleSelectFlight = (legLabel: string, flightId: string) => {
    setLegResults(prev => prev.map(l => l.label === legLabel ? { ...l, selected: l.selected === flightId ? null : flightId } : l));
  };

  const getSelectedFlights = (): Flight[] => legResults.map(leg => leg.flights.find(f => f.id === leg.selected)).filter((f): f is Flight => !!f);
  const allSelected = legResults.length > 0 && legResults.every(leg => leg.selected !== null);

  const handleContinue = () => {
    const selected = getSelectedFlights();
    if (!allSelected || selected.length === 0) return;
    if (tripType === "oneway") {
      setRedirectTo(`/flights/${selected[0].id}/book?pax=${pax}`);
    } else if (tripType === "return" && selected.length >= 2) {
      setRedirectTo(`/flights/${selected[0].id}/book?returnId=${selected[1].id}&pax=${pax}`);
    }
  };

  const allAirlines = legResults.length > 0
    ? Array.from(new Map(legResults.flatMap(l => l.flights).filter(f => f.airline).map(f => [f.airline.id, f.airline] as const)).values())
    : [];

  if (error) return <div className="min-h-screen flex items-center justify-center"><p className="text-red-500">{error}</p></div>;

  return (
    <main className="min-h-screen bg-gray-50 pb-16">
      {/* Search Form */}
      <div className="bg-white shadow-sm border-b sticky top-14 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <form onSubmit={e => { e.preventDefault(); handleSearch(); }} className="space-y-3">

            {/* Row 1: Trip type + From + To + Dates + Passengers */}
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 items-end">
              {/* Trip type */}
              <div>
                <label className="block text-[10px] font-medium text-gray-500 mb-1 uppercase">Trip</label>
                <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                  <button type="button" onClick={() => setTripType("oneway")}
                    className={`flex-1 py-2 text-xs font-medium ${tripType === "oneway" ? "bg-indigo-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
                    One Way
                  </button>
                  <button type="button" onClick={() => setTripType("return")}
                    className={`flex-1 py-2 text-xs font-medium ${tripType === "return" ? "bg-indigo-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
                    Return
                  </button>
                </div>
              </div>

              {/* From */}
              <div>
                <label className="block text-[10px] font-medium text-gray-500 mb-1 uppercase">From</label>
                <select value={from} onChange={e => setFrom(e.target.value)}
                  className="w-full px-2 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">City</option>
                  {AIRPORTS.map(a => <option key={a.code} value={a.code}>{a.city} ({a.code})</option>)}
                </select>
              </div>

              {/* Swap */}
              <div className="hidden lg:flex justify-center">
                <button type="button" onClick={swapAirports} className="mt-5 p-1.5 rounded-full hover:bg-gray-100 text-gray-400" title="Swap">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
                </button>
              </div>

              {/* To */}
              <div>
                <label className="block text-[10px] font-medium text-gray-500 mb-1 uppercase">To</label>
                <select value={to} onChange={e => setTo(e.target.value)}
                  className="w-full px-2 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">City</option>
                  {AIRPORTS.map(a => <option key={a.code} value={a.code}>{a.city} ({a.code})</option>)}
                </select>
              </div>

              {/* Depart */}
              <div>
                <label className="block text-[10px] font-medium text-gray-500 mb-1 uppercase">{tripType === "return" ? "Depart" : "Date"}</label>
                <input type="date" min={today} value={depart} onChange={e => setDepart(e.target.value)}
                  className="w-full px-2 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>

              {/* Return or Pax */}
              {tripType === "return" ? (
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 mb-1 uppercase">Return</label>
                  <input type="date" min={depart || today} value={returnDate} onChange={e => setReturnDate(e.target.value)}
                    className="w-full px-2 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 mb-1 uppercase">Pax</label>
                  <select value={pax} onChange={e => setPax(Number(e.target.value))}
                    className="w-full px-2 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {[1,2,3,4,5,6,7,8,9].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              )}
            </div>

            {/* Row 2: Return pax + Sort + Airline + Search */}
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 items-end">
              {tripType === "return" && (
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 mb-1 uppercase">Passengers</label>
                  <select value={pax} onChange={e => setPax(Number(e.target.value))}
                    className="w-full px-2 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {[1,2,3,4,5,6,7,8,9].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-[10px] font-medium text-gray-500 mb-1 uppercase">Sort</label>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                  className="w-full px-2 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="price">Price</option>
                  <option value="duration">Duration</option>
                  <option value="departure">Earliest</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-500 mb-1 uppercase">Airline</label>
                <select value={airlineFilter} onChange={e => setAirlineFilter(e.target.value)}
                  className="w-full px-2 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">All</option>
                  {allAirlines.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <button type="submit" disabled={loading || !from || !to || !depart}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white text-sm font-medium rounded-lg transition">
                {loading ? "Searching..." : "Search Flights"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="py-20 text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full mx-auto" />
          <p className="text-sm text-gray-500 mt-3">Searching flights...</p>
        </div>
      )}

      {/* Results */}
      {!loading && legResults.length > 0 && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
          {legResults.map(leg => (
            <div key={leg.label} className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-gray-50 px-5 py-3 border-b flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">{leg.label}</h2>
                  <p className="text-xs text-gray-500">{leg.date} · {leg.flights.length} found</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  leg.label === "Outbound" ? "bg-indigo-100 text-indigo-700" :
                  leg.label === "Return" ? "bg-amber-100 text-amber-700" :
                  "bg-green-100 text-green-700"
                }`}>{leg.from} → {leg.to}</span>
              </div>
              <div className="divide-y divide-gray-100">
                {leg.flights.map(f => (
                  <FlightCard key={f.id} flight={f} selected={f.id === leg.selected} onSelect={() => handleSelectFlight(leg.label, f.id)} />
                ))}
              </div>
            </div>
          ))}

          {allSelected && (
            <div className="sticky bottom-4 bg-white rounded-xl shadow-lg border p-4 flex items-center justify-between z-20">
              <div>
                <p className="text-xs text-gray-500">Total · {pax} passenger{pax > 1 ? "s" : ""}</p>
                <p className="text-xl font-bold text-indigo-600">{formatPrice(getSelectedFlights().reduce((s, f) => s + f.price, 0) * pax)}</p>
              </div>
              <button onClick={handleContinue}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-lg transition text-sm">
                Continue to Booking
              </button>
            </div>
          )}
        </div>
      )}

      {/* No results */}
      {!loading && legResults.length === 0 && from && to && depart && (
        <div className="py-20 text-center">
          <div className="text-4xl text-gray-200 mb-3">✈️</div>
          <h2 className="text-lg font-bold mb-1">No flights found</h2>
          <p className="text-sm text-gray-500">Try changing dates or airline filter.</p>
        </div>
      )}

      {/* Initial state */}
      {!loading && !from && !depart && (
        <div className="py-20 text-center">
          <div className="text-4xl text-gray-200 mb-3">✈️</div>
          <h2 className="text-lg font-bold mb-1">Search for flights</h2>
          <p className="text-sm text-gray-500">Select your route and dates above, then click Search.</p>
        </div>
      )}
    </main>
  );
}
