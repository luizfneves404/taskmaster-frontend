import { isAuthenticated, logout } from "../api/auth.ts";
import { navigate } from "../navigate.ts";
import { createElement } from "../utils.ts";

export function renderNavbar(): void {
	const el = document.querySelector<HTMLElement>("#navbar-container");
	if (!el) return;

	const hash = window.location.hash || "#/";
	const auth = isAuthenticated();

	// Clear parent
	el.replaceChildren();

	const brandLink = createElement("a", {
		href: "#/",
		className: "btn btn-ghost text-xl font-bold tracking-tight",
		textContent: "Taskmaster",
	});

	const flex1 = createElement("div", { className: "flex-1" }, brandLink);

	const flexNone = createElement("div", { className: "flex-none gap-2" });

	if (auth) {
		const ul = createElement("ul", {
			className: "menu menu-horizontal px-1 hidden sm:flex",
		});

		const links = [
			{ href: "#/", label: "Início" },
			{ href: "#/lists", label: "Listas" },
			{ href: "#/profile", label: "Perfil" },
		];

		links.forEach(({ href, label }) => {
			const isActive =
				href === "#/"
					? hash === "#/" || hash === "#" || hash === ""
					: hash.startsWith(href);
			const a = createElement("a", {
				href,
				className: isActive ? "active" : "",
				textContent: label,
			});
			ul.append(createElement("li", {}, a));
		});

		const logoutBtn = createElement("button", {
			id: "navbar-logout",
			className: "btn btn-ghost btn-sm",
			textContent: "Sair",
			onclick: async () => {
				await logout();
				navigate("#/auth");
			},
		});

		flexNone.append(ul, logoutBtn);
	} else {
		const loginLink = createElement("a", {
			href: "#/auth",
			className: "btn btn-ghost btn-sm",
			textContent: "Entrar",
		});
		flexNone.append(loginLink);
	}

	const navbar = createElement(
		"div",
		{
			className:
				"navbar bg-base-100 shadow-sm sticky top-0 z-50 border-b border-base-200",
		},
		flex1,
		flexNone,
	);

	el.append(navbar);
}
