import { createElement } from "../utils.ts";

export function priorityBadge(priority: string): HTMLElement {
	const map: Record<string, string> = {
		low: "badge-success",
		medium: "badge-warning",
		high: "badge-error",
	};
	const label: Record<string, string> = {
		low: "Baixa",
		medium: "Média",
		high: "Alta",
	};
	const cls = map[priority] ?? "badge-neutral";
	return createElement("span", {
		className: `badge ${cls} badge-sm`,
		textContent: label[priority] ?? priority,
	});
}

export function statusBadge(status: string): HTMLElement {
	const map: Record<string, string> = {
		pending: "badge-neutral",
		in_progress: "badge-info",
		done: "badge-success",
	};
	const label: Record<string, string> = {
		pending: "Pendente",
		in_progress: "Em andamento",
		done: "Concluída",
	};
	const cls = map[status] ?? "badge-neutral";
	return createElement("span", {
		className: `badge ${cls} badge-sm`,
		textContent: label[status] ?? status,
	});
}

export function priorityBorder(priority: string): string {
	const map: Record<string, string> = {
		low: "border-l-success",
		medium: "border-l-warning",
		high: "border-l-error",
	};
	return map[priority] ?? "border-l-neutral";
}
