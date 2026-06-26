import "./style.css";
import { init } from "./router.ts";
import { createElement } from "./utils.ts";

const app = document.querySelector<HTMLDivElement>("#app")!;
app.replaceChildren(
	createElement(
		"div",
		{ className: "min-h-screen flex flex-col" },
		createElement("header", { id: "navbar-container" }),
		createElement("main", {
			id: "page",
			className: "container mx-auto px-4 py-2 max-w-6xl flex-1",
		}),
	),
);

init();
