import client from "../api/client.ts";
import type { components } from "../api/schema.d.ts";
import {
	closeFormModal,
	openConfirmModal,
	openFormModal,
	setFormModalError,
} from "../components/modal.ts";
import type { TaskList } from "../types.ts";
import { createElement, extractError, fieldValue } from "../utils.ts";

export async function renderLists(): Promise<void> {
	const page = document.querySelector<HTMLElement>("#page")!;
	page.replaceChildren(
		createElement(
			"div",
			{ className: "flex justify-center py-12" },
			createElement("span", { className: "loading loading-spinner loading-lg" }),
		),
	);

	const { data: lists = [] } = await client.GET("/api/lists/");

	renderListsContent(lists);
}

function renderListsContent(lists: TaskList[]): void {
	const page = document.querySelector<HTMLElement>("#page")!;

	const header = createElement(
		"div",
		{ className: "flex items-center justify-between" },
		createElement("h1", {
			className: "text-2xl font-bold",
			textContent: "Minhas listas",
		}),
		createElement("button", {
			id: "new-list-btn",
			className: "btn btn-primary btn-sm",
			textContent: "+ Nova lista",
			onclick: () => {
				openListModal(null, async () => renderLists());
			},
		}),
	);

	let content: HTMLElement;
	if (lists.length === 0) {
		content = createElement(
			"div",
			{ className: "text-center py-16 text-base-content/50" },
			createElement("p", {
				className: "text-lg",
				textContent: "Nenhuma lista ainda.",
			}),
			createElement("p", {
				className: "text-sm mt-1",
				textContent: "Crie sua primeira lista para organizar suas tarefas.",
			}),
		);
	} else {
		const grid = createElement("div", {
			className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4",
		});
		lists.forEach((list) => {
			const card = listCard(
				list,
				() => openListModal(list, async () => renderLists()),
				() => {
					const strong = createElement("strong", { textContent: list.name });
					openConfirmModal(
						[
							'Excluir a lista "',
							strong,
							'"? Todas as tarefas serão removidas.',
						],
						async () => {
							await client.DELETE("/api/lists/{id}/", {
								params: { path: { id: list.id } },
							});
							renderLists();
						},
					);
				},
			);
			grid.append(card);
		});
		content = grid;
	}

	const container = createElement(
		"div",
		{ className: "py-6 flex flex-col gap-6" },
		header,
		content,
	);

	page.replaceChildren(container);
}

function listCard(
	list: TaskList,
	onEdit: () => void,
	onDelete: () => void,
): HTMLElement {
	const color = list.color ?? "#e5e7eb";
	const pending = list.pending_count ?? 0;

	return createElement(
		"a",
		{
			href: `#/lists/${list.id}`,
			className:
				"card bg-base-100 border border-base-200 shadow-sm hover:shadow-md transition-shadow border-l-4 block",
			style: `border-left-color: ${color}`,
		},
		createElement(
			"div",
			{ className: "card-body p-4 gap-2" },
			createElement(
				"div",
				{ className: "flex items-start justify-between gap-2" },
				createElement(
					"div",
					{ className: "flex items-center gap-2 min-w-0" },
					createElement("span", {
						className: "w-3 h-3 rounded-full shrink-0",
						style: `background: ${color}`,
					}),
					createElement("span", {
						className: "font-semibold truncate",
						textContent: list.name,
					}),
				),
				createElement("span", {
					className: "badge badge-ghost badge-sm shrink-0",
					textContent: `${pending} pendente${pending !== 1 ? "s" : ""}`,
				}),
			),
			list.description
				? createElement("p", {
						className: "text-base-content/60 text-sm line-clamp-2",
						textContent: list.description,
					})
				: null,
			createElement(
				"div",
				{
					className: "flex gap-2 mt-1",
					onclick: (e: Event) => {
						e.preventDefault();
					},
				},
				createElement("button", {
					className: "btn btn-xs btn-ghost",
					textContent: "Editar",
					onclick: (e: Event) => {
						e.preventDefault();
						onEdit();
					},
				}),
				createElement("button", {
					className: "btn btn-xs btn-error btn-outline",
					textContent: "Apagar",
					onclick: (e: Event) => {
						e.preventDefault();
						onDelete();
					},
				}),
			),
		),
	);
}

function openListModal(
	existing: TaskList | null,
	onSaved: () => Promise<void>,
): void {
	const body = createElement(
		"div",
		{ className: "flex flex-col gap-3" },
		createElement(
			"label",
			{ className: "form-control w-full" },
			createElement(
				"div",
				{ className: "label" },
				createElement("span", { className: "label-text", textContent: "Nome" }),
			),
			createElement("input", {
				name: "name",
				className: "input input-bordered w-full",
				required: true,
				value: existing?.name ?? "",
			}),
		),
		createElement(
			"label",
			{ className: "form-control w-full" },
			createElement(
				"div",
				{ className: "label" },
				createElement("span", {
					className: "label-text",
					textContent: "Descrição",
				}),
			),
			createElement("textarea", {
				name: "description",
				className: "textarea textarea-bordered w-full",
				rows: 2,
				value: existing?.description ?? "",
			}),
		),
		createElement(
			"label",
			{ className: "form-control w-full" },
			createElement(
				"div",
				{ className: "label" },
				createElement("span", { className: "label-text", textContent: "Cor" }),
			),
			createElement("input", {
				name: "color",
				type: "color",
				className: "input input-bordered h-12 w-full",
				value: existing?.color ?? "#6366f1",
			}),
		),
	);

	openFormModal({
		title: existing ? "Editar lista" : "Nova lista",
		submitLabel: existing ? "Salvar" : "Criar",
		body,
		onSubmit: async (form) => {
			const name = fieldValue(form, "name");
			if (!name) {
				setFormModalError("O nome é obrigatório.");
				return;
			}
			const body = {
				name,
				description: (
					form.elements.namedItem("description") as HTMLTextAreaElement
				).value.trim(),
				color: (form.elements.namedItem("color") as HTMLInputElement).value,
			};

			if (existing) {
				const { response } = await client.PATCH("/api/lists/{id}/", {
					params: { path: { id: existing.id } },
					body,
				});
				if (!response.ok) {
					setFormModalError(
						await extractError(response, "Erro ao salvar lista."),
					);
					return;
				}
			} else {
				const { response } = await client.POST("/api/lists/", {
					body: body as components["schemas"]["TaskList"],
				});
				if (!response.ok) {
					setFormModalError(
						await extractError(response, "Erro ao criar lista."),
					);
					return;
				}
			}

			closeFormModal();
			await onSaved();
		},
	});
}
