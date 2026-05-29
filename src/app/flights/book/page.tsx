"use client";

export const dynamic = "force-dynamic";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState, useCallback } from "react";
import { formatPrice, formatDuration, formatTime, formatDate } from "@/lib/utils";

interface FlightDetail {
  id: string;
  flightNumber: string;
  airline: { name: string; iata: string | null; logo: string | null };
  origin: { code: string; name: string; city: string };
  destination: { code: string; name: string; city: string };
  departureTime: string;
  arrivalTime: string;
  duration: number;
  price: number;
  currency: string;
  availableSeats: number;
  aircraft: string | null;
  status: string;
}

export function BookFlightsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const ids = (searchParams.get("ids") || "").split(",").filter(Boolean);
  const tripType = searchParams.get("trip") || "oneway";
  const pax = parseInt(searchParams.get("pax") || "1");

  const [flights, setFlights] = useState<FlightDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Handle all redirects via useEffect to avoid "setState during render"
  useEffect(() => {
    if (redirectTo) {
      router.push(redirectTo);
    }
  }, [redirectTo, router]);

  useEffect(() => {
    async function load() {
      try {
        const results = await Promise.all(
          ids.map((id) => fetch(`/api/flights/${id}`).then((r) => r.json()))
        );
        const valid = results.filter((f) => !f.error);
        if (valid.length === 0) {
          setRedirectTo("/flights");
          return;
        }
        setFlights(valid);
      } catch {
        setRedirectTo("/flights");
      } finally {
        setLoading(false);
      }
    }
    if (ids.length > 0) load();
    else setLoading(false);
  }, [ids.join(",")]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = "Full name is required";
    if (!form.email.trim() || !form.email.includes("@")) newErrors.email = "Valid email is required";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setBooking(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flightIds: ids,
          tripType,
          passengerName: form.name,
          passengerEmail: form.email,
          passengerPhone: form.phone || null,
          passengers: pax,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setErrors({ submit: data.error });
      } else {
        const totalPrice = flights.reduce((s, f) => s + f.price, 0) * pax;
        setRedirectTo(`/payment?ref=${data.bookingReference}&amount=${totalPrice}&email=${encodeURIComponent(form.email)}`);
      }
    } catch {
      setErrors({ submit: "Booking failed. Please try again." });
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full" />
      </div>
    );
  }

  if (flights.length === 0) return null;

  const totalPrice = flights.reduce((s, f) => s + f.price, 0) * pax;

  return (
    <main className="min-h-screen bg-gray-50 pt-2">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-2">Complete Your Booking</h1>
        <p className="text-gray-500 mb-6">
          {tripType === "return" ? "Return trip" : tripType === "multistop" ? `${flights.length}-leg trip` : "One-way"}
          {" · "}{pax} passenger{pax > 1 ? "s" : ""}
        </p>

        {/* Flight Summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold mb-3">Flight Details</h2>
          <div className="space-y-4">
            {flights.map((flight, i) => (
              <div key={flight.id} className="pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                <div className="flex items-center gap-1 mb-2">
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                    i === 0 ? "bg-indigo-100 text-indigo-700" :
                    tripType === "return" && i === 1 ? "bg-amber-100 text-amber-700" :
                    "bg-green-100 text-green-700"
                  }`}>
                    {tripType === "return" ? (i === 0 ? "OUTBOUND" : "RETURN") : `LEG ${i + 1}`}
                  </span>
                  <div className="flex items-center space-x-2 mt-1">
                    {flight.airline.logo && (
                      <img
                        src={flight.airline.logo}
                        alt={`${flight.airline.name} logo`}
                        className="w-6 h-6 object-contain"
                      />
                    )}
                    <span className="font-medium text-sm">{flight.airline.name}</span>
                  </div>
                  <span className="text-xs text-gray-500">{flight.flightNumber} · {flight.aircraft}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-xl font-bold">{formatTime(flight.departureTime)}</p>
                    <p className="text-sm text-gray-500">{flight.origin.code} · {flight.origin.city}</p>
                  </div>
                  <div className="flex-1 text-center">
                    <p className="text-xs text-gray-400">{formatDuration(flight.duration)}</p>
                    <div className="flex items-center gap-1 justify-center">
                      <div className="w-12 h-px bg-gray-300" />
                      <div className="w-2 h-2 rounded-full bg-indigo-500" />
                      <div className="w-12 h-px bg-gray-300" />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">{formatTime(flight.arrivalTime)}</p>
                    <p className="text-sm text-gray-500">{flight.destination.code} · {flight.destination.city}</p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-bold text-indigo-600">{formatPrice(flight.price * pax)}</p>
                    <p className="text-xs text-gray-500">{pax} pax</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-1">{formatDate(flight.departureTime)} · {flight.availableSeats} seats left</p>
              </div>
            ))}
          </div>
        </div>

        {/* Passenger Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold mb-4">Passenger Details</h2>
          {errors.submit && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{errors.submit}</div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={`w-full rounded-lg border ${errors.name ? "border-red-400" : "border-gray-200"} px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                placeholder="John Doe" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={`w-full rounded-lg border ${errors.email ? "border-red-400" : "border-gray-200"} px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                placeholder="john@example.com" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone (optional)</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="+234 800 000 0000" />
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-bold text-indigo-600">{formatPrice(totalPrice)}</p>
            </div>
            <button type="submit" disabled={booking}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold px-8 py-3 rounded-lg transition">
              {booking ? "Booking..." : "Confirm Booking"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

export default function BookFlightsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full" />
      </div>
    }>
      <BookFlightsPageContent />
    </Suspense>
  );
}