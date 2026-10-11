#Requires -Version 5.1
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [ValidatePattern('^\d+\.\d+\.\d+$')]
    [string]$Version,

    [string]$Dossier = (Join-Path $PSScriptRoot '..\CLR-Game\build\game'),
    [string]$Repo = 'ShizunaSH/clr-game'
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path (Join-Path $Dossier 'CLR.exe'))) {
    throw "CLR.exe introuvable dans : $Dossier"
}

$out = Join-Path $PSScriptRoot 'game.json'
$precedents = @{}
if (Test-Path $out) {
    $ancien = Get-Content $out -Raw | ConvertFrom-Json
    foreach ($f in @($ancien.files)) {
        if ($f) { $precedents[$f.file] = $f }
    }
}

$envoi = Join-Path $PSScriptRoot "game-v$Version"
if (Test-Path $envoi) { Remove-Item $envoi -Recurse -Force }
New-Item $envoi -ItemType Directory | Out-Null

$base = "https://github.com/$Repo/releases/download/v$Version"
$files = @()
$bilan = @()
Get-ChildItem $Dossier -File | Where-Object { $_.Extension -in '.exe', '.pck' } | Sort-Object Name | ForEach-Object {
    $hash = (Get-FileHash $_.FullName -Algorithm SHA256).Hash.ToLower()
    $connu = $precedents[$_.Name]
    if ($connu -and $connu.sha256 -eq $hash) {
        $url = $connu.url
    } else {
        $url = "$base/$($_.Name)"
    }
    $nouveau = $url.StartsWith($base)
    if ($nouveau) { Copy-Item $_.FullName $envoi }
    $files += [ordered]@{
        file   = $_.Name
        size   = $_.Length
        sha256 = $hash
        url    = $url
    }
    $bilan += '  {0,-12} {1,8:N1} Mo   {2}' -f $_.Name, ($_.Length / 1MB), $(if ($nouveau) { 'a envoyer' } else { 'inchange' })
}

$manifest = [ordered]@{
    version = $Version
    files   = $files
}
$json = $manifest | ConvertTo-Json -Depth 4
$utf8 = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($out, $json, $utf8)
[System.IO.File]::WriteAllText((Join-Path $envoi 'game.json'), $json, $utf8)

Write-Host "game.json ecrit : $out" -ForegroundColor Green
Write-Host "  version : $Version"
$bilan | ForEach-Object { Write-Host $_ }
Write-Host ""
Write-Host "Release GitHub sur $Repo (tag v$Version) :"
Write-Host "  1. Uploade tout le contenu de $envoi"
Write-Host "  2. Publie (pas brouillon) en cochant 'latest release'"
