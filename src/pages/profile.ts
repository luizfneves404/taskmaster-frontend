import type { User } from "../api/auth.ts";
import client from "../api/client.ts";
import {
	escapeHtml,
	extractError,
	fieldValue,
	formatDateTime,
} from "../utils.ts";

export async function renderProfile(): Promise<void> {
	const page = document.querySelector<HTMLElement>("#page")!;
	page.innerHTML = `<div class="flex justify-center py-12"><span class="loading loading-spinner loading-lg"></span></div>`;

	const { data, response } = await client.GET("/api/users/me/");
	if (!response.ok || !data) {
		page.innerHTML = `<div class="alert alert-error mt-8">Erro ao carregar perfil.</div>`;
		return;
	}

	renderProfileContent(page, data);
}

function renderProfileContent(page: HTMLElement, user: User): void {
	const joined = formatDateTime(user.date_joined);

	page.innerHTML = `
    <div class="max-w-lg mx-auto py-8 flex flex-col gap-6">
      <h1 class="text-2xl font-bold">Perfil</h1>

      <div class="card bg-base-100 shadow border border-base-200">
        <div class="card-body gap-4">
          <h2 class="card-title text-base">Dados pessoais</h2>
          <div class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm mb-2">
            <span class="text-base-content/60">Usuário</span>
            <span class="font-medium">${escapeHtml(user.username)}</span>
            <span class="text-base-content/60">Membro desde</span>
            <span>${escapeHtml(joined)}</span>
          </div>
          <form id="profile-form" class="flex flex-col gap-3">
            <label class="form-control w-full">
              <div class="label"><span class="label-text">E-mail</span></div>
              <input name="email" type="email" class="input input-bordered w-full" value="${escapeHtml(user.email ?? "")}" />
            </label>
            <label class="form-control w-full">
              <div class="label"><span class="label-text">Primeiro nome</span></div>
              <input name="first_name" class="input input-bordered w-full" value="${escapeHtml(user.first_name ?? "")}" />
            </label>
            <label class="form-control w-full">
              <div class="label"><span class="label-text">Último nome</span></div>
              <input name="last_name" class="input input-bordered w-full" value="${escapeHtml(user.last_name ?? "")}" />
            </label>
            <p class="text-error text-sm min-h-[1rem]" id="profile-error"></p>
            <p class="text-success text-sm min-h-[1rem] hidden" id="profile-ok">Salvo com sucesso.</p>
            <button class="btn btn-primary" type="submit">Salvar</button>
          </form>
        </div>
      </div>

      <div class="card bg-base-100 shadow border border-base-200">
        <div class="card-body gap-4">
          <h2 class="card-title text-base">Alterar senha</h2>
          <form id="password-form" class="flex flex-col gap-3">
            <label class="form-control w-full">
              <div class="label"><span class="label-text">Senha atual</span></div>
              <input name="current_password" type="password" class="input input-bordered w-full" required autocomplete="current-password" />
            </label>
            <label class="form-control w-full">
              <div class="label"><span class="label-text">Nova senha</span></div>
              <input name="new_password" type="password" class="input input-bordered w-full" required autocomplete="new-password" />
            </label>
            <p class="text-error text-sm min-h-[1rem]" id="password-error"></p>
            <p class="text-success text-sm min-h-[1rem] hidden" id="password-ok">Senha alterada com sucesso.</p>
            <button class="btn btn-primary" type="submit">Alterar senha</button>
          </form>
        </div>
      </div>
    </div>
  `;

	wireProfileForm();
	wirePasswordForm();
}

function wireProfileForm(): void {
	const form = document.querySelector<HTMLFormElement>("#profile-form")!;
	const errorEl = document.querySelector<HTMLElement>("#profile-error")!;
	const okEl = document.querySelector<HTMLElement>("#profile-ok")!;
	const submitBtn = form.querySelector<HTMLButtonElement>(
		"button[type=submit]",
	)!;

	form.addEventListener("submit", async (e) => {
		e.preventDefault();
		errorEl.textContent = "";
		okEl.classList.add("hidden");
		submitBtn.disabled = true;

		const { response } = await client.PATCH("/api/users/me/", {
			body: {
				email: fieldValue(form, "email"),
				first_name: fieldValue(form, "first_name"),
				last_name: fieldValue(form, "last_name"),
			},
		});

		submitBtn.disabled = false;
		if (response.ok) {
			okEl.classList.remove("hidden");
		} else {
			errorEl.textContent = await extractError(
				response,
				"Erro ao salvar perfil.",
			);
		}
	});
}

function wirePasswordForm(): void {
	const form = document.querySelector<HTMLFormElement>("#password-form")!;
	const errorEl = document.querySelector<HTMLElement>("#password-error")!;
	const okEl = document.querySelector<HTMLElement>("#password-ok")!;
	const submitBtn = form.querySelector<HTMLButtonElement>(
		"button[type=submit]",
	)!;

	form.addEventListener("submit", async (e) => {
		e.preventDefault();
		errorEl.textContent = "";
		okEl.classList.add("hidden");
		submitBtn.disabled = true;

		const { response } = await client.POST("/api/users/me/change-password/", {
			body: {
				current_password: fieldValue(form, "current_password"),
				new_password: fieldValue(form, "new_password"),
			},
		});

		submitBtn.disabled = false;
		if (response.ok) {
			form.reset();
			okEl.classList.remove("hidden");
		} else {
			errorEl.textContent = await extractError(
				response,
				"Erro ao alterar senha.",
			);
		}
	});
}
