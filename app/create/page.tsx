"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

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

const mockEditFormData: FormData = {
  title: "Weekend Garage Sale",
  town: "Simcoe",
  addressArea: "Norfolk St S area",
  date: "06/22/2026",
  startTime: "09:00",
  endTime: "14:00",
  pingRadius: "10",
  rsvpCutoff: "24_hours",
  description:
    "Family garage sale with home items, small electronics, kids toys, and a few furniture pieces.",
  selectedCategories: ["Electronics", "Furniture", "Kids"],
  lemonadeStand: true,
};

export default function CreatePage() {
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const isEditMode = Boolean(editId);

  const initialFormData = isEditMode ? mockEditFormData : emptyFormData;

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  function updateField(field: keyof FormData, value: string | boolean) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));

    setSubmitted(false);
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isFormComplete()) {
      setErrorMessage(
        "Please fill in all required details and select at least one category."
      );
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

    setSubmitted(true);
    setErrorMessage("");
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

          <div>
            <label className="mb-1 block text-sm font-semibold">
              Sale date
            </label>
            <input
              type="text"
              value={formData.date}
              onChange={(event) => updateField("date", event.target.value)}
              placeholder="MM/DD/YYYY"
              className="w-full rounded border p-3"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-semibold">
                Start time
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(event) =>
                  updateField("startTime", event.target.value)
                }
                className="w-full rounded border p-3"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold">
                End time
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(event) =>
                  updateField("endTime", event.target.value)
                }
                className="w-full rounded border p-3"
              />
            </div>
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
              After this cutoff, visitors can still view the sale but cannot RSVP.
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

          <button className="w-full rounded bg-green-500 px-4 py-3 font-semibold text-white">
            {isEditMode ? "Update Yard Ping" : "Create Yard Ping"}
          </button>

          {errorMessage && (
            <div className="rounded bg-red-100 p-3 text-sm text-red-800">
              {errorMessage}
            </div>
          )}

          {submitted && (
            <div className="rounded bg-green-100 p-3 text-sm text-green-800">
              {isEditMode
                ? "Your Yard Ping update has been prepared. Firebase will save this later."
                : "Your Yard Ping has been prepared. Firebase will publish this later."}
            </div>
          )}
        </form>
      </div>
    </main>
  );
}