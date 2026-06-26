# Overview

# Regras para desenvolvimento

TypeScript somente. Não usar código inline, referenciar arquivo. Não usar innerHTML.

# Setup

Tenha o bun instalado. Para Windows:

powershell -c "irm bun.sh/install.ps1|iex"

Para instalar as dependências do projeto:

bun install

# Development

Para rodar localmente:

bun run dev

# Deployment

Cloudflare Pages.
Necessária variável de ambiente:
VITE_API_URL=https://your-app.onrender.com
