import Container from "@/components/Container";
import PageHeader from "@/components/PageHeader";

export const metadata = { title: "Education" };

const audiences = [
  {
    title: "For students",
    body: "Age-appropriate introductions to Holocaust history, with reading lists, glossaries, and discussion guides for elementary through university classrooms.",
  },
  {
    title: "For educators",
    body: "Lesson plans aligned with state and national standards, professional development workshops, and one-on-one consultation with our education team.",
  },
  {
    title: "For families",
    body: "Resources for conversations at home, recommended books and films, and questions to help young people understand difficult history.",
  },
  {
    title: "For communities",
    body: "Programs for civic groups, faith communities, and workplaces examining the lessons of the Holocaust for our own time.",
  },
];

export default function EducationPage() {
  return (
    <>
      <PageHeader
        eyebrow="Education"
        title="Learning that lasts"
        lede="The museum's educational programs are grounded in primary sources, survivor testimony, and the best scholarship in the field. Resources are free to use and adapt."
      />
      <Container className="py-16">
        <ul className="grid gap-10 md:grid-cols-2">
          {audiences.map((a) => (
            <li key={a.title} className="border-t border-ink/10 pt-6">
              <h3 className="mb-3">{a.title}</h3>
              <p className="text-ink-soft">{a.body}</p>
            </li>
          ))}
        </ul>
        <div className="mt-16 rounded-sm bg-paper-warm p-10">
          <p className="eyebrow mb-3">Teaching guidelines</p>
          <h2 className="mb-4">Approaching the Holocaust in the classroom</h2>
          <p className="prose-museum max-w-prose text-ink-soft">
            Our pedagogical guidelines emphasize historical accuracy,
            age-appropriate framing, and the dignity of victims. We do not
            recommend simulations, role-plays of perpetrators or victims, or
            comparisons that diminish the specific history of the Holocaust.
          </p>
          <a
            href="#"
            className="mt-4 inline-block rounded-sm border border-ink px-5 py-3 no-underline hover:bg-ink hover:text-paper"
          >
            Read our guidelines
          </a>
        </div>
      </Container>
    </>
  );
}
