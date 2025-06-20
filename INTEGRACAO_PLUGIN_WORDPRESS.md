# Integração de Autenticação - Plugin WordPress

Este documento explica as modificações feitas para implementar a mesma estratégia de autenticação do frontend React no plugin WordPress.

## Problema Original

O plugin WordPress não conseguia se autenticar com o backend Laravel, impedindo a sincronização de dados geográficos (estados, cidades, bairros) e o acesso às rotas protegidas.

## Solução Implementada

### 1. Configuração de CORS no Backend

**Arquivo:** `back/config/cors.php`

Adicionado o domínio do plugin WordPress à lista de origens permitidas:
```php
'allowed_origins' => [
    // ... outras origens
    'https://criacao.davimanoel.com.br/bulbowp', // Plugin WordPress em produção
],
```

### 2. Atualização da Função de API Request

**Arquivo:** `plugin/bulbo-raiz.php`

Modificada a função `api_request()` para:
- Aceitar um parâmetro `$require_auth` (default: true)
- Adicionar Bearer token automaticamente quando necessário
- Implementar refresh automático de token em caso de expiração (401)
- Usar rotas públicas quando apropriado (estados, cidades, bairros)

```php
private function api_request($endpoint, $data = null, $method = 'GET', $require_auth = true) {
    // ... código anterior ...
    
    // Add Bearer token if authentication is required
    if ($require_auth) {
        $token = $this->get_valid_token();
        if (!$token) {
            return false;
        }
        $args['headers']['Authorization'] = 'Bearer ' . $token;
    }
    
    // ... resto da implementação ...
}
```

### 3. Nova Função de Gerenciamento de Token

**Arquivo:** `plugin/bulbo-raiz.php`

Adicionada função `get_valid_token()` que:
- Verifica se existe token válido
- Renova automaticamente se expirado
- Retorna false se não conseguir autenticar

### 4. Atualização das Chamadas de API

Todas as chamadas de API foram atualizadas para especificar se precisam de autenticação:

```php
// Rotas públicas (não precisam de auth)
$api_states = $this->api_request('geography/states', null, 'GET', false);
$api_cities = $this->api_request("geography/cities?state_id=" . $state_id, null, 'GET', false);
$lead_response = $this->api_request('leads/webhook', $data, 'POST', false);

// Rotas que podem precisar de auth no futuro
$response = $this->api_request('/admin/data', null, 'GET', true);
```

### 5. Configuração Centralizada

**Arquivos:** `plugin/bulbo-raiz-config.php`

Criada classe de configuração que:
- Detecta automaticamente ambiente (produção vs desenvolvimento)
- Define URLs da API baseadas no ambiente
- Fornece configurações de autenticação centralizadas

### 6. JavaScript Atualizado

**Arquivo:** `plugin/assets/js/bulbo-raiz.js`

Adicionado objeto `BulboRaizAuth` similar ao frontend que:
- Pode fazer requisições autenticadas direto para a API
- Inclui funcionalidade de teste de conexão
- Mantém compatibilidade com o sistema AJAX existente

### 7. URLs de Produção Configuradas

As seguintes URLs estão configuradas:

- **Backend API:** `https://bakbulbo.sitesobmedida.com.br/api`
- **Frontend:** `https://criacao.davimanoel.com.br/appbulbo/`
- **Plugin WordPress:** `https://criacao.davimanoel.com.br/bulbowp`

## Rotas Públicas Utilizadas

O plugin utiliza as seguintes rotas públicas (sem necessidade de autenticação):

- `GET /api/geography/states` - Lista de estados
- `GET /api/geography/cities?state_id={id}` - Cidades por estado
- `GET /api/geography/neighborhoods?city_id={id}` - Bairros por cidade
- `POST /api/leads/webhook` - Criação de leads
- `GET /api/distributors/search` - Busca de distribuidores

## Como Testar

### 1. Verificar CORS
```bash
curl -H "Origin: https://criacao.davimanoel.com.br/bulbowp" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://bakbulbo.sitesobmedida.com.br/api/test
```

### 2. Testar Conexão do Plugin
No WordPress, ativar debug no plugin e verificar:
- Admin → Configurações → Bulbo Raiz
- Habilitar "Modo Debug"
- Fazer teste de conexão

### 3. Verificar Logs
Verificar logs do WordPress em `wp-content/debug.log` para mensagens do tipo:
```
Bulbo Raiz: Fazendo requisição para: https://bakbulbo.sitesobmedida.com.br/api/geography/states
Bulbo Raiz: Resposta - Status: 200
```

## Configuração de Produção

### Backend (.env)
```env
CORS_ALLOWED_ORIGINS="https://criacao.davimanoel.com.br,https://criacao.davimanoel.com.br/appbulbo,https://criacao.davimanoel.com.br/bulbowp"
```

### Plugin WordPress
Na interface administrativa, configurar:
- **URL da API Laravel:** `https://bakbulbo.sitesobmedida.com.br/api`
- **Email para Autenticação:** [email do usuário admin]
- **Senha para Autenticação:** [senha do usuário admin]

## Benefícios da Implementação

1. **Consistência:** Mesma estratégia de autenticação do frontend
2. **Segurança:** Bearer tokens com refresh automático
3. **Flexibilidade:** Suporte tanto para rotas públicas quanto privadas
4. **Debugging:** Logs detalhados para troubleshooting
5. **Manutenibilidade:** Configuração centralizada

## Próximos Passos

1. Testar sincronização completa em produção
2. Monitorar logs para identificar possíveis problemas
3. Implementar cache para melhorar performance
4. Adicionar retry automático em caso de falhas de rede

## Troubleshooting

### Plugin não consegue conectar
1. Verificar se CORS está configurado corretamente
2. Verificar se URL da API está correta nas configurações
3. Verificar logs do WordPress para erros detalhados

### Token expira muito rápido
1. Verificar configuração de expiração no Laravel Sanctum
2. Ajustar configuração de refresh automático
3. Verificar se credenciais de login estão corretas 