"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  type DocumentData,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/useAuth";
import RsvpBox from "@/components/RsvpBox";
import ShareButton from "@/components/ShareButton";

type YardPing = {
  id: string;
  title: string;
  displayAddressArea: string;
  date: string;
  startTime: string;
  endTime: string;
  interestedCount: number;
  maybeCount: number;
  description: string;
  pingRadiusKm: number;
  rsvpCutoff: string;
  categories: string[];
  lemonadeStand: boolean;
  createdBy: string;
};

const reportReasons = [
  "Spam yard sale",
  "Wrong information",
  "Rude behaviour",
  "Violence or unsafe situation",
  "Other",
];

function formatRsvpCutoff(cutoff: string) {
  if (cutoff === "event_start") return "Open until sale starts";
  if (cutoff === "6_hours") return "Closes 6 hours before sale";
  if (cutoff === "12_hours") return "Closes 12 hours before sale";
  if (cutoff === "24_hours") return "Closes 24 hours before sale";
  if (cutoff === "48_hours") return "Closes 48 hours before sale";
  return "RSVP cutoff not set";
}

export default function PingDetailsPage() {
  const { user } = useAuth();
  const params = useParams();
  const id = params.id as string;

  const [ping, setPing] = useState<YardPing | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [inactiveMessage, setInactiveMessage] = useState("");

  // report state
  const [showReport, setShowReport] = useState(false);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [reporting, setReporting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState("");

  useEffect(() => {
    async function loadPing() {
      try {
        setLoading(true);

        const docRef = doc(db, "yardPings", id);
        const snapshot = await getDoc(docRef);

        if (!snapshot.exists()) {
          setPing(null);
          return;
        }

        const data = snapshot.data() as DocumentData;

        if (data.status !== "active") {
          setInactiveMessage("This Yard Ping is no longer active.");
          return;
        }

        setPing({
          id: snapshot.id,
          title: data.title || "",
          displayAddressArea:
            data.displayAddressArea ||
            `${data.city || ""}, ${data.province || ""}`,
          date: data.date || "",
          startTime: data.startTime || "",
          endTime: data.endTime || "",
          interestedCount: data.interestedCount || 0,
          maybeCount: data.maybeCount || 0,
          description: data.description || "",
          pingRadiusKm: data.pingRadiusKm || 0,
          rsvpCutoff: data.rsvpCutoff || "",
          categories: data.categories || [],
          lemonadeStand: data.lemonadeStand || false,
          createdBy: data.createdBy || "",
        });
      } catch (error) {
        console.error(error);
        setErrorMessage("Could not load this Yard Ping.");
      } finally {
        setLoading(false);
      }
    }

    if (id) loadPing();
  }, [id]);

  async function handleReport() {
    if (!user) {
      alert("Please log in to report.");
      return;
    }

    if (!reason) {
      alert("Please select a reason.");
      return;
    }

    if (!ping) return;

    if (ping.createdBy === user.uid) {
      alert("You cannot report your own Yard Ping.");
      return;
    }

    try {
      setReporting(true);

      await addDoc(collection(db, "reports"), {
        pingId: ping.id,
        reportedBy: user.uid,
        reason,
        note,
        createdAt: serverTimestamp(),
      });

      setReportSuccess("Report submitted successfully.");
      setShowReport(false);
      setReason("");
      setNote("");
    } catch (error) {
      console.error(error);
      alert("Failed to submit report.");
    } finally {
      setReporting(false);
    }
  }

  if (loading) return <div className="p-4">Loading...</div>;
  if (errorMessage) return <div className="p-4 text-red-600">{errorMessage}</div>;
  if (inactiveMessage) return <div className="p-4">{inactiveMessage}</div>;
  if (!ping) return <div className="p-4">Not found</div>;

  return (
    <main className="min-h-screen bg-gray-100 p-4">
      <div className="mx-auto max-w-md">
        <Link href="/" className="text-sm text-green-700">
          ← Back
        </Link>

        <section className="mt-4 rounded-lg bg-white p-4 shadow">
          <h1 className="text-2xl font-bold">{ping.title}</h1>

          <p className="mt-2 text-gray-600">
            📍 {ping.displayAddressArea}
          </p>

          <p className="text-gray-600">
            {ping.date} • {ping.startTime} - {ping.endTime}
          </p>

          <p className="mt-4 text-sm text-gray-600">{ping.description}</p>

          <RsvpBox
            pingId={ping.id}
            saleDate={ping.date}
            startTime={ping.startTime}
            rsvpCutoff={ping.rsvpCutoff}
          />

          <ShareButton />

          {/* REPORT BUTTON */}
          {user && ping.createdBy !== user.uid && (
            <button
              onClick={() => setShowReport(!showReport)}
              className="mt-4 w-full rounded border border-red-300 px-4 py-2 text-sm text-red-600"
            >
              Report this Yard Ping
            </button>
          )}

          {/* REPORT FORM */}
          {showReport && (
            <div className="mt-3 rounded border p-3">
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded border p-2"
              >
                <option value="">Select reason</option>
                {reportReasons.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>

              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional note"
                className="mt-2 w-full rounded border p-2"
              />

              <button
                onClick={handleReport}
                disabled={reporting}
                className="mt-2 w-full rounded bg-red-500 px-4 py-2 text-white"
              >
                {reporting ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          )}

          {reportSuccess && (
            <p className="mt-3 text-sm text-green-600">{reportSuccess}</p>
          )}
        </section>
      </div>
    </main>
  );
}