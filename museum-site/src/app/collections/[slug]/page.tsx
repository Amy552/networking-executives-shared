import { notFound } from "next/navigation";
import { PortableText } from "@portabletext/react";
import Container from "@/components/Container";
import PageHeader from "@/components/PageHeader";
import { sanityClient, urlForImage } from "@/lib/sanity";
import { artifactBySlugQuery } from "@/lib/queries";

export const revalidate = 60;

type Artifact = {
  _id: string;
  title: string;
  description?: unknown[];
  medium?: string;
  period?: string;
  origin?: string;
  image?: { asset: { _ref: string } };
  creditLine?: string;
  accessionNumber?: string;
};

export default async function ArtifactPage({
  params,
}: {
  params: { slug: string };
}) {
  let artifact: Artifact | null = null;
  try {
    artifact = await sanityClient.fetch<Artifact | null>(artifactBySlugQuery, {
      slug: params.slug,
    });
  } catch {
    artifact = null;
  }
  if (!artifact) notFound();

  return (
    <>
      <PageHeader eyebrow="From the collection" title={artifact.title} />
      <Container className="grid gap-12 py-16 md:grid-cols-2">
        <div>
          {artifact.image && (
            <img
              src={urlForImage(artifact.image).width(1200).url()}
              alt=""
              className="w-full"
            />
          )}
        </div>
        <aside>
          <dl className="space-y-4 text-sm">
            {artifact.medium && (
              <div>
                <dt className="eyebrow">Medium</dt>
                <dd className="mt-1 text-ink-soft">{artifact.medium}</dd>
              </div>
            )}
            {artifact.period && (
              <div>
                <dt className="eyebrow">Period</dt>
                <dd className="mt-1 text-ink-soft">{artifact.period}</dd>
              </div>
            )}
            {artifact.origin && (
              <div>
                <dt className="eyebrow">Origin</dt>
                <dd className="mt-1 text-ink-soft">{artifact.origin}</dd>
              </div>
            )}
            {artifact.accessionNumber && (
              <div>
                <dt className="eyebrow">Accession no.</dt>
                <dd className="mt-1 text-ink-soft">{artifact.accessionNumber}</dd>
              </div>
            )}
            {artifact.creditLine && (
              <div>
                <dt className="eyebrow">Credit</dt>
                <dd className="mt-1 text-ink-soft">{artifact.creditLine}</dd>
              </div>
            )}
          </dl>
          {artifact.description && (
            <div className="prose-museum mt-8">
              {/* @ts-expect-error PortableText accepts unknown[] blocks */}
              <PortableText value={artifact.description} />
            </div>
          )}
        </aside>
      </Container>
    </>
  );
}
