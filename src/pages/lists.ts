import client from "../api/client.ts";
import type { components } from "../api/schema.d.ts";
import {
	closeFormModal,
	openConfirmModal,
	openFormModal,
	setFormModalError,
} from "../components/modal.ts";
import type { TaskList } from "../types.ts";
import { escapeHtml, extractError, fieldValue } from "../utils.ts";

export async function renderLists(): Promise<void> {
	const page = document.querySelector<HTMLElement>("#page")!;
	page.innerHTML = `<div class="flex justify-center py-12"><span class="loading loading-spinner loading-lg"></span></div>`;

	const { data: lists = [] } = await client.GET("/api/lists/");

	renderListsContent(lists);
}

function renderListsContent(lists: TaskList[]): void {
	const page = document.querySelector<HTMLElement>("#page")!;

	page.innerHTML = `
    <div class="py-6 flex flex-col gap-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">Minhas listas</h1>
        <button id="new-list-btn" class="btn btn-primary btn-sm">+ Nova lista</button>
      </div>

      ${
				lists.length === 0
					? `<div class="text-center py-16 text-base-content/50">
            <p class="text-lg">Nenhuma lista ainda.</p>
            <p class="text-sm mt-1">Crie sua primeira lista para organizar suas tarefas.</p>
          </div>`
					: `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          ${lists.map((list) => listCard(list)).join("")}
        </div>`
			}
    </div>
  `;

	document.querySelector("#new-list-btn")!.addEventListener("click", () => {
		openListModal(null, async () => renderLists());
	});

	document
		.querySelectorAll<HTMLButtonElement>(".edit-list-btn")
		.forEach((btn) => {
			btn.addEventListener("click", (e) => {
				e.preventDefault();
				const id = Number(btn.dataset.id);
				const list = lists.find((l) => l.id === id);
				if (list) openListModal(list, async () => renderLists());
			});
		});

	document
		.querySelectorAll<HTMLButtonElement>(".delete-list-btn")
		.forEach((btn) => {
			btn.addEventListener("click", (e) => {
				e.preventDefault();
				const id = Number(btn.dataset.id);
				const list = lists.find((l) => l.id === id);
				openConfirmModal(
					`Excluir a lista "<strong>${escapeHtml(list?.name ?? "")}</strong>"? Todas as tarefas serão removidas.`,
					async () => {
						await client.DELETE("/api/lists/{id}/", {
							params: { path: { id } },
						});
						renderLists();
					},
				);
			});
		});
}

function listCard(list: TaskList): string {
	const color = list.color ?? "#e5e7eb";
	const pending = list.pending_count ?? 0;
	return `
    <a href="#/lists/${list.id}" class="card bg-base-100 border border-base-200 shadow-sm hover:shadow-md transition-shadow border-l-4 block" style="border-left-color: ${escapeHtml(color)}">
      <div class="card-body p-4 gap-2">
        <div class="flex items-start justify-between gap-2">
          <div class="flex items-center gap-2 min-w-0">
            <span class="w-3 h-3 rounded-full shrink-0" style="background: ${escapeHtml(color)}"></span>
            <span class="font-semibold truncate">${escapeHtml(list.name)}</span>
          </div>
          <span class="badge badge-ghost badge-sm shrink-0">${pending} pendente${pending !== 1 ? "s" : ""}</span>
        </div>
        ${list.description ? `<p class="text-base-content/60 text-sm line-clamp-2">${escapeHtml(list.description)}</p>` : ""}
        <div class="flex gap-2 mt-1" onclick="event.preventDefault()">
          <button class="btn btn-xs btn-ghost edit-list-btn" data-id="${list.id}">Editar</button>
          <button class="btn btn-xs btn-error btn-outline delete-list-btn" data-id="${list.id}">Apagar</button>
        </div>
      </div>
    </a>
  `;
}

function openListModal(
	existing: TaskList | null,
	onSaved: () => Promise<void>,
): void {
	openFormModal({
		title: existing ? "Editar lista" : "Nova lista",
		submitLabel: existing ? "Salvar" : "Criar",
		bodyHtml: `
      <div class="flex flex-col gap-3">
        <label class="form-control w-full">
          <div class="label"><span class="label-text">Nome</span></div>
          <input name="name" class="input input-bordered w-full" required value="${escapeHtml(existing?.name ?? "")}" />
        </label>
        <label class="form-control w-full">
          <div class="label"><span class="label-text">Descrição</span></div>
          <textarea name="description" class="textarea textarea-bordered w-full" rows="2">${escapeHtml(existing?.description ?? "")}</textarea>
        </label>
        <label class="form-control w-full">
          <div class="label"><span class="label-text">Cor</span></div>
          <input name="color" type="color" class="input input-bordered h-12 w-full" value="${escapeHtml(existing?.color ?? "#6366f1")}" />
        </label>
      </div>
    `,
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
