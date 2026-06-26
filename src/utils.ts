export const escapeHtml = (value: string): string =>
	value.replace(
		/[&<>"']/g,
		(c) =>
			({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
				c
			]!,
	);

export function messageFromError(body: unknown, fallback: string): string {
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

export function today(): string {
	return new Date().toISOString().slice(0, 10);
}

export function startOfWeek(): string {
	const d = new Date();
	d.setDate(d.getDate() - d.getDay());
	d.setHours(0, 0, 0, 0);
	return d.toISOString();
}

export function formatDate(iso: string | null | undefined): string {
	if (!iso) return "—";
	return new Date(iso).toLocaleDateString("pt-BR");
}

export function formatDateTime(iso: string): string {
	return new Date(iso).toLocaleString("pt-BR");
}

export function fieldValue(form: HTMLFormElement, name: string): string {
	return (form.elements.namedItem(name) as HTMLInputElement).value.trim();
}

export async function extractError(
	response: Response,
	fallback: string,
): Promise<string> {
	let body: unknown;
	try {
		body = await response.clone().json();
	} catch {
		body = null;
	}
	return messageFromError(body, fallback);
}
