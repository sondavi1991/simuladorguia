# Integração com Supabase

## Status Atual
A aplicação está configurada para usar o Supabase como banco de dados principal, com fallback automático para armazenamento em memória caso a conexão falhe.

## Configuração do Supabase

### 1. Criar Projeto no Supabase
1. Acesse [supabase.com](https://supabase.com)
2. Crie uma conta ou faça login
3. Clique em "New Project"
4. Escolha uma organização
5. Configure:
   - **Name**: health-insurance-simulator
   - **Database Password**: Crie uma senha forte (anote para usar depois)
   - **Region**: Escolha a região mais próxima (ex: South America)

### 2. Obter a Connection String
Após criar o projeto:
1. Vá para Settings → Database
2. Na seção "Connection string", copie a "URI" 
3. A URL deve ter este formato:
   ```
   postgresql://postgres.[ref]:[password]@db.[ref].supabase.co:5432/postgres
   ```
4. Substitua `[password]` pela senha que você criou

### 3. Configurar no Replit
1. No Replit, vá em Secrets (ícone de cadeado)
2. Crie uma nova secret:
   - **Key**: `DATABASE_URL`
   - **Value**: Cole a connection string completa do Supabase

### 4. Verificar Conexão
A aplicação tentará automaticamente conectar ao Supabase na próxima reinicialização. Você verá uma das mensagens:
- ✓ PostgreSQL connection successful
- ✗ PostgreSQL connection failed (fallback para memória)

## Configuração das Tabelas

### Opção 1: Automática (Recomendada)
Quando a conexão for estabelecida, execute:
```bash
npm run db:push
```

### Opção 2: Manual via SQL Editor
No painel do Supabase (SQL Editor), execute:

```sql
-- Tabela de usuários
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL
);

-- Tabela de submissions de formulário
CREATE TABLE form_submissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  birth_date VARCHAR(20) NOT NULL,
  zip_code VARCHAR(20) NOT NULL,
  plan_type VARCHAR(100) NOT NULL,
  price_range VARCHAR(50) NOT NULL,
  services TEXT[],
  dependents JSONB,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de passos do formulário
CREATE TABLE form_steps (
  id SERIAL PRIMARY KEY,
  step_number INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  fields JSONB,
  conditional_rules JSONB,
  navigation_rules JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de planos de saúde
CREATE TABLE health_plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  monthly_price DECIMAL(10,2) NOT NULL,
  features TEXT[],
  coverage VARCHAR(255) NOT NULL,
  is_recommended BOOLEAN DEFAULT FALSE,
  target_price_range VARCHAR(50) NOT NULL
);

-- Dados iniciais
INSERT INTO health_plans (name, description, monthly_price, features, coverage, is_recommended, target_price_range)
VALUES 
('Plano Saúde Premium', 'Cobertura completa com rede credenciada nacional', 450.00, 
 ARRAY['Consultas ilimitadas', 'Exames laboratoriais', 'Internação', 'Cirurgias'], 
 'Nacional', true, 'high'),
('Plano Saúde Essencial', 'Cobertura básica com foco em prevenção', 180.00, 
 ARRAY['Consultas básicas', 'Exames simples', 'Emergência'], 
 'Regional', true, 'low'),
('Plano Saúde Familiar', 'Ideal para famílias com desconto progressivo', 320.00, 
 ARRAY['Consultas', 'Pediatria', 'Ginecologia', 'Emergência'], 
 'Regional', true, 'medium');
```

## Solução de Problemas

### Erro: "getaddrinfo ENOTFOUND"
- Verifique se a URL está correta
- Confirme que o projeto Supabase está ativo
- Tente pausar/reativar o projeto no painel do Supabase

### Erro: "SASL authentication failed"
- Verifique se a senha está correta na connection string
- Certifique-se de não haver caracteres especiais mal codificados

### Erro: "SSL connection required"
- A aplicação já está configurada para SSL
- Verifique se está usando a porta 5432

## Benefícios da Integração
- **Persistência**: Dados são mantidos entre reinicializações
- **Backup**: Dados ficam seguros na nuvem
- **Escalabilidade**: Suporte a múltiplos usuários simultâneos
- **Interface**: Painel web para gerenciar dados diretamente

## Monitoramento
A aplicação mostra no console:
- Status da conexão na inicialização
- Logs de operações de banco de dados
- Fallback automático se necessário