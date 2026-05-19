"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("Ontario");
  const [country, setCountry] = useState("Canada");
  const [postalCode, setPostalCode] = useState("");

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
        setAddressLine1(data.addressLine1 || "");
        setAddressLine2(data.addressLine2 || "");
        setCity(data.city || "");
        setProvince(data.province || "Ontario");
        setCountry(data.country || "Canada");
        setPostalCode(data.postalCode || "");
      } else {
        setName(currentUser.displayName || "");
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    if (!name || !phone || !addressLine1 || !city || !province || !country || !postalCode) {
      setMessage("Please complete all required fields.");
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
          name,
          email,
          phone,
          addressLine1,
          addressLine2,
          city,
          province,
          country,
          postalCode,
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
            This address will be used as the locked location when you create a Yard Ping.
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
              Address Line 1 *
            </label>
            <input
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-gray-950"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Address Line 2
            </label>
            <input
              value={addressLine2}
              onChange={(e) => setAddressLine2(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-gray-950"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">City *</label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-gray-950"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Province *</label>
            <input
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-gray-950"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Postal Code *
            </label>
            <input
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value.toUpperCase())}
              className="w-full rounded border border-gray-300 px-3 py-2 text-gray-950"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Country *</label>
            <input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-gray-950"
            />
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