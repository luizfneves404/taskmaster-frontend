import createClient from "openapi-fetch";
import type { paths } from "./schema.d.ts";

const client = createClient<paths>({
	baseUrl: import.meta.env.VITE_API_URL ?? "http://localhost:8000",
});

export default client;
