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
; Luna's and Joe's voices (the Kokoro speech model), downloaded by the installer so the app speaks with them from the
; very first start. If the download fails (no internet), the app downloads them itself later.
Source: "{tmp}\model_quantized.onnx"; DestDir: "{app}\voice-model\onnx-community\Kokoro-82M-v1.0-ONNX\onnx"; Flags: external skipifsourcedoesntexist ignoreversion
Source: "{tmp}\config.json"; DestDir: "{app}\voice-model\onnx-community\Kokoro-82M-v1.0-ONNX"; Flags: external skipifsourcedoesntexist ignoreversion
Source: "{tmp}\tokenizer.json"; DestDir: "{app}\voice-model\onnx-community\Kokoro-82M-v1.0-ONNX"; Flags: external skipifsourcedoesntexist ignoreversion
Source: "{tmp}\tokenizer_config.json"; DestDir: "{app}\voice-model\onnx-community\Kokoro-82M-v1.0-ONNX"; Flags: external skipifsourcedoesntexist ignoreversion

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
const
  VoiceBase = 'https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/1939ad2a8e416c0acfeecc08a694d14ef25f2231/';
var
  DownloadPage: TDownloadWizardPage;

procedure InitializeWizard;
begin
  DownloadPage := CreateDownloadPage('Getting the voices', 'Downloading Luna''s and Joe''s voices, once (about 92 MB). This can take a few minutes on a slow Wi-Fi.', nil);
end;

function HaveVoices: Boolean;
begin
  Result := FileExists(ExpandConstant('{app}\voice-model\onnx-community\Kokoro-82M-v1.0-ONNX\onnx\model_quantized.onnx'));
end;

// After "Install" is pressed: the voices first (skipped when an earlier install already has them)
function NextButtonClick(CurPageID: Integer): Boolean;
begin
  Result := True;
  if (CurPageID = wpReady) and not HaveVoices then begin
    DownloadPage.Clear;
    DownloadPage.Add(VoiceBase + 'config.json', 'config.json', 'df34b4f930b23447cd4dc410fabfb42eb3f24e803e6c3f97d618fb359380a36f');
    DownloadPage.Add(VoiceBase + 'tokenizer.json', 'tokenizer.json', '77a02c8e164413299b4b4c403b14f8e0e1c1b727db4d46a09d6327b861060a34');
    DownloadPage.Add(VoiceBase + 'tokenizer_config.json', 'tokenizer_config.json', 'be1cb066d6ef6b074b3f15e6a6dd21ac88ff3cdaedf325f0aaed686c70f75d20');
    DownloadPage.Add(VoiceBase + 'onnx/model_quantized.onnx', 'model_quantized.onnx', 'fbae9257e1e05ffc727e951ef9b9c98418e6d79f1c9b6b13bd59f5c9028a1478');
    DownloadPage.Show;
    try
      try
        DownloadPage.Download;
      except
        // no internet or the download stopped: install anyway, the app gets the voices itself on its first start
        Log('Voices not downloaded: ' + GetExceptionMessage);
      end;
    finally
      DownloadPage.Hide;
    end;
  end;
end;

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
