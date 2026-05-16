import Container from "@/components/Container";
import PageHeader from "@/components/PageHeader";

export const metadata = { title: "Remembrance" };

export default function RemembrancePage() {
  return (
    <>
      <PageHeader
        eyebrow="Remembrance"
        title="Days of remembrance"
        lede="Each year the museum hosts ceremonies, candle-lightings, and community gatherings to remember the six million Jewish victims of the Holocaust and the millions of other people murdered by Nazi Germany and its collaborators."
      />
      <Container className="py-16">
        <section className="mb-16">
          <p className="eyebrow mb-3">Yom HaShoah</p>
          <h2 className="mb-4">Holocaust Remembrance Day</h2>
          <p className="prose-museum max-w-prose text-ink-soft">
            Observed on the 27th of Nisan, Yom HaShoah is marked at the museum
            with a ceremony of names, a candle-lighting by survivors and their
            descendants, and the recitation of Kaddish. All are welcome.
          </p>
        </section>
        <section className="mb-16">
          <p className="eyebrow mb-3">International Holocaust Remembrance Day</p>
          <h2 className="mb-4">January 27</h2>
          <p className="prose-museum max-w-prose text-ink-soft">
            The anniversary of the liberation of Auschwitz-Birkenau. The museum
            joins institutions around the world in remembrance, with programs
            open to the public throughout the week.
          </p>
        </section>
        <section className="rounded-sm bg-paper-warm p-10">
          <p className="eyebrow mb-3">Reading of names</p>
          <h2 className="mb-4">Add a name to be read</h2>
          <p className="prose-museum max-w-prose text-ink-soft">
            Each year the museum reads aloud the names of victims submitted by
            families and communities. If you would like to submit a name to be
            read at the next ceremony, please contact our remembrance program.
          </p>
          <a
            href="mailto:remembrance@example.org"
            className="mt-4 inline-block rounded-sm border border-ink px-5 py-3 no-underline hover:bg-ink hover:text-paper"
          >
            Submit a name
          </a>
        </section>
      </Container>
    </>
  );
}
