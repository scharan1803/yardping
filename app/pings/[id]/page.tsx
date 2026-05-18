import Link from "next/link";
import { mockPings } from "@/data/mockPings";
import RsvpBox from "@/components/RsvpBox";
import ShareButton from "@/components/ShareButton";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatRsvpCutoff(cutoff: string) {
  if (cutoff === "event_start") {
    return "Open until sale starts";
  }

  if (cutoff === "6_hours") {
    return "Closes 6 hours before sale";
  }

  if (cutoff === "12_hours") {
    return "Closes 12 hours before sale";
  }

  if (cutoff === "24_hours") {
    return "Closes 24 hours before sale";
  }

  if (cutoff === "48_hours") {
    return "Closes 48 hours before sale";
  }

  return "RSVP cutoff not set";
}

export default async function PingDetailsPage({ params }: PageProps) {
  const { id } = await params;

  const ping = mockPings.find((item) => item.id === id);

  if (!ping) {
    return (
      <main className="min-h-screen bg-gray-100 p-4">
        <div className="mx-auto max-w-md">
          <Link href="/" className="text-sm text-green-700">
            ← Back to Yard Pings
          </Link>

          <h1 className="mt-4 text-2xl font-bold">Yard Ping not found</h1>
          <p className="mt-2 text-gray-600">
            This listing may have been removed or does not exist.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-4">
      <div className="mx-auto max-w-md">
        <Link href="/" className="text-sm text-green-700">
          ← Back to Yard Pings
        </Link>

        <section className="mt-4 rounded-lg bg-white p-4 shadow">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-green-700">
                Yard Ping Details
              </p>

              <h1 className="text-2xl font-bold">{ping.title}</h1>
            </div>

            {ping.lemonadeStand && (
              <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800">
                🍋 Lemonade
              </span>
            )}
          </div>

          <p className="mt-3 text-gray-600">
            {ping.town} • {ping.addressArea}
          </p>

          <p className="mt-1 text-gray-600">
            {ping.date} • {ping.startTime} - {ping.endTime}
          </p>

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
            <p className="text-sm font-semibold">Description</p>
            <p className="text-sm text-gray-600">{ping.description}</p>
          </div>

          <div className="mt-4">
            <p className="text-sm font-semibold">Reach</p>
            <p className="text-sm text-gray-600">
              Shown within {ping.pingRadiusKm} km
            </p>
          </div>

          <div className="mt-4">
            <p className="text-sm font-semibold">RSVP cutoff</p>
            <p className="text-sm text-gray-600">
              {formatRsvpCutoff(ping.rsvpCutoff)}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {ping.categories.map((category) => (
              <span
                key={category}
                className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700"
              >
                {category}
              </span>
            ))}
          </div>

          <RsvpBox />

          <ShareButton />
        </section>
      </div>
    </main>
  );
}