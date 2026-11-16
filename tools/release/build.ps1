# Builds the Windows installer for a release (run by .github/workflows/release.yml on a Windows machine):
#   dist\FeelGoodIncFM-Setup-<version>.exe
# The app is Microsoft Edge in app mode (its own window, Edge's natural voices) plus the helper (server.js, run by
# Node.js renamed FeelGoodHelper.exe). The installer checks the PC first and installs Edge if it is missing.
param([string]$Version = "0.0.0", [string]$NodeVersion = "22.11.0")
$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$Version = $Version -replace '^v', ''
$stage = Join-Path $root "stage\FeelGoodIncFM"
$dist = Join-Path $root "dist"
Remove-Item -Recurse -Force (Join-Path $root "stage"), $dist -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force (Join-Path $stage "public"), $dist | Out-Null

# 1. Node.js for Windows, renamed so it shows as "FeelGoodHelper" in the Task Manager
$zip = Join-Path $env:RUNNER_TEMP "node.zip"
Invoke-WebRequest "https://nodejs.org/dist/v$NodeVersion/node-v$NodeVersion-win-x64.zip" -OutFile $zip
Expand-Archive $zip -DestinationPath (Join-Path $env:RUNNER_TEMP "node") -Force
Copy-Item (Join-Path $env:RUNNER_TEMP "node\node-v$NodeVersion-win-x64\node.exe") (Join-Path $stage "FeelGoodHelper.exe")
Copy-Item (Join-Path $env:RUNNER_TEMP "node\node-v$NodeVersion-win-x64\LICENSE") (Join-Path $stage "NODE-LICENSE.txt")

# 2. The helper, and the radio's page with every file listed in files.json
Copy-Item (Join-Path $root "server.js") $stage
$files = (Get-Content (Join-Path $root "files.json") -Raw | ConvertFrom-Json).files.PSObject.Properties.Name
foreach ($f in $files) { Copy-Item (Join-Path $root $f) (Join-Path $stage "public") }
Copy-Item (Join-Path $root "files.json") (Join-Path $stage "public")

# 3. Where it updates itself from, the launcher, the icon, and a short note
[IO.File]::WriteAllText((Join-Path $stage "cloud.json"), '{ "appUrl": "https://rim-fm.web.app/" }', (New-Object Text.UTF8Encoding $false))
Copy-Item (Join-Path $PSScriptRoot "Feel Good Inc FM.vbs") $stage
Copy-Item (Join-Path $PSScriptRoot "icon.ico") $stage
@"
Feel Good Inc. FM $Version

Open "Feel Good Inc FM.vbs" to start the radio. It opens in its own Microsoft Edge window
(Edge gives Luna and Joe their natural voices). The radio updates itself from https://rim-fm.web.app/

Sign in under Settings > My stuff to keep your playlists and liked songs on every device.
Your own files are created next to this one: data\ (library on this PC), app-cache\ (updates).
"@ | Set-Content (Join-Path $stage "README.txt") -Encoding UTF8

# The PC check the installer runs, tried here first on this Windows machine (it has Edge): it must work before we publish
$pc = Join-Path $env:RUNNER_TEMP "pc.txt"
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "check-pc.ps1") -Out $pc
Write-Host "PC check on the build machine:"; Get-Content $pc | ForEach-Object { Write-Host "  $_" }
if (-not ((Get-Content $pc -Raw) -match "edge_runs=ok")) { throw "the PC check did not find a working Edge on the build machine" }

# 4. The installer (Inno Setup)
$iscc = @("${env:ProgramFiles(x86)}\Inno Setup 6\ISCC.exe", "$env:ProgramFiles\Inno Setup 6\ISCC.exe") | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $iscc) { choco install innosetup -y --no-progress | Out-Null; $iscc = "${env:ProgramFiles(x86)}\Inno Setup 6\ISCC.exe" }
& $iscc "/DMyVersion=$Version" "/DStage=$stage" (Join-Path $PSScriptRoot "installer.iss")
if ($LASTEXITCODE -ne 0) { throw "Inno Setup failed" }

Get-ChildItem $dist | Format-Table Name, Length
