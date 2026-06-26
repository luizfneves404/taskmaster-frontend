import type { User } from "../api/auth.ts";
import client from "../api/client.ts";
import { createElement, extractError, fieldValue, formatDateTime } from "../utils.ts";

export async function renderProfile(): Promise<void> {
	const page = document.querySelector<HTMLElement>("#page")!;
	page.replaceChildren(
		createElement(
			"div",
			{ className: "flex justify-center py-12" },
			createElement("span", { className: "loading loading-spinner loading-lg" }),
		),
	);

	const { data, response } = await client.GET("/api/users/me/");
	if (!response.ok || !data) {
		page.replaceChildren(
			createElement(
				"div",
				{ className: "alert alert-error mt-8" },
				"Erro ao carregar perfil.",
			),
		);
		return;
	}

	renderProfileContent(page, data);
}

function renderProfileContent(page: HTMLElement, user: User): void {
	const joined = formatDateTime(user.date_joined);

	const profileError = createElement("p", {
		id: "profile-error",
		className: "text-error text-sm min-h-[1rem]",
	});

	const profileOk = createElement("p", {
		id: "profile-ok",
		className: "text-success text-sm min-h-[1rem] hidden",
		textContent: "Salvo com sucesso.",
	});

	const profileSubmitBtn = createElement("button", {
		className: "btn btn-primary",
		type: "submit",
		textContent: "Salvar",
	});

	const profileForm = createElement(
		"form",
		{
			id: "profile-form",
			className: "flex flex-col gap-3",
			onsubmit: async (e: Event) => {
				e.preventDefault();
				profileError.textContent = "";
				profileOk.classList.add("hidden");
				profileSubmitBtn.disabled = true;

				const { response } = await client.PATCH("/api/users/me/", {
					body: {
						email: fieldValue(profileForm, "email"),
						first_name: fieldValue(profileForm, "first_name"),
						last_name: fieldValue(profileForm, "last_name"),
					},
				});

				profileSubmitBtn.disabled = false;
				if (response.ok) {
					profileOk.classList.remove("hidden");
				} else {
					profileError.textContent = await extractError(
						response,
						"Erro ao salvar perfil.",
					);
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
				value: user.email ?? "",
			}),
		),
		createElement(
			"label",
			{ className: "form-control w-full" },
			createElement(
				"div",
				{ className: "label" },
				createElement("span", {
					className: "label-text",
					textContent: "Primeiro nome",
				}),
			),
			createElement("input", {
				name: "first_name",
				className: "input input-bordered w-full",
				value: user.first_name ?? "",
			}),
		),
		createElement(
			"label",
			{ className: "form-control w-full" },
			createElement(
				"div",
				{ className: "label" },
				createElement("span", {
					className: "label-text",
					textContent: "Último nome",
				}),
			),
			createElement("input", {
				name: "last_name",
				className: "input input-bordered w-full",
				value: user.last_name ?? "",
			}),
		),
		profileError,
		profileOk,
		profileSubmitBtn,
	);

	const passwordError = createElement("p", {
		id: "password-error",
		className: "text-error text-sm min-h-[1rem]",
	});

	const passwordOk = createElement("p", {
		id: "password-ok",
		className: "text-success text-sm min-h-[1rem] hidden",
		textContent: "Senha alterada com sucesso.",
	});

	const passwordSubmitBtn = createElement("button", {
		className: "btn btn-primary",
		type: "submit",
		textContent: "Alterar senha",
	});

	const passwordForm = createElement(
		"form",
		{
			id: "password-form",
			className: "flex flex-col gap-3",
			onsubmit: async (e: Event) => {
				e.preventDefault();
				passwordError.textContent = "";
				passwordOk.classList.add("hidden");
				passwordSubmitBtn.disabled = true;

				const { response } = await client.POST(
					"/api/users/me/change-password/",
					{
						body: {
							current_password: fieldValue(passwordForm, "current_password"),
							new_password: fieldValue(passwordForm, "new_password"),
						},
					},
				);

				passwordSubmitBtn.disabled = false;
				if (response.ok) {
					passwordForm.reset();
					passwordOk.classList.remove("hidden");
				} else {
					passwordError.textContent = await extractError(
						response,
						"Erro ao alterar senha.",
					);
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
					textContent: "Senha atual",
				}),
			),
			createElement("input", {
				name: "current_password",
				type: "password",
				className: "input input-bordered w-full",
				required: true,
				autocomplete: "current-password",
			}),
		),
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
		passwordError,
		passwordOk,
		passwordSubmitBtn,
	);

	const container = createElement(
		"div",
		{ className: "max-w-lg mx-auto py-8 flex flex-col gap-6" },
		createElement("h1", {
			className: "text-2xl font-bold",
			textContent: "Perfil",
		}),
		createElement(
			"div",
			{ className: "card bg-base-100 shadow border border-base-200" },
			createElement(
				"div",
				{ className: "card-body gap-4" },
				createElement("h2", {
					className: "card-title text-base",
					textContent: "Dados pessoais",
				}),
				createElement(
					"div",
					{ className: "grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm mb-2" },
					createElement("span", {
						className: "text-base-content/60",
						textContent: "Usuário",
					}),
					createElement("span", {
						className: "font-medium",
						textContent: user.username,
					}),
					createElement("span", {
						className: "text-base-content/60",
						textContent: "Membro desde",
					}),
					createElement("span", { textContent: joined }),
				),
				profileForm,
			),
		),
		createElement(
			"div",
			{ className: "card bg-base-100 shadow border border-base-200" },
			createElement(
				"div",
				{ className: "card-body gap-4" },
				createElement("h2", {
					className: "card-title text-base",
					textContent: "Alterar senha",
				}),
				passwordForm,
			),
		),
	);

	page.replaceChildren(container);
}
