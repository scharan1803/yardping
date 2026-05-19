"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
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
      if (!user) {
        return;
      }

      try {
        setPingsLoading(true);
        setErrorMessage("");

        const pingsQuery = query(
          collection(db, "yardPings"),
          where("createdBy", "==", user.uid),
          where("status", "==", "active")
        );

        const pingsSnapshot = await getDocs(pingsQuery);

        const loadedPings = await Promise.all(
          pingsSnapshot.docs.map(async (pingDoc) => {
            const pingData = pingDoc.data() as DocumentData;

            const rsvpsQuery = query(
              collection(db, "rsvps"),
              where("pingId", "==", pingDoc.id)
            );

            const rsvpsSnapshot = await getDocs(rsvpsQuery);

            const notes = rsvpsSnapshot.docs
              .map((rsvpDoc) => {
                const rsvpData = rsvpDoc.data() as DocumentData;
                return rsvpData.note || "";
              })
              .filter((note) => note.trim().length > 0);

            return {
              id: pingDoc.id,
              title: pingData.title || "",
              date: pingData.date || "",
              time: `${pingData.startTime || ""} - ${pingData.endTime || ""}`,
              interestedCount: pingData.interestedCount || 0,
              maybeCount: pingData.maybeCount || 0,
              notes,
            };
          })
        );

        setMyCreatedPings(loadedPings);
      } catch (error) {
        console.error(error);
        setErrorMessage("Could not load your Yard Pings. Please try again.");
      } finally {
        setPingsLoading(false);
      }
    }

    if (user) {
      loadMyCreatedPings();
    }
  }, [user]);

  async function handleDeactivate(pingId: string) {
    const shouldDeactivate = window.confirm(
      "Are you sure you want to remove this Yard Ping from public view?"
    );

    if (!shouldDeactivate) {
      return;
    }

    try {
      setDeactivatingId(pingId);
      setErrorMessage("");

      await updateDoc(doc(db, "yardPings", pingId), {
        status: "inactive",
        updatedAt: serverTimestamp(),
      });

      setMyCreatedPings((current) =>
        current.filter((ping) => ping.id !== pingId)
      );
    } catch (error) {
      console.error(error);
      setErrorMessage("Could not deactivate this Yard Ping. Please try again.");
    } finally {
      setDeactivatingId("");
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 p-4">
        <div className="mx-auto max-w-md">
          <div className="rounded-lg bg-white p-4 text-sm text-gray-600 shadow">
            Checking login status...
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-100 p-4">
      <div className="mx-auto max-w-md">
        <div className="mb-4">
          <Link href="/" className="text-sm text-green-700">
            ← Back to Yard Pings
          </Link>

          <h1 className="mt-3 text-2xl font-bold">Manage Yard Pings</h1>
          <p className="mt-1 text-sm text-gray-600">
            View your created Yard Pings, RSVP counts, and one-way notes.
          </p>

          <p className="mt-2 text-xs text-gray-500">
            Managing as {user.displayName || user.email}
          </p>
        </div>

        {pingsLoading && (
          <div className="rounded-lg bg-white p-4 text-sm text-gray-600 shadow">
            Loading your Yard Pings...
          </div>
        )}

        {errorMessage && (
          <div className="rounded bg-red-100 p-3 text-sm text-red-800">
            {errorMessage}
          </div>
        )}

        {!pingsLoading && !errorMessage && myCreatedPings.length === 0 && (
          <div className="rounded-lg bg-white p-4 text-sm text-gray-600 shadow">
            You have no active Yard Pings.
          </div>
        )}

        {!pingsLoading && !errorMessage && myCreatedPings.length > 0 && (
          <div className="space-y-4">
            {myCreatedPings.map((ping) => (
              <section key={ping.id} className="rounded-lg bg-white p-4 shadow">
                <div>
                  <h2 className="text-lg font-semibold">{ping.title}</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    {ping.date} • {ping.time}
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded bg-green-50 p-3">
                    <p className="text-xs text-gray-500">Interested</p>
                    <p className="text-xl font-bold text-green-700">
                      {ping.interestedCount}
                    </p>
                  </div>

                  <div className="rounded bg-yellow-50 p-3">
                    <p className="text-xs text-gray-500">Maybe</p>
                    <p className="text-xl font-bold text-yellow-700">
                      {ping.maybeCount}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-sm font-semibold">Notes from visitors</p>

                  {ping.notes.length === 0 ? (
                    <p className="mt-2 rounded border bg-gray-50 p-3 text-sm text-gray-500">
                      No notes yet.
                    </p>
                  ) : (
                    <div className="mt-2 space-y-2">
                      {ping.notes.map((note, index) => (
                        <p
                          key={index}
                          className="rounded border bg-gray-50 p-3 text-sm text-gray-700"
                        >
                          {note}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-1 gap-2">
                  <Link
                    href={`/create?edit=${ping.id}`}
                    className="block w-full rounded border border-gray-300 px-4 py-3 text-center font-semibold"
                  >
                    Edit Yard Ping
                  </Link>

                  <button
                    type="button"
                    disabled={deactivatingId === ping.id}
                    onClick={() => handleDeactivate(ping.id)}
                    className="w-full rounded border border-red-300 bg-red-50 px-4 py-3 text-center font-semibold text-red-700 disabled:opacity-60"
                  >
                    {deactivatingId === ping.id
                      ? "Deactivating..."
                      : "Deactivate Yard Ping"}
                  </button>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}