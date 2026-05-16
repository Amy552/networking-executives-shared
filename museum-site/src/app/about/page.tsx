import Container from "@/components/Container";
import PageHeader from "@/components/PageHeader";

export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About the museum"
        title="A borderland museum, founded by survivors"
        lede="The El Paso Holocaust Museum and Study Center teaches the history of the Holocaust, honors the memory of its victims, and asks every visitor to confront the hatred of our own time."
      />

      <section className="border-b border-ink/10">
        <Container>
          <img
            src="https://images.unsplash.com/photo-1609607923500-3a3f50a4a5cd?auto=format&fit=crop&w=2400&q=70"
            alt="A row of memorial candles burning quietly"
            className="aspect-[21/9] w-full object-cover"
          />
        </Container>
      </section>

      <Container className="py-16">
        <section id="mission" className="mb-16 max-w-prose">
          <p className="eyebrow mb-3">Our mission</p>
          <h2 className="mb-4">Memory in service of human dignity</h2>
          <p className="prose-museum text-ink-soft">
            Through exhibitions, education, and survivor programs, we invite
            visitors of every background to reflect on the Holocaust and on
            the responsibilities of citizenship in our own time. We are
            committed to truth-telling, to the dignity of victims, and to
            confronting prejudice wherever it takes root &mdash; including in
            our own community.
          </p>
        </section>

        <section id="history" className="mb-16 grid gap-12 md:grid-cols-2 md:items-start">
          <div>
            <p className="eyebrow mb-3">Our history</p>
            <h2 className="mb-4">Founded by survivors who chose El Paso</h2>
            <p className="prose-museum text-ink-soft">
              The museum was founded in 1984 by Henry Kellen, a Holocaust
              survivor who made El Paso his home after the war, together with
              fellow survivors and members of the city&rsquo;s small but
              long-rooted Jewish community. From a single room of personal
              artifacts, the museum has grown into a study center serving
              tens of thousands of visitors every year.
            </p>
            <p className="prose-museum text-ink-soft">
              In 2008, the museum moved to its current home on Oregon Street
              in downtown El Paso, expanding to include a permanent
              exhibition, the Henry Kellen Memorial Library, an auditorium
              for public programs, and dedicated classroom space.
            </p>
          </div>
          <div>
            <img
              src="https://images.unsplash.com/photo-1535191042502-e6a9a3d407e7?auto=format&fit=crop&w=1200&q=70"
              alt="A small pile of memorial stones, a Jewish tradition of remembrance"
              className="aspect-[4/5] w-full object-cover"
            />
          </div>
        </section>

        <section id="border" className="mb-16 max-w-prose">
          <p className="eyebrow mb-3">A border-region museum</p>
          <h2 className="mb-4">Why El Paso</h2>
          <p className="prose-museum text-ink-soft">
            More than 80% of our region&rsquo;s residents are Hispanic or
            Latino. Many trace their families across the U.S.&ndash;Mexico
            border for generations. The museum&rsquo;s bilingual
            programming &mdash; in English and Spanish &mdash; reflects the
            community we serve. Visitors come from El Paso, Las Cruces,
            Ciudad Ju&aacute;rez, Chihuahua, and from school districts
            across far West Texas and southern New Mexico.
          </p>
          <p className="prose-museum text-ink-soft">
            For many of our visitors, this is the first museum exhibition
            they have ever seen about the Holocaust. We take that
            responsibility seriously.
          </p>
        </section>

        <section id="aug-3" className="mb-16 rounded-sm bg-paper-warm p-10">
          <p className="eyebrow mb-3">Why this work matters here</p>
          <h2 className="mb-4">August 3, 2019</h2>
          <p className="prose-museum max-w-prose text-ink-soft">
            On August 3, 2019, a gunman drove from out of town to a Walmart
            in El Paso and murdered 23 people in an attack motivated by
            racist hatred of Latinos. The hatred that shaped the Holocaust
            did not stay in the past, and it did not stay overseas. In the
            years since, the museum&rsquo;s commitment to teaching against
            antisemitism, racism, xenophobia, and hatred of every kind has
            only deepened.
          </p>
          <p className="prose-museum max-w-prose text-ink-soft">
            We stand with our Latino, Jewish, immigrant, LGBTQ+, and
            interfaith neighbors. The lessons of the Holocaust are not
            abstract; they are urgent, and they belong to all of us.
          </p>
        </section>

        <section id="staff" className="mb-16 max-w-prose">
          <p className="eyebrow mb-3">Leadership</p>
          <h2 className="mb-4">Staff &amp; board</h2>
          <p className="prose-museum text-ink-soft">
            The museum is led by an executive director, a small professional
            staff in curatorial, education, and operations, and a volunteer
            board of trustees drawn from the El Paso community. A full
            directory is available on request.
          </p>
        </section>

        <section id="press" className="max-w-prose">
          <p className="eyebrow mb-3">Press</p>
          <h2 className="mb-4">For journalists</h2>
          <p className="prose-museum text-ink-soft">
            Journalists seeking interviews, b-roll, images, or background
            information for stories about the Holocaust, antisemitism, or
            the museum&rsquo;s work may contact our communications office.
            Bilingual interviews are available.
          </p>
          <a
            href="mailto:press@elpasoholocaustmuseum.org"
            className="mt-4 inline-block rounded-sm border border-ink px-5 py-3 no-underline hover:bg-ink hover:text-paper"
          >
            Contact press
          </a>
        </section>
      </Container>
    </>
  );
}
