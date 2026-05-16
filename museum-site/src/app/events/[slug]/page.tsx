import { notFound } from "next/navigation";
import { PortableText } from "@portabletext/react";
import Container from "@/components/Container";
import PageHeader from "@/components/PageHeader";
import { sanityClient } from "@/lib/sanity";
import { eventBySlugQuery } from "@/lib/queries";

export const revalidate = 60;

type Event = {
  _id: string;
  title: string;
  dateTime: string;
  location?: string;
  kind?: string;
  summary?: string;
  body?: unknown[];
  registrationUrl?: string;
};

export default async function EventPage({
  params,
}: {
  params: { slug: string };
}) {
  let event: Event | null = null;
  try {
    event = await sanityClient.fetch<Event | null>(eventBySlugQuery, {
      slug: params.slug,
    });
  } catch {
    event = null;
  }
  if (!event) notFound();

  return (
    <>
      <PageHeader
        eyebrow={event.kind ?? "Event"}
        title={event.title}
        lede={event.summary}
      />
      <Container className="grid gap-12 py-16 md:grid-cols-[1fr_2fr]">
        <aside>
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="eyebrow">When</dt>
              <dd className="mt-1 text-ink-soft">
                {new Date(event.dateTime).toLocaleString(undefined, {
                  dateStyle: "full",
                  timeStyle: "short",
                })}
              </dd>
            </div>
            {event.location && (
              <div>
                <dt className="eyebrow">Where</dt>
                <dd className="mt-1 text-ink-soft">{event.location}</dd>
              </div>
            )}
          </dl>
          {event.registrationUrl && (
            <a
              href={event.registrationUrl}
              className="mt-6 inline-block rounded-sm bg-ink px-5 py-3 text-paper no-underline hover:bg-accent"
            >
              Register
            </a>
          )}
        </aside>
        <article className="prose-museum max-w-prose">
          {event.body && (
            // @ts-expect-error PortableText accepts unknown[] blocks
            <PortableText value={event.body} />
          )}
        </article>
      </Container>
    </>
  );
}
