import Link from "next/link";
import Container from "@/components/Container";
import PageHeader from "@/components/PageHeader";
import { sanityClient } from "@/lib/sanity";
import { artifactsQuery } from "@/lib/queries";

type Artifact = {
  _id: string;
  title: string;
  slug: string;
  medium?: string;
  period?: string;
  image?: string;
};

export const metadata = { title: "Collections" };
export const revalidate = 60;

export default async function CollectionsPage() {
  let artifacts: Artifact[] = [];
  try {
    artifacts = await sanityClient.fetch<Artifact[]>(artifactsQuery);
  } catch {
    // empty
  }

  return (
    <>
      <PageHeader
        eyebrow="Collections"
        title="The collection"
        lede="Photographs, documents, personal belongings, and works of art that record the lives of those who suffered, resisted, and survived. Items are presented with the care and context their stories deserve."
      />
      <Container className="py-16">
        {artifacts.length === 0 ? (
          <p className="text-ink-muted">
            Collection items will appear here once published in the Sanity
            Studio.
          </p>
        ) : (
          <ul className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {artifacts.map((a) => (
              <li key={a._id}>
                <Link href={`/collections/${a.slug}`} className="block no-underline">
                  {a.image && (
                    <img
                      src={a.image}
                      alt=""
                      className="mb-3 aspect-square w-full object-cover"
                    />
                  )}
                  <p className="font-serif text-lg leading-tight">{a.title}</p>
                  <p className="mt-1 text-xs uppercase tracking-wider text-ink-muted">
                    {[a.medium, a.period].filter(Boolean).join(" · ")}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </>
  );
}
