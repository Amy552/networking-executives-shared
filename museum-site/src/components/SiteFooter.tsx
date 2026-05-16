import Link from "next/link";
import Container from "./Container";

const groups = [
  {
    heading: "Visit",
    links: [
      { href: "/visit", label: "Plan your visit" },
      { href: "/visit#hours", label: "Hours & admission" },
      { href: "/visit#accessibility", label: "Accessibility" },
      { href: "/visit#groups", label: "Group visits" },
    ],
  },
  {
    heading: "Learn",
    links: [
      { href: "/exhibitions", label: "Exhibitions" },
      { href: "/collections", label: "Collections" },
      { href: "/testimonies", label: "Survivor testimonies" },
      { href: "/education", label: "Educational resources" },
      { href: "/research", label: "Research & archives" },
    ],
  },
  {
    heading: "Engage",
    links: [
      { href: "/remembrance", label: "Remembrance" },
      { href: "/events", label: "Events & programs" },
      { href: "/news", label: "News" },
      { href: "/support", label: "Support the museum" },
    ],
  },
  {
    heading: "About",
    links: [
      { href: "/about", label: "Our mission" },
      { href: "/about#history", label: "History" },
      { href: "/about#staff", label: "Staff & board" },
      { href: "/about#press", label: "Press" },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-ink/10 bg-paper-warm py-16">
      <Container>
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <p className="font-serif text-xl">El Paso Holocaust Museum &amp; Study Center</p>
            <p className="mt-3 text-sm text-ink-muted">
              Memory, witness, and education on the U.S.&ndash;Mexico border.
            </p>
            <address className="mt-4 not-italic text-sm text-ink-soft">
              715 N. Oregon Street
              <br />
              El Paso, TX 79902
              <br />
              <a href="tel:+19153514358">(915) 351-0048</a>
            </address>
            <p className="mt-3 text-xs text-ink-muted">
              Please verify contact details before publishing.
            </p>
          </div>
          {groups.map((group) => (
            <div key={group.heading}>
              <p className="eyebrow mb-3">{group.heading}</p>
              <ul className="space-y-2 text-sm">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="no-underline text-ink-soft hover:text-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-ink/10 pt-6 text-xs text-ink-muted md:flex-row md:items-center md:justify-between">
          <p>
            &copy; {new Date().getFullYear()} Museum of Remembrance. All rights
            reserved.
          </p>
          <ul className="flex flex-wrap gap-4">
            <li>
              <Link href="/privacy" className="no-underline">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="no-underline">
                Terms
              </Link>
            </li>
            <li>
              <Link href="/accessibility" className="no-underline">
                Accessibility statement
              </Link>
            </li>
          </ul>
        </div>
      </Container>
    </footer>
  );
}
