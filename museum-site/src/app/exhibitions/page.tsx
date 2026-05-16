import Link from "next/link";
import Container from "@/components/Container";
import PageHeader from "@/components/PageHeader";
import { sanityClient } from "@/lib/sanity";
import { exhibitionsQuery } from "@/lib/queries";

type Exhibition = {
  _id: string;
  title: string;
  slug: string;
  summary?: string;
  kind?: string;
  startDate?: string;
  endDate?: string;
  coverImage?: string;
};

export const metadata = { title: "Exhibitions" };
export const revalidate = 60;

export default async function ExhibitionsPage() {
  let exhibitions: Exhibition[] = [];
  try {
    exhibitions = await sanityClient.fetch<Exhibition[]>(exhibitionsQuery);
  } catch {
    // Sanity not yet configured. Page renders without listings.
  }

  const grouped = {
    permanent: exhibitions.filter((e) => e.kind === "permanent"),
    special: exhibitions.filter((e) => e.kind === "special"),
    traveling: exhibitions.filter((e) => e.kind === "traveling"),
    past: exhibitions.filter((e) => e.kind === "past"),
  };

  return (
    <>
      <PageHeader
        eyebrow="Exhibitions"
        title="Exhibitions"
        lede="Permanent galleries, special exhibitions, and traveling shows that examine the history of the Holocaust through artifacts, testimony, and scholarship."
      />
      <Container className="space-y-16 py-16">
        {exhibitions.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {grouped.permanent.length > 0 && (
              <Section title="Permanent" items={grouped.permanent} />
            )}
            {grouped.special.length > 0 && (
              <Section title="Special" items={grouped.special} />
            )}
            {grouped.traveling.length > 0 && (
              <Section title="Traveling" items={grouped.traveling} />
            )}
            {grouped.past.length > 0 && (
              <Section title="Past" items={grouped.past} muted />
            )}
          </>
        )}
      </Container>
    </>
  );
}

function Section({
  title,
  items,
  muted = false,
}: {
  title: string;
  items: Exhibition[];
  muted?: boolean;
}) {
  return (
    <section>
      <h2 className={`mb-6 ${muted ? "text-ink-muted" : ""}`}>{title}</h2>
      <ul className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <li key={item._id} className="border-t border-ink/10 pt-6">
            <Link
              href={`/exhibitions/${item.slug}`}
              className="block no-underline"
            >
              {item.coverImage && (
                <img
                  src={item.coverImage}
                  alt=""
                  className="mb-4 aspect-[4/3] w-full object-cover"
                />
              )}
              <h3 className="mb-2 text-2xl">{item.title}</h3>
              {item.summary && (
                <p className="text-ink-soft">{item.summary}</p>
              )}
              {(item.startDate || item.endDate) && (
                <p className="mt-3 text-xs uppercase tracking-wider text-ink-muted">
                  {[item.startDate, item.endDate].filter(Boolean).join(" – ")}
                </p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="rounded-sm border border-dashed border-ink/20 p-10 text-center text-ink-muted">
      <p>
        Exhibition content will appear here once published in the Sanity
        Studio. Visit <code>/studio</code> to add your first exhibition.
      </p>
    </div>
  );
}
