import { defineField, defineType } from "sanity";

export const artifact = defineType({
  name: "artifact",
  title: "Artifact",
  type: "document",
  description:
    "An object, document, or photograph in the collection. Treat provenance and credit lines with care.",
  fields: [
    defineField({ name: "title", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({ name: "accessionNumber", type: "string" }),
    defineField({
      name: "medium",
      type: "string",
      description: "e.g. Photograph, Letter, Garment, Document",
    }),
    defineField({ name: "period", type: "string", description: "e.g. 1939–1945" }),
    defineField({ name: "origin", type: "string" }),
    defineField({
      name: "image",
      type: "image",
      options: { hotspot: true },
      fields: [{ name: "alt", type: "string", title: "Alternative text" }],
      validation: (r) => r.required(),
    }),
    defineField({
      name: "description",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "creditLine",
      type: "string",
      description: "How this item should be credited when displayed or cited.",
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "period", media: "image" },
  },
});
