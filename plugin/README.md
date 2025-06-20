# Bulbo Raiz - Sistema de Distribuidores

Plugin WordPress que integra com o sistema Bulbo Raiz Laravel para cadastrar leads e encontrar distribuidores por localização geográfica, retornando automaticamente o WhatsApp do distribuidor responsável pela região.

## Funcionalidades

- ✅ Formulário de contato com design moderno e responsivo
- ✅ Cadastro de leads no sistema Laravel
- ✅ Busca automática por distribuidores na região
- ✅ Retorno do WhatsApp do distribuidor encontrado
- ✅ Interface administrativa completa
- ✅ Sistema de cache para melhor performance
- ✅ Validação em tempo real dos campos
- ✅ Logs de debug configuráveis

## Instalação

1. Faça upload dos arquivos do plugin para `/wp-content/plugins/bulbo-raiz/`
2. Ative o plugin através do menu 'Plugins' no WordPress
3. Configure as opções em 'Configurações > Bulbo Raiz'

## Configuração

### 1. Configurações da API
- **URL da API Laravel**: Configure a URL base da sua API Laravel (ex: `https://seudominio.com/api`)
- **Email/Senha**: Credenciais para autenticação no Laravel
- **Token**: Gerado automaticamente após configurar email/senha

### 2. Configurações do Formulário
- **WhatsApp Padrão**: Número usado quando nenhum distribuidor é encontrado
- **Tema**: Claro ou escuro (padrão: claro)

### 3. Configurações Avançadas
- **Modo Debug**: Ativa logs detalhados
- **Cache**: Duração do cache em minutos

## Uso

### Shortcode Básico
```
[bulbo_raiz_form]
```

### Shortcode com Atributos
```
[bulbo_raiz_form theme="light" show_title="true"]
```

### Atributos Disponíveis
- `theme` - Tema do formulário (`light` ou `dark`)
- `show_title` - Mostrar título (`true` ou `false`)

## Estrutura do Formulário

O formulário contém os seguintes campos:

1. **Tipo de Atendimento** (dropdown) - *obrigatório*
   - Vendas
   - Suporte Técnico
   - Comercial
   - Distribuição
   - Outros

2. **Nome** (texto) - *obrigatório*
3. **Email** (email) - *obrigatório*
4. **Estado Federal** (texto) - *obrigatório*
5. **Cidade** (texto) - *obrigatório*
6. **Bairro** (texto) - *obrigatório*

## Fluxo de Funcionamento

1. **Usuário preenche o formulário** com suas informações
2. **Plugin envia dados** para a API Laravel
3. **Laravel cadastra o lead** no banco de dados
4. **Laravel busca distribuidor** responsável pela região (estado/cidade/bairro)
5. **Plugin retorna resultado**:
   - Se **distribuidor encontrado**: Nome, região e WhatsApp do distribuidor
   - Se **nenhum distribuidor**: Mensagem de contato da equipe e WhatsApp padrão

## API Endpoints Esperados

O plugin espera que sua API Laravel tenha os seguintes endpoints:

### POST /api/leads
Cadastra um novo lead
```json
{
    "service_type": "vendas",
    "name": "João Silva",
    "email": "joao@email.com",
    "state": "São Paulo",
    "city": "São Paulo",
    "neighborhood": "Vila Mariana",
    "source": "wordpress_plugin"
}
```

### POST /api/distributors/search
Busca distribuidor por localização
```json
{
    "state": "São Paulo",
    "city": "São Paulo", 
    "neighborhood": "Vila Mariana",
    "service_type": "vendas"
}
```

**Resposta esperada quando encontrado:**
```json
{
    "success": true,
    "distributor": {
        "name": "João Distribuidor",
        "whatsapp": "(11) 99999-9999",
        "coverage_area": "São Paulo - Zona Sul"
    }
}
```

## Estilização

O plugin vem com um design moderno inspirado na identidade visual da Bulbo Raiz:

- **Cores**: Verde esmeralda (#10b981) como cor principal
- **Layout**: Responsivo e mobile-friendly
- **Tipografia**: System fonts para melhor performance
- **Animações**: Transições suaves e feedback visual

## Validação

- Validação em tempo real dos campos
- Feedback visual (bordas verdes/vermelhas)
- Mensagens de erro específicas
- Prevenção de envio com dados inválidos

## Performance

- Cache inteligente de dados
- Carregamento otimizado de scripts
- Requisições AJAX assíncronas
- Compressão de assets

## Suporte

Para dúvidas ou problemas:
1. Ative o **Modo Debug** nas configurações
2. Verifique os logs do WordPress
3. Teste a conexão com a API
4. Verifique se o Laravel está rodando corretamente

## Changelog

### v1.0.0
- Lançamento inicial
- Formulário completo com todos os campos
- Integração com API Laravel
- Sistema de busca por distribuidores
- Interface administrativa
- Validação em tempo real
- Design responsivo

## 🎯 Como Usar

### Shortcode Básico
```
[bulbo_raiz_form]
```

### Shortcode Personalizado
```
[bulbo_raiz_form 
    title="Encontre seu Distribuidor" 
    subtitle="Preencha seus dados abaixo"
    button_text="Buscar Agora"
    theme="light"
    show_title="true"]
```

### Parâmetros Disponíveis
- `title` - Título do formulário
- `subtitle` - Subtítulo explicativo
- `button_text` - Texto do botão de envio
- `theme` - Tema visual (light/dark)
- `show_title` - Exibir título (true/false)

## 🔧 Requisitos

- **WordPress**: 5.0 ou superior
- **PHP**: 7.4 ou superior
- **Sistema Bulbo Raiz Laravel**: Rodando e acessível
- **jQuery**: Incluído no WordPress

## 🌐 Integração com Laravel

O plugin se conecta com os seguintes endpoints da API:

- `GET /geography/states` - Lista de estados
- `GET /geography/cities?state_id={id}` - Cidades por estado
- `GET /geography/neighborhoods?city_id={id}` - Bairros por cidade
- `POST /leads/webhook` - Criação de lead e retorno do WhatsApp

## 📊 Funcionalidades Avançadas

### Cache Inteligente
- Cache automático de estados, cidades e bairros
- Configurável de 0 a 1440 minutos
- Limpeza manual via admin

### Estatísticas
- Formulários renderizados
- Leads enviados
- Taxa de sucesso
- Monitoramento em tempo real

### Modo Debug
- Logs detalhados no console
- Informações de requisições
- Diagnóstico de erros

## 🎨 Personalização

### CSS Customizado
Adicione CSS personalizado no seu tema:

```css
.bulbo-raiz-form {
    /* Seus estilos aqui */
}

.bulbo-raiz-form.theme-dark {
    /* Tema escuro */
}
```

### Hooks WordPress
```php
// Filtrar dados antes do envio
add_filter('bulbo_raiz_form_data', function($data) {
    // Modificar $data
    return $data;
});

// Ação após envio bem-sucedido
add_action('bulbo_raiz_lead_sent', function($response) {
    // Processar resposta
});
```

## 🔒 Segurança

- Validação de nonce em todas as requisições AJAX
- Sanitização de dados de entrada
- Verificação de permissões de usuário
- Escape de saída HTML
- Rate limiting via cache

## 🐛 Solução de Problemas

### Erro de Conexão
1. Verifique se a API Laravel está rodando
2. Confirme a URL da API nas configurações
3. Teste a conexão no painel admin
4. Verifique logs de erro do WordPress

### Campos não carregam
1. Limpe o cache do plugin
2. Verifique se há erros JavaScript no console
3. Confirme se jQuery está carregado
4. Teste com tema padrão do WordPress

### Formulário não envia
1. Verifique se todos os campos obrigatórios estão preenchidos
2. Confirme se o endpoint webhook está funcionando
3. Ative o modo debug para mais informações
4. Verifique logs do servidor

## 📞 Suporte

Para suporte técnico:
- **Email**: suporte@bulboraiz.com.br
- **Website**: https://bulboraiz.com.br
- **Documentação**: Incluída no plugin

## 📄 Licença

GPL v2 ou posterior - https://www.gnu.org/licenses/gpl-2.0.html

## 🔄 Changelog

### v1.0.0
- Lançamento inicial
- Integração completa com API Laravel
- Formulário dinâmico com localização
- Painel de administração
- Sistema de cache
- Estatísticas de uso
- Temas personalizáveis

## Configuração de Autenticação

### 1. Configuração no Laravel (Backend)

#### Opção 1: Autenticação via Token Bearer (Recomendado)
1. Configure as credenciais de um usuário admin no plugin WordPress
2. O plugin irá automaticamente gerar e renovar tokens de autenticação
3. Tokens são válidos por 30 dias e renovados automaticamente

#### Opção 2: Autenticação via Chave API
1. No arquivo `.env` do Laravel, adicione:
```env
WORDPRESS_API_KEY=sua-chave-api-segura-aqui
```

2. Gere uma chave segura (exemplo):
```bash
php -r "echo bin2hex(random_bytes(32));"
```

### 2. Configuração no WordPress (Plugin)

1. Acesse **Configurações > Bulbo Raiz** no admin do WordPress
2. Configure a **URL da API Laravel** (ex: `http://localhost:8000/api`)

#### Para Autenticação via Token:
3. Preencha **Email** e **Senha** de um usuário admin do Laravel
4. Clique em **"Gerar Token"** para autenticação automática
5. O token será renovado automaticamente quando necessário

#### Para Autenticação via Chave API:
3. Preencha o campo **"Chave API WordPress"** com a mesma chave configurada no Laravel

### 3. Testando a Conexão

1. Clique no botão **"Testar Conexão"** no painel do plugin
2. Verifique se a conexão está funcionando corretamente
3. O status da conexão será exibido na sidebar

## Rotas Disponíveis

### Rotas Públicas (sem autenticação)
- `GET /api/wp/states` - Lista estados
- `GET /api/wp/cities` - Lista cidades por estado
- `GET /api/wp/neighborhoods` - Lista bairros por cidade
- `POST /api/leads/webhook` - Criação de leads

### Rotas Protegidas (requer autenticação)
- `GET /api/geography/states` - Estados com autenticação
- `GET /api/geography/cities` - Cidades com autenticação
- `GET /api/geography/neighborhoods` - Bairros com autenticação

## Uso do Shortcode

```php
[bulbo_raiz_form]
```

### Parâmetros disponíveis:
- `title` - Título do formulário
- `subtitle` - Subtítulo
- `button_text` - Texto do botão
- `theme` - Tema (light/dark)
- `show_title` - Mostrar título (true/false)

### Exemplo:
```php
[bulbo_raiz_form title="Encontre seu Distribuidor" button_text="Buscar Agora"]
```

## Troubleshooting

### Erro 401 (Não autorizado)
- Verifique se o token não expirou
- Clique em "Renovar" token
- Verifique se a chave API está correta

### Erro 403 (Proibido)
- Verifique se a chave API no WordPress é igual à do Laravel
- Verifique se o usuário tem permissões adequadas

### Erro 404 (Não encontrado)
- Verifique se a URL da API está correta
- Verifique se o Laravel está rodando

### Token expirando constantemente
- Verifique se as credenciais de email/senha estão corretas
- Verifique se o usuário existe e está ativo no Laravel

## Logs de Debug

Para ativar logs de debug:
1. Marque **"Modo Debug"** nas configurações avançadas
2. Abra o console do navegador para ver logs detalhados
3. Verifique os logs do WordPress em `wp-content/debug.log`

