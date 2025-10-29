import { CalendarDays, Clock, MapPin, Pencil, Trash2, Plus } from "lucide-react";

type EventItem = {
  title: string;
  status?: "Upcoming";
  description: string;
  date: string;
  time: string;
  location: string;
  rsvps: number;
};

const events: EventItem[] = [
  {
    title: "Public Rally - Hyderabad",
    status: "Upcoming",
    description: "Join us for a massive public rally at Necklace Road",
    date: "Sat, 25 Oct, 2025",
    time: "17:00",
    location: "Necklace Road, Hyderabad",
    rsvps: 15420,
  },
  {
    title: "Booth Committee Meeting",
    status: "Upcoming",
    description: "Monthly coordination meeting for booth-level workers",
    date: "Mon, 20 Oct, 2025",
    time: "14:00",
    location: "Gandhi Bhavan, Hyderabad",
    rsvps: 342,
  },
  {
    title: "Youth Congress Workshop",
    status: "Upcoming",
    description: "Leadership training and skill development workshop",
    date: "Tue, 28 Oct, 2025",
    time: "10:00",
    location: "HICC, Madhapur",
    rsvps: 856,
  },
];

function EventCard({ e }: { e: EventItem }) {
  return (
    <div className="bg-white rounded-lg shadow-card p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="text-base font-semibold">{e.title}</div>
            {e.status && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                {e.status}
              </span>
            )}
          </div>
          <div className="mt-2 text-sm text-gray-600">{e.description}</div>

          <div className="mt-3 flex flex-wrap items-center gap-x-8 gap-y-2 text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-gray-600" />
              {e.date}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-600" />
              {e.time}
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-600" />
              {e.location}
            </div>
          </div>

          <div className="mt-3 text-sm text-gray-500">{e.rsvps.toLocaleString()} RSVPs</div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button className="flex items-center gap-1 px-3 py-2 text-sm rounded-md border hover:bg-gray-50">
            <Pencil className="w-4 h-4" />
            Edit
          </button>
          <button className="flex items-center gap-1 px-3 py-2 text-sm rounded-md border hover:bg-gray-50">
            <Trash2 className="w-4 h-4 text-red-600" />
            <span className="text-red-600">Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EventManagement() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Event Management</h1>
          <p className="text-sm text-gray-500">Create and manage party events</p>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-orange-500 text-white hover:bg-orange-600">
          <Plus className="w-4 h-4" />
          Create Event
        </button>
      </div>

      {events.map((e) => (
        <EventCard key={e.title} e={e} />
      ))}
    </div>
  );
}