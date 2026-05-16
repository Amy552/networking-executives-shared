import { groq } from "next-sanity";

export const exhibitionsQuery = groq`
  *[_type == "exhibition" && !(_id in path("drafts.**"))] | order(startDate desc) {
    _id,
    title,
    "slug": slug.current,
    summary,
    kind,
    startDate,
    endDate,
    "coverImage": coverImage.asset->url
  }
`;

export const exhibitionBySlugQuery = groq`
  *[_type == "exhibition" && slug.current == $slug][0]{
    _id,
    title,
    summary,
    kind,
    startDate,
    endDate,
    coverImage,
    body,
    "relatedArtifacts": *[_type == "artifact" && references(^._id)]{
      _id, title, "slug": slug.current, image
    }
  }
`;

export const artifactsQuery = groq`
  *[_type == "artifact" && !(_id in path("drafts.**"))] | order(title asc) {
    _id,
    title,
    "slug": slug.current,
    medium,
    period,
    "image": image.asset->url
  }
`;

export const artifactBySlugQuery = groq`
  *[_type == "artifact" && slug.current == $slug][0]{
    _id,
    title,
    description,
    medium,
    period,
    origin,
    image,
    creditLine,
    accessionNumber
  }
`;

export const testimoniesQuery = groq`
  *[_type == "testimony" && !(_id in path("drafts.**"))] | order(recordedAt desc) {
    _id,
    "slug": slug.current,
    name,
    yearOfBirth,
    placeOfBirth,
    summary,
    "portrait": portrait.asset->url
  }
`;

export const testimonyBySlugQuery = groq`
  *[_type == "testimony" && slug.current == $slug][0]{
    _id,
    name,
    yearOfBirth,
    placeOfBirth,
    summary,
    portrait,
    recordedAt,
    transcript,
    audioUrl,
    videoUrl
  }
`;

export const upcomingEventsQuery = groq`
  *[_type == "event" && dateTime >= now()] | order(dateTime asc) {
    _id,
    title,
    "slug": slug.current,
    dateTime,
    location,
    kind,
    summary
  }
`;

export const eventBySlugQuery = groq`
  *[_type == "event" && slug.current == $slug][0]{
    _id, title, dateTime, location, kind, summary, body, registrationUrl
  }
`;

export const newsQuery = groq`
  *[_type == "newsPost" && !(_id in path("drafts.**"))] | order(publishedAt desc) {
    _id, title, "slug": slug.current, publishedAt, excerpt,
    "coverImage": coverImage.asset->url
  }
`;

export const newsBySlugQuery = groq`
  *[_type == "newsPost" && slug.current == $slug][0]{
    _id, title, publishedAt, excerpt, coverImage, body, author
  }
`;
