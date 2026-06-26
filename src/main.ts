import "./style.css";
import { init } from "./router.ts";

const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = `
  <div class="min-h-screen flex flex-col">
    <header id="navbar-container"></header>
    <main id="page" class="container mx-auto px-4 py-2 max-w-6xl flex-1"></main>
  </div>
`;

init();
