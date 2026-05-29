import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import Navbar from "@/components/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "NFlightz — Book Flights in Nigeria",
  description: "Search, compare and book flights across Nigeria. The smartest way to fly domestic.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const paystackPublicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <SessionProvider>
          <Navbar />
          {children}
        </SessionProvider>
        {paystackPublicKey && (
          <script
            dangerouslySetInnerHTML={{
              __html: `window.__PAYSTACK_PUBLIC_KEY__ = "${paystackPublicKey}";`,
            }}
          />
        )}
      </body>
    </html>
  );
}