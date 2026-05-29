import Link from "next/link";

export default function NotFound() {
  return (
    <html>
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <main className="flex items-center justify-center min-h-screen p-6">
          <div className="text-center">
            <p className="text-6xl mb-4">🛫</p>
            <h1 className="text-3xl font-bold mb-2">404 — Page Not Found</h1>
            <p className="text-gray-500 mb-6">This flight path doesn't exist.</p>
            <Link href="/" className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-lg transition text-sm">
              Back to Home
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}