"use client";

import { useEffect, useState } from "react";
import { formatPrice, formatDate, formatTime } from "@/lib/utils";

interface Stats { airlines: number; airports: number; flights: number; bookings: number }
interface User { id: string; name: string | null; email: string; role: string; createdAt: string; _count: { bookings: number } }
interface Booking {
  id: string; bookingReference: string; passengerName: string; passengerEmail: string;
  totalPrice: number; status: string; paymentStatus: string; tripType: string;
  createdAt: string; passengers: number;
  user: { name: string | null; email: string } | null;
  legs: Array<{ flight: { flightNumber: string; airline: { name: string }; origin: { code: string }; destination: { code: string }; departureTime: string; price: number } }>;
}

export default function AdminPage() {
  const [tab, setTab] = useState("dashboard");
  const [stats, setStats] = useState<Stats | null>(null);
  const [airlines, setAirlines] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingSearch, setBookingSearch] = useState("");
  const [bookingStatus, setBookingStatus] = useState("all");
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
        setAirlines(a);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  useEffect(() => {
    if (tab === "users") fetch("/api/admin/users").then(r => r.json()).then(setUsers).catch(() => {});
    if (tab === "bookings") loadBookings();
  }, [tab]);

  const loadBookings = async (search?: string, status?: string) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status && status !== "all") params.set("status", status);
    try {
      const res = await fetch(`/api/admin/bookings?${params}`);
      const data = await res.json();
      setBookings(data.bookings || []);
    } catch { setBookings([]); }
  };

  const handleBookingSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadBookings(bookingSearch, bookingStatus);
  };

  const handleCancelBooking = async (id: string) => {
    if (!confirm("Cancel this booking?")) return;
    try {
      await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "cancel" }),
      });
      loadBookings(bookingSearch, bookingStatus);
    } catch { alert("Failed to cancel"); }
  };

  const tabs = [
    { key: "dashboard", label: "📊 Overview" },
    { key: "bookings", label: "🎫 Bookings" },
    { key: "users", label: "👥 Users" },
  ];

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full" /></div>;
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 max-w-md">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition ${
                tab === t.key ? "bg-white shadow-sm text-indigo-600" : "text-gray-500 hover:text-gray-700"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Dashboard */}
        {tab === "dashboard" && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Airlines", value: stats?.airlines || 0, icon: "✈️", color: "bg-blue-50 text-blue-700" },
                { label: "Airports", value: stats?.airports || 0, icon: "🛬", color: "bg-green-50 text-green-700" },
                { label: "Flights", value: stats?.flights || 0, icon: "🛫", color: "bg-purple-50 text-purple-700" },
                { label: "Bookings", value: stats?.bookings || 0, icon: "🎫", color: "bg-amber-50 text-amber-700" },
              ].map((s) => (
                <div key={s.label} className={`rounded-xl p-5 ${s.color}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{s.icon}</span>
                    <div>
                      <p className="text-2xl font-bold">{s.value.toLocaleString()}</p>
                      <p className="text-xs opacity-75">{s.label}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold">Airlines</h2>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-500 uppercase">
                    <th className="px-5 py-3">Airline</th>
                    <th className="px-5 py-3">IATA</th>
                    <th className="px-5 py-3 text-right">Flights</th>
                  </tr>
                </thead>
                <tbody>
                  {airlines.map((a: any) => (
                    <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          {a.logo && <img src={a.logo} alt="" className="w-5 h-5 object-contain" />}
                          <span className="font-medium text-sm">{a.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500">{a.iata || "—"}</td>
                      <td className="px-5 py-3 text-sm text-right text-gray-500">{a._count.flights.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Bookings */}
        {tab === "bookings" && (
          <>
            <form onSubmit={handleBookingSearch} className="flex gap-3 mb-6 flex-wrap">
              <input type="text" value={bookingSearch} onChange={(e) => setBookingSearch(e.target.value)}
                placeholder="Search by ref, name, or email"
                className="flex-1 min-w-[200px] rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <select value={bookingStatus} onChange={(e) => setBookingStatus(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm">
                <option value="all">All Status</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <button type="submit" className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition">
                Search
              </button>
            </form>

            {bookings.length === 0 ? (
              <div className="bg-white rounded-xl border p-12 text-center text-gray-500">No bookings found</div>
            ) : (
              <div className="space-y-3">
                {bookings.map((b) => {
                  const statusLabel = b.status === "cancelled" ? "Cancelled" : b.paymentStatus === "paid" ? "Paid" : "Unpaid";
                  const statusCls = b.status === "cancelled"
                    ? "bg-red-50 text-red-700 border-red-200"
                    : b.paymentStatus === "paid"
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-yellow-50 text-yellow-700 border-yellow-200";

                  return (
                    <div key={b.id} className="bg-white rounded-xl border border-gray-200 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm font-bold bg-gray-50 px-2 py-0.5 rounded">{b.bookingReference}</span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusCls}`}>{statusLabel}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-indigo-600">{formatPrice(b.totalPrice)}</span>
                          {b.status !== "cancelled" && (
                            <button onClick={() => handleCancelBooking(b.id)} className="text-xs text-red-500 hover:underline">Cancel</button>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
                        <span>{b.passengerName} · {b.passengerEmail}</span>
                        <span>{b.passengers} pax</span>
                        <span>{b.legs[0]?.flight?.origin?.code} → {b.legs[b.legs.length - 1]?.flight?.destination?.code}</span>
                        <span>{formatDate(b.createdAt)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Users */}
        {tab === "users" && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-500 uppercase">
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3 text-right">Bookings</th>
                  <th className="px-5 py-3">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3 text-sm font-medium">{u.name || "—"}</td>
                    <td className="px-5 py-3 text-sm text-gray-500">{u.email}</td>
                    <td className="px-5 py-3 text-sm">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"
                      }`}>{u.role}</span>
                    </td>
                    <td className="px-5 py-3 text-sm text-right text-gray-500">{u._count.bookings}</td>
                    <td className="px-5 py-3 text-xs text-gray-400">{formatDate(u.createdAt)}</td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-12 text-center text-gray-500 text-sm">No users yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
