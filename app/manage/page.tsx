"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/useAuth";

type ManagedPing = {
  id: string;
  title: string;
  date: string;
  time: string;
  address: string;
  interestedCount: number;
  maybeCount: number;
  notes: string[];
};

export default function ManagePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [myCreatedPings, setMyCreatedPings] = useState<ManagedPing[]>([]);
  const [pingsLoading, setPingsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [deactivatingId, setDeactivatingId] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    async function loadMyCreatedPings() {
      if (!user) return;

      try {
        setPingsLoading(true);
        setErrorMessage("");

        const pingsQuery = query(
          collection(db, "yardPings"),
          where("createdBy", "==", user.uid),
          where("status", "==", "active")
        );

        const snapshot = await getDocs(pingsQuery);

        const loaded = await Promise.all(
          snapshot.docs.map(async (pingDoc) => {
            const data = pingDoc.data() as DocumentData;

            const rsvpsQuery = query(
              collection(db, "rsvps"),
              where("pingId", "==", pingDoc.id)
            );

            const rsvpsSnapshot = await getDocs(rsvpsQuery);

            const notes = rsvpsSnapshot.docs
              .map((r) => r.data().note || "")
              .filter((n) => n);

            return {
              id: pingDoc.id,
              title: data.title || "",
              date: data.date || "",
              time: `${data.startTime || ""} - ${data.endTime || ""}`,
              address: data.displayAddressArea || "Location unavailable",
              interestedCount: data.interestedCount || 0,
              maybeCount: data.maybeCount || 0,
              notes,
            };
          })
        );

        setMyCreatedPings(loaded);
      } catch (error) {
        console.error(error);
        setErrorMessage("Could not load your Yard Pings.");
      } finally {
        setPingsLoading(false);
      }
    }

    if (!loading && user) {
      loadMyCreatedPings();
    }
  }, [user, loading]);

  async function handleDeactivate(id: string) {
    try {
      setDeactivatingId(id);

      const ref = doc(db, "yardPings", id);
      await updateDoc(ref, {
        status: "inactive",
      });

      setMyCreatedPings((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      console.error(error);
      alert("Failed to deactivate Yard Ping.");
    } finally {
      setDeactivatingId("");
    }
  }

  if (loading || pingsLoading) {
    return (
      <main className="min-h-screen bg-gray-100 p-4">
        <div className="mx-auto max-w-md">
          <div className="rounded bg-white p-4 text-sm text-gray-600 shadow">
            Loading...
          </div>
        </div>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-gray-100 p-4">
      <div className="mx-auto max-w-md">
        <Link href="/" className="text-sm text-green-700">
          ← Back to Yard Pings
        </Link>

        <h1 className="mt-3 text-2xl font-bold">Manage Your Yard Pings</h1>

        {errorMessage && (
          <div className="mt-3 rounded bg-red-100 p-3 text-sm text-red-800">
            {errorMessage}
          </div>
        )}

        {myCreatedPings.length === 0 && (
          <div className="mt-4 rounded bg-white p-4 text-sm text-gray-600 shadow">
            You have no active Yard Pings.
          </div>
        )}

        <div className="mt-4 space-y-4">
          {myCreatedPings.map((ping) => (
            <div key={ping.id} className="rounded-lg bg-white p-4 shadow">
              <h2 className="text-lg font-semibold">{ping.title}</h2>

              <p className="text-sm text-gray-600">
                {ping.date} • {ping.time}
              </p>

              <p className="mt-1 text-sm text-gray-600">
                📍 {ping.address}
              </p>

              <p className="mt-2 text-sm text-gray-700">
                👍 {ping.interestedCount} interested • 🤔 {ping.maybeCount} maybe
              </p>

              {ping.notes.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-semibold">Visitor Notes</p>
                  <ul className="mt-1 list-disc pl-4 text-sm text-gray-600">
                    {ping.notes.map((note, i) => (
                      <li key={i}>{note}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <Link
                  href={`/create?edit=${ping.id}`}
                  className="flex-1 rounded border border-gray-300 bg-white px-3 py-2 text-center text-sm font-semibold text-gray-900"
                >
                  Edit
                </Link>

                <button
                  onClick={() => handleDeactivate(ping.id)}
                  disabled={deactivatingId === ping.id}
                  className="flex-1 rounded bg-red-500 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {deactivatingId === ping.id
                    ? "Deactivating..."
                    : "Deactivate"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}