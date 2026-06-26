import client from "../api/client.ts";
import type { components } from "../api/schema.d.ts";
import { priorityBadge, statusBadge } from "../components/badges.ts";
import { openConfirmModal } from "../components/modal.ts";
import { navigate } from "../navigate.ts";
import type { SubTask, Task, TaskList } from "../types.ts";
import { escapeHtml, formatDate, formatDateTime } from "../utils.ts";
import { openTaskModal } from "./listDetail.ts";

export async function renderTaskDetail(id: number): Promise<void> {
	const page = document.querySelector<HTMLElement>("#page")!;
	page.innerHTML = `<div class="flex justify-center py-12"><span class="loading loading-spinner loading-lg"></span></div>`;

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
		page.innerHTML = `<div class="alert alert-error mt-8">Tarefa não encontrada. <a href="#/lists" class="link">Voltar</a></div>`;
		return;
	}

	// SubTaskViewSet não filtra por task no servidor; filtramos no cliente.
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

	page.innerHTML = `
    <div class="py-6 max-w-2xl mx-auto flex flex-col gap-6">
      <a href="#/lists/${task.task_list}" class="btn btn-ghost btn-sm w-fit">← ${escapeHtml(listName)}</a>

      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div class="flex flex-col gap-2">
          <h1 class="text-2xl font-bold ${done ? "line-through text-base-content/50" : ""}">${escapeHtml(task.title)}</h1>
          <div class="flex gap-2 flex-wrap">
            ${statusBadge(task.status ?? "pending")}
            ${priorityBadge(task.priority ?? "medium")}
          </div>
        </div>
        <div class="flex gap-2 shrink-0">
          <button id="edit-task-btn" class="btn btn-ghost btn-sm">Editar</button>
          <button id="delete-task-btn" class="btn btn-error btn-outline btn-sm">Excluir</button>
        </div>
      </div>

      ${
				task.description
					? `<div class="card bg-base-100 border border-base-200">
            <div class="card-body p-4">
              <p class="text-base-content/80 whitespace-pre-wrap">${escapeHtml(task.description)}</p>
            </div>
          </div>`
					: ""
			}

      <div class="card bg-base-100 border border-base-200">
        <div class="card-body p-4 gap-0">
          <table class="table table-sm">
            <tbody>
              <tr><th class="text-base-content/60 font-normal w-32">Lista</th><td><a href="#/lists/${task.task_list}" class="link link-hover">${escapeHtml(listName)}</a></td></tr>
              ${task.planned_date ? `<tr><th class="text-base-content/60 font-normal">Planejada</th><td>${formatDate(task.planned_date)}</td></tr>` : ""}
              ${task.due_date ? `<tr><th class="text-base-content/60 font-normal">Prazo</th><td>${formatDate(task.due_date)}</td></tr>` : ""}
              <tr><th class="text-base-content/60 font-normal">Criada em</th><td>${formatDateTime(task.created_at)}</td></tr>
              <tr><th class="text-base-content/60 font-normal">Atualizada</th><td>${formatDateTime(task.updated_at)}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card bg-base-100 border border-base-200">
        <div class="card-body p-4 gap-3">
          <h2 class="card-title text-base">Subtarefas</h2>
          <form id="subtask-form" class="join w-full">
            <input name="title" type="text" placeholder="Nova subtarefa..." class="input input-bordered join-item flex-1" required />
            <button class="btn btn-primary join-item" type="submit">Adicionar</button>
          </form>
          ${
						sortedSubtasks.length === 0
							? `<p class="text-base-content/50 text-sm">Nenhuma subtarefa ainda.</p>`
							: `<ul class="flex flex-col gap-2">
              ${sortedSubtasks.map((s) => subtaskRow(s)).join("")}
            </ul>`
					}
        </div>
      </div>

      <div>
        ${
					done
						? `<button id="reopen-task-btn" class="btn btn-outline">Reabrir tarefa</button>`
						: `<button id="mark-done-btn" class="btn btn-success">Marcar como concluída</button>`
				}
      </div>
    </div>
  `;

	document.querySelector("#edit-task-btn")?.addEventListener("click", () => {
		openTaskModal(
			task,
			task.task_list,
			async () => renderTaskDetail(task.id),
			lists,
		);
	});

	document.querySelector("#delete-task-btn")?.addEventListener("click", () => {
		openConfirmModal(
			`Excluir a tarefa "<strong>${escapeHtml(task.title)}</strong>"?`,
			async () => {
				await client.DELETE("/api/tasks/{id}/", {
					params: { path: { id: task.id } },
				});
				navigate(`#/lists/${task.task_list}`);
			},
		);
	});

	const toggleTask = async (e: Event): Promise<void> => {
		(e.currentTarget as HTMLButtonElement).disabled = true;
		const { response } = await client.POST("/api/tasks/{id}/toggle/", {
			params: { path: { id: task.id } },
		});
		if (response.ok) renderTaskDetail(task.id);
	};

	document
		.querySelector<HTMLButtonElement>("#mark-done-btn")
		?.addEventListener("click", toggleTask);
	document
		.querySelector<HTMLButtonElement>("#reopen-task-btn")
		?.addEventListener("click", toggleTask);

	wireSubtasks(task.id);
}

function subtaskRow(s: SubTask): string {
	return `
    <li class="flex items-center justify-between gap-2 rounded-box border border-base-200 p-2 pl-3">
      <span class="text-sm ${s.done ? "line-through text-base-content/50" : ""}">${escapeHtml(s.title)}</span>
      <div class="flex gap-1 shrink-0">
        <button class="btn btn-xs ${s.done ? "btn-ghost" : "btn-success"} toggle-subtask-btn" data-id="${s.id}">${s.done ? "Desmarcar" : "Concluir"}</button>
        <button class="btn btn-xs btn-error btn-outline delete-subtask-btn" data-id="${s.id}" data-title="${escapeHtml(s.title)}">Excluir</button>
      </div>
    </li>`;
}

function wireSubtasks(taskId: number): void {
	const form = document.querySelector<HTMLFormElement>("#subtask-form");
	form?.addEventListener("submit", async (e) => {
		e.preventDefault();
		const input = form.elements.namedItem("title") as HTMLInputElement;
		const title = input.value.trim();
		if (!title) return;
		const submitBtn = form.querySelector<HTMLButtonElement>(
			"button[type=submit]",
		)!;
		submitBtn.disabled = true;
		const { response } = await client.POST("/api/subtasks/", {
			body: { task: taskId, title } as components["schemas"]["SubTask"],
		});
		if (response.ok) renderTaskDetail(taskId);
		else submitBtn.disabled = false;
	});

	document
		.querySelectorAll<HTMLButtonElement>(".toggle-subtask-btn")
		.forEach((btn) => {
			btn.addEventListener("click", async () => {
				btn.disabled = true;
				await client.POST("/api/subtasks/{id}/toggle/", {
					params: { path: { id: Number(btn.dataset.id) } },
				});
				renderTaskDetail(taskId);
			});
		});

	document
		.querySelectorAll<HTMLButtonElement>(".delete-subtask-btn")
		.forEach((btn) => {
			btn.addEventListener("click", () => {
				openConfirmModal(
					`Excluir a subtarefa "<strong>${escapeHtml(btn.dataset.title ?? "")}</strong>"?`,
					async () => {
						await client.DELETE("/api/subtasks/{id}/", {
							params: { path: { id: Number(btn.dataset.id) } },
						});
						renderTaskDetail(taskId);
					},
				);
			});
		});
}
