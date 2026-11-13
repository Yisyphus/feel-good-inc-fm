# Builds the Windows installer for a release (run by .github/workflows/release.yml on a Windows machine):
#   dist\FeelGoodIncFM-Setup-<version>.exe
# The app is its own program (Electron), not a browser window: "Feel Good Inc FM.exe" shows the radio and runs the
# helper (server.js) with its built-in Node. Its voices are Kokoro (kokoro-js, only the two voices it uses: Luna =
# af_heart, Joe = am_echo); the speech model itself (about 92 MB) is downloaded once by the app on its first start.
param([string]$Version = "0.0.0", [string]$ElectronVersion = "44.10.0", [string]$KokoroVersion = "1.2.1", [string]$RceditVersion = "2.0.0")
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"
$root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$Version = $Version -replace '^v', ''
$stage = Join-Path $root "stage\FeelGoodIncFM"
$dist = Join-Path $root "dist"
$tmp = $env:RUNNER_TEMP; if (-not $tmp) { $tmp = [IO.Path]::GetTempPath() }
Remove-Item -Recurse -Force (Join-Path $root "stage"), $dist -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force $stage, $dist | Out-Null

# 1. Electron for Windows, checked against its published checksum
$ez = "electron-v$ElectronVersion-win32-x64.zip"
$base = "https://github.com/electron/electron/releases/download/v$ElectronVersion"
Invoke-WebRequest "$base/$ez" -OutFile (Join-Path $tmp $ez)
Invoke-WebRequest "$base/SHASUMS256.txt" -OutFile (Join-Path $tmp "SHASUMS256.txt")
$want = ((Get-Content (Join-Path $tmp "SHASUMS256.txt")) | Where-Object { $_ -match [regex]::Escape($ez) + '$' } | Select-Object -First 1).Split(' ')[0]
$got = (Get-FileHash (Join-Path $tmp $ez) -Algorithm SHA256).Hash.ToLower()
if ($want -ne $got) { throw "Electron download did not match its checksum" }
Expand-Archive (Join-Path $tmp $ez) -DestinationPath $stage -Force
Rename-Item (Join-Path $stage "electron.exe") "Feel Good Inc FM.exe"
Remove-Item (Join-Path $stage "resources\default_app.asar") -ErrorAction SilentlyContinue
Get-ChildItem (Join-Path $stage "locales") -Filter *.pak | Where-Object { $_.Name -notin @("en-US.pak", "en-GB.pak", "fr.pak", "ar.pak") } | Remove-Item   # English is the radio's language; the rest only for Windows dialogs
Rename-Item (Join-Path $stage "LICENSE") "ELECTRON-LICENSE.txt"

# 2. The app's own code (desktop\), the name and icon on the exe
New-Item -ItemType Directory -Force (Join-Path $stage "resources\app") | Out-Null
Copy-Item (Join-Path $root "desktop\main.js"), (Join-Path $root "desktop\package.json") (Join-Path $stage "resources\app")
$rcedit = Join-Path $tmp "rcedit.exe"
Invoke-WebRequest "https://github.com/electron/rcedit/releases/download/v$RceditVersion/rcedit-x64.exe" -OutFile $rcedit
$num = ($Version -replace '[^\d.]', '') ; if (-not $num) { $num = "0.0.0" }
& $rcedit (Join-Path $stage "Feel Good Inc FM.exe") --set-icon (Join-Path $PSScriptRoot "icon.ico") --set-version-string "ProductName" "Feel Good Inc. FM" --set-version-string "FileDescription" "Feel Good Inc. FM" --set-version-string "CompanyName" "Feel Good Inc. FM" --set-version-string "OriginalFilename" "Feel Good Inc FM.exe" --set-file-version $num --set-product-version $num
if ($LASTEXITCODE -ne 0) { throw "rcedit failed" }

# 3. The voices: kokoro-js and what it needs on Windows, nothing else
$kd = Join-Path $tmp "kokoro"
New-Item -ItemType Directory -Force $kd | Out-Null
Push-Location $kd
'{ "name": "fgi-voices", "version": "1.0.0", "private": true }' | Set-Content package.json -Encoding UTF8
npm install "kokoro-js@$KokoroVersion" --omit=dev --no-audit --no-fund
if ($LASTEXITCODE -ne 0) { throw "npm install failed" }
Pop-Location
$nm = Join-Path $kd "node_modules"
Remove-Item -Recurse -Force (Join-Path $nm "onnxruntime-web"), (Join-Path $nm "@img"), (Join-Path $nm "sharp") -ErrorAction SilentlyContinue
Get-ChildItem (Join-Path $nm "onnxruntime-node\bin\napi-v3") -Directory | Where-Object { $_.Name -ne "win32" } | Remove-Item -Recurse -Force
Get-ChildItem (Join-Path $nm "onnxruntime-node\bin\napi-v3\win32") -Directory | Where-Object { $_.Name -ne "x64" } | Remove-Item -Recurse -Force
Get-ChildItem (Join-Path $nm "@huggingface\transformers\dist") -File | Where-Object { $_.Name -ne "transformers.node.cjs" } | Remove-Item -Force
Remove-Item -Recurse -Force (Join-Path $nm "@huggingface\transformers\.cache") -ErrorAction SilentlyContinue
Get-ChildItem (Join-Path $nm "kokoro-js\voices") -Filter *.bin | Where-Object { $_.Name -notin @("af_heart.bin", "am_echo.bin") } | Remove-Item -Force
# transformers loads an image library at start that the voices never use: a small stand-in instead (about 20 MB less)
New-Item -ItemType Directory -Force (Join-Path $nm "sharp") | Out-Null
'{ "name": "sharp", "version": "0.0.0-stub", "main": "index.js" }' | Set-Content (Join-Path $nm "sharp\package.json") -Encoding UTF8
'module.exports = () => { throw new Error("images are not used here"); };' | Set-Content (Join-Path $nm "sharp\index.js") -Encoding UTF8
Copy-Item $nm (Join-Path $stage "node_modules") -Recurse

# 4. The helper, and the radio's page with every file listed in files.json
New-Item -ItemType Directory -Force (Join-Path $stage "public") | Out-Null
Copy-Item (Join-Path $root "server.js") $stage
$files = (Get-Content (Join-Path $root "files.json") -Raw | ConvertFrom-Json).files.PSObject.Properties.Name
foreach ($f in $files) { Copy-Item (Join-Path $root $f) (Join-Path $stage "public") }
Copy-Item (Join-Path $root "files.json") (Join-Path $stage "public")

# 5. Where it updates itself from, the icon, and a short note
[IO.File]::WriteAllText((Join-Path $stage "cloud.json"), '{ "appUrl": "https://rim-fm.web.app/" }', (New-Object Text.UTF8Encoding $false))
Copy-Item (Join-Path $PSScriptRoot "icon.ico") $stage
@"
Feel Good Inc. FM $Version

Open "Feel Good Inc FM.exe" to start the radio, in its own window. It keeps playing when the window is minimized.
Luna's and Joe's voices are made on this PC (Kokoro): the first start downloads them once (about 92 MB).
The radio updates itself from https://rim-fm.web.app/

Your own files are created next to this one: data\ (library on this PC), app-cache\ (updates), voice-model\ (the voices).
"@ | Set-Content (Join-Path $stage "README.txt") -Encoding UTF8

# 6. A quick check that the helper and the voices load (with the app's own Node), before packing
$env:ELECTRON_RUN_AS_NODE = "1"
& (Join-Path $stage "Feel Good Inc FM.exe") -e "const rq = require('module').createRequire(process.argv[1] + '/server.js'); rq('kokoro-js'); rq('@huggingface/transformers'); rq('onnxruntime-node'); console.log('voices load ok')" $stage
if ($LASTEXITCODE -ne 0) { throw "the voices do not load" }
Remove-Item Env:ELECTRON_RUN_AS_NODE

# 7. The installer (Inno Setup)
$iscc = @("${env:ProgramFiles(x86)}\Inno Setup 6\ISCC.exe", "$env:ProgramFiles\Inno Setup 6\ISCC.exe") | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $iscc) { choco install innosetup -y --no-progress | Out-Null; $iscc = "${env:ProgramFiles(x86)}\Inno Setup 6\ISCC.exe" }
& $iscc "/DMyVersion=$Version" "/DStage=$stage" (Join-Path $PSScriptRoot "installer.iss")
if ($LASTEXITCODE -ne 0) { throw "Inno Setup failed" }

Get-ChildItem $dist | Format-Table Name, Length
