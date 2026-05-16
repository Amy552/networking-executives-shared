import Link from "next/link";
import Container from "@/components/Container";
import PageHeader from "@/components/PageHeader";
import { sanityClient } from "@/lib/sanity";
import { upcomingEventsQuery } from "@/lib/queries";

type Event = {
  _id: string;
  title: string;
  slug: string;
  dateTime: string;
  location?: string;
  kind?: string;
  summary?: string;
};

export const metadata = { title: "Events" };
export const revalidate = 60;

export default async function EventsPage() {
  let events: Event[] = [];
  try {
    events = await sanityClient.fetch<Event[]>(upcomingEventsQuery);
  } catch {
    // empty
  }

  return (
    <>
      <PageHeader
        eyebrow="Events"
        title="Programs and events"
        lede="Survivor talks, lectures, screenings, commemorations, and family programs."
      />
      <Container className="py-16">
        {events.length === 0 ? (
          <p className="text-ink-muted">
            Upcoming events will appear here once published.
          </p>
        ) : (
          <ul className="divide-y divide-ink/10 border-t border-ink/10">
            {events.map((event) => (
              <li key={event._id} className="py-8">
                <Link
                  href={`/events/${event.slug}`}
                  className="grid gap-4 no-underline md:grid-cols-[180px_1fr]"
                >
                  <div>
                    <p className="font-serif text-xl">
                      {formatDate(event.dateTime)}
                    </p>
                    <p className="text-xs uppercase tracking-wider text-ink-muted">
                      {formatTime(event.dateTime)}
                    </p>
                  </div>
                  <div>
                    {event.kind && (
                      <p className="eyebrow mb-1">{event.kind}</p>
                    )}
                    <h3 className="mb-2 text-2xl">{event.title}</h3>
                    {event.location && (
                      <p className="text-sm text-ink-muted">{event.location}</p>
                    )}
                    {event.summary && (
                      <p className="mt-2 text-ink-soft">{event.summary}</p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}
