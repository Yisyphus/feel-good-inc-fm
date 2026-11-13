; Feel Good Inc. FM installer (Inno Setup 6). Built by .github/workflows/release.yml from tools/release/build.ps1.
; Installs for the current user only (no administrator rights), in %LOCALAPPDATA%\Programs\FeelGoodIncFM,
; the same place every time: an update keeps the data and the downloaded updates. Windows 10 or newer only.

#ifndef MyVersion
  #define MyVersion "0.0.0"
#endif
#ifndef Stage
  #define Stage "..\..\stage\FeelGoodIncFM"
#endif

[Setup]
AppId={{3E9A7C51-2B64-4F0D-8C1E-FEELGOODFM01}
AppName=Feel Good Inc. FM
AppVersion={#MyVersion}
AppPublisher=Feel Good Inc. FM
DefaultDirName={localappdata}\Programs\FeelGoodIncFM
MinVersion=10.0
DisableDirPage=yes
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
OutputDir=..\..\dist
OutputBaseFilename=FeelGoodIncFM-Setup-{#MyVersion}
SetupIconFile=icon.ico
UninstallDisplayIcon={app}\Feel Good Inc FM.exe
CloseApplications=yes
Compression=lzma2
SolidCompression=yes
WizardStyle=modern

[Tasks]
Name: "desktopicon"; Description: "Create a desktop shortcut"; GroupDescription: "Shortcuts:"

[InstallDelete]
; the launcher and helper of the older, Edge-based app
Type: files; Name: "{app}\Feel Good Inc FM.vbs"
Type: files; Name: "{app}\FeelGoodHelper.exe"
Type: files; Name: "{app}\NODE-LICENSE.txt"

[Files]
; everything the radio needs; your own files (data, app-cache, voice-model) are never touched
Source: "{#Stage}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{userprograms}\Feel Good Inc FM"; Filename: "{app}\Feel Good Inc FM.exe"; WorkingDir: "{app}"
Name: "{userdesktop}\Feel Good Inc FM"; Filename: "{app}\Feel Good Inc FM.exe"; WorkingDir: "{app}"; Tasks: desktopicon

[Run]
Filename: "{app}\Feel Good Inc FM.exe"; Description: "Open Feel Good Inc. FM"; Flags: postinstall nowait skipifsilent

[UninstallDelete]
; the downloaded voices and updates go with the app (your library in data\ stays, in case you install it again)
Type: filesandordirs; Name: "{app}\voice-model"
Type: filesandordirs; Name: "{app}\app-cache"

[UninstallRun]
Filename: "{sys}\WindowsPowerShell\v1.0\powershell.exe"; Parameters: "-NoProfile -WindowStyle Hidden -Command ""try {{ Invoke-WebRequest http://127.0.0.1:8789/api/quit -UseBasicParsing -TimeoutSec 3 | Out-Null }} catch {{}}"""; Flags: runhidden; RunOnceId: "StopHelper"

[Code]
// Before installing over a running radio: ask its helper to stop, so its files can be replaced
function PrepareToInstall(var NeedsRestart: Boolean): String;
var
  Code: Integer;
begin
  Exec(ExpandConstant('{sys}\WindowsPowerShell\v1.0\powershell.exe'),
    '-NoProfile -WindowStyle Hidden -Command "try { Invoke-WebRequest http://127.0.0.1:8789/api/quit -UseBasicParsing -TimeoutSec 3 | Out-Null } catch {}; Start-Sleep -Milliseconds 800"',
    '', SW_HIDE, ewWaitUntilTerminated, Code);
  Result := '';
end;
