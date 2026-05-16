import Link from "next/link";
import Container from "@/components/Container";

export default function HomePage() {
  return (
    <>
      <section className="relative border-b border-ink/10 bg-ink text-paper">
        <div className="absolute inset-0 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1543599538-a6c4f6cc5c05?auto=format&fit=crop&w=2400&q=70"
            alt=""
            className="h-full w-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/80 to-transparent" />
        </div>
        <Container className="relative py-24 md:py-32">
          <p className="eyebrow mb-6 text-paper/70">
            On the U.S.&ndash;Mexico border &middot; El Paso, Texas
          </p>
          <h1 className="max-w-3xl text-paper">
            We remember the six million. We listen to survivors. We teach so
            that hatred has no foothold in our community.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-paper/85">
            Founded by survivors who made El Paso their home, the El Paso
            Holocaust Museum and Study Center is one of only a handful of
            Holocaust museums on the U.S.&ndash;Mexico border. Admission is
            free.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/visit"
              className="no-underline rounded-sm bg-paper px-5 py-3 text-ink hover:bg-paper-warm"
            >
              Plan your visit
            </Link>
            <Link
              href="/education"
              className="no-underline rounded-sm border border-paper/30 px-5 py-3 text-paper hover:border-paper"
            >
              For schools &amp; educators
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
                Recorded accounts from El Paso&rsquo;s survivor community and
                witnesses worldwide. In English and Spanish, preserved for
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
                Lesson plans aligned to Texas standards, bilingual resources,
                and free school programs that reach every district in the
                Borderplex.
              </p>
              <Link href="/education" className="mt-4 inline-block">
                Resources &rarr;
              </Link>
            </article>
            <article>
              <p className="eyebrow mb-3">Stand against hatred</p>
              <h3 className="mb-3">August 3 and beyond</h3>
              <p className="text-ink-soft">
                After the 2019 attack on El Paso, our work to confront
                antisemitism, racism, and hate of every kind became more
                urgent than ever.
              </p>
              <Link href="/about" className="mt-4 inline-block">
                Our mission &rarr;
              </Link>
            </article>
          </div>
        </Container>
      </section>

      <section className="border-t border-ink/10 bg-paper-warm py-20">
        <Container>
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <img
                src="https://images.unsplash.com/photo-1604881991720-f91add269bed?auto=format&fit=crop&w=1600&q=70"
                alt=""
                className="aspect-[4/3] w-full object-cover"
              />
            </div>
            <div>
              <p className="eyebrow mb-4">Visit free of charge</p>
              <h2 className="mb-4">A museum for every community on the border</h2>
              <p className="prose-museum text-ink-soft">
                Our permanent galleries, special exhibitions, and survivor
                programs are free and open to the public. Bilingual signage
                and audio guides welcome Spanish-speaking visitors from El
                Paso, Las Cruces, and Ciudad Ju&aacute;rez.
              </p>
              <Link
                href="/visit"
                className="mt-4 inline-block rounded-sm bg-ink px-5 py-3 text-paper no-underline hover:bg-accent"
              >
                Hours &amp; directions
              </Link>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-20">
        <Container className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <p className="eyebrow mb-4">Support our mission</p>
            <h2 className="mb-4">
              Help keep this history alive on the border.
            </h2>
            <p className="text-ink-soft">
              The museum is an independent nonprofit, supported by individuals,
              families, schools, and foundations across the Borderplex who
              believe this history must be taught.
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
