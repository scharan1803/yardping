"use client";

import Link from "next/link";
import { useState } from "react";

export default function RegisterPage() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <main className="min-h-screen bg-gray-100 p-4">
      <div className="mx-auto max-w-md">
        <div className="mb-4">
          <h1 className="mt-3 text-2xl font-bold">Create your account</h1>
          <p className="mt-1 text-sm text-gray-600">
            Sign up to RSVP, save local sales, and manage your Yard Pings.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-lg bg-white p-4 shadow"
        >
          <input
            type="text"
            placeholder="Full name"
            className="w-full rounded border p-3"
          />

          <input
            type="email"
            placeholder="Email address"
            className="w-full rounded border p-3"
          />

          <input
            type="tel"
            placeholder="Phone number"
            className="w-full rounded border p-3"
          />

          <input
            type="text"
            placeholder="Hometown e.g. Simcoe"
            className="w-full rounded border p-3"
          />

          <input
            type="text"
            placeholder="Postal code e.g. N3Y"
            className="w-full rounded border p-3"
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full rounded border p-3"
          />

          <button className="w-full rounded bg-green-500 px-4 py-3 font-semibold text-white">
            Create account
          </button>

          {submitted && (
            <div className="rounded bg-green-100 p-3 text-sm text-green-800">
              Account form prepared. Firebase will create the account later.
            </div>
          )}

          <p className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-green-700">
              Log in
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}