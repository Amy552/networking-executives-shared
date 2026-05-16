import Container from "@/components/Container";
import PageHeader from "@/components/PageHeader";

export const metadata = { title: "Support" };

const ways = [
  {
    title: "Become a member",
    body: "Annual membership supports the museum's daily work and includes invitations to members-only previews, lectures, and family programs.",
    cta: "Join",
  },
  {
    title: "Make a gift",
    body: "Donations of any size sustain exhibitions, education, archives, and survivor programs. Gifts are tax-deductible to the fullest extent permitted by law.",
    cta: "Donate",
  },
  {
    title: "Legacy giving",
    body: "Include the museum in your will or estate plans to ensure that this history continues to be taught for generations to come.",
    cta: "Plan a legacy",
  },
  {
    title: "Volunteer",
    body: "Volunteers serve as visitor greeters, archive assistants, and educators. Training is provided.",
    cta: "Volunteer",
  },
];

export default function SupportPage() {
  return (
    <>
      <PageHeader
        eyebrow="Support"
        title="Your support sustains this work"
        lede="The museum is an independent, nonprofit institution. Every membership, gift, and volunteer hour makes our work possible."
      />
      <Container className="py-16">
        <ul className="grid gap-10 md:grid-cols-2">
          {ways.map((w) => (
            <li key={w.title} className="rounded-sm bg-paper-warm p-8">
              <h3 className="mb-3">{w.title}</h3>
              <p className="prose-museum text-ink-soft">{w.body}</p>
              <a
                href="#"
                className="mt-4 inline-block rounded-sm bg-ink px-5 py-3 text-paper no-underline hover:bg-accent"
              >
                {w.cta}
              </a>
            </li>
          ))}
        </ul>
        <div className="mt-16 text-sm text-ink-muted">
          The Museum of Remembrance is a 501(c)(3) nonprofit organization.
          EIN 00-0000000.
        </div>
      </Container>
    </>
  );
}
