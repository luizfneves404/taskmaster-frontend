import { confirmPasswordReset, requestPasswordReset } from "../api/auth.ts";
import { createElement, fieldValue } from "../utils.ts";

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
	const errorEl = createElement("p", {
		id: "reset-error",
		className: "text-error text-sm min-h-[1rem]",
	});

	const submitBtn = createElement("button", {
		className: "btn btn-primary w-full",
		type: "submit",
		textContent: "Enviar",
	});

	const form = createElement(
		"form",
		{
			id: "reset-request-form",
			className: "flex flex-col gap-3",
			onsubmit: async (e: Event) => {
				e.preventDefault();
				errorEl.textContent = "";
				submitBtn.disabled = true;
				const result = await requestPasswordReset(fieldValue(form, "email"));
				submitBtn.disabled = false;
				if (result.ok) {
					page.replaceChildren(
						createElement(
							"div",
							{
								className:
									"flex flex-col items-center justify-center min-h-[80vh]",
							},
							createElement(
								"div",
								{ className: "card bg-base-100 shadow-xl w-full max-w-sm" },
								createElement(
									"div",
									{ className: "card-body gap-4 text-center" },
									createElement("div", {
										className: "text-5xl",
										textContent: "✉️",
									}),
									createElement("h2", {
										className: "card-title text-xl justify-center",
										textContent: "Verifique seu e-mail",
									}),
									createElement("p", {
										className: "text-base-content/60 text-sm",
										textContent:
											"Se existe uma conta com esse endereço, você receberá um e-mail com o link de redefinição.",
									}),
									createElement("a", {
										href: "#/auth",
										className: "btn btn-primary w-full mt-2",
										textContent: "Voltar ao login",
									}),
								),
							),
						),
					);
				} else {
					errorEl.textContent = result.error;
				}
			},
		},
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
				required: true,
			}),
		),
		errorEl,
		submitBtn,
	);

	const container = createElement(
		"div",
		{ className: "flex flex-col items-center justify-center min-h-[80vh]" },
		createElement(
			"div",
			{ className: "card bg-base-100 shadow-xl w-full max-w-sm" },
			createElement(
				"div",
				{ className: "card-body gap-4" },
				createElement("h2", {
					className: "card-title text-xl",
					textContent: "Redefinir senha",
				}),
				createElement("p", {
					className: "text-base-content/60 text-sm",
					textContent:
						"Informe seu e-mail e enviaremos um link para redefinir sua senha.",
				}),
				form,
				createElement(
					"div",
					{ className: "text-center text-sm" },
					createElement("a", {
						href: "#/auth",
						className: "link link-primary",
						textContent: "Voltar ao login",
					}),
				),
			),
		),
	);

	page.replaceChildren(container);
}

function renderConfirmForm(
	page: HTMLElement,
	uid: string,
	token: string,
): void {
	const errorEl = createElement("p", {
		id: "reset-confirm-error",
		className: "text-error text-sm min-h-[1rem]",
	});

	const submitBtn = createElement("button", {
		className: "btn btn-primary w-full",
		type: "submit",
		textContent: "Salvar",
	});

	const form = createElement(
		"form",
		{
			id: "reset-confirm-form",
			className: "flex flex-col gap-3",
			onsubmit: async (e: Event) => {
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
					page.replaceChildren(
						createElement(
							"div",
							{
								className:
									"flex flex-col items-center justify-center min-h-[80vh]",
							},
							createElement(
								"div",
								{ className: "card bg-base-100 shadow-xl w-full max-w-sm" },
								createElement(
									"div",
									{ className: "card-body gap-4 text-center" },
									createElement("div", {
										className: "text-5xl",
										textContent: "✅",
									}),
									createElement("h2", {
										className: "card-title text-xl justify-center",
										textContent: "Senha redefinida!",
									}),
									createElement("p", {
										className: "text-base-content/60 text-sm",
										textContent: "Sua senha foi alterada com sucesso.",
									}),
									createElement("a", {
										href: "#/auth",
										className: "btn btn-primary w-full mt-2",
										textContent: "Fazer login",
									}),
								),
							),
						),
					);
				} else {
					errorEl.textContent = result.error;
				}
			},
		},
		createElement(
			"label",
			{ className: "form-control w-full" },
			createElement(
				"div",
				{ className: "label" },
				createElement("span", {
					className: "label-text",
					textContent: "Nova senha",
				}),
			),
			createElement("input", {
				name: "new_password",
				type: "password",
				className: "input input-bordered w-full",
				required: true,
				autocomplete: "new-password",
			}),
		),
		errorEl,
		submitBtn,
	);

	const container = createElement(
		"div",
		{ className: "flex flex-col items-center justify-center min-h-[80vh]" },
		createElement(
			"div",
			{ className: "card bg-base-100 shadow-xl w-full max-w-sm" },
			createElement(
				"div",
				{ className: "card-body gap-4" },
				createElement("h2", {
					className: "card-title text-xl",
					textContent: "Nova senha",
				}),
				form,
			),
		),
	);

	page.replaceChildren(container);
}
