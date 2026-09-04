#Requires -Version 5.1
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [ValidatePattern('^\d+\.\d+\.\d+$')]
    [string]$Version
)

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$conf = Join-Path $root 'src-tauri\tauri.conf.json'
$cargo = Join-Path $root 'src-tauri\Cargo.toml'
$keyFile = Join-Path $root '.tauri-keys\naglfar.key'

if (-not (Test-Path $keyFile)) {
    throw "Cle de signature introuvable : $keyFile"
}

Write-Host "==> Passage en version $Version" -ForegroundColor Cyan

$confText = Get-Content $conf -Raw
$confText = [regex]::Replace($confText, '("version"\s*:\s*")\d+\.\d+\.\d+(")', "`${1}$Version`${2}", 1)
Set-Content $conf $confText -Encoding utf8 -NoNewline

$cargoText = Get-Content $cargo -Raw
$cargoText = [regex]::Replace($cargoText, '(?m)^(version\s*=\s*")\d+\.\d+\.\d+(")', "`${1}$Version`${2}")
Set-Content $cargo $cargoText -Encoding utf8 -NoNewline

Write-Host "==> Build signe (peut prendre 1-2 min)" -ForegroundColor Cyan
$env:TAURI_SIGNING_PRIVATE_KEY = (Get-Content $keyFile -Raw).Trim()
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = ''
Push-Location $root
try {
    & cargo clean -p app --manifest-path src-tauri/Cargo.toml | Out-Null
    & npx tauri build
    if ($LASTEXITCODE -ne 0) { throw "Le build a echoue (code $LASTEXITCODE)" }
}
finally {
    Pop-Location
}

$setup = Join-Path $root "src-tauri\target\release\bundle\nsis\Naglfar Launcher_${Version}_x64-setup.exe"
$sig = "$setup.sig"
if (-not (Test-Path $setup) -or -not (Test-Path $sig)) {
    throw "Installeur ou signature introuvable pour la version $Version"
}

$outDir = Join-Path $root "release-v$Version"
if (Test-Path $outDir) { Remove-Item $outDir -Recurse -Force }
New-Item $outDir -ItemType Directory | Out-Null

$assetName = "Naglfar_${Version}_x64-setup.exe"
Copy-Item $setup (Join-Path $outDir $assetName)

$latest = [ordered]@{
    version   = $Version
    notes     = "Mise a jour $Version du launcher Naglfar."
    pub_date  = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
    platforms = [ordered]@{
        'windows-x86_64' = [ordered]@{
            signature = (Get-Content $sig -Raw).Trim()
            url       = "https://github.com/ShizunaSH/naglfar-launcher/releases/download/v$Version/$assetName"
        }
    }
}
$latest | ConvertTo-Json -Depth 6 | Set-Content (Join-Path $outDir 'latest.json') -Encoding utf8

Write-Host ""
Write-Host "==> Pret : $outDir" -ForegroundColor Green
Write-Host "   1. Cree une release GitHub avec le tag v$Version"
Write-Host "   2. Uploade les 2 fichiers : $assetName  +  latest.json"
Write-Host "   3. Publie (pas brouillon) en cochant 'latest release'"
