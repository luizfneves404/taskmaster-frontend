import createClient from "openapi-fetch";
import type { paths } from "./schema.d.ts";

const client = createClient<paths>({ baseUrl: "http://localhost:8000" });

export default client;
