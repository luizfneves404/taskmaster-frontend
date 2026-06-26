import client from "./client.ts";

export type ConnectionStatus =
	| { state: "connected"; httpStatus: number }
	| { state: "reachable-unauthenticated"; httpStatus: number }
	| { state: "unreachable"; detail: string };

/**
 * Validação de conexão com o backend.
 *
 * Chama um endpoint real da API através do client tipado. Como `/api/lists/`
 * exige autenticação, sem token ele responde 401 — o que já prova que o
 * servidor está acessível e o CORS está liberado. Apenas falhas de rede/CORS
 * lançam exceção (fetch rejeitado).
 */
export async function checkConnection(): Promise<ConnectionStatus> {
	try {
		const { response } = await client.GET("/api/lists/");

		if (response.status === 401 || response.status === 403) {
			return {
				state: "reachable-unauthenticated",
				httpStatus: response.status,
			};
		}

		return { state: "connected", httpStatus: response.status };
	} catch (err) {
		return {
			state: "unreachable",
			detail: err instanceof Error ? err.message : String(err),
		};
	}
}
