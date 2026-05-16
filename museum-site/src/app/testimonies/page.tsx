import Link from "next/link";
import Container from "@/components/Container";
import PageHeader from "@/components/PageHeader";
import { sanityClient } from "@/lib/sanity";
import { testimoniesQuery } from "@/lib/queries";

type Testimony = {
  _id: string;
  slug: string;
  name: string;
  yearOfBirth?: number;
  placeOfBirth?: string;
  summary?: string;
  portrait?: string;
};

export const metadata = { title: "Testimonies" };
export const revalidate = 60;

export default async function TestimoniesPage() {
  let testimonies: Testimony[] = [];
  try {
    testimonies = await sanityClient.fetch<Testimony[]>(testimoniesQuery);
  } catch {
    // empty
  }

  return (
    <>
      <PageHeader
        eyebrow="Testimony"
        title="Voices of survivors and witnesses"
        lede="Every testimony is a life. These recordings are shared with the consent of survivors and their families, and are kept in trust for future generations."
      />
      <Container className="py-16">
        {testimonies.length === 0 ? (
          <p className="text-ink-muted">
            Testimonies will appear here once recorded and published. Consent
            must be confirmed before any testimony goes live.
          </p>
        ) : (
          <ul className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
            {testimonies.map((t) => (
              <li key={t._id} className="border-t border-ink/10 pt-6">
                <Link
                  href={`/testimonies/${t.slug}`}
                  className="block no-underline"
                >
                  {t.portrait && (
                    <img
                      src={t.portrait}
                      alt=""
                      className="mb-4 aspect-[3/4] w-full object-cover grayscale"
                    />
                  )}
                  <p className="font-serif text-2xl">{t.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-wider text-ink-muted">
                    {[t.yearOfBirth, t.placeOfBirth].filter(Boolean).join(" · ")}
                  </p>
                  {t.summary && (
                    <p className="mt-3 text-ink-soft">{t.summary}</p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </>
  );
}
