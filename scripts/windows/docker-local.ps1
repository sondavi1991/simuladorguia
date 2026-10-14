# Script para rodar com Docker no Windows
# Execute: .\scripts\windows\docker-local.ps1

Write-Host "🐳 Iniciando Guia Único com Docker" -ForegroundColor Green

# Verificar se Docker está instalado
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker encontrado: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker não encontrado. Instale Docker Desktop de https://www.docker.com/products/docker-desktop/" -ForegroundColor Red
    exit 1
}

# Verificar se arquivo .env existe
if (-not (Test-Path ".env")) {
    Write-Host "📝 Criando arquivo .env..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    
    # Configurar para Docker
    $envContent = Get-Content ".env"
    $envContent = $envContent -replace "DATABASE_URL=.*", "DATABASE_URL=postgresql://postgres:postgres@db:5432/guiaunico"
    $envContent | Set-Content ".env"
    
    Write-Host "✅ Arquivo .env configurado para Docker" -ForegroundColor Green
}

# Parar containers existentes
Write-Host "🛑 Parando containers existentes..." -ForegroundColor Yellow
docker-compose down

# Construir e iniciar containers
Write-Host "🔨 Construindo e iniciando containers..." -ForegroundColor Yellow
docker-compose up --build -d

# Aguardar containers iniciarem
Write-Host "⏳ Aguardando containers iniciarem..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Verificar status
Write-Host "📊 Status dos containers:" -ForegroundColor Cyan
docker-compose ps

Write-Host ""
Write-Host "🎉 Aplicação iniciada com Docker!" -ForegroundColor Green
Write-Host "🌐 Acesse: http://localhost:5000" -ForegroundColor Cyan
Write-Host "👤 Crie o admin com: npm run create-admin -- admin" -ForegroundColor Cyan
Write-Host ""
Write-Host "Comandos úteis:" -ForegroundColor Yellow
Write-Host "docker-compose logs app    # Ver logs da aplicação" -ForegroundColor White
Write-Host "docker-compose down        # Parar containers" -ForegroundColor White
Write-Host "docker-compose restart     # Reiniciar containers" -ForegroundColor White