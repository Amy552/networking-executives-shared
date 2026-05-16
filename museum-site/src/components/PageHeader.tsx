import Container from "./Container";

export default function PageHeader({
  eyebrow,
  title,
  lede,
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
}) {
  return (
    <header className="border-b border-ink/10 bg-paper-warm py-16 md:py-24">
      <Container>
        {eyebrow ? <p className="eyebrow mb-4">{eyebrow}</p> : null}
        <h1 className="max-w-3xl">{title}</h1>
        {lede ? (
          <p className="mt-6 max-w-2xl text-lg text-ink-soft">{lede}</p>
        ) : null}
      </Container>
    </header>
  );
}
