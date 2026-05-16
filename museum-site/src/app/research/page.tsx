import Container from "@/components/Container";
import PageHeader from "@/components/PageHeader";

export const metadata = { title: "Research" };

export default function ResearchPage() {
  return (
    <>
      <PageHeader
        eyebrow="Research"
        title="Library, archives, and scholarship"
        lede="The museum's research collections support scholars, students, journalists, and families seeking to recover the histories of people lost or displaced."
      />
      <Container className="grid gap-12 py-16 md:grid-cols-2">
        <section>
          <h2 className="mb-4">Library</h2>
          <p className="prose-museum text-ink-soft">
            Open to the public by appointment. Holdings include published
            scholarship, memoirs, periodicals, and rare books in English,
            Yiddish, Hebrew, German, Polish, and other languages.
          </p>
        </section>
        <section>
          <h2 className="mb-4">Archives</h2>
          <p className="prose-museum text-ink-soft">
            Documents, photographs, oral histories, and family papers. Many
            items are available digitally; others may be consulted on-site
            with advance notice.
          </p>
        </section>
        <section>
          <h2 className="mb-4">Family history & survivor records</h2>
          <p className="prose-museum text-ink-soft">
            Our reference staff help individuals trace family members who were
            displaced, killed, or survived. We work with international
            databases including the International Tracing Service and partner
            institutions worldwide.
          </p>
          <a
            href="mailto:research@example.org"
            className="mt-4 inline-block rounded-sm border border-ink px-5 py-3 no-underline hover:bg-ink hover:text-paper"
          >
            Request research help
          </a>
        </section>
        <section>
          <h2 className="mb-4">Fellowships</h2>
          <p className="prose-museum text-ink-soft">
            The museum awards short-term and year-long fellowships to scholars
            working on Holocaust history and related fields, including
            comparative genocide studies.
          </p>
        </section>
      </Container>
    </>
  );
}
