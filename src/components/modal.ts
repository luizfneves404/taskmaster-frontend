import { createElement } from "../utils.ts";

export function openConfirmModal(
	message: string | Node | (string | Node)[],
	onConfirm: () => void,
): void {
	const existing = document.getElementById("tm-confirm-modal");
	if (existing) existing.remove();

	const dialog = createElement("dialog", {
		id: "tm-confirm-modal",
		className: "modal modal-open",
	});

	const p = createElement("p", { className: "text-base" });
	if (Array.isArray(message)) {
		p.append(...message);
	} else {
		p.append(message);
	}

	const confirmBtn = createElement("button", {
		id: "tm-confirm-yes",
		className: "btn btn-error",
		textContent: "Confirmar",
		onclick: () => {
			dialog.remove();
			onConfirm();
		},
	});

	const cancelBtn = createElement("button", {
		id: "tm-confirm-no",
		className: "btn btn-ghost",
		textContent: "Cancelar",
		onclick: () => {
			dialog.remove();
		},
	});

	const backdropBtn = createElement("button", {
		textContent: "fechar",
		onclick: () => {
			dialog.remove();
		},
	});

	const box = createElement(
		"div",
		{ className: "modal-box" },
		p,
		createElement("div", { className: "modal-action" }, confirmBtn, cancelBtn),
	);

	const backdropForm = createElement(
		"form",
		{ method: "dialog", className: "modal-backdrop" },
		backdropBtn,
	);

	dialog.append(box, backdropForm);
	document.body.appendChild(dialog);
}

export function openFormModal(opts: {
	title: string;
	body: HTMLElement | DocumentFragment;
	submitLabel: string;
	onSubmit: (form: HTMLFormElement) => Promise<void>;
}): void {
	const existing = document.getElementById("tm-form-modal");
	if (existing) existing.remove();

	const errorEl = createElement("p", {
		id: "tm-form-modal-error",
		className: "text-error text-sm mt-2 min-h-[1rem]",
	});

	const submitBtn = createElement("button", {
		type: "submit",
		id: "tm-form-modal-submit",
		className: "btn btn-primary",
		textContent: opts.submitLabel,
	});

	const dialog = createElement("dialog", {
		id: "tm-form-modal",
		className: "modal modal-open",
	});

	const cancelBtn = createElement("button", {
		type: "button",
		id: "tm-form-modal-cancel",
		className: "btn btn-ghost",
		textContent: "Cancelar",
		onclick: () => {
			dialog.remove();
		},
	});

	const backdropBtn = createElement("button", {
		textContent: "fechar",
		onclick: () => {
			dialog.remove();
		},
	});

	const form = createElement(
		"form",
		{
			id: "tm-form-modal-form",
			noValidate: true,
			onsubmit: async (e: Event) => {
				e.preventDefault();
				errorEl.textContent = "";
				submitBtn.disabled = true;
				try {
					await opts.onSubmit(form);
				} catch (err) {
					errorEl.textContent =
						err instanceof Error ? err.message : "Erro desconhecido.";
					submitBtn.disabled = false;
				}
			},
		},
		opts.body,
		errorEl,
		createElement(
			"div",
			{ className: "modal-action mt-4" },
			submitBtn,
			cancelBtn,
		),
	);

	const box = createElement(
		"div",
		{ className: "modal-box w-full max-w-lg" },
		createElement("h3", {
			className: "font-bold text-lg mb-4",
			textContent: opts.title,
		}),
		form,
	);

	const backdropForm = createElement(
		"form",
		{ method: "dialog", className: "modal-backdrop" },
		backdropBtn,
	);

	dialog.append(box, backdropForm);
	document.body.appendChild(dialog);
}

export function closeFormModal(): void {
	document.getElementById("tm-form-modal")?.remove();
}

export function setFormModalError(message: string): void {
	const el = document.querySelector<HTMLElement>("#tm-form-modal-error");
	if (el) el.textContent = message;
	const btn = document.querySelector<HTMLButtonElement>(
		"#tm-form-modal-submit",
	);
	if (btn) btn.disabled = false;
}
