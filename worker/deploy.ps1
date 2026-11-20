<#
  Deploy script for Masry on GitHub Pages + Cloudflare Worker.
  Everything used here is FREE (Workers Free + KV Free + GitHub Pages).

  Usage:
    1) Open PowerShell in the worker folder.
    2) Set env vars (or let the script prompt you):
         $env:CLOUDFLARE_API_TOKEN = "TOKEN"
         $env:CLOUDFLARE_ACCOUNT_ID = "ACCOUNT_ID"
         $env:ADMIN_PASSWORD = "strong-password"
    3) Run:  .\deploy.ps1

  It creates the KV namespace, writes its id into wrangler.toml, sets the
  admin password, deploys the Worker, then updates <meta name="masry-api">
  in dev/index.html and admin/index.html with the Worker URL.
#>

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

function Read-EnvValue {
    $name = $args[0]
    $prompt = $args[1]
    $current = [Environment]::GetEnvironmentVariable($name)
    if ($current) { return $current }
    return (Read-Host $prompt).Trim()
}

Write-Host ""
Write-Host "== 1/6 Cloudflare credentials ==" -ForegroundColor Cyan

$pass = Read-EnvValue "ADMIN_PASSWORD" "Admin password"
if (-not $pass) { throw "Admin password is required." }

$env:WRANGLER_SEND_METRICS = "false"

# أولاً: جرّب الـ OAuth المحفوظ من `wrangler login` (أسهل طريق).
Write-Host "Checking Cloudflare login..." -ForegroundColor Gray
$who = & npx --yes wrangler whoami 2>&1 | Out-String
if ($LASTEXITCODE -ne 0) {
    # fallback: API token + account id من المتغيرات / الإدخال.
    $token   = Read-EnvValue "CLOUDFLARE_API_TOKEN" "Cloudflare API Token"
    $account = Read-EnvValue "CLOUDFLARE_ACCOUNT_ID" "Cloudflare Account ID"
    if (-not $token -or -not $account) {
        throw "Not logged in. Run `npx wrangler login` first, or provide token + account id."
    }
    $env:CLOUDFLARE_API_TOKEN = $token
    $env:CLOUDFLARE_ACCOUNT_ID = $account
    $who = & npx --yes wrangler whoami 2>&1 | Out-String
    if ($LASTEXITCODE -ne 0) {
        Write-Host $who
        throw "Bad token or Account ID."
    }
}
Write-Host "OK: account connected." -ForegroundColor Green

Write-Host ""
Write-Host "== 2/6 Create KV namespace ==" -ForegroundColor Cyan
$kvOut = & npx --yes wrangler kv namespace create MASRY_KV 2>&1 | Out-String
if ($LASTEXITCODE -ne 0) {
    Write-Host $kvOut
    throw "Failed to create KV namespace."
}

$kvId = $null
$m = [regex]::Match($kvOut, '"id"\s*:\s*"([a-f0-9]{32})"')
if (-not $m.Success) { $m = [regex]::Match($kvOut, 'id\s*=\s*"([a-f0-9]{32})"') }
if (-not $m.Success) { $m = [regex]::Match($kvOut, '\b([a-f0-9]{32})\b') }
if ($m.Success) { $kvId = $m.Groups[1].Value }
if (-not $kvId) {
    Write-Host $kvOut
    $kvId = (Read-Host "Could not find KV id, paste it here").Trim()
}
Write-Host "KV ID = $kvId" -ForegroundColor Green

Write-Host ""
Write-Host "== 3/6 Update wrangler.toml ==" -ForegroundColor Cyan
$tomlPath = Join-Path $PSScriptRoot "wrangler.toml"
$toml = Get-Content $tomlPath -Raw
$toml = $toml -replace "PUT_KV_NAMESPACE_ID_HERE", $kvId
[System.IO.File]::WriteAllText($tomlPath, $toml, (New-Object System.Text.UTF8Encoding($false)))
Write-Host "OK." -ForegroundColor Green

Write-Host ""
Write-Host "== 4/6 Set admin password ==" -ForegroundColor Cyan
$pass | & npx --yes wrangler secret put ADMIN_PASSWORD 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) { throw "Failed to set ADMIN_PASSWORD." }
Write-Host "OK." -ForegroundColor Green

Write-Host ""
Write-Host "== 5/6 Deploy Worker ==" -ForegroundColor Cyan
$deployOut = & npx --yes wrangler deploy 2>&1 | Out-String
if ($LASTEXITCODE -ne 0) {
    Write-Host $deployOut
    throw "Deploy failed."
}

$workerUrl = $null
$u = [regex]::Match($deployOut, 'https://[A-Za-z0-9._-]+\.workers\.dev')
if (-not $u.Success) { $u = [regex]::Match($deployOut, 'https://[A-Za-z0-9._-]+\.[A-Za-z0-9-]+\.com') }
if ($u.Success) { $workerUrl = ($u.Value -replace '/+$','') }
if (-not $workerUrl) {
    Write-Host $deployOut
    $workerUrl = (Read-Host "Could not find Worker URL, paste it here (no trailing slash)").Trim()
}
Write-Host "Worker = $workerUrl" -ForegroundColor Green

Write-Host ""
Write-Host "== 6/6 Update API URLs in the site ==" -ForegroundColor Cyan
$files = @(
    (Join-Path $PSScriptRoot "..\dev\index.html"),
    (Join-Path $PSScriptRoot "..\admin\index.html")
)
foreach ($f in $files) {
    if (-not (Test-Path $f)) { Write-Host "Missing: $f" -ForegroundColor Yellow; continue }
    $c = Get-Content $f -Raw
    $c = [regex]::Replace($c, '(<meta name="masry-api" content=")[^"]*(")', {
        param($m)
        $m.Groups[1].Value + $workerUrl + "/" + $m.Groups[2].Value
    })
    [System.IO.File]::WriteAllText($f, $c, (New-Object System.Text.UTF8Encoding($false)))
    Write-Host "Updated: $f" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deploy complete - all free tiers." -ForegroundColor Green
Write-Host "Host:  https://faslaanime.github.io/dev/index.html"
Write-Host "Admin: https://faslaanime.github.io/admin/"
Write-Host "API:   $workerUrl/api/v1/config"
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Now commit and push: dev/index.html, admin/index.html, wrangler.toml"
