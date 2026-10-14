# Guia de Instalação - Windows

## Configuração Rápida (5 minutos)

### Passo 1: Baixar e Descompactar
1. Baixe o projeto como ZIP ou clone via Git
2. Descompacte em uma pasta de sua escolha (ex: `C:\projetos\guia-unico`)

### Passo 2: Instalar Node.js
1. Acesse: https://nodejs.org/
2. Baixe a versão LTS (recomendada)
3. Execute o instalador e siga as instruções padrão
4. Reinicie o PowerShell após a instalação

### Passo 3: Configurar Banco de Dados

#### Opção A - Supabase (Mais Fácil)
1. Acesse: https://supabase.com/
2. Crie uma conta gratuita
3. Crie um novo projeto
4. Vá em Settings > Database
5. Copie a Connection String (URL de conexão)

#### Opção B - PostgreSQL Local
1. Baixe: https://www.postgresql.org/download/windows/
2. Instale com senha: `postgres`
3. Crie banco: `guiaunico`

### Passo 4: Executar Configuração
Abra PowerShell na pasta do projeto e execute:

```powershell
# Permitir execução de scripts (apenas primeira vez)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Executar configuração automática
.\scripts\windows\setup-windows.ps1
```

### Passo 5: Configurar Conexão
Edite o arquivo `.env` e configure:

```env
# Cole sua URL do Supabase aqui:
DATABASE_URL=postgresql://postgres:[SENHA]@db.[PROJETO].supabase.co:5432/postgres

# Ou para PostgreSQL local:
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/guiaunico
```

### Passo 6: Iniciar Aplicação
```powershell
.\scripts\windows\dev-windows.ps1
```

## Acesso à Aplicação

- **URL:** http://localhost:5000
- **Login:** admin
- **Senha:** a definida em `ADMIN_INITIAL_PASSWORD` no `.env` (ou a exibida no console ao iniciar em desenvolvimento). Em produção, crie o admin com `npm run create-admin`.

## Funcionalidades Disponíveis

### Para Usuários
- Simulador interativo de planos
- Comparação de preços e benefícios
- Recomendações personalizadas
- Contato direto via WhatsApp

### Para Administradores
- Gestão de usuários
- Configuração de planos
- Relatórios e analytics
- Exportação de dados

## Solução de Problemas

### Erro: "Execution of scripts is disabled"
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Porta 5000 ocupada
No arquivo `.env`, mude para:
```env
PORT=3000
```

### Erro de conexão com banco
1. Verifique a URL no arquivo `.env`
2. Teste conectividade com: `.\scripts\windows\test-windows.ps1`
3. Para PostgreSQL local, verifique se o serviço está ativo

### Node.js não reconhecido
1. Reinstale o Node.js
2. Reinicie o PowerShell
3. Verifique com: `node --version`

## Scripts Disponíveis

- `.\scripts\windows\setup-windows.ps1` - Configuração inicial
- `.\scripts\windows\dev-windows.ps1` - Desenvolvimento local
- `.\scripts\windows\docker-local.ps1` - Usar com Docker
- `.\scripts\windows\test-windows.ps1` - Testar funcionalidades

## Estrutura do Projeto

```
guia-unico/
├── client/           # Interface do usuário (React)
├── server/           # API do servidor (Node.js)
├── shared/           # Código compartilhado
├── .env             # Configurações (CONFIGURAR!)
└── *.ps1           # Scripts do Windows
```

## Próximos Passos

1. **Personalize** os planos de saúde no painel admin
2. **Configure** integração WhatsApp (opcional)
3. **Teste** o simulador com dados reais
4. **Exporte** relatórios para análise

## Recursos Adicionais

- Documentação completa: `README.md`
- Deploy em produção: `docs/DEPLOYMENT.md`
- Arquivos Docker incluídos para deploy

## Suporte

Se encontrar dificuldades:
1. Execute `.\scripts\windows\test-windows.ps1` para diagnóstico
2. Verifique os logs no terminal
3. Confirme configuração do arquivo `.env`