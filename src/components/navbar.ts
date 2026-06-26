import { isAuthenticated, logout } from "../api/auth.ts";
import { navigate } from "../navigate.ts";

export function renderNavbar(): void {
	const el = document.querySelector<HTMLElement>("#navbar-container");
	if (!el) return;

	const hash = window.location.hash || "#/";
	const auth = isAuthenticated();

	const navLink = (href: string, label: string): string => {
		const isActive =
			href === "#/"
				? hash === "#/" || hash === "#" || hash === ""
				: hash.startsWith(href);
		return `<li><a href="${href}" class="${isActive ? "active" : ""}">${label}</a></li>`;
	};

	el.innerHTML = `
    <div class="navbar bg-base-100 shadow-sm sticky top-0 z-50 border-b border-base-200">
      <div class="flex-1">
        <a href="#/" class="btn btn-ghost text-xl font-bold tracking-tight">Taskmaster</a>
      </div>
      <div class="flex-none gap-2">
        ${
					auth
						? `
          <ul class="menu menu-horizontal px-1 hidden sm:flex">
            ${navLink("#/", "Início")}
            ${navLink("#/lists", "Listas")}
            ${navLink("#/profile", "Perfil")}
          </ul>
          <button id="navbar-logout" class="btn btn-ghost btn-sm">Sair</button>
        `
						: `
          <a href="#/auth" class="btn btn-ghost btn-sm">Entrar</a>
        `
				}
      </div>
    </div>
  `;

	document
		.querySelector<HTMLButtonElement>("#navbar-logout")
		?.addEventListener("click", async () => {
			await logout();
			navigate("#/auth");
		});
}
