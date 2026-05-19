"use client";

import Link from "next/link";
import { signOut } from "firebase/auth";
import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
  type DocumentData,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/lib/useAuth";
import YardPingCard from "@/components/YardPingCard";

type YardPing = {
  id: string;
  title: string;
  displayAddressArea: string;
  date: string;
  startTime: string;
  endTime: string;
  interestedCount: number;
  maybeCount: number;
  categories: string[];
  lemonadeStand: boolean;
};

export default function Home() {
  const { user, loading } = useAuth();

  const [yardPings, setYardPings] = useState<YardPing[]>([]);
  const [pingsLoading, setPingsLoading] = useState(true);
  const [pingsError, setPingsError] = useState("");

  useEffect(() => {
    async function loadYardPings() {
      try {
        setPingsLoading(true);
        setPingsError("");

        const yardPingsQuery = query(
          collection(db, "yardPings"),
          where("status", "==", "active"),
          orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(yardPingsQuery);

        const loadedPings = snapshot.docs.map((doc) => {
          const data = doc.data() as DocumentData;

          return {
            id: doc.id,
            title: data.title || "",
            displayAddressArea:
              data.displayAddressArea ||
              `${data.city || ""}, ${data.province || ""}`,
            date: data.date || "",
            startTime: data.startTime || "",
            endTime: data.endTime || "",
            interestedCount: data.interestedCount || 0,
            maybeCount: data.maybeCount || 0,
            categories: data.categories || [],
            lemonadeStand: data.lemonadeStand || false,
          };
        });

        setYardPings(loadedPings);
      } catch (error) {
        console.error(error);
        setPingsError("Could not load Yard Pings. Please refresh and try again.");
      } finally {
        setPingsLoading(false);
      }
    }

    loadYardPings();
  }, []);

  async function handleSignOut() {
    await signOut(auth);
  }

  return (
    <main className="min-h-screen bg-gray-100 p-4">
      <div className="mx-auto max-w-md">
        <div className="mb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-950">YardPing</h1>
              <p className="mt-1 text-sm text-gray-600">
                Local garage sales near you
              </p>

              {!loading && user && (
                <p className="mt-2 text-xs text-gray-500">
                  Signed in as{" "}
                  <Link
                    href="/profile"
                    className="font-semibold text-green-700 underline underline-offset-2 hover:text-green-800"
                  >
                    {user.displayName || user.email}
                  </Link>
                </p>
              )}
            </div>

            {!loading && user ? (
              <button
                onClick={handleSignOut}
                className="rounded border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900"
              >
                Sign out
              </button>
            ) : (
              <Link
                href="/login"
                className="rounded border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900"
              >
                Log in
              </Link>
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Link
              href="/create"
              className="rounded bg-green-500 px-4 py-3 text-center font-semibold text-white"
            >
              Create
            </Link>

            <Link
              href="/manage"
              className="rounded border border-gray-300 bg-white px-4 py-3 text-center font-semibold text-gray-900"
            >
              Manage
            </Link>
          </div>

          {!loading && !user && (
            <div className="mt-3 rounded bg-yellow-100 p-3 text-sm text-yellow-800">
              Log in to RSVP or manage your Yard Pings.
            </div>
          )}
        </div>

        {pingsLoading && (
          <div className="rounded-lg bg-white p-4 text-sm text-gray-600 shadow">
            Loading Yard Pings...
          </div>
        )}

        {pingsError && (
          <div className="rounded bg-red-100 p-3 text-sm text-red-800">
            {pingsError}
          </div>
        )}

        {!pingsLoading && !pingsError && yardPings.length === 0 && (
          <div className="rounded-lg bg-white p-4 text-sm text-gray-600 shadow">
            No Yard Pings yet. Create the first one.
          </div>
        )}

        {!pingsLoading &&
          !pingsError &&
          yardPings.map((ping) => (
            <YardPingCard
              key={ping.id}
              id={ping.id}
              title={ping.title}
              displayAddressArea={ping.displayAddressArea}
              date={ping.date}
              startTime={ping.startTime}
              endTime={ping.endTime}
              interestedCount={ping.interestedCount}
              maybeCount={ping.maybeCount}
              categories={ping.categories}
              lemonadeStand={ping.lemonadeStand}
            />
          ))}
      </div>
    </main>
  );
}