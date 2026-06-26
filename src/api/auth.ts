import type { components } from "./schema.d.ts";

export type User = components["schemas"]["User"];

export const baseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const ACCESS_KEY = "tm_access";
const REFRESH_KEY = "tm_refresh";

/** Resultado discriminado para as chamadas de auth, facilitando o render de erros na UI. */
export type Result<T = void> =
	| { ok: true; data: T }
	| { ok: false; error: string };

// --- Token store (localStorage) ---------------------------------------------

export function getAccessToken(): string | null {
	return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
	return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(access: string, refresh: string): void {
	localStorage.setItem(ACCESS_KEY, access);
	localStorage.setItem(REFRESH_KEY, refresh);
}

function setAccessToken(access: string): void {
	localStorage.setItem(ACCESS_KEY, access);
}

export function clearTokens(): void {
	localStorage.removeItem(ACCESS_KEY);
	localStorage.removeItem(REFRESH_KEY);
}

export function isAuthenticated(): boolean {
	return getAccessToken() !== null;
}

// --- Helpers ----------------------------------------------------------------

/** Achata um corpo de erro do DRF ({detail} ou {campo: [msgs]}) em uma mensagem legível. */
function messageFromErrorBody(body: unknown, fallback: string): string {
	if (body && typeof body === "object") {
		const obj = body as Record<string, unknown>;
		if (typeof obj.detail === "string") return obj.detail;
		const parts: string[] = [];
		for (const [field, value] of Object.entries(obj)) {
			const text = Array.isArray(value) ? value.join(" ") : String(value);
			parts.push(field === "non_field_errors" ? text : `${field}: ${text}`);
		}
		if (parts.length > 0) return parts.join(" — ");
	}
	return fallback;
}

async function readBody(response: Response): Promise<unknown> {
	try {
		return await response.json();
	} catch {
		return null;
	}
}

/**
 * POST direto via fetch (sem o client tipado / middleware). Usado nos endpoints de
 * auth porque (a) o token/refresh/register marcam campos como readOnly — o que torna
 * o body do client tipado inconveniente — e (b) precisamos ficar fora do fluxo de
 * refresh do middleware para evitar recursão.
 */
async function postJson(path: string, payload: unknown): Promise<Response> {
	return fetch(`${baseUrl}${path}`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	});
}

// --- Auth API ---------------------------------------------------------------

export async function login(
	username: string,
	password: string,
): Promise<Result> {
	let response: Response;
	try {
		response = await postJson("/api/token/", { username, password });
	} catch (err) {
		return { ok: false, error: networkError(err) };
	}

	const body = await readBody(response);
	if (!response.ok) {
		return {
			ok: false,
			error: messageFromErrorBody(body, "Usuário ou senha inválidos."),
		};
	}

	const { access, refresh } = body as { access?: string; refresh?: string };
	if (!access || !refresh) {
		return { ok: false, error: "Resposta de login inválida do servidor." };
	}
	setTokens(access, refresh);
	return { ok: true, data: undefined };
}

export async function register(
	username: string,
	email: string,
	password: string,
): Promise<Result> {
	let response: Response;
	try {
		response = await postJson("/api/auth/register/", {
			username,
			email,
			password,
		});
	} catch (err) {
		return { ok: false, error: networkError(err) };
	}

	if (!response.ok) {
		const body = await readBody(response);
		return {
			ok: false,
			error: messageFromErrorBody(body, "Não foi possível criar a conta."),
		};
	}

	// Cadastro OK → autentica automaticamente para fechar o loop já logado.
	return login(username, password);
}

/**
 * Renova o access token usando o refresh armazenado. Em caso de falha, limpa os
 * tokens (sessão expirada). Usa fetch direto para não recair no próprio middleware.
 */
export async function refreshAccessToken(): Promise<boolean> {
	const refresh = getRefreshToken();
	if (!refresh) return false;

	let response: Response;
	try {
		response = await postJson("/api/token/refresh/", { refresh });
	} catch {
		return false;
	}

	if (!response.ok) {
		clearTokens();
		return false;
	}

	const body = (await readBody(response)) as { access?: string };
	if (!body.access) {
		clearTokens();
		return false;
	}
	setAccessToken(body.access);
	return true;
}

/** Invalida o refresh token no backend (blacklist) e limpa o store localmente. */
export async function logout(): Promise<void> {
	const refresh = getRefreshToken();
	const access = getAccessToken();
	if (refresh && access) {
		try {
			await fetch(`${baseUrl}/api/auth/logout/`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${access}`,
				},
				body: JSON.stringify({ refresh }),
			});
		} catch {
			// Ignora falhas de rede: a sessão local é encerrada de qualquer forma.
		}
	}
	clearTokens();
}

function networkError(err: unknown): string {
	const detail = err instanceof Error ? err.message : String(err);
	return `Não foi possível conectar ao backend (${detail}).`;
}
