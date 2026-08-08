# Sets production environment variables on Vercel for fc26-test-auctions.
# Prerequisites:
#   1. npm i -g vercel
#   2. vercel login
#   3. vercel link   (select the fc26-test-auctions project)
#
# Usage (from repo root):
#   powershell -ExecutionPolicy Bypass -File scripts/set-vercel-production-env.ps1

$ErrorActionPreference = "Stop"

$productionUrl = "https://fc26-test-auctions.vercel.app"
$envLocalPath = Join-Path $PSScriptRoot ".." ".env.local" | Resolve-Path -ErrorAction SilentlyContinue

if (-not $envLocalPath) {
  Write-Error ".env.local not found. Create it from .env.example first."
}

$envValues = @{}
Get-Content $envLocalPath | ForEach-Object {
  if ($_ -match '^\s*([^#=]+)=(.*)$') {
    $envValues[$matches[1].Trim()] = $matches[2].Trim()
  }
}

$mongodbUri = $envValues["MONGODB_URI"]
$authSecret = $envValues["AUTH_SECRET"]

if (-not $mongodbUri -or -not $authSecret) {
  Write-Error ".env.local must contain MONGODB_URI and AUTH_SECRET"
}

Write-Host "Linking project if needed..."
vercel link --yes 2>$null

function Set-VercelEnv($name, $value) {
  Write-Host "Setting $name (production)..."
  $value | vercel env add $name production --force
}

Set-VercelEnv "MONGODB_URI" $mongodbUri
Set-VercelEnv "AUTH_SECRET" $authSecret
Set-VercelEnv "AUTH_URL" $productionUrl
Set-VercelEnv "NEXT_PUBLIC_APP_URL" $productionUrl

Write-Host ""
Write-Host "Done. Redeploy production:"
Write-Host "  vercel --prod"
Write-Host ""
Write-Host "Production site: $productionUrl"
