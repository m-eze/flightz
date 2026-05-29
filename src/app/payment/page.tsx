"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { formatPrice } from "@/lib/utils";

declare global {
  interface Window {
    PaystackPop?: new (key: string) => {
      new (key: string): {
        checkout: (args: {
          key: string;
          email: string;
          amount: number;
          reference: string;
          callback: (response: { reference: string }) => void;
          onClose: () => void;
        }) => void;
      };
    };
  }
}

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const ref = searchParams.get("ref") || "";
  const amount = parseInt(searchParams.get("amount") || "0");
  const email = searchParams.get("email") || "";
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  const loadPaystack = () => {
    return new Promise<void>((resolve) => {
      if (window.PaystackPop) { resolve(); return; }
      const script = document.createElement("script");
      script.src = "https://js.paystack.co/v1/inline.js";
      script.onload = () => resolve();
      document.body.appendChild(script);
    });
  };

  const handlePay = async () => {
    setPaying(true);
    setError("");

    try {
      // Try real Paystack
      await loadPaystack();
      const publicKey = (window as any).__PAYSTACK_PUBLIC_KEY__ || "";

      if (publicKey && window.PaystackPop) {
        const handler = new window.PaystackPop();
        handler.checkout({
          key: publicKey,
          email,
          amount,
          reference: ref,
          callback: (res: { reference: string }) => {
            fetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ reference: res.reference }),
            }).then(() => router.push(`/payment/callback?reference=${res.reference}`));
          },
          onClose: () => setPaying(false),
        });
      } else {
        // Fallback: simulated payment
        await new Promise((r) => setTimeout(r, 2000));
        const res = await fetch("/api/payment/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference: ref }),
        });
        const data = await res.json();
        if (data.error) {
          setError(data.error);
          setPaying(false);
        } else {
          router.push(`/payment/callback?reference=${ref}`);
        }
      }
    } catch {
      setError("Payment failed. Please try again.");
      setPaying(false);
    }
  };

  const handleCancel = () => router.push("/dashboard");

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="text-3xl mb-2">💳</div>
          <h1 className="text-xl font-bold">Complete Payment</h1>
          <p className="text-sm text-gray-500 mt-1">Booking: <span className="font-mono font-semibold">{ref}</span></p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 text-center">
            {error}
          </div>
        )}

        {/* Simulated card form */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">Payment method</span>
            <div className="flex gap-1">
              <span className="text-xs">💳</span>
              <span className="text-xs">🏦</span>
              <span className="text-xs">📱</span>
            </div>
          </div>
          <div className="bg-white rounded border border-gray-200 p-3 mb-3">
            <p className="text-xs text-gray-400 mb-1">Card number</p>
            <p className="text-sm font-mono">**** **** **** 4242</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded border border-gray-200 p-3">
              <p className="text-xs text-gray-400 mb-1">Expiry</p>
              <p className="text-sm font-mono">12/28</p>
            </div>
            <div className="bg-white rounded border border-gray-200 p-3">
              <p className="text-xs text-gray-400 mb-1">CVV</p>
              <p className="text-sm font-mono">***</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between py-3 border-t border-gray-100">
          <span className="text-sm text-gray-600">Total to pay</span>
          <span className="text-xl font-bold text-indigo-600">{formatPrice(amount)}</span>
        </div>

        <div className="flex gap-3 mt-4">
          <button onClick={handleCancel}
            className="flex-1 py-3 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg transition">
            Cancel
          </button>
          <button onClick={handlePay} disabled={paying}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3 rounded-lg transition text-sm">
            {paying ? "Processing..." : `Pay ${formatPrice(amount)}`}
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          🔒 Secured by Paystack
        </p>
      </div>
    </main>
  );
}