# Museum of Remembrance — Holocaust museum starter

A starter Next.js + Sanity website for a Holocaust museum. The structure is designed around the work a museum actually does: visit information, exhibitions, collections, survivor testimonies, education, research, remembrance, events, news, and support.

## Stack

- **Next.js 14** (App Router) — file-based routing, server components, image optimization
- **Tailwind CSS** — restrained, reverent design tokens (`paper`, `ink`, `accent`)
- **Sanity** — headless CMS with embedded Studio at `/studio`
- **TypeScript**

## Getting started

```bash
cd museum-site
npm install
cp .env.example .env.local
# fill in NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET
npm run dev
```

Open <http://localhost:3000>. The Studio is available at <http://localhost:3000/studio>.

To create a Sanity project: <https://www.sanity.io/manage> → New project, then add the project ID to `.env.local`.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Home |
| `/visit` | Hours, admission, accessibility, security, group visits |
| `/exhibitions` | Permanent, special, traveling, past |
| `/exhibitions/[slug]` | Individual exhibition |
| `/collections` | Browsable artifact list |
| `/collections/[slug]` | Individual artifact with metadata |
| `/testimonies` | Survivor and witness testimonies |
| `/testimonies/[slug]` | Individual testimony with transcript/audio/video |
| `/education` | Resources for students, educators, families, communities |
| `/remembrance` | Yom HaShoah, International Holocaust Remembrance Day, name submissions |
| `/research` | Library, archives, family history, fellowships |
| `/events` | Upcoming programs |
| `/events/[slug]` | Individual event |
| `/news` | News and announcements |
| `/news/[slug]` | Individual news post |
| `/support` | Membership, donations, legacy giving, volunteer |
| `/about` | Mission, history, staff, press |
| `/studio` | Embedded Sanity Studio |

## Content model

Schemas live in `src/sanity/schemas/`:

- `exhibition` — permanent / special / traveling / online / past, with related artifacts
- `artifact` — collection items with provenance, credit line, accession number
- `testimony` — survivor testimonies with a required `consent` boolean (consent must be on file before publishing)
- `event` — programs with registration links
- `educationalResource` — lesson plans, reading lists, videos, activities
- `newsPost` — news and announcements
- `page` — flexible editable pages

## Notes on tone & care

This subject demands care. A few choices reflect that:

- The `testimony` schema requires a `consent` boolean before publishing.
- Sample copy avoids sensationalism and never uses victim imagery as decoration.
- The visual system is restrained — serif headings, generous whitespace, a muted palette.
- Survivor portraits use grayscale by default, a common convention in memorial design.
- The footer and home page link to remembrance and education, not just visiting and donating.

You should review and revise placeholder copy before deploying. Replace the institution name, contact information, EIN, and image placeholders.

## Recommended additions before launch

- **Image/asset pipeline** — Sanity's CDN handles most cases; for high-resolution zoomable images consider [IIIF](https://iiif.io) and OpenSeadragon.
- **Ticketing** — embed your provider (Tessitura, ACME, Showclix) on `/visit`.
- **Translations** — the App Router supports i18n routing; consider Hebrew, Yiddish, German, Polish, Russian, and Spanish based on your audience.
- **Search** — Sanity's GROQ supports basic search; Algolia or Pagefind work well for larger collections.
- **Analytics** — Plausible or Fathom for privacy-respecting analytics.
- **Donations** — embed Stripe / Givebutter / a campaign provider on `/support`.

## License

Source is provided as a starter. Replace all placeholder copy before publishing.
