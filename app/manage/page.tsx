import Link from "next/link";

const myCreatedPings = [
  {
    id: "1",
    title: "Weekend Garage Sale",
    date: "06/22/2026",
    time: "9:00 AM - 2:00 PM",
    interestedCount: 12,
    maybeCount: 4,
    notes: [
      "Do you have any TVs available?",
      "Can you add photos of the furniture?",
      "Interested in kids toys if available.",
    ],
  },
  {
    id: "2",
    title: "Moving Sale",
    date: "06/23/2026",
    time: "10:00 AM - 3:00 PM",
    interestedCount: 8,
    maybeCount: 2,
    notes: ["Do you have kitchen appliances?", "Any bookshelves available?"],
  },
];

export default function ManagePage() {
  return (
    <main className="min-h-screen bg-gray-100 p-4">
      <div className="mx-auto max-w-md">
        <div className="mb-4">
          <Link href="/" className="text-sm text-green-700">
            ← Back to Yard Pings
          </Link>

          <h1 className="mt-3 text-2xl font-bold">Manage Yard Pings</h1>
          <p className="mt-1 text-sm text-gray-600">
            View your created Yard Pings, RSVP counts, and one-way notes.
          </p>
        </div>

        <div className="space-y-4">
          {myCreatedPings.map((ping) => (
            <section key={ping.id} className="rounded-lg bg-white p-4 shadow">
              <div>
                <h2 className="text-lg font-semibold">{ping.title}</h2>
                <p className="mt-1 text-sm text-gray-600">
                  {ping.date} • {ping.time}
                </p>
              </div>

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
                <p className="text-sm font-semibold">Notes from visitors</p>

                <div className="mt-2 space-y-2">
                  {ping.notes.map((note, index) => (
                    <p
                      key={index}
                      className="rounded border bg-gray-50 p-3 text-sm text-gray-700"
                    >
                      {note}
                    </p>
                  ))}
                </div>
              </div>

              <Link
                href={`/create?edit=${ping.id}`}
                className="mt-4 block w-full rounded border border-gray-300 px-4 py-3 text-center font-semibold"
              >
                Edit Yard Ping
              </Link>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}