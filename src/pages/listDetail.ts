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
import { escapeHtml, extractError, fieldValue, formatDate } from "../utils.ts";

export async function renderListDetail(id: number): Promise<void> {
	const page = document.querySelector<HTMLElement>("#page")!;
	page.innerHTML = `<div class="flex justify-center py-12"><span class="loading loading-spinner loading-lg"></span></div>`;

	const [{ data: list, response }, { data: tasks = [] }] = await Promise.all([
		client.GET("/api/lists/{id}/", { params: { path: { id } } }),
		client.GET("/api/tasks/"),
	]);

	if (!response.ok || !list) {
		page.innerHTML = `<div class="alert alert-error mt-8">Lista não encontrada. <a href="#/lists" class="link">Voltar</a></div>`;
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

	page.innerHTML = `
    <div class="py-6 flex flex-col gap-6">
      <a href="#/lists" class="btn btn-ghost btn-sm w-fit">← Listas</a>

      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div class="flex items-center gap-3">
          <span class="w-4 h-4 rounded-full shrink-0" style="background: ${escapeHtml(color)}"></span>
          <div>
            <h1 class="text-2xl font-bold">${escapeHtml(list.name)}</h1>
            ${list.description ? `<p class="text-base-content/60 text-sm mt-0.5">${escapeHtml(list.description)}</p>` : ""}
          </div>
        </div>
        <div class="flex gap-2 shrink-0">
          <button id="new-task-btn" class="btn btn-primary btn-sm">+ Nova tarefa</button>
          <button id="edit-list-btn" class="btn btn-ghost btn-sm">Editar</button>
          <button id="delete-list-btn" class="btn btn-error btn-outline btn-sm">Excluir</button>
        </div>
      </div>

      <div class="text-sm text-base-content/60">${tasks.length} tarefa${tasks.length !== 1 ? "s" : ""}</div>

      ${
				sorted.length === 0
					? `<div class="text-center py-16 text-base-content/50">
            <p class="text-lg">Nenhuma tarefa nesta lista.</p>
            <p class="text-sm mt-1">Crie sua primeira tarefa.</p>
          </div>`
					: `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            ${sorted.map((t) => taskCard(t)).join("")}
          </div>`
			}
    </div>
  `;

	document.querySelector("#new-task-btn")!.addEventListener("click", () => {
		openTaskModal(null, list.id, async () => renderListDetail(list.id));
	});

	document.querySelector("#edit-list-btn")!.addEventListener("click", () => {
		openListEditModal(list, async () => renderListDetail(list.id));
	});

	document.querySelector("#delete-list-btn")!.addEventListener("click", () => {
		openConfirmModal(
			`Excluir a lista "<strong>${escapeHtml(list.name)}</strong>"? Todas as tarefas serão removidas.`,
			async () => {
				await client.DELETE("/api/lists/{id}/", {
					params: { path: { id: list.id } },
				});
				navigate("#/lists");
			},
		);
	});

	document
		.querySelectorAll<HTMLButtonElement>(".edit-task-btn")
		.forEach((btn) => {
			btn.addEventListener("click", (e) => {
				e.preventDefault();
				const id = Number(btn.dataset.id);
				const task = tasks.find((t) => t.id === id);
				if (task)
					openTaskModal(task, list.id, async () => renderListDetail(list.id));
			});
		});

	document
		.querySelectorAll<HTMLButtonElement>(".delete-task-btn")
		.forEach((btn) => {
			btn.addEventListener("click", (e) => {
				e.preventDefault();
				const id = Number(btn.dataset.id);
				const task = tasks.find((t) => t.id === id);
				openConfirmModal(
					`Excluir a tarefa "<strong>${escapeHtml(task?.title ?? "")}</strong>"?`,
					async () => {
						await client.DELETE("/api/tasks/{id}/", {
							params: { path: { id } },
						});
						renderListDetail(list.id);
					},
				);
			});
		});

	document
		.querySelectorAll<HTMLButtonElement>(".mark-done-btn")
		.forEach((btn) => {
			btn.addEventListener("click", async (e) => {
				e.preventDefault();
				btn.disabled = true;
				await client.PATCH("/api/tasks/{id}/", {
					params: { path: { id: Number(btn.dataset.id) } },
					body: { status: "done" },
				});
				renderListDetail(list.id);
			});
		});
}

function taskCard(t: Task): string {
	const border = priorityBorder(t.priority ?? "medium");
	const done = t.status === "done";
	return `
    <a href="#/tasks/${t.id}" class="card bg-base-100 border border-base-200 shadow-sm hover:shadow-md transition-shadow border-l-4 ${border} block ${done ? "opacity-60" : ""}">
      <div class="card-body p-4 gap-2">
        <div class="flex items-start justify-between gap-2">
          <span class="font-medium leading-snug ${done ? "line-through" : ""}">${escapeHtml(t.title)}</span>
          ${statusBadge(t.status ?? "pending")}
        </div>
        <div class="flex gap-1 flex-wrap">
          ${priorityBadge(t.priority ?? "medium")}
        </div>
        ${t.description ? `<p class="text-base-content/60 text-xs line-clamp-2">${escapeHtml(t.description)}</p>` : ""}
        ${
					t.planned_date || t.due_date
						? `<p class="text-xs text-base-content/50">
            ${t.planned_date ? `Planejada: ${formatDate(t.planned_date)}` : ""}
            ${t.planned_date && t.due_date ? " · " : ""}
            ${t.due_date ? `Prazo: ${formatDate(t.due_date)}` : ""}
          </p>`
						: ""
				}
        <div class="flex gap-2 mt-1" onclick="event.preventDefault()">
          <button class="btn btn-xs btn-ghost edit-task-btn" data-id="${t.id}">Editar</button>
          <button class="btn btn-xs btn-error btn-outline delete-task-btn" data-id="${t.id}">Excluir</button>
          ${!done ? `<button class="btn btn-xs btn-success mark-done-btn" data-id="${t.id}">Concluir</button>` : ""}
        </div>
      </div>
    </a>
  `;
}

function openListEditModal(list: TaskList, onSaved: () => Promise<void>): void {
	openFormModal({
		title: "Editar lista",
		submitLabel: "Salvar",
		bodyHtml: `
      <div class="flex flex-col gap-3">
        <label class="form-control w-full">
          <div class="label"><span class="label-text">Nome</span></div>
          <input name="name" class="input input-bordered w-full" required value="${escapeHtml(list.name)}" />
        </label>
        <label class="form-control w-full">
          <div class="label"><span class="label-text">Descrição</span></div>
          <textarea name="description" class="textarea textarea-bordered w-full" rows="2">${escapeHtml(list.description ?? "")}</textarea>
        </label>
        <label class="form-control w-full">
          <div class="label"><span class="label-text">Cor</span></div>
          <input name="color" type="color" class="input input-bordered h-12 w-full" value="${escapeHtml(list.color ?? "#6366f1")}" />
        </label>
      </div>
    `,
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
	const listSelectHtml =
		lists && lists.length > 0
			? `<label class="form-control w-full">
        <div class="label"><span class="label-text">Lista</span></div>
        <select name="task_list" class="select select-bordered w-full">
          ${lists
						.map(
							(l) =>
								`<option value="${l.id}" ${(existing?.task_list ?? defaultListId) === l.id ? "selected" : ""}>${escapeHtml(l.name)}</option>`,
						)
						.join("")}
        </select>
      </label>`
			: `<input type="hidden" name="task_list" value="${defaultListId}" />`;

	openFormModal({
		title: existing ? "Editar tarefa" : "Nova tarefa",
		submitLabel: existing ? "Salvar" : "Criar",
		bodyHtml: `
      <div class="flex flex-col gap-3">
        ${listSelectHtml}
        <label class="form-control w-full">
          <div class="label"><span class="label-text">Título</span></div>
          <input name="title" class="input input-bordered w-full" required value="${escapeHtml(existing?.title ?? "")}" />
        </label>
        <label class="form-control w-full">
          <div class="label"><span class="label-text">Descrição</span></div>
          <textarea name="description" class="textarea textarea-bordered w-full" rows="2">${escapeHtml(existing?.description ?? "")}</textarea>
        </label>
        <div class="grid grid-cols-2 gap-3">
          <label class="form-control w-full">
            <div class="label"><span class="label-text">Prioridade</span></div>
            <select name="priority" class="select select-bordered w-full">
              <option value="low" ${existing?.priority === "low" ? "selected" : ""}>Baixa</option>
              <option value="medium" ${!existing || existing?.priority === "medium" ? "selected" : ""}>Média</option>
              <option value="high" ${existing?.priority === "high" ? "selected" : ""}>Alta</option>
            </select>
          </label>
          <label class="form-control w-full">
            <div class="label"><span class="label-text">Status</span></div>
            <select name="status" class="select select-bordered w-full">
              <option value="pending" ${!existing || existing?.status === "pending" ? "selected" : ""}>Pendente</option>
              <option value="in_progress" ${existing?.status === "in_progress" ? "selected" : ""}>Em andamento</option>
              <option value="done" ${existing?.status === "done" ? "selected" : ""}>Concluída</option>
            </select>
          </label>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <label class="form-control w-full">
            <div class="label"><span class="label-text">Planejada para</span></div>
            <input name="planned_date" type="date" class="input input-bordered w-full" value="${existing?.planned_date ?? ""}" />
          </label>
          <label class="form-control w-full">
            <div class="label"><span class="label-text">Prazo</span></div>
            <input name="due_date" type="date" class="input input-bordered w-full" value="${existing?.due_date ?? ""}" />
          </label>
        </div>
      </div>
    `,
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
