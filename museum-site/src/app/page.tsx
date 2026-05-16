import Link from "next/link";
import Container from "@/components/Container";

export default function HomePage() {
  return (
    <>
      <section className="border-b border-ink/10 bg-ink text-paper">
        <Container className="py-24 md:py-32">
          <p className="eyebrow mb-6 text-paper/70">A place of memory</p>
          <h1 className="max-w-3xl text-paper">
            We remember the lives lost, honor the voices of survivors, and teach
            so that history is not repeated.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-paper/80">
            The Museum of Remembrance preserves the history of the Holocaust
            through artifacts, testimony, scholarship, and education.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/visit"
              className="no-underline rounded-sm bg-paper px-5 py-3 text-ink hover:bg-paper-warm"
            >
              Plan your visit
            </Link>
            <Link
              href="/exhibitions"
              className="no-underline rounded-sm border border-paper/30 px-5 py-3 text-paper hover:border-paper"
            >
              Current exhibitions
            </Link>
          </div>
        </Container>
      </section>

      <section className="py-20">
        <Container>
          <div className="grid gap-12 md:grid-cols-3">
            <article>
              <p className="eyebrow mb-3">Bear witness</p>
              <h3 className="mb-3">Survivor testimonies</h3>
              <p className="text-ink-soft">
                Recorded accounts from survivors and witnesses, preserved for
                future generations.
              </p>
              <Link href="/testimonies" className="mt-4 inline-block">
                Listen &rarr;
              </Link>
            </article>
            <article>
              <p className="eyebrow mb-3">Learn</p>
              <h3 className="mb-3">For educators &amp; students</h3>
              <p className="text-ink-soft">
                Lesson plans, reading lists, and programs for classrooms at
                every level.
              </p>
              <Link href="/education" className="mt-4 inline-block">
                Resources &rarr;
              </Link>
            </article>
            <article>
              <p className="eyebrow mb-3">Remember</p>
              <h3 className="mb-3">Days of remembrance</h3>
              <p className="text-ink-soft">
                Annual ceremonies, candle-lighting, and community gatherings.
              </p>
              <Link href="/remembrance" className="mt-4 inline-block">
                Observances &rarr;
              </Link>
            </article>
          </div>
        </Container>
      </section>

      <section className="border-t border-ink/10 bg-paper-warm py-20">
        <Container className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <p className="eyebrow mb-4">Support our mission</p>
            <h2 className="mb-4">
              Your gift sustains the work of memory and education.
            </h2>
            <p className="text-ink-soft">
              The museum is supported by individuals, families, and foundations
              who believe that this history must be taught.
            </p>
          </div>
          <div>
            <Link
              href="/support"
              className="no-underline inline-block rounded-sm bg-accent px-6 py-3 text-paper hover:bg-accent-dark"
            >
              Make a gift
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}
