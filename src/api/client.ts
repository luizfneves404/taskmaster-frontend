import createClient, { type Middleware } from "openapi-fetch";
import {
	baseUrl,
	getAccessToken,
	getRefreshToken,
	refreshAccessToken,
} from "./auth.ts";
import type { paths } from "./schema.d.ts";

const client = createClient<paths>({ baseUrl });

// Endpoints públicos de auth: nunca enviam Bearer nem disparam refresh.
const AUTH_PATHS = [
	"/api/token/",
	"/api/token/refresh/",
	"/api/auth/register/",
	"/api/auth/password-reset/",
];

function isAuthPath(schemaPath: string): boolean {
	return AUTH_PATHS.some((path) => schemaPath.startsWith(path));
}

const authMiddleware: Middleware = {
	onRequest({ request, schemaPath }) {
		if (isAuthPath(schemaPath)) return undefined;
		const access = getAccessToken();
		if (access) request.headers.set("Authorization", `Bearer ${access}`);
		return request;
	},

	async onResponse({ request, response, schemaPath }) {
		// Tenta um único refresh quando o access expira (401) em rota protegida.
		if (
			response.status !== 401 ||
			isAuthPath(schemaPath) ||
			!getRefreshToken()
		) {
			return undefined;
		}

		const refreshed = await refreshAccessToken();
		if (!refreshed) return undefined;

		const retry = request.clone();
		retry.headers.set("Authorization", `Bearer ${getAccessToken()}`);
		return fetch(retry);
	},
};

client.use(authMiddleware);

export default client;
