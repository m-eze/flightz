"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function Navbar() {
  const { data: session, status } = useSession();

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-indigo-600">✈️ Flightz</Link>

        <div className="flex items-center gap-4 text-sm">
          {status === "loading" ? (
            <span className="w-5 h-5 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          ) : session?.user ? (
            <>
              <Link href="/dashboard" className="text-gray-600 hover:text-indigo-600 transition">My Bookings</Link>
              <Link href="/admin" className="text-gray-600 hover:text-indigo-600 transition">Admin</Link>
              <div className="flex items-center gap-2 ml-2">
                {session.user.image && (
                  <img src={session.user.image} alt="" className="w-6 h-6 rounded-full" />
                )}
                <span className="text-gray-700 font-medium">{session.user.name || session.user.email}</span>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-gray-400 hover:text-red-500 transition ml-1"
                >
                  Sign out
                </button>
              </div>
            </>
          ) : (
            <>
              <Link href="/dashboard" className="text-gray-600 hover:text-indigo-600 transition">My Bookings</Link>
              <Link href="/admin" className="text-gray-600 hover:text-indigo-600 transition">Admin</Link>
              <Link href="/auth/login" className="text-indigo-600 hover:text-indigo-700 font-medium transition">Sign In</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}