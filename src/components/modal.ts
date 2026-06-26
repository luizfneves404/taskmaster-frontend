export function openConfirmModal(message: string, onConfirm: () => void): void {
	const existing = document.getElementById("tm-confirm-modal");
	if (existing) existing.remove();

	const dialog = document.createElement("dialog");
	dialog.id = "tm-confirm-modal";
	dialog.className = "modal modal-open";
	dialog.innerHTML = `
    <div class="modal-box">
      <p class="text-base">${message}</p>
      <div class="modal-action">
        <button id="tm-confirm-yes" class="btn btn-error">Confirmar</button>
        <button id="tm-confirm-no" class="btn btn-ghost">Cancelar</button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop"><button>fechar</button></form>
  `;
	document.body.appendChild(dialog);

	dialog.querySelector("#tm-confirm-yes")!.addEventListener("click", () => {
		dialog.remove();
		onConfirm();
	});
	dialog.querySelector("#tm-confirm-no")!.addEventListener("click", () => {
		dialog.remove();
	});
	dialog
		.querySelector(".modal-backdrop button")!
		.addEventListener("click", () => {
			dialog.remove();
		});
}

export function openFormModal(opts: {
	title: string;
	bodyHtml: string;
	submitLabel: string;
	onSubmit: (form: HTMLFormElement) => Promise<void>;
}): void {
	const existing = document.getElementById("tm-form-modal");
	if (existing) existing.remove();

	const dialog = document.createElement("dialog");
	dialog.id = "tm-form-modal";
	dialog.className = "modal modal-open";
	dialog.innerHTML = `
    <div class="modal-box w-full max-w-lg">
      <h3 class="font-bold text-lg mb-4">${opts.title}</h3>
      <form id="tm-form-modal-form" novalidate>
        ${opts.bodyHtml}
        <p class="text-error text-sm mt-2 min-h-[1rem]" id="tm-form-modal-error"></p>
        <div class="modal-action mt-4">
          <button type="submit" id="tm-form-modal-submit" class="btn btn-primary">${opts.submitLabel}</button>
          <button type="button" id="tm-form-modal-cancel" class="btn btn-ghost">Cancelar</button>
        </div>
      </form>
    </div>
    <form method="dialog" class="modal-backdrop"><button>fechar</button></form>
  `;
	document.body.appendChild(dialog);

	const form = dialog.querySelector<HTMLFormElement>("#tm-form-modal-form")!;
	const errorEl = dialog.querySelector<HTMLElement>("#tm-form-modal-error")!;
	const submitBtn = dialog.querySelector<HTMLButtonElement>(
		"#tm-form-modal-submit",
	)!;

	form.addEventListener("submit", async (e) => {
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
	});

	dialog
		.querySelector("#tm-form-modal-cancel")!
		.addEventListener("click", () => {
			dialog.remove();
		});
	dialog
		.querySelector(".modal-backdrop button")!
		.addEventListener("click", () => {
			dialog.remove();
		});
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
