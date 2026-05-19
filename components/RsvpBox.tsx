//yardping/components/RsvpBox.tsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  increment,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/useAuth";

type RsvpBoxProps = {
  pingId: string;
  saleDate: string;
  startTime: string;
  rsvpCutoff: string;
};

function getRsvpCutoffTime(
  saleDate: string,
  startTime: string,
  rsvpCutoff: string
) {
  if (!saleDate || !startTime) {
    return null;
  }

  const saleStart = new Date(`${saleDate}T${startTime}:00`);

  if (Number.isNaN(saleStart.getTime())) {
    return null;
  }

  const cutoffTime = new Date(saleStart);

  if (rsvpCutoff === "6_hours") cutoffTime.setHours(cutoffTime.getHours() - 6);
  if (rsvpCutoff === "12_hours") cutoffTime.setHours(cutoffTime.getHours() - 12);
  if (rsvpCutoff === "24_hours") cutoffTime.setHours(cutoffTime.getHours() - 24);
  if (rsvpCutoff === "48_hours") cutoffTime.setHours(cutoffTime.getHours() - 48);

  return cutoffTime;
}

function formatCutoffMessage(cutoffTime: Date | null) {
  if (!cutoffTime) {
    return "RSVP availability could not be checked.";
  }

  return `RSVPs closed on ${cutoffTime.toLocaleDateString()} at ${cutoffTime.toLocaleTimeString(
    [],
    {
      hour: "numeric",
      minute: "2-digit",
    }
  )}.`;
}

export default function RsvpBox({
  pingId,
  saleDate,
  startTime,
  rsvpCutoff,
}: RsvpBoxProps) {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [interestStatus, setInterestStatus] = useState("");
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [noteLocked, setNoteLocked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isOwner, setIsOwner] = useState(false);

  const cutoffTime = getRsvpCutoffTime(saleDate, startTime, rsvpCutoff);
  const rsvpClosed = cutoffTime ? new Date() >= cutoffTime : false;

  useEffect(() => {
    async function loadExistingRsvp() {
      if (!user || !pingId) {
        return;
      }

      try {
        const pingRef = doc(db, "yardPings", pingId);
        const pingSnapshot = await getDoc(pingRef);

        if (pingSnapshot.exists()) {
          const pingData = pingSnapshot.data();

          if (pingData.createdBy === user.uid) {
            setIsOwner(true);
          }
        }

        const rsvpRef = doc(db, "rsvps", `${pingId}_${user.uid}`);
        const snapshot = await getDoc(rsvpRef);

        if (snapshot.exists()) {
          const data = snapshot.data();

          setInterestStatus(data.status || "");
          setNote(data.note || "");
          setNoteLocked(Boolean(data.noteLocked));
          setSubmitted(true);
        }
      } catch (error) {
        console.error(error);
      }
    }

    loadExistingRsvp();
  }, [user, pingId]);

  function requireLogin() {
    if (!loading && !user) {
      router.push("/login");
      return false;
    }

    return true;
  }

  function blockOwnerRsvp() {
    if (isOwner) {
      alert("This is your own Yard Ping. You cannot RSVP to it.");
      return true;
    }

    return false;
  }

  function handleStatusChange(value: string) {
    if (!requireLogin()) {
      return;
    }

    if (blockOwnerRsvp()) {
      return;
    }

    if (rsvpClosed) {
      setErrorMessage("RSVPs are closed for this Yard Ping.");
      return;
    }

    setInterestStatus(value);
    setSubmitted(false);
    setErrorMessage("");
  }

  async function handleSubmit() {
    if (!requireLogin()) {
      return;
    }

    if (!user) {
      return;
    }

    if (blockOwnerRsvp()) {
      return;
    }

    if (rsvpClosed) {
      setErrorMessage("RSVPs are closed for this Yard Ping.");
      return;
    }

    if (!interestStatus) {
      alert("Please choose Yes or Maybe before submitting.");
      return;
    }

    setSaving(true);
    setErrorMessage("");

    try {
      const pingRef = doc(db, "yardPings", pingId);
      const rsvpRef = doc(db, "rsvps", `${pingId}_${user.uid}`);

      await runTransaction(db, async (transaction) => {
        const existingRsvpSnapshot = await transaction.get(rsvpRef);
        const existingRsvp = existingRsvpSnapshot.exists()
          ? existingRsvpSnapshot.data()
          : null;

        const previousStatus = existingRsvp?.status || "";
        const existingNoteLocked = Boolean(existingRsvp?.noteLocked);

        let interestedDelta = 0;
        let maybeDelta = 0;

        if (!previousStatus && interestStatus === "yes") {
          interestedDelta = 1;
        }

        if (!previousStatus && interestStatus === "maybe") {
          maybeDelta = 1;
        }

        if (previousStatus === "yes" && interestStatus === "maybe") {
          interestedDelta = -1;
          maybeDelta = 1;
        }

        if (previousStatus === "maybe" && interestStatus === "yes") {
          maybeDelta = -1;
          interestedDelta = 1;
        }

        const cleanNote = note.trim();
        const shouldSaveNote = cleanNote.length > 0 && !existingNoteLocked;

        transaction.set(
          rsvpRef,
          {
            pingId,
            userId: user.uid,
            userName: user.displayName || user.email || "",
            userEmail: user.email || "",
            status: interestStatus,
            note: shouldSaveNote ? cleanNote : existingRsvp?.note || "",
            noteLocked: shouldSaveNote ? true : existingNoteLocked,
            updatedAt: serverTimestamp(),
            createdAt: existingRsvp?.createdAt || serverTimestamp(),
          },
          { merge: true }
        );

        transaction.update(pingRef, {
          interestedCount: increment(interestedDelta),
          maybeCount: increment(maybeDelta),
          updatedAt: serverTimestamp(),
        });
      });

      setSubmitted(true);

      if (note.trim().length > 0) {
        setNoteLocked(true);
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("Could not save your RSVP. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function getConfirmationMessage() {
    if (interestStatus === "yes") {
      return "Thanks! Your response is now marked as interested.";
    }

    if (interestStatus === "maybe") {
      return "Thanks! Your response is now marked as maybe.";
    }

    return "Your response has been saved.";
  }

  return (
    <div className="mt-5 rounded-lg border bg-gray-50 p-3">
      <p className="text-sm font-semibold">Interested in visiting?</p>
      <p className="mt-1 text-xs text-gray-500">
        Let the seller know if you may visit. You can also leave one optional
        note.
      </p>

      {isOwner && (
        <div className="mt-3 rounded bg-yellow-100 p-3 text-sm text-yellow-800">
          This is your own Yard Ping. You cannot RSVP to it.
        </div>
      )}

      {rsvpClosed && (
        <div className="mt-3 rounded bg-red-100 p-3 text-sm text-red-800">
          RSVPs are closed for this Yard Ping. {formatCutoffMessage(cutoffTime)}
        </div>
      )}

      {!loading && !user && !rsvpClosed && (
        <div className="mt-3 rounded bg-yellow-100 p-3 text-sm text-yellow-800">
          Please log in to RSVP or leave a note.
        </div>
      )}

      <div className="mt-3 space-y-2">
        <label className="flex items-center gap-2 rounded border bg-white p-3 text-sm">
          <input
            type="radio"
            name="interestStatus"
            value="yes"
            checked={interestStatus === "yes"}
            disabled={rsvpClosed || isOwner}
            onChange={(event) => handleStatusChange(event.target.value)}
          />
          Yes, I’m interested
        </label>

        <label className="flex items-center gap-2 rounded border bg-white p-3 text-sm">
          <input
            type="radio"
            name="interestStatus"
            value="maybe"
            checked={interestStatus === "maybe"}
            disabled={rsvpClosed || isOwner}
            onChange={(event) => handleStatusChange(event.target.value)}
          />
          Maybe
        </label>
      </div>

      <div className="mt-3">
        <textarea
          value={note}
          maxLength={150}
          disabled={noteLocked || rsvpClosed || isOwner || (!loading && !user)}
          onChange={(event) => {
            setNote(event.target.value);
            setSubmitted(false);
            setErrorMessage("");
          }}
          placeholder="Optional note e.g. Do you have any TVs available?"
          className="min-h-24 w-full rounded border bg-white p-3 text-sm disabled:bg-gray-100 disabled:text-gray-500"
        />

        <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
          <span>
            {noteLocked
              ? "Your note has been sent and cannot be edited."
              : "Optional one-time note to the seller."}
          </span>
          <span>{note.length}/150</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={saving || rsvpClosed || isOwner}
        className="mt-3 w-full rounded bg-green-500 px-4 py-3 font-semibold text-white disabled:opacity-60"
      >
        {saving
          ? "Saving..."
          : submitted
          ? "Update response"
          : "Submit response"}
      </button>

      {errorMessage && (
        <div className="mt-3 rounded bg-red-100 p-3 text-sm text-red-800">
          {errorMessage}
        </div>
      )}

      {submitted && !errorMessage && !rsvpClosed && !isOwner && (
        <div className="mt-3 rounded bg-green-100 p-3 text-sm text-green-800">
          {getConfirmationMessage()}
        </div>
      )}

      <p className="mt-2 text-center text-xs text-gray-500">
        This does not start a chat. It only sends your note to the seller.
      </p>
    </div>
  );
}