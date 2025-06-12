# Guia Único - Sistema de Simulação de Planos de Saúde

## Visão Geral
Sistema completo para simulação e recomendação de planos de saúde, desenvolvido com React, Node.js e PostgreSQL.

## Funcionalidades Principais

### 🏥 Simulador Inteligente
- Formulário multi-etapas com lógica condicional
- Validação em tempo real
- Suporte a upload de arquivos
- Sistema de navegação inteligente

### 📊 Engine de Recomendação
- Recomendações personalizadas baseadas no perfil do usuário
- Comparação de preços e benefícios
- Matching de características por necessidades

### 👥 Painel Administrativo
- Gestão completa de usuários
- Configuração dinâmica de planos
- Construtor de formulários
- Dashboard de analytics

### 📱 Integração WhatsApp
- Distribuição automática de contatos
- Sistema de fila para consultores
- Notificações em tempo real

### 📋 Exportação e Relatórios
- Exportação para Excel
- Relatórios detalhados de submissões
- Analytics de conversão

## Stack Tecnológica

### Frontend
- **React 18** - Interface de usuário
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **Shadcn/UI** - Componentes reutilizáveis
- **Tanstack Query** - Gerenciamento de estado
- **Wouter** - Roteamento
- **Framer Motion** - Animações

### Backend
- **Node.js 20** - Runtime
- **Express** - Framework web
- **TypeScript** - Tipagem estática
- **Drizzle ORM** - Database ORM
- **PostgreSQL** - Banco de dados
- **bcrypt** - Hash de senhas
- **Zod** - Validação de dados

### DevOps & Deploy
- **Docker** - Containerização
- **Coolify** - Deploy e orquestração
- **Nginx** - Proxy reverso (opcional)

## Estrutura do Projeto

```
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── pages/          # Páginas da aplicação
│   │   └── lib/            # Utilitários e configurações
├── server/                 # Backend Node.js
│   ├── routes.ts           # Rotas da API
│   ├── storage.ts          # Camada de dados
│   ├── auth.ts             # Autenticação
│   └── index.ts            # Servidor principal
├── shared/                 # Código compartilhado
│   └── schema.ts           # Esquemas e tipos
├── Dockerfile              # Configuração Docker
├── docker-compose.yml      # Orquestração local
├── coolify.yml             # Configuração Coolify
└── DEPLOYMENT.md           # Guia de deploy
```

## Desenvolvimento Local

### Pré-requisitos
- Node.js 20+
- PostgreSQL
- npm ou yarn

### Configuração
1. Clone o repositório
2. Instale as dependências: `npm install`
3. Configure as variáveis de ambiente (ver `.env.example`)
4. Execute as migrações: `npm run db:push`
5. Inicie o servidor de desenvolvimento: `npm run dev`

### Usuários Padrão
- **Username:** admin
- **Password:** admin123

## Deploy em Produção

### Coolify (Recomendado)
1. Conecte seu repositório ao Coolify
2. Configure as variáveis de ambiente
3. Deploy automático via Dockerfile

### Docker Compose
```bash
docker-compose up -d
```

### Variáveis de Ambiente Obrigatórias
- `DATABASE_URL` - URL do PostgreSQL
- `SESSION_SECRET` - Chave secreta para sessões

## Segurança
- Senhas criptografadas com bcrypt
- Autenticação baseada em sessões
- Validação de entrada com Zod
- Headers de segurança configurados
- Proteção contra SQL injection

## Performance
- Build otimizado para produção
- Cache de assets estáticos
- Compressão gzip
- Connection pooling do banco
- Health checks configurados

## Monitoramento
- Endpoint de health check: `/api/health`
- Logs estruturados
- Métricas de uptime
- Error tracking

## Licença
MIT License

## Suporte
Para suporte técnico, consulte a documentação de deployment ou verifique os logs da aplicação.

# Guia Saúde

Projeto pronto para deploy no Coolify usando Docker.

## Como rodar no Coolify

1. **Configure a variável de ambiente do banco:**
   - No painel do Coolify, adicione a variável `DATABASE_URL` com a string de conexão do seu banco PostgreSQL/Supabase.

2. **Deploy via Dockerfile:**
   - O Coolify irá buildar a imagem usando o `Dockerfile` já pronto.
   - O app irá rodar na porta 3000 (exposta no Dockerfile).

3. **Acesse a aplicação:**
   - O Coolify irá mapear a porta 3000 para a URL do seu projeto.

## Variáveis de ambiente obrigatórias

- `DATABASE_URL` (string de conexão do banco PostgreSQL)
- (Opcional) Outras variáveis do seu `.env` se necessário

## Build e start local (opcional)

```sh
npm install
npm run build
PORT=3000 npm start
```

## Deploy manual via Docker (opcional)

```sh
docker build -t guia-saude .
docker run -p 3000:3000 --env DATABASE_URL=postgresql://usuario:senha@host:porta/postgres guia-saude
```

---

Se precisar de ajuda para migrar o banco ou configurar o deploy, consulte o README ou peça suporte!