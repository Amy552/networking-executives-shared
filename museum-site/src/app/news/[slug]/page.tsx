import { notFound } from "next/navigation";
import { PortableText } from "@portabletext/react";
import Container from "@/components/Container";
import PageHeader from "@/components/PageHeader";
import { sanityClient, urlForImage } from "@/lib/sanity";
import { newsBySlugQuery } from "@/lib/queries";

export const revalidate = 60;

type NewsPost = {
  _id: string;
  title: string;
  publishedAt: string;
  excerpt?: string;
  coverImage?: { asset: { _ref: string } };
  body?: unknown[];
  author?: string;
};

export default async function NewsPostPage({
  params,
}: {
  params: { slug: string };
}) {
  let post: NewsPost | null = null;
  try {
    post = await sanityClient.fetch<NewsPost | null>(newsBySlugQuery, {
      slug: params.slug,
    });
  } catch {
    post = null;
  }
  if (!post) notFound();

  return (
    <>
      <PageHeader
        eyebrow={new Date(post.publishedAt).toLocaleDateString(undefined, {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
        title={post.title}
        lede={post.excerpt}
      />
      <Container className="py-16">
        {post.coverImage && (
          <img
            src={urlForImage(post.coverImage).width(1600).url()}
            alt=""
            className="mb-10 w-full"
          />
        )}
        {post.author && (
          <p className="mb-6 text-sm text-ink-muted">By {post.author}</p>
        )}
        <article className="prose-museum max-w-prose">
          {post.body && (
            // @ts-expect-error PortableText accepts unknown[] blocks
            <PortableText value={post.body} />
          )}
        </article>
      </Container>
    </>
  );
}
