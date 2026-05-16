import { notFound } from "next/navigation";
import { PortableText } from "@portabletext/react";
import Container from "@/components/Container";
import PageHeader from "@/components/PageHeader";
import { sanityClient, urlForImage } from "@/lib/sanity";
import { exhibitionBySlugQuery } from "@/lib/queries";

export const revalidate = 60;

type Exhibition = {
  _id: string;
  title: string;
  summary?: string;
  kind?: string;
  startDate?: string;
  endDate?: string;
  coverImage?: { asset: { _ref: string } };
  body?: unknown[];
  relatedArtifacts?: Array<{
    _id: string;
    title: string;
    slug?: string;
    image?: { asset: { _ref: string } };
  }>;
};

export default async function ExhibitionPage({
  params,
}: {
  params: { slug: string };
}) {
  let exhibition: Exhibition | null = null;
  try {
    exhibition = await sanityClient.fetch<Exhibition | null>(
      exhibitionBySlugQuery,
      { slug: params.slug }
    );
  } catch {
    exhibition = null;
  }
  if (!exhibition) notFound();

  return (
    <>
      <PageHeader
        eyebrow={exhibition.kind ?? "Exhibition"}
        title={exhibition.title}
        lede={exhibition.summary}
      />
      <Container className="py-16">
        {exhibition.coverImage && (
          <img
            src={urlForImage(exhibition.coverImage).width(1600).url()}
            alt=""
            className="mb-10 w-full"
          />
        )}
        <div className="prose-museum max-w-prose">
          {exhibition.body ? (
            // @ts-expect-error PortableText accepts unknown[] blocks
            <PortableText value={exhibition.body} />
          ) : null}
        </div>
        {exhibition.relatedArtifacts && exhibition.relatedArtifacts.length > 0 && (
          <section className="mt-16 border-t border-ink/10 pt-10">
            <p className="eyebrow mb-4">In this exhibition</p>
            <ul className="grid gap-6 md:grid-cols-3">
              {exhibition.relatedArtifacts.map((a) => (
                <li key={a._id}>
                  {a.image && (
                    <img
                      src={urlForImage(a.image).width(600).url()}
                      alt=""
                      className="mb-2 aspect-square w-full object-cover"
                    />
                  )}
                  <p>{a.title}</p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </Container>
    </>
  );
}
