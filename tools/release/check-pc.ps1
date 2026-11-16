# Feel Good Inc. FM: the PC check the installer runs before it installs anything.
# Writes one "name=value" line per check into the file given as -Out. Nothing is changed on the PC.
param([string]$Out)
$ErrorActionPreference = "SilentlyContinue"
$ProgressPreference = "SilentlyContinue"
$r = [ordered]@{}

# Microsoft Edge: where it is, which version, and whether it really starts (invisibly, on its own temporary profile)
$edge = @("${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe", "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe", "$env:LOCALAPPDATA\Microsoft\Edge\Application\msedge.exe") | Where-Object { Test-Path $_ } | Select-Object -First 1
if ($edge) {
  $r.edge_path = $edge
  $r.edge_version = (Get-Item $edge).VersionInfo.ProductVersion
  $tmp = Join-Path $env:TEMP ("fgi-edge-test-" + [guid]::NewGuid().ToString("N"))
  New-Item -ItemType Directory -Force $tmp | Out-Null
  $outFile = Join-Path $tmp "out.txt"
  $p = Start-Process -FilePath $edge -ArgumentList @("--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--user-data-dir=`"$tmp\profile`"", "--dump-dom", "data:text/html,<b>fgi-edge-ok</b>") -RedirectStandardOutput $outFile -PassThru -NoNewWindow
  if ($p -and $p.WaitForExit(30000)) {
    $r.edge_runs = if ((Get-Content $outFile -Raw) -match "fgi-edge-ok") { "ok" } else { "fail" }
  } else {
    if ($p) { try { $p.Kill() } catch {} }
    $r.edge_runs = "timeout"
  }
  Remove-Item -Recurse -Force $tmp
} else {
  $r.edge_runs = "missing"
}

# Internet: the radio's website and YouTube
foreach ($t in @(@("net_site", "https://rim-fm.web.app/files.json"), @("net_youtube", "https://www.youtube.com/iframe_api"))) {
  try { $x = Invoke-WebRequest $t[1] -UseBasicParsing -TimeoutSec 20; $r[$t[0]] = if ($x.StatusCode -eq 200) { "ok" } else { "fail" } } catch { $r[$t[0]] = "fail" }
}

# What hide-on-minimize needs: PowerShell able to compile a small helper (Add-Type)
try { Add-Type -TypeDefinition "public static class FgiCheck { public static int One() { return 1; } }"; $r.addtype = if ([FgiCheck]::One() -eq 1) { "ok" } else { "fail" } } catch { $r.addtype = "fail" }

# Memory and processor (information only)
try { $cs = Get-CimInstance Win32_ComputerSystem; $r.ram_gb = [math]::Round($cs.TotalPhysicalMemory / 1GB, 1); $r.cores = $cs.NumberOfLogicalProcessors } catch {}

($r.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join "`r`n" | Set-Content -Path $Out -Encoding ASCII
