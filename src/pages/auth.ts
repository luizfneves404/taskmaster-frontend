import { login, register } from "../api/auth.ts";
import { navigate } from "../navigate.ts";
import { createElement, fieldValue } from "../utils.ts";

function setSubmitting(form: HTMLFormElement, submitting: boolean): void {
	form.querySelector<HTMLButtonElement>("button[type=submit]")!.disabled =
		submitting;
}

export function renderAuth(): void {
	const page = document.querySelector<HTMLElement>("#page")!;
	page.replaceChildren();

	const tabLogin = createElement("button", {
		id: "tab-login",
		role: "tab",
		type: "button",
		className: "tab tab-active",
		textContent: "Entrar",
	});

	const tabRegister = createElement("button", {
		id: "tab-register",
		role: "tab",
		type: "button",
		className: "tab",
		textContent: "Criar conta",
	});

	const loginError = createElement("p", {
		id: "login-error",
		className: "text-error text-sm min-h-[1rem]",
	});

	const loginForm = createElement(
		"form",
		{
			id: "login-form",
			className: "flex flex-col gap-3",
			onsubmit: async (e: Event) => {
				e.preventDefault();
				loginError.textContent = "";
				setSubmitting(loginForm, true);
				const result = await login(
					fieldValue(loginForm, "username"),
					fieldValue(loginForm, "password"),
				);
				setSubmitting(loginForm, false);
				if (result.ok) {
					navigate("#/");
				} else {
					loginError.textContent = result.error;
				}
			},
		},
		createElement(
			"label",
			{ className: "form-control w-full" },
			createElement(
				"div",
				{ className: "label" },
				createElement("span", { className: "label-text", textContent: "Usuário" }),
			),
			createElement("input", {
				name: "username",
				className: "input input-bordered w-full",
				autocomplete: "username",
				required: true,
			}),
		),
		createElement(
			"label",
			{ className: "form-control w-full" },
			createElement(
				"div",
				{ className: "label" },
				createElement("span", { className: "label-text", textContent: "Senha" }),
			),
			createElement("input", {
				name: "password",
				type: "password",
				className: "input input-bordered w-full",
				autocomplete: "current-password",
				required: true,
			}),
		),
		loginError,
		createElement("button", {
			className: "btn btn-primary w-full",
			type: "submit",
			textContent: "Entrar",
		}),
		createElement(
			"div",
			{ className: "text-center text-sm" },
			createElement("a", {
				href: "#/reset-password",
				className: "link link-primary",
				textContent: "Esqueci minha senha",
			}),
		),
	);

	const registerError = createElement("p", {
		id: "register-error",
		className: "text-error text-sm min-h-[1rem]",
	});

	const registerForm = createElement(
		"form",
		{
			id: "register-form",
			className: "flex flex-col gap-3 hidden",
			onsubmit: async (e: Event) => {
				e.preventDefault();
				registerError.textContent = "";
				setSubmitting(registerForm, true);
				const result = await register(
					fieldValue(registerForm, "username"),
					fieldValue(registerForm, "email"),
					fieldValue(registerForm, "password"),
				);
				setSubmitting(registerForm, false);
				if (result.ok) {
					navigate("#/");
				} else {
					registerError.textContent = result.error;
				}
			},
		},
		createElement(
			"label",
			{ className: "form-control w-full" },
			createElement(
				"div",
				{ className: "label" },
				createElement("span", { className: "label-text", textContent: "Usuário" }),
			),
			createElement("input", {
				name: "username",
				className: "input input-bordered w-full",
				autocomplete: "username",
				required: true,
			}),
		),
		createElement(
			"label",
			{ className: "form-control w-full" },
			createElement(
				"div",
				{ className: "label" },
				createElement("span", { className: "label-text", textContent: "E-mail" }),
			),
			createElement("input", {
				name: "email",
				type: "email",
				className: "input input-bordered w-full",
				autocomplete: "email",
				required: true,
			}),
		),
		createElement(
			"label",
			{ className: "form-control w-full" },
			createElement(
				"div",
				{ className: "label" },
				createElement("span", { className: "label-text", textContent: "Senha" }),
			),
			createElement("input", {
				name: "password",
				type: "password",
				className: "input input-bordered w-full",
				autocomplete: "new-password",
				required: true,
			}),
		),
		registerError,
		createElement("button", {
			className: "btn btn-primary w-full",
			type: "submit",
			textContent: "Criar conta e entrar",
		}),
	);

	const select = (loginActive: boolean): void => {
		tabLogin.classList.toggle("tab-active", loginActive);
		tabRegister.classList.toggle("tab-active", !loginActive);
		loginForm.classList.toggle("hidden", !loginActive);
		registerForm.classList.toggle("hidden", loginActive);
	};

	tabLogin.addEventListener("click", () => select(true));
	tabRegister.addEventListener("click", () => select(false));

	const container = createElement(
		"div",
		{ className: "flex flex-col items-center justify-center min-h-[80vh] py-8" },
		createElement(
			"div",
			{ className: "card bg-base-100 shadow-xl w-full max-w-sm" },
			createElement(
				"div",
				{ className: "card-body gap-4" },
				createElement(
					"div",
					{ className: "text-center mb-2" },
					createElement("h1", {
						className: "text-3xl font-bold tracking-tight",
						textContent: "Taskmaster",
					}),
					createElement("p", {
						className: "text-base-content/60 text-sm mt-1",
						textContent: "Gerencie suas tarefas",
					}),
				),
				createElement(
					"div",
					{ role: "tablist", className: "tabs tabs-boxed" },
					tabLogin,
					tabRegister,
				),
				loginForm,
				registerForm,
			),
		),
	);

	page.append(container);
}
