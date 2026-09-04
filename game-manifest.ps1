#Requires -Version 5.1
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [ValidatePattern('^\d+\.\d+\.\d+$')]
    [string]$Version,

    [string]$Exe = (Join-Path $PSScriptRoot 'src-tauri\game\CLR.exe'),
    [string]$Repo = 'ShizunaSH/clr-game'
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path $Exe)) {
    throw "CLR.exe introuvable : $Exe"
}

$item = Get-Item $Exe
$hash = (Get-FileHash $Exe -Algorithm SHA256).Hash.ToLower()

$manifest = [ordered]@{
    version = $Version
    file    = 'CLR.exe'
    size    = $item.Length
    sha256  = $hash
    url     = "https://github.com/$Repo/releases/download/v$Version/CLR.exe"
}

$out = Join-Path $PSScriptRoot 'game.json'
$manifest | ConvertTo-Json -Depth 3 | Set-Content $out -Encoding utf8 -NoNewline

Write-Host "game.json ecrit : $out" -ForegroundColor Green
Write-Host "  version : $Version"
Write-Host "  taille  : $($item.Length) o"
Write-Host "  sha256  : $hash"
Write-Host "  url     : $($manifest.url)"
Write-Host ""
Write-Host "Release GitHub sur $Repo (tag v$Version) :"
Write-Host "  1. Uploade CLR.exe  +  game.json"
Write-Host "  2. Publie (pas brouillon) en cochant 'latest release'"
