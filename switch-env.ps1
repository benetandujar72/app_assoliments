# Script per alternar entre configuració de desenvolupament i producció
param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("dev", "prod")]
    [string]$Environment
)

Write-Host "🔄 Canviant a configuració de $Environment..." -ForegroundColor Yellow

if ($Environment -eq "dev") {
    # Copiar configuració de desenvolupament
    Copy-Item "config.dev.env" "config.env" -Force
    Write-Host "✅ Configuració de desenvolupament activada" -ForegroundColor Green
    Write-Host "📍 Base de dades: localhost" -ForegroundColor Cyan
    Write-Host "🔧 Mode: development" -ForegroundColor Cyan
} elseif ($Environment -eq "prod") {
    # La configuració de producció ja està en config.env
    Write-Host "✅ Configuració de producció activada" -ForegroundColor Green
    Write-Host "📍 Base de dades: dpg-d1t0j4er433s73eraf60-a.frankfurt-postgres.render.com" -ForegroundColor Cyan
    Write-Host "🔧 Mode: production" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "📋 Per reiniciar el servidor:" -ForegroundColor Yellow
Write-Host "   npm start" -ForegroundColor White
Write-Host ""
Write-Host "📋 Per verificar la connexió:" -ForegroundColor Yellow
Write-Host "   curl http://localhost:3000/api/health" -ForegroundColor White 