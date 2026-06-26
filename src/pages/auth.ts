import { login, register } from "../api/auth.ts";
import { navigate } from "../navigate.ts";
import { fieldValue } from "../utils.ts";

function setSubmitting(form: HTMLFormElement, submitting: boolean): void {
	form.querySelector<HTMLButtonElement>("button[type=submit]")!.disabled =
		submitting;
}

export function renderAuth(): void {
	const page = document.querySelector<HTMLElement>("#page")!;
	page.innerHTML = `
    <div class="flex flex-col items-center justify-center min-h-[80vh] py-8">
      <div class="card bg-base-100 shadow-xl w-full max-w-sm">
        <div class="card-body gap-4">
          <div class="text-center mb-2">
            <h1 class="text-3xl font-bold tracking-tight">Taskmaster</h1>
            <p class="text-base-content/60 text-sm mt-1">Gerencie suas tarefas</p>
          </div>

          <div role="tablist" class="tabs tabs-boxed">
            <button id="tab-login" role="tab" type="button" class="tab tab-active">Entrar</button>
            <button id="tab-register" role="tab" type="button" class="tab">Criar conta</button>
          </div>

          <form id="login-form" class="flex flex-col gap-3">
            <label class="form-control w-full">
              <div class="label"><span class="label-text">Usuário</span></div>
              <input name="username" class="input input-bordered w-full" autocomplete="username" required />
            </label>
            <label class="form-control w-full">
              <div class="label"><span class="label-text">Senha</span></div>
              <input name="password" type="password" class="input input-bordered w-full" autocomplete="current-password" required />
            </label>
            <p class="text-error text-sm min-h-[1rem]" id="login-error"></p>
            <button class="btn btn-primary w-full" type="submit">Entrar</button>
            <div class="text-center text-sm">
              <a href="#/reset-password" class="link link-primary">Esqueci minha senha</a>
            </div>
          </form>

          <form id="register-form" class="flex flex-col gap-3 hidden">
            <label class="form-control w-full">
              <div class="label"><span class="label-text">Usuário</span></div>
              <input name="username" class="input input-bordered w-full" autocomplete="username" required />
            </label>
            <label class="form-control w-full">
              <div class="label"><span class="label-text">E-mail</span></div>
              <input name="email" type="email" class="input input-bordered w-full" autocomplete="email" required />
            </label>
            <label class="form-control w-full">
              <div class="label"><span class="label-text">Senha</span></div>
              <input name="password" type="password" class="input input-bordered w-full" autocomplete="new-password" required />
            </label>
            <p class="text-error text-sm min-h-[1rem]" id="register-error"></p>
            <button class="btn btn-primary w-full" type="submit">Criar conta e entrar</button>
          </form>
        </div>
      </div>
    </div>
  `;

	wireTabs();
	wireLoginForm();
	wireRegisterForm();
}

function wireTabs(): void {
	const tabLogin = document.querySelector<HTMLButtonElement>("#tab-login")!;
	const tabRegister =
		document.querySelector<HTMLButtonElement>("#tab-register")!;
	const loginForm = document.querySelector<HTMLFormElement>("#login-form")!;
	const registerForm =
		document.querySelector<HTMLFormElement>("#register-form")!;

	const select = (loginActive: boolean): void => {
		tabLogin.classList.toggle("tab-active", loginActive);
		tabRegister.classList.toggle("tab-active", !loginActive);
		loginForm.classList.toggle("hidden", !loginActive);
		registerForm.classList.toggle("hidden", loginActive);
	};

	tabLogin.addEventListener("click", () => select(true));
	tabRegister.addEventListener("click", () => select(false));
}

function wireLoginForm(): void {
	const form = document.querySelector<HTMLFormElement>("#login-form")!;
	const errorEl = document.querySelector<HTMLParagraphElement>("#login-error")!;

	form.addEventListener("submit", async (e) => {
		e.preventDefault();
		errorEl.textContent = "";
		setSubmitting(form, true);
		const result = await login(
			fieldValue(form, "username"),
			fieldValue(form, "password"),
		);
		setSubmitting(form, false);
		if (result.ok) {
			navigate("#/");
		} else {
			errorEl.textContent = result.error;
		}
	});
}

function wireRegisterForm(): void {
	const form = document.querySelector<HTMLFormElement>("#register-form")!;
	const errorEl =
		document.querySelector<HTMLParagraphElement>("#register-error")!;

	form.addEventListener("submit", async (e) => {
		e.preventDefault();
		errorEl.textContent = "";
		setSubmitting(form, true);
		const result = await register(
			fieldValue(form, "username"),
			fieldValue(form, "email"),
			fieldValue(form, "password"),
		);
		setSubmitting(form, false);
		if (result.ok) {
			navigate("#/");
		} else {
			errorEl.textContent = result.error;
		}
	});
}
