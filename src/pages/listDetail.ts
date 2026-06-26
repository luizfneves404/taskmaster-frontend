import client from "../api/client.ts";
import type { components } from "../api/schema.d.ts";
import {
	priorityBadge,
	priorityBorder,
	statusBadge,
} from "../components/badges.ts";
import {
	closeFormModal,
	openConfirmModal,
	openFormModal,
	setFormModalError,
} from "../components/modal.ts";
import { navigate } from "../navigate.ts";
import type { Task, TaskList } from "../types.ts";
import { createElement, extractError, fieldValue, formatDate } from "../utils.ts";

export async function renderListDetail(id: number): Promise<void> {
	const page = document.querySelector<HTMLElement>("#page")!;
	page.replaceChildren(
		createElement(
			"div",
			{ className: "flex justify-center py-12" },
			createElement("span", { className: "loading loading-spinner loading-lg" }),
		),
	);

	const [{ data: list, response }, { data: tasks = [] }] = await Promise.all([
		client.GET("/api/lists/{id}/", { params: { path: { id } } }),
		client.GET("/api/tasks/"),
	]);

	if (!response.ok || !list) {
		page.replaceChildren(
			createElement(
				"div",
				{ className: "alert alert-error mt-8" },
				"Lista não encontrada. ",
				createElement("a", {
					href: "#/lists",
					className: "link",
					textContent: "Voltar",
				}),
			),
		);
		return;
	}

	const listTasks = tasks.filter((t) => t.task_list === id);
	renderListDetailContent(list, listTasks);
}

function renderListDetailContent(list: TaskList, tasks: Task[]): void {
	const page = document.querySelector<HTMLElement>("#page")!;
	const color = list.color ?? "#e5e7eb";

	const sorted = [...tasks].sort((a, b) => {
		const statusOrder: Record<string, number> = {
			pending: 0,
			in_progress: 1,
			done: 2,
		};
		const sa = statusOrder[a.status ?? "pending"] ?? 0;
		const sb = statusOrder[b.status ?? "pending"] ?? 0;
		if (sa !== sb) return sa - sb;
		return a.title.localeCompare(b.title);
	});

	const header = createElement(
		"div",
		{
			className:
				"flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3",
		},
		createElement(
			"div",
			{ className: "flex items-center gap-3" },
			createElement("span", {
				className: "w-4 h-4 rounded-full shrink-0",
				style: `background: ${color}`,
			}),
			createElement(
				"div",
				{},
				createElement("h1", {
					className: "text-2xl font-bold",
					textContent: list.name,
				}),
				list.description
					? createElement("p", {
							className: "text-base-content/60 text-sm mt-0.5",
							textContent: list.description,
						})
					: null,
			),
		),
		createElement(
			"div",
			{ className: "flex gap-2 shrink-0" },
			createElement("button", {
				id: "new-task-btn",
				className: "btn btn-primary btn-sm",
				textContent: "+ Nova tarefa",
				onclick: () => {
					openTaskModal(null, list.id, async () => renderListDetail(list.id));
				},
			}),
			createElement("button", {
				id: "edit-list-btn",
				className: "btn btn-ghost btn-sm",
				textContent: "Editar",
				onclick: () => {
					openListEditModal(list, async () => renderListDetail(list.id));
				},
			}),
			createElement("button", {
				id: "delete-list-btn",
				className: "btn btn-error btn-outline btn-sm",
				textContent: "Excluir",
				onclick: () => {
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
							navigate("#/lists");
						},
					);
				},
			}),
		),
	);

	let tasksContent: HTMLElement;
	if (sorted.length === 0) {
		tasksContent = createElement(
			"div",
			{ className: "text-center py-16 text-base-content/50" },
			createElement("p", {
				className: "text-lg",
				textContent: "Nenhuma tarefa nesta lista.",
			}),
			createElement("p", {
				className: "text-sm mt-1",
				textContent: "Crie sua primeira tarefa.",
			}),
		);
	} else {
		const grid = createElement("div", {
			className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4",
		});
		sorted.forEach((t) => {
			const card = taskCard(
				t,
				() =>
					openTaskModal(t, list.id, async () => renderListDetail(list.id)),
				() => {
					const strong = createElement("strong", { textContent: t.title });
					openConfirmModal(
						['Excluir a tarefa "', strong, '"?'],
						async () => {
							await client.DELETE("/api/tasks/{id}/", {
								params: { path: { id: t.id } },
							});
							renderListDetail(list.id);
						},
					);
				},
				async () => {
					await client.POST("/api/tasks/{id}/toggle/", {
						params: { path: { id: t.id } },
					});
					renderListDetail(list.id);
				},
			);
			grid.append(card);
		});
		tasksContent = grid;
	}

	const container = createElement(
		"div",
		{ className: "py-6 flex flex-col gap-6" },
		createElement(
			"a",
			{
				href: "#/lists",
				className: "btn btn-ghost btn-sm w-fit",
				textContent: "← Listas",
			},
		),
		header,
		createElement("div", {
			className: "text-sm text-base-content/60",
			textContent: `${tasks.length} tarefa${tasks.length !== 1 ? "s" : ""}`,
		}),
		tasksContent,
	);

	page.replaceChildren(container);
}

function taskCard(
	t: Task,
	onEdit: () => void,
	onDelete: () => void,
	onToggle: () => void,
): HTMLElement {
	const border = priorityBorder(t.priority ?? "medium");
	const done = t.status === "done";

	const card = createElement(
		"a",
		{
			href: `#/tasks/${t.id}`,
			className: `card bg-base-100 border border-base-200 shadow-sm hover:shadow-md transition-shadow border-l-4 ${border} block ${done ? "opacity-60" : ""}`,
		},
		createElement(
			"div",
			{ className: "card-body p-4 gap-2" },
			createElement(
				"div",
				{ className: "flex items-start justify-between gap-2" },
				createElement("span", {
					className: `font-medium leading-snug ${done ? "line-through" : ""}`,
					textContent: t.title,
				}),
				statusBadge(t.status ?? "pending"),
			),
			createElement(
				"div",
				{ className: "flex gap-1 flex-wrap" },
				priorityBadge(t.priority ?? "medium"),
			),
			t.description
				? createElement("p", {
						className: "text-base-content/60 text-xs line-clamp-2",
						textContent: t.description,
					})
				: null,
			t.planned_date || t.due_date
				? createElement(
						"p",
						{ className: "text-xs text-base-content/50" },
						t.planned_date ? `Planejada: ${formatDate(t.planned_date)}` : "",
						t.planned_date && t.due_date ? " · " : "",
						t.due_date ? `Prazo: ${formatDate(t.due_date)}` : "",
					)
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
					textContent: "Excluir",
					onclick: (e: Event) => {
						e.preventDefault();
						onDelete();
					},
				}),
				createElement("button", {
					className: `btn btn-xs ${done ? "btn-ghost" : "btn-success"}`,
					textContent: done ? "Reabrir" : "Concluir",
					onclick: (e: Event) => {
						e.preventDefault();
						onToggle();
					},
				}),
			),
		),
	);
	return card;
}

function openListEditModal(list: TaskList, onSaved: () => Promise<void>): void {
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
				value: list.name,
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
				value: list.description ?? "",
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
				value: list.color ?? "#6366f1",
			}),
		),
	);

	openFormModal({
		title: "Editar lista",
		submitLabel: "Salvar",
		body,
		onSubmit: async (form) => {
			const { response } = await client.PATCH("/api/lists/{id}/", {
				params: { path: { id: list.id } },
				body: {
					name: fieldValue(form, "name"),
					description: (
						form.elements.namedItem("description") as HTMLTextAreaElement
					).value.trim(),
					color: (form.elements.namedItem("color") as HTMLInputElement).value,
				},
			});
			if (!response.ok) {
				setFormModalError(
					await extractError(response, "Erro ao salvar lista."),
				);
				return;
			}
			closeFormModal();
			await onSaved();
		},
	});
}

export function openTaskModal(
	existing: Task | null,
	defaultListId: number,
	onSaved: () => Promise<void>,
	lists?: TaskList[],
): void {
	let listSelectEl: HTMLElement;
	if (lists && lists.length > 0) {
		const select = createElement("select", {
			name: "task_list",
			className: "select select-bordered w-full",
		});
		lists.forEach((l) => {
			const option = createElement("option", {
				value: String(l.id),
				selected: (existing?.task_list ?? defaultListId) === l.id,
				textContent: l.name,
			});
			select.append(option);
		});
		listSelectEl = createElement(
			"label",
			{ className: "form-control w-full" },
			createElement(
				"div",
				{ className: "label" },
				createElement("span", { className: "label-text", textContent: "Lista" }),
			),
			select,
		);
	} else {
		listSelectEl = createElement("input", {
			type: "hidden",
			name: "task_list",
			value: String(defaultListId),
		});
	}

	const body = createElement(
		"div",
		{ className: "flex flex-col gap-3" },
		listSelectEl,
		createElement(
			"label",
			{ className: "form-control w-full" },
			createElement(
				"div",
				{ className: "label" },
				createElement("span", { className: "label-text", textContent: "Título" }),
			),
			createElement("input", {
				name: "title",
				className: "input input-bordered w-full",
				required: true,
				value: existing?.title ?? "",
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
			"div",
			{ className: "grid grid-cols-2 gap-3" },
			createElement(
				"label",
				{ className: "form-control w-full" },
				createElement(
					"div",
					{ className: "label" },
					createElement("span", {
						className: "label-text",
						textContent: "Prioridade",
					}),
				),
				createElement(
					"select",
					{ name: "priority", className: "select select-bordered w-full" },
					createElement("option", {
						value: "low",
						selected: existing?.priority === "low",
						textContent: "Baixa",
					}),
					createElement("option", {
						value: "medium",
						selected: !existing || existing?.priority === "medium",
						textContent: "Média",
					}),
					createElement("option", {
						value: "high",
						selected: existing?.priority === "high",
						textContent: "Alta",
					}),
				),
			),
			createElement(
				"label",
				{ className: "form-control w-full" },
				createElement(
					"div",
					{ className: "label" },
					createElement("span", {
						className: "label-text",
						textContent: "Status",
					}),
				),
				createElement(
					"select",
					{ name: "status", className: "select select-bordered w-full" },
					createElement("option", {
						value: "pending",
						selected: !existing || existing?.status === "pending",
						textContent: "Pendente",
					}),
					createElement("option", {
						value: "in_progress",
						selected: existing?.status === "in_progress",
						textContent: "Em andamento",
					}),
					createElement("option", {
						value: "done",
						selected: existing?.status === "done",
						textContent: "Concluída",
					}),
				),
			),
		),
		createElement(
			"div",
			{ className: "grid grid-cols-2 gap-3" },
			createElement(
				"label",
				{ className: "form-control w-full" },
				createElement(
					"div",
					{ className: "label" },
					createElement("span", {
						className: "label-text",
						textContent: "Planejada para",
					}),
				),
				createElement("input", {
					name: "planned_date",
					type: "date",
					className: "input input-bordered w-full",
					value: existing?.planned_date ?? "",
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
						textContent: "Prazo",
					}),
				),
				createElement("input", {
					name: "due_date",
					type: "date",
					className: "input input-bordered w-full",
					value: existing?.due_date ?? "",
				}),
			),
		),
	);

	openFormModal({
		title: existing ? "Editar tarefa" : "Nova tarefa",
		submitLabel: existing ? "Salvar" : "Criar",
		body,
		onSubmit: async (form) => {
			const title = fieldValue(form, "title");
			if (!title) {
				setFormModalError("O título é obrigatório.");
				return;
			}
			const body = {
				task_list: Number(
					(
						form.elements.namedItem("task_list") as
							| HTMLInputElement
							| HTMLSelectElement
					).value,
				),
				title,
				description: (
					form.elements.namedItem("description") as HTMLTextAreaElement
				).value.trim(),
				priority: fieldValue(form, "priority") as Task["priority"],
				status: fieldValue(form, "status") as Task["status"],
				due_date: fieldValue(form, "due_date") || null,
				planned_date: fieldValue(form, "planned_date") || null,
			};

			if (existing) {
				const { response } = await client.PATCH("/api/tasks/{id}/", {
					params: { path: { id: existing.id } },
					body,
				});
				if (!response.ok) {
					setFormModalError(
						await extractError(response, "Erro ao salvar tarefa."),
					);
					return;
				}
			} else {
				const { response } = await client.POST("/api/tasks/", {
					body: body as components["schemas"]["Task"],
				});
				if (!response.ok) {
					setFormModalError(
						await extractError(response, "Erro ao criar tarefa."),
					);
					return;
				}
			}

			closeFormModal();
			await onSaved();
		},
	});
}
