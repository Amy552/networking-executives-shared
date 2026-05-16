import Link from "next/link";
import Container from "@/components/Container";
import PageHeader from "@/components/PageHeader";
import { sanityClient } from "@/lib/sanity";
import { newsQuery } from "@/lib/queries";

type NewsPost = {
  _id: string;
  title: string;
  slug: string;
  publishedAt: string;
  excerpt?: string;
  coverImage?: string;
};

export const metadata = { title: "News" };
export const revalidate = 60;

export default async function NewsPage() {
  let posts: NewsPost[] = [];
  try {
    posts = await sanityClient.fetch<NewsPost[]>(newsQuery);
  } catch {
    // empty
  }

  return (
    <>
      <PageHeader
        eyebrow="News"
        title="News from the museum"
        lede="Announcements, recent acquisitions, research notes, and reflections from our staff and scholars."
      />
      <Container className="py-16">
        {posts.length === 0 ? (
          <p className="text-ink-muted">
            News posts will appear here once published.
          </p>
        ) : (
          <ul className="grid gap-10 md:grid-cols-2">
            {posts.map((post) => (
              <li key={post._id} className="border-t border-ink/10 pt-6">
                <Link href={`/news/${post.slug}`} className="block no-underline">
                  {post.coverImage && (
                    <img
                      src={post.coverImage}
                      alt=""
                      className="mb-4 aspect-[3/2] w-full object-cover"
                    />
                  )}
                  <p className="text-xs uppercase tracking-wider text-ink-muted">
                    {new Date(post.publishedAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <h3 className="mt-1 mb-3">{post.title}</h3>
                  {post.excerpt && (
                    <p className="text-ink-soft">{post.excerpt}</p>
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
