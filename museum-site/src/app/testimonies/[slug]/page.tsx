import { notFound } from "next/navigation";
import { PortableText } from "@portabletext/react";
import Container from "@/components/Container";
import PageHeader from "@/components/PageHeader";
import { sanityClient, urlForImage } from "@/lib/sanity";
import { testimonyBySlugQuery } from "@/lib/queries";

export const revalidate = 60;

type Testimony = {
  _id: string;
  name: string;
  yearOfBirth?: number;
  placeOfBirth?: string;
  summary?: string;
  portrait?: { asset: { _ref: string } };
  recordedAt?: string;
  transcript?: unknown[];
  audioUrl?: string;
  videoUrl?: string;
};

export default async function TestimonyPage({
  params,
}: {
  params: { slug: string };
}) {
  let testimony: Testimony | null = null;
  try {
    testimony = await sanityClient.fetch<Testimony | null>(testimonyBySlugQuery, {
      slug: params.slug,
    });
  } catch {
    testimony = null;
  }
  if (!testimony) notFound();

  return (
    <>
      <PageHeader
        eyebrow="Testimony"
        title={testimony.name}
        lede={testimony.summary}
      />
      <Container className="grid gap-12 py-16 md:grid-cols-[1fr_2fr]">
        <aside>
          {testimony.portrait && (
            <img
              src={urlForImage(testimony.portrait).width(800).url()}
              alt=""
              className="mb-6 w-full grayscale"
            />
          )}
          <dl className="space-y-3 text-sm">
            {testimony.yearOfBirth && (
              <div>
                <dt className="eyebrow">Born</dt>
                <dd className="mt-1 text-ink-soft">
                  {testimony.yearOfBirth}
                  {testimony.placeOfBirth ? `, ${testimony.placeOfBirth}` : ""}
                </dd>
              </div>
            )}
            {testimony.recordedAt && (
              <div>
                <dt className="eyebrow">Recorded</dt>
                <dd className="mt-1 text-ink-soft">{testimony.recordedAt}</dd>
              </div>
            )}
          </dl>
        </aside>
        <article>
          {testimony.videoUrl && (
            <div className="mb-8 aspect-video w-full bg-ink/5">
              <iframe
                src={testimony.videoUrl}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={`Testimony of ${testimony.name}`}
              />
            </div>
          )}
          {testimony.audioUrl && !testimony.videoUrl && (
            <audio controls src={testimony.audioUrl} className="mb-8 w-full" />
          )}
          {testimony.transcript && (
            <div className="prose-museum max-w-prose">
              {/* @ts-expect-error PortableText accepts unknown[] blocks */}
              <PortableText value={testimony.transcript} />
            </div>
          )}
        </article>
      </Container>
    </>
  );
}
