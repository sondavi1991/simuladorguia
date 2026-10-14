# Guia Único — Simulador e recomendação de planos de saúde

> **EN:** Full-stack web app (React + Express + PostgreSQL, all TypeScript) that guides visitors through a configurable multi-step form, recommends health plans from their answers, and routes the resulting leads to sales consultants via WhatsApp using round-robin distribution. Includes an admin panel with a form builder and Excel export.

Aplicação web full-stack em TypeScript. O visitante responde a um formulário em etapas, recebe recomendações de planos de saúde compatíveis com o perfil e é encaminhado a um consultor por WhatsApp. A equipe administra tudo por um painel: planos, etapas do formulário, atendentes, e-mail e submissões.

<!-- Adicione capturas de tela em docs/img/ e referencie aqui, por exemplo: ![Simulador](docs/img/simulador.png) -->

## Funcionalidades

**Simulador**
- Formulário multi-etapas configurável, com regras condicionais e navegação entre etapas
- Motor de recomendação que cruza as respostas com os planos cadastrados (`POST /api/health-plans/recommend`)

**Painel administrativo**
- Gestão de usuários administradores
- Cadastro e edição de planos de saúde
- Construtor de formulário: criação e edição das etapas do simulador
- Consulta das submissões e exportação para Excel (`GET /api/form-submissions/export`)

**WhatsApp e e-mail**
- Distribuição de contatos entre os atendentes ativos em rodízio (round-robin), com pré-visualização do próximo atendente
- Envio de e-mail por SMTP configurável pelo painel, com endpoint de teste

## Stack

| Camada | Tecnologias |
| --- | --- |
| Front-end | React, TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack Query, Wouter, Framer Motion |
| Back-end | Node.js 20, Express, TypeScript, Drizzle ORM, Zod, Nodemailer, SheetJS (xlsx) |
| Banco de dados | PostgreSQL (compatível com Supabase e Neon) |
| Infra | Docker, Docker Compose, Coolify, Nginx (opcional) |

## Estrutura do projeto

```
├── client/                  # Front-end React (pages, components, lib)
├── server/                  # API Express
│   ├── index.ts             # Servidor, middlewares e health check
│   ├── routes.ts            # Rotas da API
│   ├── storage.ts           # Camada de dados (PostgreSQL ou memória)
│   ├── auth.ts              # Autenticação e sessões
│   └── email-service.ts     # Envio de e-mail
├── shared/schema.ts         # Schemas Drizzle e tipos compartilhados (Zod)
├── scripts/
│   ├── create-admin.ts      # Cria ou redefine a senha de um admin no PostgreSQL
│   └── windows/             # Scripts PowerShell de apoio para Windows
├── docs/                    # Deploy, Supabase e guias para Windows
├── Dockerfile · docker-compose.yml · coolify.yml · nginx.conf
└── .env.example             # Modelo das variáveis de ambiente
```

## Como rodar localmente

Pré-requisitos: Node.js 20+ e um PostgreSQL acessível (local, Supabase ou Neon).

```bash
git clone https://github.com/sondavi1991/simuladorguia.git
cd simuladorguia
npm install
cp .env.example .env      # preencha DATABASE_URL
npm run db:push           # cria as tabelas
npm run dev               # http://localhost:5000
```

**Primeiro acesso ao painel.** Fora de produção, o servidor cria em memória os usuários `admin` e `gerente`, com a senha definida em `ADMIN_INITIAL_PASSWORD`. Se a variável estiver vazia, uma senha aleatória é gerada e exibida no console ao iniciar. Esses usuários **não existem em produção**. Para criar o administrador no banco:

```bash
ADMIN_PASSWORD='uma-senha-forte-com-12+-caracteres' npm run create-admin -- admin seu@email.com
```

O mesmo comando redefine a senha de um usuário existente e encerra as sessões ativas dele.

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `DATABASE_URL` | Sim | String de conexão do PostgreSQL |
| `NODE_ENV` | Não | `development` ou `production` |
| `PORT` / `HOST` | Não | Porta (padrão `5000`) e host do servidor |
| `ADMIN_INITIAL_PASSWORD` | Não | Senha dos usuários de desenvolvimento (somente fora de produção) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Não | Envio de e-mail |
| `WHATSAPP_API_URL`, `WHATSAPP_TOKEN` | Não | Integração com a API de WhatsApp |
| `SESSION_SECRET` | Não | Reservada: as sessões atuais usam IDs aleatórios guardados no banco |

Nunca versione o `.env`. Use `.env.example` como modelo.

## Deploy

**Coolify.** Conecte o repositório, defina `DATABASE_URL` nas variáveis de ambiente e faça o deploy. O `coolify.yml` define `PORT=5000`.

> **Atenção à porta:** o `Dockerfile` define `PORT=3000` por padrão, enquanto `docker-compose.yml` e `coolify.yml` a sobrescrevem para `5000`. Use a porta correspondente ao método de deploy ao configurar o mapeamento.

**Docker manual** (usa a porta 3000 do `Dockerfile`):

```bash
docker build -t guia-unico .
docker run -p 3000:3000 --env DATABASE_URL='postgresql://usuario:senha@host:5432/postgres' guia-unico
```

**Docker Compose:** `docker-compose up -d`. Detalhes em [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) e [`docs/SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md). Guia para Windows em [`docs/windows/`](docs/windows/).

Depois do primeiro deploy, crie o administrador com `npm run create-admin`, conforme a seção anterior.

## Segurança

- Senhas com hash bcrypt; sessões com identificadores aleatórios de 256 bits
- Limite de tentativas no endpoint de login (`express-rate-limit`)
- Cabeçalhos de segurança com Helmet
- Validação de entrada com Zod; consultas ao banco parametrizadas pelo Drizzle ORM
- Nenhuma conta padrão em produção

## Operação

- Health check: `GET /api/health` (também usado pelo `HEALTHCHECK` do Docker)
- Se a conexão com o PostgreSQL falhar na inicialização, o servidor cai para armazenamento em memória, útil só para desenvolvimento. Em produção, monitore o log de inicialização.

## Estado atual e próximos passos

- Ainda não há testes automatizados nem pipeline de CI
- Logs são simples (`console`); não há logging estruturado nem monitoramento de erros
- Capturas de tela e uma demo pública com dados fictícios estão planejadas
