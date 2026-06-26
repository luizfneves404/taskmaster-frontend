import client from "../api/client.ts";
import { priorityBadge, statusBadge } from "../components/badges.ts";
import { openConfirmModal } from "../components/modal.ts";
import { navigate } from "../navigate.ts";
import type { Task, TaskList } from "../types.ts";
import { escapeHtml, formatDate, formatDateTime } from "../utils.ts";
import { openTaskModal } from "./listDetail.ts";

export async function renderTaskDetail(id: number): Promise<void> {
	const page = document.querySelector<HTMLElement>("#page")!;
	page.innerHTML = `<div class="flex justify-center py-12"><span class="loading loading-spinner loading-lg"></span></div>`;

	const [{ data: task, response }, { data: lists = [] }] = await Promise.all([
		client.GET("/api/tasks/{id}/", { params: { path: { id } } }),
		client.GET("/api/lists/"),
	]);

	if (!response.ok || !task) {
		page.innerHTML = `<div class="alert alert-error mt-8">Tarefa não encontrada. <a href="#/lists" class="link">Voltar</a></div>`;
		return;
	}

	renderTaskDetailContent(task, lists);
}

function renderTaskDetailContent(task: Task, lists: TaskList[]): void {
	const page = document.querySelector<HTMLElement>("#page")!;
	const listName = lists.find((l) => l.id === task.task_list)?.name ?? "Lista";
	const done = task.status === "done";

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

      <div>
        ${
					done
						? `<span class="badge badge-success badge-lg">Concluída</span>`
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

	document
		.querySelector<HTMLButtonElement>("#mark-done-btn")
		?.addEventListener("click", async (e) => {
			(e.currentTarget as HTMLButtonElement).disabled = true;
			const { response } = await client.PATCH("/api/tasks/{id}/", {
				params: { path: { id: task.id } },
				body: { status: "done" },
			});
			if (response.ok) renderTaskDetail(task.id);
		});
}
