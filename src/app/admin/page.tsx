"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils";

interface Stats {
  airlines: number;
  airports: number;
  flights: number;
  bookings: number;
}

interface AirlineWithCount {
  id: string;
  name: string;
  iata: string | null;
  _count: { flights: number };
}

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [topAirlines, setTopAirlines] = useState<AirlineWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, airlineRes] = await Promise.all([
          fetch("/api/admin/stats"),
          fetch("/api/admin/airlines"),
        ]);
        const [s, a] = await Promise.all([statsRes.json(), airlineRes.json()]);
        setStats(s);
        setTopAirlines(a);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pt-2">

      <div className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-gray-500 mb-8">System overview and management</p>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Airlines", value: stats?.airlines || 0, icon: "✈️", color: "bg-indigo-50 text-indigo-700" },
            { label: "Airports", value: stats?.airports || 0, icon: "🛬", color: "bg-green-50 text-green-700" },
            { label: "Flights", value: stats?.flights || 0, icon: "🛫", color: "bg-blue-50 text-blue-700" },
            { label: "Bookings", value: stats?.bookings || 0, icon: "🎫", color: "bg-amber-50 text-amber-700" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{s.icon}</span>
                <div>
                  <p className="text-3xl font-bold">{s.value.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">{s.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Airlines Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold">Airlines & Flight Count</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-500 uppercase">
                <th className="px-6 py-3">Airline</th>
                <th className="px-6 py-3">IATA</th>
                <th className="px-6 py-3 text-right">Total Flights</th>
              </tr>
            </thead>
            <tbody>
              {topAirlines.map((a) => (
                <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium text-sm">{a.name}</td>
                  <td className="px-6 py-3 text-sm text-gray-500">{a.iata || "—"}</td>
                  <td className="px-6 py-3 text-sm text-right">{a._count.flights.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
