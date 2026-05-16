import { defineField, defineType } from "sanity";

export const testimony = defineType({
  name: "testimony",
  title: "Testimony",
  type: "document",
  description:
    "A survivor or witness testimony. Publish only with documented consent from the survivor or their family.",
  fields: [
    defineField({ name: "name", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "name", maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({ name: "yearOfBirth", type: "number" }),
    defineField({ name: "placeOfBirth", type: "string" }),
    defineField({
      name: "summary",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "portrait",
      type: "image",
      options: { hotspot: true },
      fields: [{ name: "alt", type: "string", title: "Alternative text" }],
    }),
    defineField({ name: "recordedAt", type: "date" }),
    defineField({
      name: "transcript",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({ name: "audioUrl", type: "url" }),
    defineField({ name: "videoUrl", type: "url" }),
    defineField({
      name: "consent",
      type: "boolean",
      title: "Consent on file",
      description:
        "Confirm written consent is on file before publishing this testimony.",
      validation: (r) => r.required(),
      initialValue: false,
    }),
  ],
  preview: {
    select: { title: "name", subtitle: "placeOfBirth", media: "portrait" },
  },
});
