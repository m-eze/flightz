"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils";

const popularFrom = ["LOS", "ABV", "PHC", "ENU", "KAN"];
const popularTo = ["ABV", "LOS", "PHC", "KAN", "ENU"];

const airportNames: Record<string, string> = {
  LOS: "Lagos (LOS)", ABV: "Abuja (ABV)", KAN: "Kano (KAN)",
  PHC: "Port Harcourt (PHC)", ENU: "Enugu (ENU)", QUO: "Uyo (QUO)",
  CBQ: "Calabar (CBQ)", BNI: "Benin City (BNI)", QOW: "Owerri (QOW)",
  ILR: "Ilorin (ILR)", IBA: "Ibadan (IBA)", JOS: "Jos (JOS)",
  KAD: "Kaduna (KAD)", AKR: "Akure (AKR)", ABB: "Asaba (ABB)",
  MDG: "Maiduguri (MDG)", SKO: "Sokoto (SKO)", YOL: "Yola (YOL)",
  WAR: "Warri (WAR)", GMO: "Gombe (GMO)", BCU: "Bauchi (BCU)", DKA: "Katsina (DKA)",
};

export default function HomePage() {
  const router = useRouter();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [departDate, setDepartDate] = useState("");
  const [passengers, setPassengers] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Set min date to today
  const today = new Date().toISOString().split("T")[0];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!from) newErrors.from = "Select departure city";
    if (!to) newErrors.to = "Select destination";
    if (from === to) newErrors.to = "Destination must be different";
    if (!departDate) newErrors.depart = "Select a date";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const params = new URLSearchParams({ from, to, depart: departDate, pax: String(passengers) });
    router.push(`/flights?${params.toString()}`);
  };

  const swapAirports = () => {
    const tmp = from;
    setFrom(to);
    setTo(tmp);
  };

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />

        {/* Nav */}
        <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold tracking-tight">✈️ Flightz</h1>
          <div className="flex gap-4 text-sm">
            <a href="/dashboard" className="hover:text-indigo-200 transition">My Bookings</a>
            <a href="/admin" className="hover:text-indigo-200 transition">Admin</a>
          </div>
        </nav>

        {/* Hero content */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-24 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            Fly Nigeria, <span className="text-indigo-200">Made Simple</span>
          </h2>
          <p className="text-lg text-indigo-200 mb-10 max-w-xl mx-auto">
            Search and book flights across all Nigerian domestic airlines. Compare prices, find the best routes, and fly smart.
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-2xl p-6 max-w-3xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              {/* From */}
              <div className="md:col-span-1">
                <label className="block text-xs font-semibold text-gray-500 mb-1 text-left">From</label>
                <select
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className={`w-full rounded-lg border ${errors.from ? "border-red-400" : "border-gray-200"} bg-gray-50 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                >
                  <option value="">Select city</option>
                  {popularFrom.map((code) => (
                    <option key={code} value={code}>{airportNames[code]}</option>
                  ))}
                </select>
                {errors.from && <p className="text-red-500 text-xs mt-1">{errors.from}</p>}
              </div>

              {/* Swap */}
              <div className="hidden md:flex md:col-span-1 justify-center pb-1">
                <button
                  type="button"
                  onClick={swapAirports}
                  className="rounded-full border border-gray-200 bg-white p-2 hover:bg-gray-50 transition shadow-sm"
                  title="Swap airports"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </button>
              </div>

              {/* To */}
              <div className="md:col-span-1">
                <label className="block text-xs font-semibold text-gray-500 mb-1 text-left">To</label>
                <select
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className={`w-full rounded-lg border ${errors.to ? "border-red-400" : "border-gray-200"} bg-gray-50 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                >
                  <option value="">Select city</option>
                  {popularTo.map((code) => (
                    <option key={code} value={code}>{airportNames[code]}</option>
                  ))}
                </select>
                {errors.to && <p className="text-red-500 text-xs mt-1">{errors.to}</p>}
              </div>

              {/* Date */}
              <div className="md:col-span-1">
                <label className="block text-xs font-semibold text-gray-500 mb-1 text-left">Departure</label>
                <input
                  type="date"
                  value={departDate}
                  onChange={(e) => setDepartDate(e.target.value)}
                  min={today}
                  className={`w-full rounded-lg border ${errors.depart ? "border-red-400" : "border-gray-200"} bg-gray-50 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                />
                {errors.depart && <p className="text-red-500 text-xs mt-1">{errors.depart}</p>}
              </div>

              {/* Search */}
              <div className="md:col-span-1">
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-lg transition text-sm"
                >
                  Search Flights
                </button>
              </div>
            </div>

            {/* Passengers row */}
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-gray-500">{passengers} passenger{passengers > 1 ? "s" : ""}</span>
              <button type="button" onClick={() => setPassengers(Math.max(1, passengers - 1))} className="w-7 h-7 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 text-sm">−</button>
              <button type="button" onClick={() => setPassengers(Math.min(9, passengers + 1))} className="w-7 h-7 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 text-sm">+</button>
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

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-8 text-center text-sm text-gray-400">
        <p>✈️ Flightz — Nigeria&apos;s flight booking platform. Built with ❤️</p>
      </footer>
    </main>
  );
}
