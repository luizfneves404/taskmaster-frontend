import { confirmPasswordReset, requestPasswordReset } from "../api/auth.ts";
import { fieldValue } from "../utils.ts";

export function renderResetPassword(
	uid: string | null,
	token: string | null,
): void {
	const page = document.querySelector<HTMLElement>("#page")!;

	if (uid && token) {
		renderConfirmForm(page, uid, token);
	} else {
		renderRequestForm(page);
	}
}

function renderRequestForm(page: HTMLElement): void {
	page.innerHTML = `
    <div class="flex flex-col items-center justify-center min-h-[80vh]">
      <div class="card bg-base-100 shadow-xl w-full max-w-sm">
        <div class="card-body gap-4">
          <h2 class="card-title text-xl">Redefinir senha</h2>
          <p class="text-base-content/60 text-sm">Informe seu e-mail e enviaremos um link para redefinir sua senha.</p>
          <form id="reset-request-form" class="flex flex-col gap-3">
            <label class="form-control w-full">
              <div class="label"><span class="label-text">E-mail</span></div>
              <input name="email" type="email" class="input input-bordered w-full" required />
            </label>
            <p class="text-error text-sm min-h-[1rem]" id="reset-error"></p>
            <button class="btn btn-primary w-full" type="submit">Enviar</button>
          </form>
          <div class="text-center text-sm">
            <a href="#/auth" class="link link-primary">Voltar ao login</a>
          </div>
        </div>
      </div>
    </div>
  `;

	const form = document.querySelector<HTMLFormElement>("#reset-request-form")!;
	const errorEl = document.querySelector<HTMLElement>("#reset-error")!;
	const submitBtn = form.querySelector<HTMLButtonElement>(
		"button[type=submit]",
	)!;

	form.addEventListener("submit", async (e) => {
		e.preventDefault();
		errorEl.textContent = "";
		submitBtn.disabled = true;
		const result = await requestPasswordReset(fieldValue(form, "email"));
		submitBtn.disabled = false;
		if (result.ok) {
			page.innerHTML = `
        <div class="flex flex-col items-center justify-center min-h-[80vh]">
          <div class="card bg-base-100 shadow-xl w-full max-w-sm">
            <div class="card-body gap-4 text-center">
              <div class="text-5xl">✉️</div>
              <h2 class="card-title text-xl justify-center">Verifique seu e-mail</h2>
              <p class="text-base-content/60 text-sm">Se existe uma conta com esse endereço, você receberá um e-mail com o link de redefinição.</p>
              <a href="#/auth" class="btn btn-primary w-full mt-2">Voltar ao login</a>
            </div>
          </div>
        </div>
      `;
		} else {
			errorEl.textContent = result.error;
		}
	});
}

function renderConfirmForm(
	page: HTMLElement,
	uid: string,
	token: string,
): void {
	page.innerHTML = `
    <div class="flex flex-col items-center justify-center min-h-[80vh]">
      <div class="card bg-base-100 shadow-xl w-full max-w-sm">
        <div class="card-body gap-4">
          <h2 class="card-title text-xl">Nova senha</h2>
          <form id="reset-confirm-form" class="flex flex-col gap-3">
            <label class="form-control w-full">
              <div class="label"><span class="label-text">Nova senha</span></div>
              <input name="new_password" type="password" class="input input-bordered w-full" required autocomplete="new-password" />
            </label>
            <p class="text-error text-sm min-h-[1rem]" id="reset-confirm-error"></p>
            <button class="btn btn-primary w-full" type="submit">Salvar</button>
          </form>
        </div>
      </div>
    </div>
  `;

	const form = document.querySelector<HTMLFormElement>("#reset-confirm-form")!;
	const errorEl = document.querySelector<HTMLElement>("#reset-confirm-error")!;
	const submitBtn = form.querySelector<HTMLButtonElement>(
		"button[type=submit]",
	)!;

	form.addEventListener("submit", async (e) => {
		e.preventDefault();
		errorEl.textContent = "";
		submitBtn.disabled = true;
		const result = await confirmPasswordReset(
			uid,
			token,
			fieldValue(form, "new_password"),
		);
		submitBtn.disabled = false;
		if (result.ok) {
			page.innerHTML = `
        <div class="flex flex-col items-center justify-center min-h-[80vh]">
          <div class="card bg-base-100 shadow-xl w-full max-w-sm">
            <div class="card-body gap-4 text-center">
              <div class="text-5xl">✅</div>
              <h2 class="card-title text-xl justify-center">Senha redefinida!</h2>
              <p class="text-base-content/60 text-sm">Sua senha foi alterada com sucesso.</p>
              <a href="#/auth" class="btn btn-primary w-full mt-2">Fazer login</a>
            </div>
          </div>
        </div>
      `;
		} else {
			errorEl.textContent = result.error;
		}
	});
}
