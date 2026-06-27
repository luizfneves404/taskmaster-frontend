# 📋 Taskmaster - Controle de Tarefas avançado

> **INF1407 - Programação para a Web**  
> **Pontifícia Universidade Católica do Rio de Janeiro (PUC-Rio)**

---

## 👥 Integrantes do Grupo

* **Luiz Felipe Neves** — 2311024
* **Matheus Nossar de Queiroz Claudio** — 2311213

---

## 🔗 Links Úteis

* **Repositório do Frontend:** [GitHub - taskmaster-frontend](https://github.com/luizfneves404/taskmaster-frontend)
* **Cloudflare em Produção (Frontend):** [Taskmaster Frontend](https://taskmaster-frontend.pages.dev)

---

## 🔎 Relato do que foi Desenvolvido (Escopo do Projeto)

O **Taskmaster** é uma aplicação web responsiva para gerenciamento avançado de listas e tarefas. O frontend foi desenvolvido utilizando tecnologias modernas para garantir uma experiência de usuário (UX) fluida e excelente desempenho.

### Componentes Principais e Tecnologias
* **Vite + TypeScript:** Setup rápido e digitação estrita para prevenção de erros.
* **Tailwind CSS + DaisyUI:** Design system moderno, com componentes estilizados (botões, modais, inputs, cards) e suporte nativo a temas responsivos.
* **openapi-fetch:** Cliente HTTP tipado gerado diretamente a partir do esquema OpenAPI (Swagger) do backend, reduzindo erros de integração.
* **Autenticação Segura:** Middleware HTTP personalizado no cliente que injeta o token JWT `Bearer` e realiza o refresh automático transparente no caso de `401 Unauthorized`.

---

## 📖 Manual do Usuário (Funcionamento)

Abaixo está o guia básico de utilização da plataforma:

1. **Acesso e Cadastro:**
   * Caso não possua conta, selecione a aba **"Criar conta"** na tela de autenticação, insira um nome de usuário, e-mail e senha.
   * Se já possuir cadastro, faça login utilizando seu usuário e senha.
2. **Dashboard Principal:**
   * A tela inicial exibe contadores com o número de tarefas **Pendentes**, **Atrasadas**, **Para Hoje** e **Concluídas na Semana**.
   * Uma tabela exibe rapidamente as primeiras tarefas atrasadas e prioritárias com atalhos diretos para sua visualização.
3. **Gerenciamento de Listas:**
   * Acesse **"Listas"** no menu de navegação superior.
   * Clique em **"+ Nova lista"** para preencher o nome, descrição e selecionar uma cor de identificação no color picker.
   * Você pode editar ou apagar qualquer lista usando os botões localizados dentro do card da lista.
4. **Gerenciamento de Tarefas:**
   * Clique em uma lista para visualizar seus detalhes.
   * Clique em **"+ Nova tarefa"** para adicionar tarefas informando Título, Descrição, Prioridade (Alta, Média, Baixa) e datas planejadas e de vencimento.
   * Cada tarefa possui atalhos rápidos para ser editada, excluída ou concluída na própria tela da lista.
5. **Subtarefas e Detalhes:**
   * Clique no título de qualquer tarefa para abrir a tela de detalhes.
   * Ali, você pode criar subtarefas (etapas menores), marcá-las como concluídas ou excluí-las individualmente.
6. **Gerenciamento de Perfil:**
   * Na página de **"Perfil"**, atualize suas informações cadastrais (e-mail, primeiro nome, último nome) ou modifique sua senha atual.

---

## 🛠️ Instalação e Execução Local

### Pré-requisitos
Certifique-se de ter o **Bun** instalado em sua máquina.

* **Instalação no Windows (PowerShell):**
  ```powershell
  powershell -c "irm bun.sh/install.ps1|iex"
  ```
* **Instalação no Linux / macOS:**
  ```bash
  curl -fsSL https://bun.sh/install | bash
  ```

### Passos para Rodar a Aplicação

1. Clone o repositório do frontend:
   ```bash
   git clone https://github.com/luizfneves404/taskmaster-frontend.git
   cd taskmaster-frontend
   ```
2. Instale as dependências:
   ```bash
   bun install
   ```
3. Crie e configure o arquivo `.env` na raiz do projeto:
   ```bash
   cp .env.example .env
   ```
   Ajuste a variável `VITE_API_URL` para apontar para a API local (geralmente `http://localhost:8000`) ou a API de produção:
   ```env
   VITE_API_URL=http://localhost:8000
   ```
4. Inicie o servidor de desenvolvimento:
   ```bash
   bun run dev
   ```
   Acesse a URL indicada no terminal (geralmente `http://localhost:5173`).

---

## 🧪 Relatório de Testes (O que funcionou)

> [!NOTE]
> Todos os testes abaixo foram realizados integrando o frontend com a API executada localmente e em ambiente de staging.

### ✅ O que funcionou (Testado e Validado)
* **Autenticação JWT:** Registro de usuário, Login e Logout funcionam perfeitamente. O armazenamento local e injeção do token via Headers HTTP funcionam corretamente.
* **Auto-Refresh de Sessão:** O middleware intercepta respostas 401, solicita um novo access token por meio do refresh token em segundo plano e refaz a requisição original de forma transparente ao usuário.
* **CRUD de Listas:** Criação, edição (incluindo cores customizadas) e exclusão de listas com atualização dinâmica em tela.
* **CRUD de Tarefas:** Adição de tarefas dentro das listas, edição de dados e exclusão com modal de confirmação.
* **Status de Conclusão:** Ações de concluir e reabrir tarefas e subtarefas operam e persistem os estados no banco de dados.
* **Subtarefas:** Adição, marcação de conclusão e exclusão de subtarefas associadas a uma tarefa específica.
* **Atualização de Perfil & Senha:** Atualização de e-mail/nomes e o fluxo de alteração de senha autenticada funcionam e aplicam validação em tempo real.
* **Dashboard e Agregações:** Cards estatísticos refletem exatamente as contagens retornadas pelo backend.
* **Redefinição de Senha por Link:** O fluxo de solicitação de recuperação de senha por e-mail e confirmação do formulário com token (`uid` + `token`) na rota pública está funcional.
