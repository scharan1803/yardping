"use client";

import { useState } from "react";

export default function RsvpBox() {
  const [interestStatus, setInterestStatus] = useState("");
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [noteLocked, setNoteLocked] = useState(false);

  function handleSubmit() {
    if (!interestStatus) {
      alert("Please choose Yes or Maybe before submitting.");
      return;
    }

    setSubmitted(true);

    if (note.trim().length > 0) {
      setNoteLocked(true);
    }
  }

  function getConfirmationMessage() {
    if (interestStatus === "yes") {
      return "Thanks! Your response is now marked as interested.";
    }

    if (interestStatus === "maybe") {
      return "Thanks! Your response is now marked as maybe.";
    }

    return "Your response has been saved for now.";
  }

  return (
    <div className="mt-5 rounded-lg border bg-gray-50 p-3">
      <p className="text-sm font-semibold">Interested in visiting?</p>
      <p className="mt-1 text-xs text-gray-500">
        Let the seller know if you may visit. You can also leave one optional
        note.
      </p>

      <div className="mt-3 space-y-2">
        <label className="flex items-center gap-2 rounded border bg-white p-3 text-sm">
          <input
            type="radio"
            name="interestStatus"
            value="yes"
            checked={interestStatus === "yes"}
            onChange={(event) => {
              setInterestStatus(event.target.value);
              setSubmitted(false);
            }}
          />
          Yes, I’m interested
        </label>

        <label className="flex items-center gap-2 rounded border bg-white p-3 text-sm">
          <input
            type="radio"
            name="interestStatus"
            value="maybe"
            checked={interestStatus === "maybe"}
            onChange={(event) => {
              setInterestStatus(event.target.value);
              setSubmitted(false);
            }}
          />
          Maybe
        </label>
      </div>

      <div className="mt-3">
        <textarea
          value={note}
          maxLength={150}
          disabled={noteLocked}
          onChange={(event) => {
            setNote(event.target.value);
            setSubmitted(false);
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
        className="mt-3 w-full rounded bg-green-500 px-4 py-3 font-semibold text-white"
      >
        {submitted ? "Update response" : "Submit response"}
      </button>

      {submitted && (
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