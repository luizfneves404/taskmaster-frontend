import client from "../api/client.ts";
import { priorityBadge, statusBadge } from "../components/badges.ts";
import type { Task, TaskList } from "../types.ts";
import { escapeHtml, formatDate, formatDateTime } from "../utils.ts";

export async function renderHome(): Promise<void> {
	const page = document.querySelector<HTMLElement>("#page")!;
	page.innerHTML = `<div class="flex justify-center py-12"><span class="loading loading-spinner loading-lg"></span></div>`;

	const [
		{ data: user },
		{ data: lists = [] },
		{ data: summary },
		{ data: upcoming = [] },
		{ data: late = [] },
		{ data: completed = [] },
	] = await Promise.all([
		client.GET("/api/users/me/"),
		client.GET("/api/lists/"),
		client.GET("/api/dashboard/summary/"),
		client.GET("/api/dashboard/upcoming/"),
		client.GET("/api/tasks/late/"),
		client.GET("/api/tasks/completed/"),
	]);

	if (!user) {
		page.innerHTML = `<div class="alert alert-error mt-8">Sessão expirada. <a href="#/auth" class="link">Entrar</a></div>`;
		return;
	}

	const listMap = new Map<number, TaskList>(lists.map((l) => [l.id, l]));
	const stats = summary ?? {
		pending: 0,
		overdue: 0,
		today: 0,
		completed_week: 0,
	};

	page.innerHTML = `
    <div class="py-6 flex flex-col gap-8">
      <div>
        <h1 class="text-2xl font-bold">Olá, ${escapeHtml(user.username)}.</h1>
        <p class="text-base-content/60 text-sm mt-1">Aqui está o resumo das suas tarefas.</p>
      </div>

      <div class="stats stats-vertical sm:stats-horizontal shadow w-full border border-base-200">
        <div class="stat">
          <div class="stat-title">Pendentes</div>
          <div class="stat-value text-primary">${stats.pending}</div>
        </div>
        <div class="stat">
          <div class="stat-title">Atrasadas</div>
          <div class="stat-value text-error">${stats.overdue}</div>
        </div>
        <div class="stat">
          <div class="stat-title">Para hoje</div>
          <div class="stat-value text-warning">${stats.today}</div>
        </div>
        <div class="stat">
          <div class="stat-title">Concluídas na semana</div>
          <div class="stat-value text-success">${stats.completed_week}</div>
        </div>
      </div>

      <div>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">Minhas listas</h2>
          <a href="#/lists" class="btn btn-sm btn-ghost">Ver todas →</a>
        </div>
        ${
					lists.length === 0
						? `<div class="text-base-content/50 text-sm">Nenhuma lista ainda. <a href="#/lists" class="link link-primary">Criar lista</a></div>`
						: `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            ${lists
							.slice(0, 6)
							.map((list) => {
								const pending = list.pending_count ?? 0;
								return `
                <a href="#/lists/${list.id}" class="card bg-base-100 border border-base-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer border-l-4" style="border-left-color: ${escapeHtml(list.color ?? "#e5e7eb")}">
                  <div class="card-body p-4 gap-1">
                    <div class="flex items-center justify-between">
                      <span class="font-semibold truncate">${escapeHtml(list.name)}</span>
                      <span class="badge badge-ghost badge-sm shrink-0 ml-2">${pending} pendente${pending !== 1 ? "s" : ""}</span>
                    </div>
                    ${list.description ? `<p class="text-base-content/60 text-xs truncate">${escapeHtml(list.description)}</p>` : ""}
                  </div>
                </a>`;
							})
							.join("")}
          </div>`
				}
      </div>

      ${
				late.length > 0
					? `
        <div>
          <h2 class="text-lg font-semibold mb-3">Tarefas atrasadas</h2>
          <div class="overflow-x-auto">
            <table class="table table-sm bg-base-100 border border-base-200 rounded-box">
              <thead>
                <tr><th>Tarefa</th><th>Lista</th><th>Prazo</th></tr>
              </thead>
              <tbody>
                ${late
									.slice(0, 5)
									.map(
										(t) => `
                  <tr>
                    <td><a href="#/tasks/${t.id}" class="link link-hover">${escapeHtml(t.title)}</a></td>
                    <td class="text-base-content/60">${escapeHtml(listMap.get(t.task_list)?.name ?? "—")}</td>
                    <td class="text-error">${formatDate(t.due_date)}</td>
                  </tr>`,
									)
									.join("")}
              </tbody>
            </table>
          </div>
        </div>`
					: ""
			}

      ${
				upcoming.length > 0
					? `
        <div>
          <h2 class="text-lg font-semibold mb-3">Próximas tarefas</h2>
          <div class="overflow-x-auto">
            <table class="table table-sm bg-base-100 border border-base-200 rounded-box">
              <thead>
                <tr><th>Tarefa</th><th>Lista</th><th>Prioridade</th><th>Prazo</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                ${upcoming.map((t) => upcomingRow(t, listMap)).join("")}
              </tbody>
            </table>
          </div>
        </div>`
					: ""
			}

      ${
				completed.length > 0
					? `
        <div>
          <h2 class="text-lg font-semibold mb-3">Tarefas concluídas</h2>
          <div class="overflow-x-auto">
            <table class="table table-sm bg-base-100 border border-base-200 rounded-box">
              <thead>
                <tr><th>Tarefa</th><th>Lista</th><th>Atualizada</th></tr>
              </thead>
              <tbody>
                ${completed
									.slice(0, 5)
									.map(
										(t) => `
                  <tr>
                    <td><a href="#/tasks/${t.id}" class="link link-hover">${escapeHtml(t.title)}</a></td>
                    <td class="text-base-content/60">${escapeHtml(listMap.get(t.task_list)?.name ?? "—")}</td>
                    <td class="text-base-content/60">${formatDateTime(t.updated_at)}</td>
                  </tr>`,
									)
									.join("")}
              </tbody>
            </table>
          </div>
        </div>`
					: ""
			}
    </div>
  `;

	wireMarkDone();
}

function upcomingRow(t: Task, listMap: Map<number, TaskList>): string {
	return `
    <tr data-task-id="${t.id}">
      <td><a href="#/tasks/${t.id}" class="link link-hover">${escapeHtml(t.title)}</a></td>
      <td class="text-base-content/60">${escapeHtml(listMap.get(t.task_list)?.name ?? "—")}</td>
      <td>${priorityBadge(t.priority ?? "medium")}</td>
      <td>${formatDate(t.due_date)}</td>
      <td>${statusBadge(t.status ?? "pending")}</td>
      <td>
        ${
					t.status !== "done"
						? `<button class="btn btn-xs btn-success mark-done-btn" data-id="${t.id}">Concluir</button>`
						: ""
				}
      </td>
    </tr>`;
}

function wireMarkDone(): void {
	document
		.querySelectorAll<HTMLButtonElement>(".mark-done-btn")
		.forEach((btn) => {
			btn.addEventListener("click", async () => {
				const id = Number(btn.dataset.id);
				btn.disabled = true;
				await client.POST("/api/tasks/{id}/toggle/", {
					params: { path: { id } },
				});
				renderHome();
			});
		});
}
