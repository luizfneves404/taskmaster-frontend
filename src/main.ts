import "./style.css";
import {
	clearTokens,
	isAuthenticated,
	login,
	logout,
	register,
	type User,
} from "./api/auth.ts";
import client from "./api/client.ts";
import { type ConnectionStatus, checkConnection } from "./api/health.ts";

const app = document.querySelector<HTMLDivElement>("#app")!;

const escapeHtml = (value: string) =>
	value.replace(
		/[&<>"']/g,
		(c) =>
			({
				"&": "&amp;",
				"<": "&lt;",
				">": "&gt;",
				'"': "&quot;",
				"'": "&#39;",
			})[c]!,
	);

// --- Authenticated view: profile from GET /api/users/me/ --------------------

function renderProfile(user: User) {
	const joined = user.date_joined
		? new Date(user.date_joined).toLocaleString("pt-BR")
		: "—";

	app.innerHTML = `
<main id="home">
  <header class="home-header">
    <h1>Taskmaster</h1>
  </header>
  <section class="card">
    <div class="status">
      <span class="dot dot--ok"></span>
      <span>Conectado e autenticado — HTTP 200</span>
    </div>
    <dl class="profile">
      <dt>Usuário</dt><dd>${escapeHtml(user.username)}</dd>
      <dt>E-mail</dt><dd>${escapeHtml(user.email || "—")}</dd>
      <dt>Membro desde</dt><dd>${escapeHtml(joined)}</dd>
    </dl>
    <button id="logout" type="button" class="btn">Sair</button>
  </section>
</main>`;

	const logoutBtn = document.querySelector<HTMLButtonElement>("#logout")!;
	logoutBtn.addEventListener("click", async () => {
		if (logoutBtn.disabled) return; // evita logout duplicado
		logoutBtn.disabled = true;
		await logout();
		start();
	});
}

async function loadProfile() {
	app.innerHTML = `<main id="home"><p class="status-detail">Carregando…</p></main>`;
	const { data, response } = await client.GET("/api/users/me/");
	if (response.ok && data) {
		renderProfile(data);
	} else {
		// Sessão inválida (refresh também falhou): volta para o login.
		clearTokens();
		renderAuth();
	}
}

// --- Unauthenticated view: login / register + connection baseline -----------

function renderAuth() {
	app.innerHTML = `
<main id="home">
  <header class="home-header">
    <h1>Taskmaster</h1>
    <p class="tagline">Gerenciador de tarefas — lists, tasks e subtasks.</p>
  </header>

  <section id="connection" class="card baseline" aria-live="polite">
    <div class="status">
      <span id="status-dot" class="dot dot--loading"></span>
      <span id="status-label">Verificando conexão com o backend…</span>
    </div>
    <p class="status-detail"><code>${escapeHtml(
			import.meta.env.VITE_API_URL ?? "http://localhost:8000",
		)}</code></p>
  </section>

  <section class="card">
    <div class="tabs" role="tablist">
      <button id="tab-login" class="tab tab--active" role="tab" type="button">Entrar</button>
      <button id="tab-register" class="tab" role="tab" type="button">Criar conta</button>
    </div>

    <form id="login-form" class="auth-form">
      <label>Usuário<input name="username" autocomplete="username" required></label>
      <label>Senha<input name="password" type="password" autocomplete="current-password" required></label>
      <p class="form-error" id="login-error"></p>
      <button class="btn btn--primary" type="submit">Entrar</button>
    </form>

    <form id="register-form" class="auth-form hidden">
      <label>Usuário<input name="username" autocomplete="username" required></label>
      <label>E-mail<input name="email" type="email" autocomplete="email" required></label>
      <label>Senha<input name="password" type="password" autocomplete="new-password" required></label>
      <p class="form-error" id="register-error"></p>
      <button class="btn btn--primary" type="submit">Criar conta e entrar</button>
    </form>
  </section>
</main>`;

	wireConnectionBaseline();
	wireTabs();
	wireLoginForm();
	wireRegisterForm();
}

function wireConnectionBaseline() {
	const dot = document.querySelector<HTMLSpanElement>("#status-dot")!;
	const label = document.querySelector<HTMLSpanElement>("#status-label")!;
	const render = (status: ConnectionStatus) => {
		dot.className = "dot";
		if (status.state === "unreachable") {
			dot.classList.add("dot--error");
			label.textContent = "Backend inacessível";
		} else {
			dot.classList.add("dot--ok");
			label.textContent = "Backend acessível";
		}
	};
	checkConnection().then(render);
}

function wireTabs() {
	const tabLogin = document.querySelector<HTMLButtonElement>("#tab-login")!;
	const tabRegister =
		document.querySelector<HTMLButtonElement>("#tab-register")!;
	const loginForm = document.querySelector<HTMLFormElement>("#login-form")!;
	const registerForm =
		document.querySelector<HTMLFormElement>("#register-form")!;

	const select = (loginActive: boolean) => {
		tabLogin.classList.toggle("tab--active", loginActive);
		tabRegister.classList.toggle("tab--active", !loginActive);
		loginForm.classList.toggle("hidden", !loginActive);
		registerForm.classList.toggle("hidden", loginActive);
	};

	tabLogin.addEventListener("click", () => select(true));
	tabRegister.addEventListener("click", () => select(false));
}

function fieldValue(form: HTMLFormElement, name: string): string {
	return (form.elements.namedItem(name) as HTMLInputElement).value.trim();
}

function setSubmitting(form: HTMLFormElement, submitting: boolean) {
	form.querySelector<HTMLButtonElement>("button[type=submit]")!.disabled =
		submitting;
}

function wireLoginForm() {
	const form = document.querySelector<HTMLFormElement>("#login-form")!;
	const errorEl = document.querySelector<HTMLParagraphElement>("#login-error")!;
	form.addEventListener("submit", async (event) => {
		event.preventDefault();
		errorEl.textContent = "";
		setSubmitting(form, true);
		const result = await login(
			fieldValue(form, "username"),
			fieldValue(form, "password"),
		);
		setSubmitting(form, false);
		if (result.ok) {
			loadProfile();
		} else {
			errorEl.textContent = result.error;
		}
	});
}

function wireRegisterForm() {
	const form = document.querySelector<HTMLFormElement>("#register-form")!;
	const errorEl =
		document.querySelector<HTMLParagraphElement>("#register-error")!;
	form.addEventListener("submit", async (event) => {
		event.preventDefault();
		errorEl.textContent = "";
		setSubmitting(form, true);
		const result = await register(
			fieldValue(form, "username"),
			fieldValue(form, "email"),
			fieldValue(form, "password"),
		);
		setSubmitting(form, false);
		if (result.ok) {
			loadProfile();
		} else {
			errorEl.textContent = result.error;
		}
	});
}

// --- Entry ------------------------------------------------------------------

function start() {
	if (isAuthenticated()) {
		loadProfile();
	} else {
		renderAuth();
	}
}

start();
