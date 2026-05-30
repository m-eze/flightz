"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function Navbar() {
  const { data: session, status } = useSession();

  return (
    <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="text-lg font-bold text-indigo-600 tracking-tight">
            ✈ NFlightz
          </Link>

          <div className="flex items-center gap-3 text-sm">
            {status === "loading" ? (
              <span className="w-5 h-5 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            ) : session?.user ? (
              <>
                <Link href="/dashboard" className="text-gray-500 hover:text-indigo-600 transition hidden sm:inline font-medium">
                  My Bookings
                </Link>
                <Link href="/dashboard/profile" className="text-gray-500 hover:text-indigo-600 transition hidden sm:inline font-medium">
                  Profile
                </Link>
                {(session.user as any).role === "admin" && (
                  <Link href="/admin" className="text-gray-500 hover:text-indigo-600 transition hidden sm:inline font-medium">
                    Admin
                  </Link>
                )}
                <div className="h-4 w-px bg-gray-200 hidden sm:block" />
                <span className="text-gray-600 font-medium truncate max-w-[100px] text-xs">
                  {session.user.name || session.user.email?.split("@")[0]}
                </span>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-xs text-gray-400 hover:text-red-500 transition font-medium"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/dashboard" className="text-gray-500 hover:text-indigo-600 transition hidden sm:inline font-medium">
                  Bookings
                </Link>
                <Link href="/auth/login" className="text-indigo-600 hover:text-indigo-700 font-medium transition text-xs border border-indigo-200 px-3 py-1.5 rounded-full hover:bg-indigo-50">
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
