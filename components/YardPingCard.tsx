import Link from "next/link";

type YardPingCardProps = {
  id: string;
  title: string;
  town: string;
  addressArea: string;
  date: string;
  startTime: string;
  endTime: string;
  interestedCount: number;
  maybeCount: number;
  categories: string[];
  lemonadeStand: boolean;
};

export default function YardPingCard({
  id,
  title,
  town,
  addressArea,
  date,
  startTime,
  endTime,
  interestedCount,
  maybeCount,
  categories,
  lemonadeStand,
}: YardPingCardProps) {
  return (
    <Link href={`/pings/${id}`} className="block">
      <div className="mb-4 rounded-lg bg-white p-4 shadow">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-gray-600">
              {town} • {addressArea}
            </p>
            <p className="mt-1 text-sm text-gray-600">
              {date} • {startTime} - {endTime}
            </p>
          </div>

          {lemonadeStand && (
            <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800">
              🍋
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {categories.slice(0, 3).map((category) => (
            <span
              key={category}
              className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700"
            >
              {category}
            </span>
          ))}
        </div>

        <p className="mt-3 text-sm">
          {interestedCount} interested • {maybeCount} maybe
        </p>

        <button className="mt-3 rounded bg-green-500 px-4 py-2 text-white">
          View Details
        </button>
      </div>
    </Link>
  );
}