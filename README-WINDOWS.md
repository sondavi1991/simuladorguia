# Guia Único - Configuração para Windows

## Pré-requisitos

### 1. Node.js (Obrigatório)
- Baixe e instale o Node.js 20+ de: https://nodejs.org/
- Escolha a versão LTS (Long Term Support)
- O npm será instalado automaticamente junto

### 2. Banco de Dados (Escolha uma opção)

#### Opção A: PostgreSQL Local
- Baixe de: https://www.postgresql.org/download/windows/
- Durante a instalação, anote a senha do usuário `postgres`
- Crie um banco chamado `guiaunico`

#### Opção B: Docker (Recomendado)
- Instale Docker Desktop: https://www.docker.com/products/docker-desktop/
- Execute: `docker run --name postgres-guia -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=guiaunico -p 5432:5432 -d postgres:15`

#### Opção C: Serviço em Nuvem
- Supabase (gratuito): https://supabase.com/
- Neon (gratuito): https://neon.tech/
- Railway: https://railway.app/

### 3. Git (Opcional)
- Baixe de: https://git-scm.com/download/win
- Para clonar o repositório

## Configuração Rápida

### 1. Baixar o Projeto
```bash
git clone [URL_DO_REPOSITORIO]
cd guia-unico
```

### 2. Configuração Automática
Abra o PowerShell como administrador e execute:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\setup-windows.ps1
```

### 3. Configurar Banco de Dados
Edite o arquivo `.env` e configure:
```env
# Para PostgreSQL local
DATABASE_URL=postgresql://postgres:SUA_SENHA@localhost:5432/guiaunico

# Para Supabase/Neon (copie a URL fornecida)
DATABASE_URL=postgresql://usuario:senha@host:5432/database

# Configurações obrigatórias
SESSION_SECRET=sua-chave-secreta-de-pelo-menos-32-caracteres
NODE_ENV=development
```

### 4. Iniciar Desenvolvimento
```powershell
.\dev-windows.ps1
```

## Comandos Úteis

### Desenvolvimento
```powershell
npm run dev          # Inicia servidor de desenvolvimento
npm run build        # Gera build de produção
npm run start        # Inicia servidor de produção
npm run db:push      # Sincroniza banco de dados
```

### Banco de Dados
```powershell
# Resetar banco (cuidado: apaga todos os dados)
npm run db:push -- --force
```

## Solução de Problemas

### Erro de Execução de Script
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Porta 5000 em Uso
No Windows, a porta 5000 pode estar sendo usada. Mude no arquivo `.env`:
```env
PORT=3000
```

### Erro de Conexão com Banco
1. Verifique se o PostgreSQL está rodando
2. Confirme a URL no arquivo `.env`
3. Teste a conexão: `psql -h localhost -U postgres -d guiaunico`

### Node.js não Reconhecido
1. Reinicie o PowerShell após instalar o Node.js
2. Verifique se foi adicionado ao PATH
3. Execute: `node --version` para confirmar

## Estrutura de Pastas
```
guia-unico/
├── client/                 # Frontend React
├── server/                 # Backend Node.js
├── shared/                 # Código compartilhado
├── .env                    # Variáveis de ambiente
├── setup-windows.ps1       # Script de configuração
├── dev-windows.ps1         # Script de desenvolvimento
└── package.json            # Dependências
```

## URLs Importantes
- Aplicação: http://localhost:5000
- Login padrão: admin / admin123
- Health Check: http://localhost:5000/api/health

## Recursos do Sistema
- Simulador de planos de saúde
- Painel administrativo
- Integração WhatsApp
- Exportação para Excel
- Sistema de recomendações

## Suporte
Se encontrar problemas:
1. Verifique os logs no terminal
2. Confirme as variáveis de ambiente
3. Teste a conexão com o banco
4. Reinicie o servidor