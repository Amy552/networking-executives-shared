import Link from "next/link";
import Container from "@/components/Container";

export default function NotFound() {
  return (
    <Container className="py-24 text-center">
      <p className="eyebrow mb-4">404</p>
      <h1 className="mb-6">We couldn&rsquo;t find that page</h1>
      <p className="mb-8 text-ink-soft">
        The page you&rsquo;re looking for may have been moved or no longer exists.
      </p>
      <Link
        href="/"
        className="no-underline rounded-sm bg-ink px-5 py-3 text-paper hover:bg-accent"
      >
        Return home
      </Link>
    </Container>
  );
}
