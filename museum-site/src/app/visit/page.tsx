import Container from "@/components/Container";
import PageHeader from "@/components/PageHeader";

export const metadata = { title: "Visit" };

export default function VisitPage() {
  return (
    <>
      <PageHeader
        eyebrow="Visit"
        title="Plan your visit"
        lede="The El Paso Holocaust Museum and Study Center is located in the heart of downtown El Paso. Admission is free, and we welcome visitors from across the Borderplex and beyond."
      />

      <section className="border-b border-ink/10">
        <Container>
          <img
            src="https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=2400&q=70"
            alt="View of downtown El Paso with the Franklin Mountains in the background"
            className="aspect-[21/9] w-full object-cover"
          />
        </Container>
      </section>

      <Container className="grid gap-16 py-16 md:grid-cols-3">
        <section id="hours">
          <p className="eyebrow mb-3">Hours</p>
          <ul className="space-y-1 text-ink-soft">
            <li>Tuesday &ndash; Friday: 9am &ndash; 4pm</li>
            <li>Saturday: 11am &ndash; 5pm</li>
            <li>Sunday: 1pm &ndash; 5pm</li>
            <li>Monday: Closed</li>
            <li className="mt-3 text-sm text-ink-muted">
              Closed on major Jewish holidays, Thanksgiving Day, and December 25.
              Hours may change for community programs &mdash; please call ahead.
            </li>
          </ul>
        </section>
        <section id="admission">
          <p className="eyebrow mb-3">Admission</p>
          <p className="text-ink-soft">
            <strong className="text-ink">Free for all visitors.</strong>{" "}
            Donations are gratefully accepted at the front desk and online.
            Reservations are required for school and community groups of ten
            or more.
          </p>
          <a
            href="mailto:info@elpasoholocaustmuseum.org"
            className="mt-4 inline-block rounded-sm bg-ink px-5 py-3 text-paper no-underline hover:bg-accent"
          >
            Reserve a group visit
          </a>
        </section>
        <section id="location">
          <p className="eyebrow mb-3">Location</p>
          <address className="not-italic text-ink-soft">
            715 N. Oregon Street
            <br />
            El Paso, TX 79902
            <br />
            <a href="tel:+19153510048">(915) 351-0048</a>
          </address>
          <p className="mt-3 text-sm text-ink-muted">
            Two blocks north of San Jacinto Plaza in downtown El Paso, near
            the El Paso Museum of Art and the Plaza Theatre.
          </p>
        </section>
      </Container>

      <section className="border-t border-ink/10 bg-paper-warm py-16">
        <Container className="grid gap-12 md:grid-cols-2">
          <div id="getting-here">
            <p className="eyebrow mb-3">Getting here</p>
            <h2 className="mb-4">By car, transit, and from M&eacute;xico</h2>
            <ul className="space-y-3 text-ink-soft">
              <li>
                <strong className="text-ink">Driving:</strong> From I-10, take
                the Oregon Street exit (Exit 19) and head north. Metered
                street parking is available, and the Convention Center garage
                is two blocks away.
              </li>
              <li>
                <strong className="text-ink">Sun Metro:</strong> The
                Brio rapid transit Mesa line and several local routes stop
                within two blocks of the museum.
              </li>
              <li>
                <strong className="text-ink">Streetcar:</strong> The El Paso
                Streetcar&rsquo;s downtown loop has a stop one block south at
                Mills &amp; Oregon.
              </li>
              <li>
                <strong className="text-ink">Cruzando desde Ju&aacute;rez:</strong>{" "}
                El museo se encuentra a 10 minutos a pie del puente Paso del
                Norte. Recomendamos cruzar con tiempo suficiente para las
                filas de inspecci&oacute;n.
              </li>
            </ul>
          </div>
          <div id="accessibility">
            <p className="eyebrow mb-3">Accessibility</p>
            <h2 className="mb-4">A welcoming museum for every visitor</h2>
            <ul className="space-y-2 text-ink-soft">
              <li>Step-free access to all public galleries and restrooms.</li>
              <li>Wheelchairs and folding stools available at the front desk.</li>
              <li>
                Large-print gallery guides in English and Spanish; assistive
                listening devices for programs in the auditorium.
              </li>
              <li>
                ASL-interpreted tours by request, with 14 days&rsquo; notice.
              </li>
              <li>
                Sensory-friendly visit times by appointment for visitors with
                autism or sensory sensitivities.
              </li>
              <li>
                Service animals are welcome throughout the museum.
              </li>
            </ul>
          </div>
        </Container>
      </section>

      <Container className="grid gap-12 py-16 md:grid-cols-2">
        <div id="bilingual">
          <p className="eyebrow mb-3">English y espa&ntilde;ol</p>
          <h2 className="mb-4">Bilingual museum</h2>
          <p className="prose-museum text-ink-soft">
            All permanent exhibition text is in English and Spanish. Audio
            guides, education materials, and survivor testimonies are
            available in both languages. School programs are offered
            bilingually on request &mdash; please indicate your preference
            when booking.
          </p>
        </div>
        <div id="security">
          <p className="eyebrow mb-3">Before you arrive</p>
          <h2 className="mb-4">Security &amp; what to bring</h2>
          <p className="prose-museum text-ink-soft">
            All visitors pass through security screening upon entry. Large
            bags and backpacks may be checked at the front desk. Photography
            for personal, non-commercial use is permitted in most galleries;
            flash, tripods, and selfie sticks are not allowed.
          </p>
          <p className="prose-museum text-ink-soft">
            The permanent exhibition addresses violence, antisemitism, and
            the Holocaust in age-appropriate detail. We recommend the
            experience for visitors ages 11 and up; parents and educators
            know their children best.
          </p>
        </div>
      </Container>

      <section className="border-t border-ink/10 bg-paper-warm py-16">
        <Container>
          <div id="groups">
            <p className="eyebrow mb-3">School &amp; group visits</p>
            <h2 className="mb-4">Free programs for every El Paso student</h2>
            <p className="prose-museum max-w-prose text-ink-soft">
              School groups from EPISD, YISD, SISD, Canutillo, San Elizario,
              Clint, Tornillo, Las Cruces, and across the region visit the
              museum free of charge. Programs include a docent-led tour, a
              survivor or descendant talk when available, and a pre-visit
              guide for teachers. Bus subsidies are available for Title I
              schools through our education fund.
            </p>
            <a
              href="mailto:education@elpasoholocaustmuseum.org"
              className="mt-4 inline-block rounded-sm border border-ink px-5 py-3 no-underline hover:bg-ink hover:text-paper"
            >
              Contact education services
            </a>
          </div>
        </Container>
      </section>
    </>
  );
}
