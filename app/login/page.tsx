"use client";

import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <main className="min-h-screen bg-gray-100 p-4">
      <div className="mx-auto max-w-md">
        <div className="mb-4">
          <h1 className="mt-3 text-2xl font-bold">Log in</h1>
          <p className="mt-1 text-sm text-gray-600">
            Access your RSVP responses and manage your Yard Pings.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-lg bg-white p-4 shadow"
        >
          <input
            type="email"
            placeholder="Email address"
            className="w-full rounded border p-3"
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full rounded border p-3"
          />

          <button className="w-full rounded bg-green-500 px-4 py-3 font-semibold text-white">
            Log in
          </button>

          {submitted && (
            <div className="rounded bg-green-100 p-3 text-sm text-green-800">
              Login form prepared. Firebase will authenticate this later.
            </div>
          )}

          <p className="text-center text-sm text-gray-600">
            New to YardPing?{" "}
            <Link href="/register" className="font-semibold text-green-700">
              Create account
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}