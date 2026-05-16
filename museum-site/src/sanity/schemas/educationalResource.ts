import { defineField, defineType } from "sanity";

export const educationalResource = defineType({
  name: "educationalResource",
  title: "Educational resource",
  type: "document",
  fields: [
    defineField({ name: "title", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
    }),
    defineField({
      name: "audience",
      type: "string",
      options: {
        list: [
          { title: "Elementary", value: "elementary" },
          { title: "Middle school", value: "middle" },
          { title: "High school", value: "high" },
          { title: "Educators", value: "educators" },
          { title: "University", value: "university" },
          { title: "General public", value: "general" },
        ],
      },
    }),
    defineField({
      name: "format",
      type: "string",
      options: {
        list: ["Lesson plan", "Reading list", "Video", "Lecture", "Activity"],
      },
    }),
    defineField({ name: "summary", type: "text", rows: 3 }),
    defineField({
      name: "body",
      type: "array",
      of: [{ type: "block" }, { type: "image" }],
    }),
    defineField({ name: "downloadUrl", type: "url" }),
  ],
});
