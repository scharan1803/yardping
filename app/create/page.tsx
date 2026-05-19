"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/useAuth";

const categories = [
  "Electronics",
  "Furniture",
  "Kids",
  "Clothes",
  "Books",
  "Tools",
  "Home Goods",
  "Outdoor",
  "Others",
];

type FormData = {
  title: string;
  town: string;
  addressArea: string;
  date: string;
  startTime: string;
  endTime: string;
  pingRadius: string;
  rsvpCutoff: string;
  description: string;
  selectedCategories: string[];
  lemonadeStand: boolean;
};

const emptyFormData: FormData = {
  title: "",
  town: "",
  addressArea: "",
  date: "",
  startTime: "",
  endTime: "",
  pingRadius: "",
  rsvpCutoff: "",
  description: "",
  selectedCategories: [],
  lemonadeStand: false,
};

function normalizeDateForInput(dateValue: string) {
  if (!dateValue) {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return dateValue;
  }

  const parts = dateValue.split("/");

  if (parts.length === 3) {
    const [month, day, year] = parts;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return "";
}

function openNativePicker(input: HTMLInputElement | null) {
  if (!input) {
    return;
  }

  input.focus();

  const pickerInput = input as HTMLInputElement & {
    showPicker?: () => void;
  };

  pickerInput.showPicker?.();
}

function getTomorrowDateString() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, "0");
  const day = String(tomorrow.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isEndTimeAfterStartTime(startTime: string, endTime: string) {
  if (!startTime || !endTime) {
    return false;
  }

  return endTime > startTime;
}

export default function CreatePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const dateInputRef = useRef<HTMLInputElement | null>(null);
  const startTimeInputRef = useRef<HTMLInputElement | null>(null);
  const endTimeInputRef = useRef<HTMLInputElement | null>(null);

  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const isEditMode = Boolean(editId);

  const [formData, setFormData] = useState<FormData>(emptyFormData);
  const [initialFormData, setInitialFormData] =
    useState<FormData>(emptyFormData);

  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [createdPingId, setCreatedPingId] = useState("");
  const [editLoading, setEditLoading] = useState(isEditMode);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    async function loadPingForEdit() {
      if (!isEditMode || !editId || !user) {
        setEditLoading(false);
        return;
      }

      try {
        setEditLoading(true);
        setErrorMessage("");

        const pingRef = doc(db, "yardPings", editId);
        const snapshot = await getDoc(pingRef);

        if (!snapshot.exists()) {
          setErrorMessage("This Yard Ping does not exist.");
          return;
        }

        const data = snapshot.data() as DocumentData;

        if (data.createdBy !== user.uid) {
          setErrorMessage("You can only edit Yard Pings created by you.");
          return;
        }

        const loadedFormData: FormData = {
          title: data.title || "",
          town: data.town || "",
          addressArea: data.addressArea || "",
          date: normalizeDateForInput(data.date || ""),
          startTime: data.startTime || "",
          endTime: data.endTime || "",
          pingRadius: String(data.pingRadiusKm || ""),
          rsvpCutoff: data.rsvpCutoff || "",
          description: data.description || "",
          selectedCategories: data.categories || [],
          lemonadeStand: Boolean(data.lemonadeStand),
        };

        setFormData(loadedFormData);
        setInitialFormData(loadedFormData);
      } catch (error) {
        console.error(error);
        setErrorMessage("Could not load this Yard Ping for editing.");
      } finally {
        setEditLoading(false);
      }
    }

    if (!loading && user) {
      loadPingForEdit();
    }
  }, [isEditMode, editId, user, loading]);

  if (loading || editLoading) {
    return (
      <main className="min-h-screen bg-gray-100 p-4">
        <div className="mx-auto max-w-md">
          <div className="rounded-lg bg-white p-4 text-sm text-gray-600 shadow">
            {isEditMode ? "Loading Yard Ping..." : "Checking login status..."}
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  function updateField(field: keyof FormData, value: string | boolean) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));

    setSubmitted(false);
    setCreatedPingId("");
    setErrorMessage("");
  }

  function toggleCategory(category: string) {
    setFormData((current) => {
      const alreadySelected = current.selectedCategories.includes(category);

      return {
        ...current,
        selectedCategories: alreadySelected
          ? current.selectedCategories.filter((item) => item !== category)
          : [...current.selectedCategories, category],
      };
    });

    setSubmitted(false);
    setCreatedPingId("");
    setErrorMessage("");
  }

  function isFormComplete() {
    return (
      formData.title.trim() &&
      formData.town.trim() &&
      formData.addressArea.trim() &&
      formData.date.trim() &&
      formData.startTime &&
      formData.endTime &&
      formData.pingRadius &&
      formData.rsvpCutoff &&
      formData.description.trim() &&
      formData.selectedCategories.length > 0
    );
  }

  function hasFormChanged() {
    return JSON.stringify(formData) !== JSON.stringify(initialFormData);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isFormComplete()) {
      setErrorMessage(
        "Please fill in all required details and select at least one category."
      );
      setSubmitted(false);
      return;
    }

    if (formData.date < getTomorrowDateString()) {
      setErrorMessage("Please choose a sale date from tomorrow onwards.");
      setSubmitted(false);
      return;
    }

    if (!isEndTimeAfterStartTime(formData.startTime, formData.endTime)) {
      setErrorMessage("End time must be later than start time.");
      setSubmitted(false);
      return;
    }

    if (isEditMode && !hasFormChanged()) {
      const shouldProceed = window.confirm(
        "You haven’t made any changes. Are you sure you wish to proceed?"
      );

      if (!shouldProceed) {
        return;
      }
    }

    setSaving(true);
    setSubmitted(false);
    setErrorMessage("");

    try {
      if (isEditMode && editId) {
        const pingRef = doc(db, "yardPings", editId);

        await updateDoc(pingRef, {
          title: formData.title.trim(),
          town: formData.town.trim(),
          addressArea: formData.addressArea.trim(),
          date: formData.date.trim(),
          startTime: formData.startTime,
          endTime: formData.endTime,
          pingRadiusKm: Number(formData.pingRadius),
          rsvpCutoff: formData.rsvpCutoff,
          description: formData.description.trim(),
          categories: formData.selectedCategories,
          lemonadeStand: formData.lemonadeStand,
          updatedAt: serverTimestamp(),
        });

        setInitialFormData(formData);
        setSubmitted(true);
        return;
      }

      const docRef = await addDoc(collection(db, "yardPings"), {
        title: formData.title.trim(),
        town: formData.town.trim(),
        addressArea: formData.addressArea.trim(),
        date: formData.date.trim(),
        startTime: formData.startTime,
        endTime: formData.endTime,
        pingRadiusKm: Number(formData.pingRadius),
        rsvpCutoff: formData.rsvpCutoff,
        description: formData.description.trim(),
        categories: formData.selectedCategories,
        lemonadeStand: formData.lemonadeStand,
        interestedCount: 0,
        maybeCount: 0,
        createdBy: user.uid,
        createdByName: user.displayName || user.email || "",
        createdByEmail: user.email || "",
        status: "active",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setCreatedPingId(docRef.id);
      setSubmitted(true);
      setFormData(emptyFormData);
      setInitialFormData(emptyFormData);
    } catch (error) {
      console.error(error);
      setErrorMessage("Could not save your Yard Ping. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (errorMessage && isEditMode && !formData.title) {
    return (
      <main className="min-h-screen bg-gray-100 p-4">
        <div className="mx-auto max-w-md">
          <Link href="/manage" className="text-sm text-green-700">
            ← Back to Manage
          </Link>

          <div className="mt-4 rounded bg-red-100 p-3 text-sm text-red-800">
            {errorMessage}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-4">
      <div className="mx-auto max-w-md">
        <div className="mb-4">
          <Link
            href={isEditMode ? "/manage" : "/"}
            className="text-sm text-green-700"
          >
            {isEditMode ? "← Back to Manage" : "← Back to Yard Pings"}
          </Link>

          <h1 className="mt-3 text-2xl font-bold">
            {isEditMode ? "Edit Yard Ping" : "Create Yard Ping"}
          </h1>

          <p className="mt-1 text-sm text-gray-600">
            {isEditMode
              ? "Update the details for your garage sale."
              : "Add the basic details for your garage sale."}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-lg bg-white p-4 shadow"
        >
          <input
            type="text"
            value={formData.title}
            onChange={(event) => updateField("title", event.target.value)}
            placeholder="Sale title"
            className="w-full rounded border p-3"
          />

          <input
            type="text"
            value={formData.town}
            onChange={(event) => updateField("town", event.target.value)}
            placeholder="Town / locality e.g. Simcoe"
            className="w-full rounded border p-3"
          />

          <input
            type="text"
            value={formData.addressArea}
            onChange={(event) =>
              updateField("addressArea", event.target.value)
            }
            placeholder="Address area e.g. Norfolk St S area"
            className="w-full rounded border p-3"
          />

          <div className="rounded-lg border bg-gray-50 p-3">
            <label className="mb-1 block text-sm font-semibold">
              Sale date
            </label>

            <div className="relative">
              <input
                ref={dateInputRef}
                type="date"
                value={formData.date}
                min={getTomorrowDateString()}
                onChange={(event) => updateField("date", event.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-3 pr-12 text-sm shadow-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
              />

              <button
                type="button"
                onClick={() => openNativePicker(dateInputRef.current)}
                className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md bg-green-50 text-green-700"
                aria-label="Open calendar"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M8 2v4" />
                  <path d="M16 2v4" />
                  <path d="M3 10h18" />
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                </svg>
              </button>
            </div>

            <p className="mt-1 text-xs text-gray-500">
              Tap the calendar icon to pick the sale date.
            </p>
          </div>

          <div className="rounded-lg border bg-gray-50 p-3">
            <p className="mb-2 text-sm font-semibold">Sale time</p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Start time
                </label>

                <div className="relative">
                  <input
                    ref={startTimeInputRef}
                    type="time"
                    value={formData.startTime}
                    onChange={(event) =>
                      updateField("startTime", event.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-3 pr-10 text-sm shadow-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                  />

                  <button
                    type="button"
                    onClick={() => openNativePicker(startTimeInputRef.current)}
                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md bg-green-50 text-green-700"
                    aria-label="Open start time picker"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 7v5l3 2" />
                    </svg>
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  End time
                </label>

                <div className="relative">
                  <input
                    ref={endTimeInputRef}
                    type="time"
                    value={formData.endTime}
                    onChange={(event) =>
                      updateField("endTime", event.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-3 pr-10 text-sm shadow-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                  />

                  <button
                    type="button"
                    onClick={() => openNativePicker(endTimeInputRef.current)}
                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md bg-green-50 text-green-700"
                    aria-label="Open end time picker"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 7v5l3 2" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <p className="mt-2 text-xs text-gray-500">
              Tap the clock icon to choose start and end times.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold">
              Ping radius
            </label>
            <select
              value={formData.pingRadius}
              onChange={(event) =>
                updateField("pingRadius", event.target.value)
              }
              className="w-full rounded border p-3"
            >
              <option value="">Choose how far to advertise</option>
              <option value="2">Within 2 km</option>
              <option value="5">Within 5 km</option>
              <option value="10">Within 10 km</option>
              <option value="15">Within 15 km</option>
              <option value="25">Within 25 km</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              This controls how far your Yard Ping is shown to nearby users.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold">
              RSVP cutoff
            </label>
            <select
              value={formData.rsvpCutoff}
              onChange={(event) =>
                updateField("rsvpCutoff", event.target.value)
              }
              className="w-full rounded border p-3"
            >
              <option value="">Choose when RSVPs should close</option>
              <option value="event_start">Keep open until sale starts</option>
              <option value="6_hours">Close 6 hours before sale</option>
              <option value="12_hours">Close 12 hours before sale</option>
              <option value="24_hours">Close 24 hours before sale</option>
              <option value="48_hours">Close 48 hours before sale</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              After this cutoff, visitors can still view the sale but cannot
              RSVP.
            </p>
          </div>

          <textarea
            value={formData.description}
            onChange={(event) =>
              updateField("description", event.target.value)
            }
            placeholder="Description — what kind of items are available?"
            className="min-h-28 w-full rounded border p-3"
          />

          <div>
            <p className="mb-2 text-sm font-semibold">Categories</p>

            <div className="grid grid-cols-2 gap-2 text-sm">
              {categories.map((category) => (
                <label
                  key={category}
                  className="flex items-center gap-2 rounded border p-2"
                >
                  <input
                    type="checkbox"
                    checked={formData.selectedCategories.includes(category)}
                    onChange={() => toggleCategory(category)}
                  />
                  {category}
                </label>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 rounded border bg-yellow-50 p-3 text-sm">
            <input
              type="checkbox"
              checked={formData.lemonadeStand}
              onChange={(event) =>
                updateField("lemonadeStand", event.target.checked)
              }
            />
            🍋 Lemonade stand available
          </label>

          <button
            disabled={saving}
            className="w-full rounded bg-green-500 px-4 py-3 font-semibold text-white disabled:opacity-60"
          >
            {saving
              ? "Saving..."
              : isEditMode
              ? "Update Yard Ping"
              : "Create Yard Ping"}
          </button>

          {errorMessage && (
            <div className="rounded bg-red-100 p-3 text-sm text-red-800">
              {errorMessage}
            </div>
          )}

          {submitted && (
            <div className="rounded bg-green-100 p-3 text-sm text-green-800">
              {isEditMode
                ? "Your Yard Ping has been updated successfully."
                : `Your Yard Ping has been published successfully. ID: ${createdPingId}`}
            </div>
          )}
        </form>
      </div>
    </main>
  );
}