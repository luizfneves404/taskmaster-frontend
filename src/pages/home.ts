import client from "../api/client.ts";
import { priorityBadge, statusBadge } from "../components/badges.ts";
import type { TaskList } from "../types.ts";
import { createElement, formatDate, formatDateTime } from "../utils.ts";

export async function renderHome(): Promise<void> {
	const page = document.querySelector<HTMLElement>("#page")!;
	page.replaceChildren(
		createElement(
			"div",
			{ className: "flex justify-center py-12" },
			createElement("span", { className: "loading loading-spinner loading-lg" }),
		),
	);

	const [
		{ data: user },
		{ data: lists = [] },
		{ data: summary },
		{ data: upcoming = [] },
		{ data: late = [] },
		{ data: completed = [] },
	] = await Promise.all([
		client.GET("/api/users/me/"),
		client.GET("/api/lists/"),
		client.GET("/api/dashboard/summary/"),
		client.GET("/api/dashboard/upcoming/"),
		client.GET("/api/tasks/late/"),
		client.GET("/api/tasks/completed/"),
	]);

	if (!user) {
		page.replaceChildren(
			createElement(
				"div",
				{ className: "alert alert-error mt-8" },
				"Sessão expirada. ",
				createElement("a", {
					href: "#/auth",
					className: "link",
					textContent: "Entrar",
				}),
			),
		);
		return;
	}

	const listMap = new Map<number, TaskList>(lists.map((l) => [l.id, l]));
	const stats = summary ?? {
		pending: 0,
		overdue: 0,
		today: 0,
		completed_week: 0,
	};

	const statsSection = createElement(
		"div",
		{
			className:
				"stats stats-vertical sm:stats-horizontal shadow w-full border border-base-200",
		},
		createElement(
			"div",
			{ className: "stat" },
			createElement("div", { className: "stat-title", textContent: "Pendentes" }),
			createElement("div", {
				className: "stat-value text-primary",
				textContent: String(stats.pending),
			}),
		),
		createElement(
			"div",
			{ className: "stat" },
			createElement("div", { className: "stat-title", textContent: "Atrasadas" }),
			createElement("div", {
				className: "stat-value text-error",
				textContent: String(stats.overdue),
			}),
		),
		createElement(
			"div",
			{ className: "stat" },
			createElement("div", {
				className: "stat-title",
				textContent: "Para hoje",
			}),
			createElement("div", {
				className: "stat-value text-warning",
				textContent: String(stats.today),
			}),
		),
		createElement(
			"div",
			{ className: "stat" },
			createElement("div", {
				className: "stat-title",
				textContent: "Concluídas na semana",
			}),
			createElement("div", {
				className: "stat-value text-success",
				textContent: String(stats.completed_week),
			}),
		),
	);

	const listsGrid = createElement("div", {
		className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4",
	});
	if (lists.length === 0) {
		listsGrid.className = "text-base-content/50 text-sm";
		listsGrid.append(
			"Nenhuma lista ainda. ",
			createElement("a", {
				href: "#/lists",
				className: "link link-primary",
				textContent: "Criar lista",
			}),
		);
	} else {
		lists.slice(0, 6).forEach((list) => {
			const pending = list.pending_count ?? 0;
			const card = createElement(
				"a",
				{
					href: `#/lists/${list.id}`,
					className:
						"card bg-base-100 border border-base-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer border-l-4",
					style: `border-left-color: ${list.color ?? "#e5e7eb"}`,
				},
				createElement(
					"div",
					{ className: "card-body p-4 gap-1" },
					createElement(
						"div",
						{ className: "flex items-center justify-between" },
						createElement("span", {
							className: "font-semibold truncate",
							textContent: list.name,
						}),
						createElement("span", {
							className: "badge badge-ghost badge-sm shrink-0 ml-2",
							textContent: `${pending} pendente${pending !== 1 ? "s" : ""}`,
						}),
					),
					list.description
						? createElement("p", {
								className: "text-base-content/60 text-xs truncate",
								textContent: list.description,
							})
						: null,
				),
			);
			listsGrid.append(card);
		});
	}

	let lateSection: HTMLElement | null = null;
	if (late.length > 0) {
		const tbody = createElement("tbody");
		late.slice(0, 5).forEach((t) => {
			const tr = createElement(
				"tr",
				{},
				createElement(
					"td",
					{},
					createElement("a", {
						href: `#/tasks/${t.id}`,
						className: "link link-hover",
						textContent: t.title,
					}),
				),
				createElement("td", {
					className: "text-base-content/60",
					textContent: listMap.get(t.task_list)?.name ?? "—",
				}),
				createElement("td", {
					className: "text-error",
					textContent: formatDate(t.due_date),
				}),
			);
			tbody.append(tr);
		});

		lateSection = createElement(
			"div",
			{},
			createElement("h2", {
				className: "text-lg font-semibold mb-3",
				textContent: "Tarefas atrasadas",
			}),
			createElement(
				"div",
				{ className: "overflow-x-auto" },
				createElement(
					"table",
					{
						className:
							"table table-sm bg-base-100 border border-base-200 rounded-box",
					},
					createElement(
						"thead",
						{},
						createElement(
							"tr",
							{},
							createElement("th", { textContent: "Tarefa" }),
							createElement("th", { textContent: "Lista" }),
							createElement("th", { textContent: "Prazo" }),
						),
					),
					tbody,
				),
			),
		);
	}

	let upcomingSection: HTMLElement | null = null;
	if (upcoming.length > 0) {
		const tbody = createElement("tbody");
		upcoming.forEach((t) => {
			const doneBtn =
				t.status !== "done"
					? createElement("button", {
							className: "btn btn-xs btn-success mark-done-btn",
							textContent: "Concluir",
							onclick: async (e: Event) => {
								const btn = e.currentTarget as HTMLButtonElement;
								btn.disabled = true;
								await client.POST("/api/tasks/{id}/toggle/", {
									params: { path: { id: t.id } },
								});
								renderHome();
							},
						})
					: null;

			const tr = createElement(
				"tr",
				{ dataset: { taskId: String(t.id) } },
				createElement(
					"td",
					{},
					createElement("a", {
						href: `#/tasks/${t.id}`,
						className: "link link-hover",
						textContent: t.title,
					}),
				),
				createElement("td", {
					className: "text-base-content/60",
					textContent: listMap.get(t.task_list)?.name ?? "—",
				}),
				createElement("td", {}, priorityBadge(t.priority ?? "medium")),
				createElement("td", { textContent: formatDate(t.due_date) }),
				createElement("td", {}, statusBadge(t.status ?? "pending")),
				createElement("td", {}, doneBtn),
			);
			tbody.append(tr);
		});

		upcomingSection = createElement(
			"div",
			{},
			createElement("h2", {
				className: "text-lg font-semibold mb-3",
				textContent: "Próximas tarefas",
			}),
			createElement(
				"div",
				{ className: "overflow-x-auto" },
				createElement(
					"table",
					{
						className:
							"table table-sm bg-base-100 border border-base-200 rounded-box",
					},
					createElement(
						"thead",
						{},
						createElement(
							"tr",
							{},
							createElement("th", { textContent: "Tarefa" }),
							createElement("th", { textContent: "Lista" }),
							createElement("th", { textContent: "Prioridade" }),
							createElement("th", { textContent: "Prazo" }),
							createElement("th", { textContent: "Status" }),
							createElement("th"),
						),
					),
					tbody,
				),
			),
		);
	}

	let completedSection: HTMLElement | null = null;
	if (completed.length > 0) {
		const tbody = createElement("tbody");
		completed.slice(0, 5).forEach((t) => {
			const tr = createElement(
				"tr",
				{},
				createElement(
					"td",
					{},
					createElement("a", {
						href: `#/tasks/${t.id}`,
						className: "link link-hover",
						textContent: t.title,
					}),
				),
				createElement("td", {
					className: "text-base-content/60",
					textContent: listMap.get(t.task_list)?.name ?? "—",
				}),
				createElement("td", {
					className: "text-base-content/60",
					textContent: formatDateTime(t.updated_at),
				}),
			);
			tbody.append(tr);
		});

		completedSection = createElement(
			"div",
			{},
			createElement("h2", {
				className: "text-lg font-semibold mb-3",
				textContent: "Tarefas concluídas",
			}),
			createElement(
				"div",
				{ className: "overflow-x-auto" },
				createElement(
					"table",
					{
						className:
							"table table-sm bg-base-100 border border-base-200 rounded-box",
					},
					createElement(
						"thead",
						{},
						createElement(
							"tr",
							{},
							createElement("th", { textContent: "Tarefa" }),
							createElement("th", { textContent: "Lista" }),
							createElement("th", { textContent: "Atualizada" }),
						),
					),
					tbody,
				),
			),
		);
	}

	const container = createElement(
		"div",
		{ className: "py-6 flex flex-col gap-8" },
		createElement(
			"div",
			{},
			createElement("h1", {
				className: "text-2xl font-bold",
				textContent: `Olá, ${user.username}.`,
			}),
			createElement("p", {
				className: "text-base-content/60 text-sm mt-1",
				textContent: "Aqui está o resumo das suas tarefas.",
			}),
		),
		statsSection,
		createElement(
			"div",
			{},
			createElement(
				"div",
				{ className: "flex items-center justify-between mb-4" },
				createElement("h2", {
					className: "text-lg font-semibold",
					textContent: "Minhas listas",
				}),
				createElement("a", {
					href: "#/lists",
					className: "btn btn-sm btn-ghost",
					textContent: "Ver todas →",
				}),
			),
			listsGrid,
		),
		lateSection,
		upcomingSection,
		completedSection,
	);

	page.replaceChildren(container);
}
