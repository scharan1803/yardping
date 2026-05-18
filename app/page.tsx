import Link from "next/link";
import YardPingCard from "@/components/YardPingCard";
import { mockPings } from "@/data/mockPings";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 p-4">
      <div className="mx-auto max-w-md">
        <div className="mb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">YardPing</h1>
              <p className="mt-1 text-sm text-gray-600">
                Local garage sales near you
              </p>
            </div>

            <Link
              href="/login"
              className="rounded border border-gray-300 bg-white px-3 py-2 text-sm font-semibold"
            >
              Sign out
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Link
              href="/create"
              className="rounded bg-green-500 px-4 py-3 text-center font-semibold text-white"
            >
              Create
            </Link>

            <Link
              href="/manage"
              className="rounded border border-gray-300 bg-white px-4 py-3 text-center font-semibold"
            >
              Manage
            </Link>
          </div>
        </div>

        {mockPings.map((ping) => (
          <YardPingCard
            key={ping.id}
            id={ping.id}
            title={ping.title}
            town={ping.town}
            addressArea={ping.addressArea}
            date={ping.date}
            startTime={ping.startTime}
            endTime={ping.endTime}
            interestedCount={ping.interestedCount}
            maybeCount={ping.maybeCount}
            categories={ping.categories}
            lemonadeStand={ping.lemonadeStand}
          />
        ))}
      </div>
    </main>
  );
}