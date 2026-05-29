"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const airportNames: Record<string, string> = {
  LOS: "Lagos (LOS)", ABV: "Abuja (ABV)", KAN: "Kano (KAN)",
  PHC: "Port Harcourt (PHC)", ENU: "Enugu (ENU)", QUO: "Uyo (QUO)",
  CBQ: "Calabar (CBQ)", BNI: "Benin City (BNI)", QOW: "Owerri (QOW)",
  ILR: "Ilorin (ILR)", IBA: "Ibadan (IBA)", JOS: "Jos (JOS)",
  KAD: "Kaduna (KAD)", AKR: "Akure (AKR)", ABB: "Asaba (ABB)",
  MDG: "Maiduguri (MDG)", SKO: "Sokoto (SKO)", YOL: "Yola (YOL)",
  WAR: "Warri (WAR)", GMO: "Gombe (GMO)", BCU: "Bauchi (BCU)", DKA: "Katsina (DKA)",
};

type TripType = "oneway" | "return" | "multistop";

interface Leg {
  from: string;
  to: string;
  date: string;
}

export default function HomePage() {
  const router = useRouter();
  const [tripType, setTripType] = useState<TripType>("oneway");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [departDate, setDepartDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [passengers, setPassengers] = useState(1);
  const [legs, setLegs] = useState<Leg[]>([
    { from: "", to: "", date: "" },
    { from: "", to: "", date: "" },
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const today = new Date().toISOString().split("T")[0];

  const addLeg = () => {
    if (legs.length < 5) setLegs([...legs, { from: "", to: "", date: "" }]);
  };

  const removeLeg = (idx: number) => {
    if (legs.length > 2) setLegs(legs.filter((_, i) => i !== idx));
  };

  const updateLeg = (idx: number, field: keyof Leg, value: string) => {
    const updated = [...legs];
    updated[idx] = { ...updated[idx], [field]: value };
    setLegs(updated);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (tripType === "oneway" || tripType === "return") {
      if (!from) newErrors.from = "Select departure city";
      if (!to) newErrors.to = "Select destination";
      if (from === to) newErrors.to = "Destination must be different";
      if (!departDate) newErrors.depart = "Select a date";
      if (tripType === "return" && !returnDate) newErrors.return = "Select return date";
    }

    if (tripType === "multistop") {
      legs.forEach((leg, i) => {
        if (!leg.from) newErrors[`leg${i}from`] = "Required";
        if (!leg.to) newErrors[`leg${i}to`] = "Required";
        if (leg.from === leg.to) newErrors[`leg${i}to`] = "Different city needed";
        if (!leg.date) newErrors[`leg${i}date`] = "Required";
      });
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    if (tripType === "oneway") {
      router.push(`/flights?trip=oneway&from=${from}&to=${to}&depart=${departDate}&pax=${passengers}`);
    } else if (tripType === "return") {
      router.push(`/flights?trip=return&from=${from}&to=${to}&depart=${departDate}&return=${returnDate}&pax=${passengers}`);
    } else {
      const legCodes = legs.map((l) => `${l.from}-${l.to}`).join(",");
      const legDates = legs.map((l) => l.date).join(",");
      router.push(`/flights?trip=multistop&legs=${legCodes}&dates=${legDates}&pax=${passengers}`);
    }
  };

  const tripTypes: { type: TripType; label: string; icon: string }[] = [
    { type: "oneway", label: "One Way", icon: "→" },
    { type: "return", label: "Return", icon: "⇄" },
    { type: "multistop", label: "Multi-City", icon: "↗" },
  ];

  const airportOptions = Object.entries(airportNames).map(([code, name]) => (
    <option key={code} value={code}>{name}</option>
  ));

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />

        {/* Nav handled by layout */}

        {/* Hero content */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-24 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            Fly Nigeria, <span className="text-indigo-200">Made Simple</span>
          </h2>
          <p className="text-lg text-indigo-200 mb-10 max-w-xl mx-auto">
            Search and book flights across all Nigerian domestic airlines. One-way, return, or multi-city — we&apos;ve got you covered.
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-2xl p-6 max-w-3xl mx-auto">
            {/* Trip Type Toggle */}
            <div className="flex gap-1 mb-5 bg-gray-100 rounded-lg p-1">
              {tripTypes.map((t) => (
                <button
                  key={t.type}
                  type="button"
                  onClick={() => setTripType(t.type)}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition ${
                    tripType === t.type
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <span className="mr-1">{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>

            {/* One Way / Return */}
            {(tripType === "oneway" || tripType === "return") && (
              <div className={`grid grid-cols-1 ${tripType === "return" ? "md:grid-cols-2" : "md:grid-cols-5"} gap-4 items-end`}>
                <div className="md:col-span-1">
                  <label className="block text-xs font-semibold text-gray-500 mb-1 text-left">From</label>
                  <select value={from} onChange={(e) => setFrom(e.target.value)}
                    className={`w-full rounded-lg border ${errors.from ? "border-red-400" : "border-gray-200"} bg-gray-50 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500`}>
                    <option value="">Select city</option>
                    {airportOptions}
                  </select>
                  {errors.from && <p className="text-red-500 text-xs mt-1">{errors.from}</p>}
                </div>

                {/* Swap button (one-way) */}
                {tripType === "oneway" && (
                  <div className="hidden md:flex md:col-span-1 justify-center pb-1">
                    <button type="button" onClick={() => { const t = from; setFrom(to); setTo(t); }}
                      className="rounded-full border border-gray-200 bg-white p-2 hover:bg-gray-50 transition shadow-sm" title="Swap airports">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    </button>
                  </div>
                )}

                <div className="md:col-span-1">
                  <label className="block text-xs font-semibold text-gray-500 mb-1 text-left">To</label>
                  <select value={to} onChange={(e) => setTo(e.target.value)}
                    className={`w-full rounded-lg border ${errors.to ? "border-red-400" : "border-gray-200"} bg-gray-50 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500`}>
                    <option value="">Select city</option>
                    {airportOptions}
                  </select>
                  {errors.to && <p className="text-red-500 text-xs mt-1">{errors.to}</p>}
                </div>

                <div className="md:col-span-1">
                  <label className="block text-xs font-semibold text-gray-500 mb-1 text-left">
                    {tripType === "return" ? "Depart" : "Departure"}
                  </label>
                  <input type="date" value={departDate} onChange={(e) => setDepartDate(e.target.value)} min={today}
                    className={`w-full rounded-lg border ${errors.depart ? "border-red-400" : "border-gray-200"} bg-gray-50 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500`} />
                  {errors.depart && <p className="text-red-500 text-xs mt-1">{errors.depart}</p>}
                </div>

                {tripType === "return" && (
                  <div className="md:col-span-1">
                    <label className="block text-xs font-semibold text-gray-500 mb-1 text-left">Return</label>
                    <input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} min={departDate || today}
                      className={`w-full rounded-lg border ${errors.return ? "border-red-400" : "border-gray-200"} bg-gray-50 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500`} />
                    {errors.return && <p className="text-red-500 text-xs mt-1">{errors.return}</p>}
                  </div>
                )}

                {/* Search button */}
                <div className={`${tripType === "oneway" ? "md:col-span-1" : "md:col-span-1"}`}>
                  <button type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-lg transition text-sm">
                    Search Flights
                  </button>
                </div>
              </div>
            )}

            {/* Multi-stop */}
            {tripType === "multistop" && (
              <div className="space-y-3">
                {legs.map((leg, i) => (
                  <div key={i} className="flex items-end gap-3">
                    <div className="flex-shrink-0 w-16">
                      <p className="text-xs text-gray-500 font-medium mb-1">Leg {i + 1}</p>
                    </div>
                    <div className="flex-1 grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">From</label>
                        <select value={leg.from} onChange={(e) => updateLeg(i, "from", e.target.value)}
                          className={`w-full rounded-lg border ${errors[`leg${i}from`] ? "border-red-400" : "border-gray-200"} bg-gray-50 px-2 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500`}>
                          <option value="">City</option>
                          {airportOptions}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">To</label>
                        <select value={leg.to} onChange={(e) => updateLeg(i, "to", e.target.value)}
                          className={`w-full rounded-lg border ${errors[`leg${i}to`] ? "border-red-400" : "border-gray-200"} bg-gray-50 px-2 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500`}>
                          <option value="">City</option>
                          {airportOptions}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Date</label>
                        <input type="date" value={leg.date} onChange={(e) => updateLeg(i, "date", e.target.value)} min={today}
                          className={`w-full rounded-lg border ${errors[`leg${i}date`] ? "border-red-400" : "border-gray-200"} bg-gray-50 px-2 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500`} />
                      </div>
                    </div>
                    {legs.length > 2 && (
                      <button type="button" onClick={() => removeLeg(i)}
                        className="flex-shrink-0 w-8 h-8 rounded-full border border-red-200 text-red-400 hover:bg-red-50 text-sm flex items-center justify-center mb-0.5">
                        ✕
                      </button>
                    )}
                  </div>
                ))}

                <div className="flex items-center gap-3 pt-2">
                  <button type="button" onClick={addLeg}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                    + Add another flight
                  </button>
                  <span className="text-xs text-gray-400">up to 5 legs</span>
                  <div className="flex-1" />
                  <button type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-6 rounded-lg transition text-sm">
                    Search All Flights
                  </button>
                </div>
              </div>
            )}

            {/* Passengers */}
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs text-gray-500">{passengers} passenger{passengers > 1 ? "s" : ""}</span>
              <button type="button" onClick={() => setPassengers(Math.max(1, passengers - 1))}
                className="w-7 h-7 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 text-sm">−</button>
              <button type="button" onClick={() => setPassengers(Math.min(9, passengers + 1))}
                className="w-7 h-7 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 text-sm">+</button>
            </div>
          </form>
        </div>

        {/* Wave */}
        <div className="relative z-10">
          <svg viewBox="0 0 1440 60" className="w-full" fill="none">
            <path d="M0 60V30C240 0 480 0 720 30 960 60 1200 60 1440 30V60H0Z" fill="#f9fafb" />
          </svg>
        </div>
      </div>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h3 className="text-2xl font-bold text-center mb-12">Why Flightz?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: "🇳🇬", title: "All Nigerian Airlines", desc: "Air Peace, Arik Air, Ibom Air, Max Air, and 14+ more — all in one place." },
            { icon: "💰", title: "Best Price Guarantee", desc: "Compare prices across all domestic carriers and find the best deal." },
            { icon: "⚡", title: "Instant Booking", desc: "Search, select, and book in under 2 minutes. No hidden fees." },
          ].map((f) => (
            <div key={f.title} className="text-center p-6 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition">
              <div className="text-4xl mb-3">{f.icon}</div>
              <h4 className="font-semibold mb-2">{f.title}</h4>
              <p className="text-sm text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Popular Routes */}
      <section className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h3 className="text-2xl font-bold mb-8">Popular Routes</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              ["Lagos → Abuja", "₦35,000+"],
              ["Abuja → Kano", "₦25,000+"],
              ["Lagos → Port Harcourt", "₦30,000+"],
              ["Lagos → Enugu", "₦32,000+"],
              ["Abuja → Port Harcourt", "₦33,000+"],
              ["Lagos → Benin City", "₦22,000+"],
              ["Kano → Abuja", "₦25,000+"],
              ["Lagos → Owerri", "₦30,000+"],
            ].map(([route, price]) => (
              <div key={route} className="p-4 rounded-lg border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition cursor-pointer">
                <p className="font-medium text-sm">{route}</p>
                <p className="text-xs text-gray-500 mt-1">from {price}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-200 bg-white py-8 text-center text-sm text-gray-400">
        <p>✈️ Flightz — Nigeria&apos;s flight booking platform. Built with ❤️</p>
      </footer>
    </main>
  );
}