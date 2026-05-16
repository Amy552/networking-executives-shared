import { defineField, defineType } from "sanity";

export const event = defineType({
  name: "event",
  title: "Event",
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
      type: "string",
      options: {
        list: [
          { title: "Lecture", value: "lecture" },
          { title: "Survivor talk", value: "survivor-talk" },
          { title: "Commemoration", value: "commemoration" },
          { title: "Film screening", value: "film" },
          { title: "Workshop", value: "workshop" },
          { title: "Family program", value: "family" },
        ],
      },
    }),
    defineField({ name: "dateTime", type: "datetime", validation: (r) => r.required() }),
    defineField({ name: "location", type: "string" }),
    defineField({ name: "summary", type: "text", rows: 2 }),
    defineField({
      name: "body",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({ name: "registrationUrl", type: "url" }),
  ],
  preview: {
    select: { title: "title", subtitle: "dateTime" },
  },
});
