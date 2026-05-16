import type { SchemaTypeDefinition } from "sanity";
import { exhibition } from "./exhibition";
import { artifact } from "./artifact";
import { testimony } from "./testimony";
import { event } from "./event";
import { educationalResource } from "./educationalResource";
import { newsPost } from "./newsPost";
import { page } from "./page";

export const schemaTypes: SchemaTypeDefinition[] = [
  exhibition,
  artifact,
  testimony,
  event,
  educationalResource,
  newsPost,
  page,
];
