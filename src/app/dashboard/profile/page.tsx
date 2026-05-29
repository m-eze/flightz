"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [name, setName] = useState(session?.user?.name || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  if (!session) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl border p-8 text-center max-w-md">
          <p className="text-lg font-semibold mb-2">Not logged in</p>
          <button onClick={() => router.push("/auth/login")} className="text-indigo-600 hover:underline">Sign in</button>
        </div>
      </main>
    );
  }

  const user = session.user as any;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (data.error) {
        setMessage(data.error);
      } else {
        await update({ ...session, user: { ...session.user, name } });
        setMessage("Profile updated!");
      }
    } catch {
      setMessage("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold mb-2">My Profile</h1>
        <p className="text-gray-500 mb-8">Manage your account details</p>

        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${message.includes("updated") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold mb-4">Account Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-500">Email</label>
              <input type="email" value={session.user?.email || ""} disabled
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-500" />
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-500">Role</label>
              <input type="text" value={user.role || "user"} disabled
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-500 capitalize" />
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100">
            <button type="submit" disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold px-6 py-2.5 rounded-lg transition text-sm">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>

        {/* Quick links */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold mb-3">Quick Links</h2>
          <div className="space-y-2">
            <button onClick={() => router.push("/dashboard")} className="block text-sm text-indigo-600 hover:underline">📋 My Bookings</button>
            {user.role === "admin" && (
              <button onClick={() => router.push("/admin")} className="block text-sm text-indigo-600 hover:underline">🛡️ Admin Panel</button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}