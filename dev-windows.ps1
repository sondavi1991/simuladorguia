# Script para desenvolvimento no Windows
# Execute: .\dev-windows.ps1

Write-Host "🚀 Iniciando Guia Único - Desenvolvimento" -ForegroundColor Green

# Verificar se o arquivo .env existe
if (-not (Test-Path ".env")) {
    Write-Host "❌ Arquivo .env não encontrado!" -ForegroundColor Red
    Write-Host "Execute primeiro: .\setup-windows.ps1" -ForegroundColor Yellow
    exit 1
}

# Verificar se as dependências estão instaladas
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependências..." -ForegroundColor Yellow
    npm install
}

# Executar migrações do banco
Write-Host "🗄️ Sincronizando banco de dados..." -ForegroundColor Yellow
npm run db:push

# Iniciar servidor de desenvolvimento
Write-Host "🌐 Iniciando servidor de desenvolvimento..." -ForegroundColor Green
Write-Host "Acesse: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Login: admin / admin123" -ForegroundColor Cyan
Write-Host ""
Write-Host "Pressione Ctrl+C para parar o servidor" -ForegroundColor Yellow

npm run dev