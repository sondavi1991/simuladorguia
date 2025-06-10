# Script de configuração para Windows PowerShell
# Execute como administrador: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

Write-Host "🚀 Configurando Guia Único - Sistema de Simulação de Planos de Saúde" -ForegroundColor Green
Write-Host "===============================================================" -ForegroundColor Green

# Verificar se o Node.js está instalado
Write-Host "📋 Verificando pré-requisitos..." -ForegroundColor Yellow

try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js encontrado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js não encontrado. Por favor, instale o Node.js 20+ de https://nodejs.org/" -ForegroundColor Red
    exit 1
}

try {
    $npmVersion = npm --version
    Write-Host "✅ npm encontrado: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm não encontrado. Instale o Node.js que inclui o npm." -ForegroundColor Red
    exit 1
}

# Verificar se o PostgreSQL está disponível
Write-Host "🔍 Verificando PostgreSQL..." -ForegroundColor Yellow
try {
    $pgVersion = psql --version 2>$null
    if ($pgVersion) {
        Write-Host "✅ PostgreSQL encontrado: $pgVersion" -ForegroundColor Green
    } else {
        Write-Host "⚠️ PostgreSQL não encontrado. Você pode:" -ForegroundColor Yellow
        Write-Host "   1. Instalar PostgreSQL localmente" -ForegroundColor Yellow
        Write-Host "   2. Usar Docker para PostgreSQL" -ForegroundColor Yellow
        Write-Host "   3. Usar um serviço em nuvem (Supabase, Neon, etc.)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ PostgreSQL não encontrado no PATH" -ForegroundColor Yellow
}

# Instalar dependências
Write-Host "📦 Instalando dependências..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependências instaladas com sucesso!" -ForegroundColor Green
} else {
    Write-Host "❌ Erro ao instalar dependências" -ForegroundColor Red
    exit 1
}

# Verificar se existe arquivo .env
if (Test-Path ".env") {
    Write-Host "✅ Arquivo .env encontrado" -ForegroundColor Green
} else {
    Write-Host "📝 Criando arquivo .env baseado no exemplo..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "⚠️ Configure as variáveis de ambiente no arquivo .env antes de continuar" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Configuração concluída!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Configure o arquivo .env com suas credenciais de banco" -ForegroundColor White
Write-Host "2. Execute: npm run db:push (para criar as tabelas)" -ForegroundColor White
Write-Host "3. Execute: npm run dev (para iniciar o servidor)" -ForegroundColor White
Write-Host ""
Write-Host "🌐 A aplicação estará disponível em: http://localhost:5000" -ForegroundColor Cyan
Write-Host "👤 Login padrão: admin / admin123" -ForegroundColor Cyan