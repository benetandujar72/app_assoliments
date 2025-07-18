# Script per crear un repositori a GitHub via GitHub CLI
# Requereix GitHub CLI instal·lat: https://cli.github.com/

Write-Host "🚀 Creant repositori a GitHub..." -ForegroundColor Green

# Verificar si GitHub CLI està instal·lat
try {
    gh --version | Out-Null
    Write-Host "✅ GitHub CLI detectat" -ForegroundColor Green
} catch {
    Write-Host "❌ GitHub CLI no està instal·lat" -ForegroundColor Red
    Write-Host "Si us plau, instal·la GitHub CLI des de: https://cli.github.com/" -ForegroundColor Yellow
    Write-Host "O crea el repositori manualment a: https://github.com/new" -ForegroundColor Yellow
    exit 1
}

# Verificar si estàs autenticat
try {
    gh auth status | Out-Null
    Write-Host "✅ Autenticat amb GitHub" -ForegroundColor Green
} catch {
    Write-Host "❌ No estàs autenticat amb GitHub" -ForegroundColor Red
    Write-Host "Executant: gh auth login" -ForegroundColor Yellow
    gh auth login
}

# Crear el repositori
Write-Host "📦 Creant repositori 'app_assoliments'..." -ForegroundColor Yellow

try {
    gh repo create app_assoliments --public --description "Dashboard d'Assoliments - Aplicació per visualitzar i analitzar dades d'assoliments acadèmics amb Docker i PostgreSQL" --source=. --remote=origin --push
    Write-Host "✅ Repositori creat i codi pujat correctament!" -ForegroundColor Green
    Write-Host "🌐 URL del repositori: https://github.com/bandujar72/app_assoliments" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Error creant el repositori" -ForegroundColor Red
    Write-Host "Si us plau, crea el repositori manualment a: https://github.com/new" -ForegroundColor Yellow
    Write-Host "Nom del repositori: app_assoliments" -ForegroundColor Yellow
    Write-Host "Despres executa: git push -u origin master" -ForegroundColor Yellow
} 