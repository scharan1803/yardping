//yardping/app/profile/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";

declare global {
  interface Window {
    google?: any;
    __googleMapsScriptLoadingPromise?: Promise<void>;
  }
}

function loadGoogleMapsScript() {
  if (window.google?.maps?.places) {
    return Promise.resolve();
  }

  if (window.__googleMapsScriptLoadingPromise) {
    return window.__googleMapsScriptLoadingPromise;
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return Promise.reject("Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY");
  }

  window.__googleMapsScriptLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");

    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => resolve();
    script.onerror = () => reject("Google Maps failed to load");

    document.head.appendChild(script);
  });

  return window.__googleMapsScriptLoadingPromise;
}

function getAddressPart(components: any[], type: string, useShortName = false) {
  const component = components.find((item) => item.types.includes(type));
  return component ? (useShortName ? component.short_name : component.long_name) : "";
}

export default function ProfilePage() {
  const router = useRouter();
  const addressSearchRef = useRef<HTMLInputElement | null>(null);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [formattedAddress, setFormattedAddress] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [country, setCountry] = useState("Canada");
  const [postalCode, setPostalCode] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [placeId, setPlaceId] = useState("");
  const [addressVerified, setAddressVerified] = useState(false);

  const [message, setMessage] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }

      setUser(currentUser);
      setEmail(currentUser.email || "");

      const profileRef = doc(db, "users", currentUser.uid);
      const profileSnap = await getDoc(profileRef);

      if (profileSnap.exists()) {
        const data = profileSnap.data();

        setName(data.name || currentUser.displayName || "");
        setPhone(data.phone || "");

        setFormattedAddress(data.formattedAddress || "");
        setAddressLine1(data.addressLine1 || "");
        setAddressLine2(data.addressLine2 || "");
        setCity(data.city || "");
        setProvince(data.province || "");
        setCountry(data.country || "Canada");
        setPostalCode(data.postalCode || "");
        setLat(typeof data.lat === "number" ? data.lat : null);
        setLng(typeof data.lng === "number" ? data.lng : null);
        setPlaceId(data.placeId || "");
        setAddressVerified(Boolean(data.addressVerified));
      } else {
        setName(currentUser.displayName || "");
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (loading) return;

    let autocomplete: any;
    let listener: any;

    async function setupAutocomplete() {
      try {
        await loadGoogleMapsScript();

        if (!addressSearchRef.current || !window.google?.maps?.places) return;

        autocomplete = new window.google.maps.places.Autocomplete(
          addressSearchRef.current,
          {
            componentRestrictions: { country: "ca" },
            fields: ["address_components", "formatted_address", "geometry", "place_id"],
            types: ["address"],
          }
        );

        listener = autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();

          if (!place.geometry || !place.address_components) {
            setMessage("Please select an address from the suggestions.");
            return;
          }

          const components = place.address_components;

          const streetNumber = getAddressPart(components, "street_number");
          const route = getAddressPart(components, "route");
          const unit = getAddressPart(components, "subpremise");

          const parsedAddressLine1 = `${streetNumber} ${route}`.trim();
          const parsedCity =
            getAddressPart(components, "locality") ||
            getAddressPart(components, "postal_town") ||
            getAddressPart(components, "administrative_area_level_3") ||
            getAddressPart(components, "sublocality");

          const parsedProvince =
            getAddressPart(components, "administrative_area_level_1") ||
            getAddressPart(components, "administrative_area_level_1", true);

          const parsedCountry = getAddressPart(components, "country");
          const parsedPostalCode = `${getAddressPart(
            components,
            "postal_code"
          )} ${getAddressPart(components, "postal_code_suffix")}`.trim();

          setFormattedAddress(place.formatted_address || "");
          setAddressLine1(parsedAddressLine1);
          setAddressLine2(unit || "");
          setCity(parsedCity);
          setProvince(parsedProvince);
          setCountry(parsedCountry || "Canada");
          setPostalCode(parsedPostalCode.toUpperCase());
          setLat(place.geometry.location.lat());
          setLng(place.geometry.location.lng());
          setPlaceId(place.place_id || "");
          setAddressVerified(true);
          setMessage("");
        });
      } catch (error) {
        console.error(error);
        setMessage("Could not load Google address search. Please refresh and try again.");
      }
    }

    setupAutocomplete();

    return () => {
      if (listener) {
        listener.remove();
      }
    };
  }, [loading]);

  function handleAddressTyping(value: string) {
    setFormattedAddress(value);
    setAddressVerified(false);
    setPlaceId("");
    setLat(null);
    setLng(null);
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    if (!name.trim()) {
      setMessage("Please enter your name.");
      return;
    }

    if (!phone.trim()) {
      setMessage("Please enter your phone number.");
      return;
    }

    if (
      !addressVerified ||
      !formattedAddress ||
      !addressLine1 ||
      !city ||
      !province ||
      !country ||
      !postalCode ||
      !placeId ||
      lat === null ||
      lng === null
    ) {
      setMessage("Please search and select your address from the Google suggestions.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const profileRef = doc(db, "users", user.uid);

      await setDoc(
        profileRef,
        {
          uid: user.uid,
          name: name.trim(),
          email,
          phone: phone.trim(),

          formattedAddress,
          addressLine1,
          addressLine2,
          city,
          province,
          country,
          postalCode,
          lat,
          lng,
          placeId,
          addressVerified: true,

          sellerVerified: false,
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );

      setMessage("Profile saved successfully.");
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong while saving your profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 p-4">
        <div className="mx-auto max-w-md rounded-lg bg-white p-4 text-sm text-gray-600 shadow">
          Loading profile...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-4">
      <div className="mx-auto max-w-md">
        <div className="mb-4">
          <Link
            href="/"
            className="inline-block rounded border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900"
          >
            ← Back home
          </Link>

          <h1 className="mt-4 text-2xl font-bold text-gray-950">Your Profile</h1>
          <p className="mt-1 text-sm text-gray-600">
            Select your address from Google so YardPing can support nearby discovery later.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-4 rounded-lg bg-white p-4 shadow">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-gray-950"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input
              value={email}
              disabled
              className="w-full rounded border border-gray-300 bg-gray-100 px-3 py-2 text-gray-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Phone *</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-gray-950"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Search and select address *
            </label>
            <input
              ref={addressSearchRef}
              value={formattedAddress}
              onChange={(e) => handleAddressTyping(e.target.value)}
              placeholder="Start typing your address..."
              className="w-full rounded border border-gray-300 px-3 py-2 text-gray-950"
            />
            <p className="mt-1 text-xs text-gray-500">
              You must choose an address from the Google suggestions.
            </p>
          </div>

          {addressVerified && (
            <div className="rounded border border-green-200 bg-green-50 p-3">
              <p className="text-sm font-semibold text-green-800">
                Verified address selected
              </p>
              <p className="mt-1 text-sm text-gray-700">{formattedAddress}</p>
              <p className="mt-1 text-xs text-gray-500">
                Lat: {lat} • Lng: {lng}
              </p>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Address Line 2 / Unit
            </label>
            <input
              value={addressLine2}
              onChange={(e) => setAddressLine2(e.target.value)}
              placeholder="Apartment, unit, suite, etc."
              className="w-full rounded border border-gray-300 px-3 py-2 text-gray-950"
            />
          </div>

          <div className="rounded border border-gray-200 bg-gray-50 p-3">
            <p className="text-sm font-semibold text-gray-800">Address details</p>

            <div className="mt-3 space-y-3">
              <input
                value={addressLine1}
                disabled
                placeholder="Address Line 1"
                className="w-full rounded border border-gray-300 bg-gray-100 px-3 py-2 text-gray-500"
              />

              <input
                value={city}
                disabled
                placeholder="City"
                className="w-full rounded border border-gray-300 bg-gray-100 px-3 py-2 text-gray-500"
              />

              <input
                value={province}
                disabled
                placeholder="Province"
                className="w-full rounded border border-gray-300 bg-gray-100 px-3 py-2 text-gray-500"
              />

              <input
                value={postalCode}
                disabled
                placeholder="Postal Code"
                className="w-full rounded border border-gray-300 bg-gray-100 px-3 py-2 text-gray-500"
              />

              <input
                value={country}
                disabled
                placeholder="Country"
                className="w-full rounded border border-gray-300 bg-gray-100 px-3 py-2 text-gray-500"
              />
            </div>
          </div>

          {message && (
            <div className="rounded bg-yellow-100 p-3 text-sm text-yellow-800">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded bg-green-500 px-4 py-3 font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </div>
    </main>
  );
}