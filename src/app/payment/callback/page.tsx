"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

export function PaymentCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = searchParams.get("reference") || searchParams.get("trxref") || "";
  const [status, setStatus] = useState<"verifying" | "success" | "failed">("verifying");

  useEffect(() => {
    if (!reference) {
      setStatus("failed");
      return;
    }

    fetch("/api/payment/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reference }),
    })
      .then((r) => r.json())
      .then((data) => {
        setStatus(data.success ? "success" : "failed");
      })
      .catch(() => setStatus("failed"));
  }, [reference]);

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        {status === "verifying" && (
          <>
            <div className="animate-spin inline-block w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full mb-4" />
            <h1 className="text-xl font-bold">Verifying Payment</h1>
            <p className="text-sm text-gray-500 mt-2">Please wait while we confirm your payment...</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="text-5xl mb-4">🎉</div>
            <h1 className="text-xl font-bold">Payment Successful!</h1>
            <p className="text-sm text-gray-500 mt-2">
              Reference: <strong className="text-indigo-600">{reference}</strong>
            </p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => router.push("/dashboard")}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg text-sm transition">
                View My Bookings
              </button>
            </div>
          </>
        )}

        {status === "failed" && (
          <>
            <div className="text-5xl mb-4">😕</div>
            <h1 className="text-xl font-bold">Payment Failed</h1>
            <p className="text-sm text-gray-500 mt-2">Something went wrong. Please try again.</p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => router.push("/dashboard")}
                className="flex-1 bg-gray-100 hover:bg-gray-200 py-2.5 rounded-lg text-sm transition">
                My Bookings
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full" />
      </div>
    }>
      <PaymentCallbackContent />
    </Suspense>
  );
}