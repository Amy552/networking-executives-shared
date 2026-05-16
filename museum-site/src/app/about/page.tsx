import Container from "@/components/Container";
import PageHeader from "@/components/PageHeader";

export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About"
        title="Our mission"
        lede="The Museum of Remembrance teaches the history of the Holocaust, honors the memory of its victims, and challenges visitors to confront hatred, prevent genocide, and promote human dignity."
      />
      <Container className="py-16">
        <section id="mission" className="mb-16 max-w-prose">
          <h2 className="mb-4">What we do</h2>
          <p className="prose-museum text-ink-soft">
            Through exhibitions, education, research, and remembrance, the
            museum invites visitors of every background to reflect on this
            history and on the responsibilities of citizenship in our own
            time.
          </p>
        </section>
        <section id="history" className="mb-16 max-w-prose">
          <h2 className="mb-4">Our history</h2>
          <p className="prose-museum text-ink-soft">
            The museum was founded by survivors, their families, and members
            of the community who believed that the memory of the Holocaust
            must be preserved and that its lessons must shape the future.
          </p>
        </section>
        <section id="staff" className="mb-16 max-w-prose">
          <h2 className="mb-4">Staff &amp; board</h2>
          <p className="prose-museum text-ink-soft">
            The museum is led by a director, professional staff in
            curatorial, education, and operations, and a volunteer board of
            trustees. A full directory is available on request.
          </p>
        </section>
        <section id="press" className="max-w-prose">
          <h2 className="mb-4">Press</h2>
          <p className="prose-museum text-ink-soft">
            Journalists seeking interviews, images, or background information
            may contact our communications office.
          </p>
          <a
            href="mailto:press@example.org"
            className="mt-4 inline-block rounded-sm border border-ink px-5 py-3 no-underline hover:bg-ink hover:text-paper"
          >
            Contact press
          </a>
        </section>
      </Container>
    </>
  );
}
