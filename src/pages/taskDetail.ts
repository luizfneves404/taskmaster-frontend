import client from "../api/client.ts";
import type { components } from "../api/schema.d.ts";
import { priorityBadge, statusBadge } from "../components/badges.ts";
import { openConfirmModal } from "../components/modal.ts";
import { navigate } from "../navigate.ts";
import type { SubTask, Task, TaskList } from "../types.ts";
import { createElement, formatDate, formatDateTime } from "../utils.ts";
import { openTaskModal } from "./listDetail.ts";

export async function renderTaskDetail(id: number): Promise<void> {
	const page = document.querySelector<HTMLElement>("#page")!;
	page.replaceChildren(
		createElement(
			"div",
			{ className: "flex justify-center py-12" },
			createElement("span", { className: "loading loading-spinner loading-lg" }),
		),
	);

	const [
		{ data: task, response },
		{ data: lists = [] },
		{ data: subtasks = [] },
	] = await Promise.all([
		client.GET("/api/tasks/{id}/", { params: { path: { id } } }),
		client.GET("/api/lists/"),
		client.GET("/api/subtasks/"),
	]);

	if (!response.ok || !task) {
		page.replaceChildren(
			createElement(
				"div",
				{ className: "alert alert-error mt-8" },
				"Tarefa não encontrada. ",
				createElement("a", {
					href: "#/lists",
					className: "link",
					textContent: "Voltar",
				}),
			),
		);
		return;
	}

	const taskSubtasks = subtasks.filter((s) => s.task === id);
	renderTaskDetailContent(task, lists, taskSubtasks);
}

function renderTaskDetailContent(
	task: Task,
	lists: TaskList[],
	subtasks: SubTask[],
): void {
	const page = document.querySelector<HTMLElement>("#page")!;
	const listName = lists.find((l) => l.id === task.task_list)?.name ?? "Lista";
	const done = task.status === "done";

	const sortedSubtasks = [...subtasks].sort((a, b) => {
		if (a.done !== b.done) return a.done ? 1 : -1;
		return a.id - b.id;
	});

	const header = createElement(
		"div",
		{
			className:
				"flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3",
		},
		createElement(
			"div",
			{ className: "flex flex-col gap-2" },
			createElement("h1", {
				className: `text-2xl font-bold ${done ? "line-through text-base-content/50" : ""}`,
				textContent: task.title,
			}),
			createElement(
				"div",
				{ className: "flex gap-2 flex-wrap" },
				statusBadge(task.status ?? "pending"),
				priorityBadge(task.priority ?? "medium"),
			),
		),
		createElement(
			"div",
			{ className: "flex gap-2 shrink-0" },
			createElement("button", {
				id: "edit-task-btn",
				className: "btn btn-ghost btn-sm",
				textContent: "Editar",
				onclick: () => {
					openTaskModal(
						task,
						task.task_list,
						async () => renderTaskDetail(task.id),
						lists,
					);
				},
			}),
			createElement("button", {
				id: "delete-task-btn",
				className: "btn btn-error btn-outline btn-sm",
				textContent: "Excluir",
				onclick: () => {
					const strong = createElement("strong", { textContent: task.title });
					openConfirmModal(
						['Excluir a tarefa "', strong, '"?'],
						async () => {
							await client.DELETE("/api/tasks/{id}/", {
								params: { path: { id: task.id } },
							});
							navigate(`#/lists/${task.task_list}`);
						},
					);
				},
			}),
		),
	);

	const descriptionEl = task.description
		? createElement(
				"div",
				{ className: "card bg-base-100 border border-base-200" },
				createElement(
					"div",
					{ className: "card-body p-4" },
					createElement("p", {
						className: "text-base-content/80 whitespace-pre-wrap",
						textContent: task.description,
					}),
				),
			)
		: null;

	const tableBody = createElement(
		"tbody",
		{},
		createElement(
			"tr",
			{},
			createElement("th", {
				className: "text-base-content/60 font-normal w-32",
				textContent: "Lista",
			}),
			createElement(
				"td",
				{},
				createElement("a", {
					href: `#/lists/${task.task_list}`,
					className: "link link-hover",
					textContent: listName,
				}),
			),
		),
		task.planned_date
			? createElement(
					"tr",
					{},
					createElement("th", {
						className: "text-base-content/60 font-normal",
						textContent: "Planejada",
					}),
					createElement("td", { textContent: formatDate(task.planned_date) }),
				)
			: null,
		task.due_date
			? createElement(
					"tr",
					{},
					createElement("th", {
						className: "text-base-content/60 font-normal",
						textContent: "Prazo",
					}),
					createElement("td", { textContent: formatDate(task.due_date) }),
				)
			: null,
		createElement(
			"tr",
			{},
			createElement("th", {
				className: "text-base-content/60 font-normal",
				textContent: "Criada em",
			}),
			createElement("td", { textContent: formatDateTime(task.created_at) }),
		),
		createElement(
			"tr",
			{},
			createElement("th", {
				className: "text-base-content/60 font-normal",
				textContent: "Atualizada",
			}),
			createElement("td", { textContent: formatDateTime(task.updated_at) }),
		),
	);

	const detailsCard = createElement(
		"div",
		{ className: "card bg-base-100 border border-base-200" },
		createElement(
			"div",
			{ className: "card-body p-4 gap-0" },
			createElement(
				"table",
				{ className: "table table-sm" },
				tableBody,
			),
		),
	);

	const subtaskForm = createElement(
		"form",
		{
			id: "subtask-form",
			className: "join w-full",
			onsubmit: async (e: Event) => {
				e.preventDefault();
				const input = subtaskForm.elements.namedItem("title") as HTMLInputElement;
				const title = input.value.trim();
				if (!title) return;
				const submitBtn = subtaskForm.querySelector<HTMLButtonElement>(
					"button[type=submit]",
				)!;
				submitBtn.disabled = true;
				const { response } = await client.POST("/api/subtasks/", {
					body: { task: task.id, title } as components["schemas"]["SubTask"],
				});
				if (response.ok) renderTaskDetail(task.id);
				else submitBtn.disabled = false;
			},
		},
		createElement("input", {
			name: "title",
			type: "text",
			placeholder: "Nova subtarefa...",
			className: "input input-bordered join-item flex-1",
			required: true,
		}),
		createElement("button", {
			className: "btn btn-primary join-item",
			type: "submit",
			textContent: "Adicionar",
		}),
	);

	const subtaskListContainer = createElement("div", {
		className: "card bg-base-100 border border-base-200",
	});
	const subtaskListBody = createElement(
		"div",
		{ className: "card-body p-4 gap-3" },
		createElement("h2", {
			className: "card-title text-base",
			textContent: "Subtarefas",
		}),
		subtaskForm,
	);

	if (sortedSubtasks.length === 0) {
		subtaskListBody.append(
			createElement("p", {
				className: "text-base-content/50 text-sm",
				textContent: "Nenhuma subtarefa ainda.",
			}),
		);
	} else {
		const ul = createElement("ul", { className: "flex flex-col gap-2" });
		sortedSubtasks.forEach((s) => {
			ul.append(
				subtaskRow(
					s,
					async () => {
						await client.POST("/api/subtasks/{id}/toggle/", {
							params: { path: { id: s.id } },
						});
						renderTaskDetail(task.id);
					},
					() => {
						const strong = createElement("strong", { textContent: s.title });
						openConfirmModal(
							['Excluir a subtarefa "', strong, '"?'],
							async () => {
								await client.DELETE("/api/subtasks/{id}/", {
									params: { path: { id: s.id } },
								});
								renderTaskDetail(task.id);
							},
						);
					},
				),
			);
		});
		subtaskListBody.append(ul);
	}
	subtaskListContainer.append(subtaskListBody);

	const toggleTask = async (e: Event): Promise<void> => {
		(e.currentTarget as HTMLButtonElement).disabled = true;
		const { response } = await client.POST("/api/tasks/{id}/toggle/", {
			params: { path: { id: task.id } },
		});
		if (response.ok) renderTaskDetail(task.id);
	};

	const footerBtn = done
		? createElement("button", {
				id: "reopen-task-btn",
				className: "btn btn-outline",
				textContent: "Reabrir tarefa",
				onclick: toggleTask,
			})
		: createElement("button", {
				id: "mark-done-btn",
				className: "btn btn-success",
				textContent: "Marcar como concluída",
				onclick: toggleTask,
			});

	const container = createElement(
		"div",
		{ className: "py-6 max-w-2xl mx-auto flex flex-col gap-6" },
		createElement("a", {
			href: `#/lists/${task.task_list}`,
			className: "btn btn-ghost btn-sm w-fit",
			textContent: `← ${listName}`,
		}),
		header,
		descriptionEl,
		detailsCard,
		subtaskListContainer,
		createElement("div", {}, footerBtn),
	);

	page.replaceChildren(container);
}

function subtaskRow(
	s: SubTask,
	onToggle: () => void,
	onDelete: () => void,
): HTMLElement {
	const done = s.done;
	return createElement(
		"li",
		{
			className:
				"flex items-center justify-between gap-2 rounded-box border border-base-200 p-2 pl-3",
		},
		createElement("span", {
			className: `text-sm ${done ? "line-through text-base-content/50" : ""}`,
			textContent: s.title,
		}),
		createElement(
			"div",
			{ className: "flex gap-1 shrink-0" },
			createElement("button", {
				className: `btn btn-xs ${done ? "btn-ghost" : "btn-success"}`,
				textContent: done ? "Desmarcar" : "Concluir",
				onclick: (e: Event) => {
					(e.currentTarget as HTMLButtonElement).disabled = true;
					onToggle();
				},
			}),
			createElement("button", {
				className: "btn btn-xs btn-error btn-outline",
				textContent: "Excluir",
				onclick: () => {
					onDelete();
				},
			}),
		),
	);
}
