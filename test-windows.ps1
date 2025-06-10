# Script de teste para Windows
# Execute: .\test-windows.ps1

Write-Host "🧪 Testando Guia Único - Sistema de Simulação" -ForegroundColor Green

# Verificar se o servidor está rodando
Write-Host "🔍 Verificando se o servidor está ativo..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method Get -TimeoutSec 5
    Write-Host "✅ Servidor ativo!" -ForegroundColor Green
    Write-Host "Status: $($response.status)" -ForegroundColor Cyan
    Write-Host "Ambiente: $($response.environment)" -ForegroundColor Cyan
    Write-Host "Uptime: $([math]::Round($response.uptime/60, 2)) minutos" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Servidor não está respondendo em http://localhost:5000" -ForegroundColor Red
    Write-Host "Execute primeiro: .\dev-windows.ps1" -ForegroundColor Yellow
    exit 1
}

# Testar conexão com banco
Write-Host "🗄️ Testando conexão com banco..." -ForegroundColor Yellow
try {
    $dbTest = Invoke-RestMethod -Uri "http://localhost:5000/api/health-plans" -Method Get -TimeoutSec 5
    Write-Host "✅ Banco de dados conectado!" -ForegroundColor Green
    Write-Host "Planos encontrados: $($dbTest.Count)" -ForegroundColor Cyan
} catch {
    Write-Host "⚠️ Possível problema com banco de dados" -ForegroundColor Yellow
    Write-Host "Verifique a configuração DATABASE_URL no arquivo .env" -ForegroundColor Yellow
}

# Testar autenticação
Write-Host "🔐 Testando sistema de autenticação..." -ForegroundColor Yellow
try {
    $loginData = @{
        username = "admin"
        password = "admin123"
    } | ConvertTo-Json

    $session = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" -Method Post -Body $loginData -ContentType "application/json" -SessionVariable webSession
    
    if ($session.StatusCode -eq 200) {
        Write-Host "✅ Login funcionando!" -ForegroundColor Green
        
        # Testar acesso autenticado
        $userInfo = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/me" -Method Get -WebSession $webSession
        Write-Host "Usuário logado: $($userInfo.user.username)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "⚠️ Problema com autenticação" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎯 Resumo dos Testes:" -ForegroundColor Green
Write-Host "📱 Frontend: http://localhost:5000" -ForegroundColor White
Write-Host "🔧 API Health: http://localhost:5000/api/health" -ForegroundColor White
Write-Host "👤 Login: admin / admin123" -ForegroundColor White
Write-Host ""
Write-Host "📋 Funcionalidades Principais:" -ForegroundColor Cyan
Write-Host "• Simulador de planos de saúde" -ForegroundColor White
Write-Host "• Painel administrativo" -ForegroundColor White
Write-Host "• Sistema de recomendações" -ForegroundColor White
Write-Host "• Exportação para Excel" -ForegroundColor White
Write-Host "• Integração WhatsApp" -ForegroundColor White