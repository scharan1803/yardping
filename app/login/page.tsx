"use client";

import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/");
    } catch (err) {
      console.error(err);
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError("");
    setGoogleLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);

      await setDoc(
        doc(db, "users", userCredential.user.uid),
        {
          uid: userCredential.user.uid,
          name: userCredential.user.displayName || "",
          email: userCredential.user.email || "",
          phone: "",
          hometown: "",
          postalCode: "",
          authProvider: "google",
          sellerVerified: false,
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );

      router.push("/");
    } catch (err) {
      console.error(err);
      setError("Google sign-in failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
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
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full rounded border border-gray-300 bg-white px-4 py-3 font-semibold text-gray-800 disabled:opacity-60"
          >
            {googleLoading
              ? "Signing in with Google..."
              : "Continue with Google"}
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs text-gray-500">or</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded border p-3"
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded border p-3"
            required
          />

          <button
            disabled={loading}
            className="w-full rounded bg-green-500 px-4 py-3 font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>

          {error && (
            <div className="rounded bg-red-100 p-3 text-sm text-red-800">
              {error}
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