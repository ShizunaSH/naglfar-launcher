#Requires -Version 5.1
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$keyFile = Join-Path $root '.tauri-keys\naglfar.key'

if (Test-Path $keyFile) {
    $env:TAURI_SIGNING_PRIVATE_KEY = (Get-Content $keyFile -Raw).Trim()
    $env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = ''
}

Push-Location $root
try {
    Get-Process Naglfar, msedgewebview2 -ErrorAction SilentlyContinue | Stop-Process -Force

    $ErrorActionPreference = 'Continue'
    cmd /c "cargo clean -p app --manifest-path src-tauri\Cargo.toml"
    $tauriCmd = @(
        "$env:APPDATA\npm\tauri.cmd",
        "C:\Users\Shizuna\AppData\Roaming\npm\tauri.cmd",
        (Get-Command tauri -ErrorAction SilentlyContinue).Source
    ) | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1
    if ($tauriCmd) { Write-Host "tauri: $tauriCmd"; & $tauriCmd build } else { npx tauri build }
    $buildCode = $LASTEXITCODE
    $ErrorActionPreference = 'Stop'
    if ($buildCode -ne 0) { throw "Le build a echoue (code $buildCode)" }
}
finally {
    Pop-Location
}

$cache = Join-Path $env:LOCALAPPDATA 'com.naglfar.launcher'
if (Test-Path $cache) { Remove-Item $cache -Recurse -Force -ErrorAction SilentlyContinue }

$exe = Join-Path $root 'src-tauri\target\release\Naglfar.exe'
Write-Host ""
Write-Host "==> Build termine : $exe" -ForegroundColor Green
Start-Process -FilePath $exe
