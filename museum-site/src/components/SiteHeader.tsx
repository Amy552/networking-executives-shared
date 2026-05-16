import Link from "next/link";
import Container from "./Container";

const nav = [
  { href: "/visit", label: "Visit" },
  { href: "/exhibitions", label: "Exhibitions" },
  { href: "/collections", label: "Collections" },
  { href: "/testimonies", label: "Testimonies" },
  { href: "/education", label: "Education" },
  { href: "/remembrance", label: "Remembrance" },
  { href: "/research", label: "Research" },
  { href: "/events", label: "Events" },
  { href: "/news", label: "News" },
  { href: "/about", label: "About" },
];

export default function SiteHeader() {
  return (
    <header className="border-b border-ink/10 bg-paper">
      <Container className="flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
        <Link href="/" className="no-underline">
          <span className="block font-serif text-2xl leading-tight">
            Museum of Remembrance
          </span>
          <span className="block text-xs uppercase tracking-[0.2em] text-ink-muted">
            Holocaust history &amp; education
          </span>
        </Link>
        <nav aria-label="Primary">
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="no-underline text-ink-soft hover:text-ink"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/support"
                className="no-underline rounded-sm bg-ink px-3 py-1 text-paper hover:bg-accent"
              >
                Support
              </Link>
            </li>
          </ul>
        </nav>
      </Container>
    </header>
  );
}
