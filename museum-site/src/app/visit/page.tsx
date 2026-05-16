import Container from "@/components/Container";
import PageHeader from "@/components/PageHeader";

export const metadata = { title: "Visit" };

export default function VisitPage() {
  return (
    <>
      <PageHeader
        eyebrow="Visit"
        title="Plan your visit"
        lede="The museum is open to the public year-round. We recommend reserving timed-entry tickets in advance."
      />
      <Container className="grid gap-16 py-16 md:grid-cols-3">
        <section id="hours">
          <p className="eyebrow mb-3">Hours</p>
          <ul className="space-y-1 text-ink-soft">
            <li>Monday – Friday: 10am – 5pm</li>
            <li>Saturday: 10am – 6pm</li>
            <li>Sunday: 12pm – 5pm</li>
            <li className="mt-3 text-sm text-ink-muted">
              Closed on Yom Kippur, Thanksgiving Day, and December 25.
            </li>
          </ul>
        </section>
        <section id="admission">
          <p className="eyebrow mb-3">Admission</p>
          <p className="text-ink-soft">
            General admission is free. Timed-entry passes are required and may be
            reserved online up to four months in advance.
          </p>
          <a
            href="#"
            className="mt-4 inline-block rounded-sm bg-ink px-5 py-3 text-paper no-underline hover:bg-accent"
          >
            Reserve passes
          </a>
        </section>
        <section id="location">
          <p className="eyebrow mb-3">Location</p>
          <address className="not-italic text-ink-soft">
            123 Memorial Way
            <br />
            City, State 00000
          </address>
          <p className="mt-3 text-sm text-ink-muted">
            Accessible by public transit. Limited paid parking is available
            nearby.
          </p>
        </section>
      </Container>

      <section className="border-t border-ink/10 bg-paper-warm py-16">
        <Container className="grid gap-12 md:grid-cols-2">
          <div id="accessibility">
            <p className="eyebrow mb-3">Accessibility</p>
            <h2 className="mb-4">A welcoming museum for every visitor</h2>
            <ul className="space-y-2 text-ink-soft">
              <li>Step-free access to all public galleries and restrooms.</li>
              <li>Wheelchairs available at the visitor services desk.</li>
              <li>Assistive listening devices and large-print guides.</li>
              <li>ASL-interpreted tours by request, with 14 days&rsquo; notice.</li>
              <li>Sensory-friendly hours on the first Sunday of each month.</li>
            </ul>
          </div>
          <div id="security">
            <p className="eyebrow mb-3">Before you arrive</p>
            <h2 className="mb-4">Security &amp; what to bring</h2>
            <p className="prose-museum text-ink-soft">
              All visitors pass through security screening upon entry, similar
              to airport security. Please plan extra time during peak hours.
              Large bags and backpacks may be checked or stored at the visitor
              services desk.
            </p>
            <p className="prose-museum text-ink-soft">
              Photography is permitted in most galleries for personal,
              non-commercial use. Flash, tripods, and selfie sticks are not
              allowed.
            </p>
          </div>
        </Container>
      </section>

      <Container className="py-16">
        <div id="groups">
          <p className="eyebrow mb-3">Group visits</p>
          <h2 className="mb-4">Schools, community groups, and tours</h2>
          <p className="prose-museum max-w-prose text-ink-soft">
            Groups of ten or more must reserve in advance. School groups
            receive a pre-visit guide and the option of a docent-led
            introduction. Please contact our visitor services team at least
            three weeks before your visit.
          </p>
          <a
            href="mailto:groups@example.org"
            className="mt-4 inline-block rounded-sm border border-ink px-5 py-3 no-underline hover:bg-ink hover:text-paper"
          >
            Contact group services
          </a>
        </div>
      </Container>
    </>
  );
}
