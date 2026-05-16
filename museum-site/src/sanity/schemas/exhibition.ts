import { defineField, defineType } from "sanity";

export const exhibition = defineType({
  name: "exhibition",
  title: "Exhibition",
  type: "document",
  fields: [
    defineField({ name: "title", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "kind",
      title: "Type",
      type: "string",
      options: {
        list: [
          { title: "Permanent", value: "permanent" },
          { title: "Special", value: "special" },
          { title: "Traveling", value: "traveling" },
          { title: "Online", value: "online" },
          { title: "Past", value: "past" },
        ],
        layout: "radio",
      },
    }),
    defineField({ name: "startDate", type: "date" }),
    defineField({ name: "endDate", type: "date" }),
    defineField({
      name: "summary",
      type: "text",
      rows: 3,
      description: "Short description shown in listings.",
    }),
    defineField({
      name: "coverImage",
      type: "image",
      options: { hotspot: true },
      fields: [{ name: "alt", type: "string", title: "Alternative text" }],
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "array",
      of: [{ type: "block" }, { type: "image", options: { hotspot: true } }],
    }),
    defineField({
      name: "relatedArtifacts",
      type: "array",
      of: [{ type: "reference", to: [{ type: "artifact" }] }],
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "kind", media: "coverImage" },
  },
});
