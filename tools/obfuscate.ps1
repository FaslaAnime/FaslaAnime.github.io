<#
  Obfuscate/minify the client-side JavaScript for Masry.
  The original .js files stay as readable source; the site loads .min.js.

  Run from anywhere:
    powershell -ExecutionPolicy Bypass -File tools\obfuscate.ps1

  Requires internet the first time (npx downloads terser). Free forever.
#>

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$files = @(
    "app.js",
    "redirect.js",
    "dev\dev.js",
    "dev\license.js",
    "admin\admin.js"
)

foreach ($f in $files) {
    $src = Join-Path $root $f
    if (-not (Test-Path $src)) { Write-Host "Skip (missing): $f"; continue }
    $out = [System.IO.Path]::Combine([System.IO.Path]::GetDirectoryName($src),
        [System.IO.Path]::GetFileNameWithoutExtension($src) + ".min.js")
    npx --yes terser $src --compress --mangle --output $out
    if ($LASTEXITCODE -ne 0) { throw "Terser failed on $f" }
    $before = (Get-Item $src).Length
    $after = (Get-Item $out).Length
    Write-Host ("Obfuscated {0}: {1} -> {2} bytes" -f $f, $before, $after)
}

Write-Host "Done. Commit the generated .min.js files along with the HTML changes."
