import { isAuthenticated } from "./api/auth.ts";
import { renderNavbar } from "./components/navbar.ts";
import { renderAuth } from "./pages/auth.ts";
import { renderHome } from "./pages/home.ts";
import { renderListDetail } from "./pages/listDetail.ts";
import { renderLists } from "./pages/lists.ts";
import { renderProfile } from "./pages/profile.ts";
import { renderResetPassword } from "./pages/resetPassword.ts";
import { renderTaskDetail } from "./pages/taskDetail.ts";

async function route(): Promise<void> {
	renderNavbar();

	// Password reset confirm arrives as a real pathname from the email link.
	if (window.location.pathname === "/reset-password") {
		const params = new URLSearchParams(window.location.search);
		renderResetPassword(params.get("uid"), params.get("token"));
		return;
	}

	const hash = window.location.hash || "#/";
	const path = hash.replace(/^#\/?/, "");
	const parts = path.split("/").filter(Boolean);
	const first = parts[0] ?? "";

	if (first === "auth") {
		if (isAuthenticated()) {
			window.location.hash = "#/";
			return;
		}
		renderAuth();
		return;
	}

	if (first === "reset-password") {
		renderResetPassword(null, null);
		return;
	}

	if (!isAuthenticated()) {
		window.location.hash = "#/auth";
		return;
	}

	if (first === "") {
		await renderHome();
	} else if (first === "lists" && parts[1]) {
		await renderListDetail(Number(parts[1]));
	} else if (first === "lists") {
		await renderLists();
	} else if (first === "tasks" && parts[1]) {
		await renderTaskDetail(Number(parts[1]));
	} else if (first === "profile") {
		await renderProfile();
	} else {
		window.location.hash = "#/";
	}
}

export function init(): void {
	route();
	window.addEventListener("hashchange", route);
}
