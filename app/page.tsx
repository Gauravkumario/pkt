"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center w-full max-w-md">
        <h1 className="text-3xl font-bold text-center w-full mb-4 text-gray-700">
          Security Cam System
        </h1>

        <div className="flex flex-col gap-4 w-full">
          <Link
            href="/camera"
            className="flex flex-col items-center justify-center gap-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 p-8 transition-colors border-2 border-gray-300 shadow-sm cursor-pointer"
          >
            <div className="text-xl font-semibold">Camera Mode</div>
            <span className="text-sm text-gray-500">
              Turn this device into a camera
            </span>
          </Link>

          <Link
            href="/viewer"
            className="flex flex-col items-center justify-center gap-2 rounded-xl bg-gray-800 hover:bg-gray-900 text-amber-50 p-8 transition-colors shadow-sm cursor-pointer"
          >
            <div className="text-xl font-semibold">Viewer Mode</div>
            <span className="text-sm text-gray-400">
              Watch a stream from another device
            </span>
          </Link>
        </div>
      </main>

      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center text-gray-400 text-xs">
        Secure P2P Streaming via WebRTC
      </footer>
    </div>
  );
}
