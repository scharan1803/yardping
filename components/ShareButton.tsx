"use client";

import { useState } from "react";

export default function ShareButton() {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const currentUrl = window.location.href;

    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      alert("Could not copy the link. Please copy it from the address bar.");
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleShare}
        className="mt-3 w-full rounded border border-gray-300 px-4 py-3 font-semibold"
      >
        Share / Copy Link
      </button>

      {copied && (
        <p className="mt-2 text-center text-sm text-green-700">
          Link copied!
        </p>
      )}
    </div>
  );
}