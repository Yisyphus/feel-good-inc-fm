; Feel Good Inc. FM installer (Inno Setup 6). Built by .github/workflows/release.yml from tools/release/build.ps1.
; Installs for the current user only, in %LOCALAPPDATA%\Programs\FeelGoodIncFM, the same place every time: an update keeps
; the data and the downloaded updates.
; Before it installs anything it checks the PC (check-pc.ps1): Windows 10 or newer, Microsoft Edge present and really
; starting, internet, disk space, and what hide-on-minimize needs. If Edge is missing, too old or doesn't start, it
; downloads Microsoft's own Edge installer (its Microsoft signature checked) and runs it, then checks again.

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
DisableDirPage=yes
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
OutputDir=..\..\dist
OutputBaseFilename=FeelGoodIncFM-Setup-{#MyVersion}
SetupIconFile=icon.ico
UninstallDisplayIcon={app}\icon.ico
CloseApplications=yes
Compression=lzma2
SolidCompression=yes
WizardStyle=modern

[Tasks]
Name: "desktopicon"; Description: "Create a desktop shortcut"; GroupDescription: "Shortcuts:"

[InstallDelete]
; what the earlier versions left behind: the Electron app (with its voice engine), and the voices it downloaded
Type: files; Name: "{app}\Feel Good Inc FM.exe"
Type: filesandordirs; Name: "{app}\resources"
Type: filesandordirs; Name: "{app}\locales"
Type: filesandordirs; Name: "{app}\node_modules"
Type: filesandordirs; Name: "{app}\voice-model"
Type: files; Name: "{app}\*.dll"
Type: files; Name: "{app}\*.pak"
Type: files; Name: "{app}\*.bin"
Type: files; Name: "{app}\icudtl.dat"
Type: files; Name: "{app}\vk_swiftshader_icd.json"
Type: files; Name: "{app}\LICENSES.chromium.html"
Type: files; Name: "{app}\ELECTRON-LICENSE.txt"
Type: files; Name: "{app}\version"

[Files]
; the PC check, used by the installer only
Source: "check-pc.ps1"; Flags: dontcopy
; everything the radio needs; your own files (data, app-cache) are never touched
Source: "{#Stage}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{userprograms}\Feel Good Inc FM"; Filename: "{sys}\wscript.exe"; Parameters: """{app}\Feel Good Inc FM.vbs"""; WorkingDir: "{app}"; IconFilename: "{app}\icon.ico"
Name: "{userdesktop}\Feel Good Inc FM"; Filename: "{sys}\wscript.exe"; Parameters: """{app}\Feel Good Inc FM.vbs"""; WorkingDir: "{app}"; IconFilename: "{app}\icon.ico"; Tasks: desktopicon

[Run]
Filename: "{sys}\wscript.exe"; Parameters: """{app}\Feel Good Inc FM.vbs"""; Description: "Open Feel Good Inc. FM"; Flags: postinstall nowait skipifsilent

[UninstallRun]
Filename: "{sys}\WindowsPowerShell\v1.0\powershell.exe"; Parameters: "-NoProfile -WindowStyle Hidden -Command ""try {{ Invoke-WebRequest http://127.0.0.1:8789/api/quit -UseBasicParsing -TimeoutSec 3 | Out-Null }} catch {{}}"""; Flags: runhidden; RunOnceId: "StopHelper"

[Code]
const
  EdgeSetupUrl = 'https://go.microsoft.com/fwlink/?linkid=2108834&Channel=Stable&language=en';
  MinEdgeMajor = 110;
var
  CheckPage: TOutputMsgMemoWizardPage;
  DownloadPage: TDownloadWizardPage;
  Checked, EdgeTried: Boolean;
  REdgeRuns, REdgeVersion, RSite, RYouTube, RAddType, RRam, RCores: String;

function PS: String;
begin
  Result := ExpandConstant('{sys}\WindowsPowerShell\v1.0\powershell.exe');
end;

// Windows 7 and 8 are no longer supported by Edge, Chrome or YouTube's newer players: say so plainly and stop
function InitializeSetup: Boolean;
var
  V: TWindowsVersion;
begin
  GetWindowsVersionEx(V);
  Result := V.Major >= 10;
  if not Result then
    MsgBox('Feel Good Inc. FM needs Windows 10 or Windows 11.' + #13#10#13#10 +
      'This PC has an older Windows. Microsoft Edge (which gives Luna and Joe their natural voices) and Chrome stopped ' +
      'supporting it in 2023, so the app would not work well here, and nothing has been installed.' + #13#10#13#10 +
      'The radio still opens in a browser on this PC: https://rim-fm.web.app/', mbInformation, MB_OK);
end;

procedure InitializeWizard;
begin
  CheckPage := CreateOutputMsgMemoPage(wpWelcome, 'Checking this PC', 'A few quick checks before anything is installed.',
    'Feel Good Inc. FM runs in Microsoft Edge (for Luna''s and Joe''s natural voices) and needs the internet for the music.', '');
  DownloadPage := CreateDownloadPage('Getting Microsoft Edge', 'Downloading Microsoft''s own Edge installer.', nil);
end;

function GetVal(const Lines: TArrayOfString; const Key: String): String;
var
  I: Integer;
begin
  Result := '';
  for I := 0 to GetArrayLength(Lines) - 1 do
    if Pos(Key + '=', Lines[I]) = 1 then Result := Copy(Lines[I], Length(Key) + 2, 1000);
end;

function EdgeMajor: Integer;
var
  P: Integer;
begin
  Result := 0;
  P := Pos('.', REdgeVersion);
  if P > 1 then Result := StrToIntDef(Copy(REdgeVersion, 1, P - 1), 0);
end;

function EdgeOk: Boolean;
begin
  Result := (REdgeRuns = 'ok') and (EdgeMajor >= MinEdgeMajor);
end;

function NetOk: Boolean;
begin
  Result := (RSite = 'ok') and (RYouTube = 'ok');
end;

function FreeMB: Integer;
var
  FreeBytes, TotalBytes: Int64;
begin
  Result := 0;
  if GetSpaceOnDisk64(ExpandConstant('{localappdata}'), FreeBytes, TotalBytes) then Result := Integer(FreeBytes div 1048576);
end;

function Mark(Ok: Boolean): String;
begin
  if Ok then Result := '[OK]   ' else Result := '[!]    ';
end;

procedure RunChecks;
var
  Code: Integer;
  Lines: TArrayOfString;
  Txt, F: String;
begin
  WizardForm.NextButton.Enabled := False;
  CheckPage.RichEditViewer.Lines.Text := 'Checking this PC... (up to a minute)';
  WizardForm.Update;
  ExtractTemporaryFile('check-pc.ps1');
  F := ExpandConstant('{tmp}\pc.txt');
  DeleteFile(F);
  Exec(PS, '-NoProfile -ExecutionPolicy Bypass -File "' + ExpandConstant('{tmp}\check-pc.ps1') + '" -Out "' + F + '"', '', SW_HIDE, ewWaitUntilTerminated, Code);
  if not LoadStringsFromFile(F, Lines) then SetArrayLength(Lines, 0);
  REdgeRuns := GetVal(Lines, 'edge_runs'); REdgeVersion := GetVal(Lines, 'edge_version');
  RSite := GetVal(Lines, 'net_site'); RYouTube := GetVal(Lines, 'net_youtube'); RAddType := GetVal(Lines, 'addtype');
  RRam := GetVal(Lines, 'ram_gb'); RCores := GetVal(Lines, 'cores');

  Txt := Mark(True) + 'Windows 10 or newer' + #13#10;
  if EdgeOk then Txt := Txt + Mark(True) + 'Microsoft Edge ' + REdgeVersion + ', it starts fine' + #13#10
  else if REdgeRuns = 'missing' then Txt := Txt + Mark(False) + 'Microsoft Edge is not installed: press Next to install it (from Microsoft)' + #13#10
  else if (REdgeRuns = 'ok') then Txt := Txt + Mark(False) + 'Microsoft Edge ' + REdgeVersion + ' is too old: press Next to update it (from Microsoft)' + #13#10
  else Txt := Txt + Mark(False) + 'Microsoft Edge ' + REdgeVersion + ' did not start properly: press Next to reinstall it (from Microsoft)' + #13#10;
  Txt := Txt + Mark(NetOk) + 'Internet: the radio''s website ' + RSite + ', YouTube ' + RYouTube + #13#10;
  Txt := Txt + Mark(FreeMB >= 200) + 'Free disk space: ' + IntToStr(FreeMB) + ' MB (needs 200 MB)' + #13#10;
  Txt := Txt + Mark(RAddType = 'ok') + 'Keep playing when minimized: ' + RAddType + #13#10;
  if RRam <> '' then Txt := Txt + '       Memory ' + RRam + ' GB, ' + RCores + ' processor threads' + #13#10;
  Txt := Txt + #13#10;
  if not NetOk then Txt := Txt + 'This PC could not reach the internet. Connect it, then press Next to check again.'
  else if FreeMB < 200 then Txt := Txt + 'Not enough free space. Free some up, then press Next to check again.'
  else if not EdgeOk then Txt := Txt + 'Press Next to get Microsoft Edge first. Windows will ask once for permission: Edge installs for the whole PC.'
  else Txt := Txt + 'Everything is ready. Press Next to install.';
  if RAddType <> 'ok' then Txt := Txt + #13#10#13#10 + 'Note: on this PC the radio may pause between songs while it is minimized. Leave it open behind other windows instead.';
  CheckPage.RichEditViewer.Lines.Text := Txt;
  Checked := True;
  WizardForm.NextButton.Enabled := True;
end;

procedure CurPageChanged(CurPageID: Integer);
begin
  if CurPageID = CheckPage.ID then RunChecks;
end;

// Microsoft's Edge installer, only when its Microsoft signature is valid; it asks Windows for permission itself
function InstallEdge: Boolean;
var
  Code: Integer;
  F: String;
begin
  Result := False;
  DownloadPage.Clear;
  DownloadPage.Add(EdgeSetupUrl, 'MicrosoftEdgeSetup.exe', '');
  DownloadPage.Show;
  try
    try
      DownloadPage.Download;
    except
      MsgBox('Microsoft Edge could not be downloaded: ' + GetExceptionMessage, mbError, MB_OK);
      Exit;
    end;
  finally
    DownloadPage.Hide;
  end;
  F := ExpandConstant('{tmp}\MicrosoftEdgeSetup.exe');
  Exec(PS, '-NoProfile -Command "$s = Get-AuthenticodeSignature ''' + F + '''; if ($s.Status -eq ''Valid'' -and $s.SignerCertificate.Subject -match ''Microsoft Corporation'') { exit 0 } else { exit 1 }"', '', SW_HIDE, ewWaitUntilTerminated, Code);
  if Code <> 0 then begin
    MsgBox('The Edge installer that was downloaded is not signed by Microsoft, so it was not run.', mbError, MB_OK);
    Exit;
  end;
  if not ShellExec('runas', F, '', '', SW_SHOW, ewWaitUntilTerminated, Code) then begin
    MsgBox('Microsoft Edge was not installed (' + SysErrorMessage(Code) + ').', mbError, MB_OK);
    Exit;
  end;
  Result := True;
end;

function NextButtonClick(CurPageID: Integer): Boolean;
begin
  Result := True;
  if CurPageID <> CheckPage.ID then Exit;
  if not Checked then begin RunChecks; Result := False; Exit; end;
  if (not NetOk) or (FreeMB < 200) then begin RunChecks; Result := False; Exit; end;   // check again
  if not EdgeOk then begin
    if EdgeTried then begin
      MsgBox('Microsoft Edge still does not start on this PC.' + #13#10#13#10 +
        'To repair it: open Settings > Apps > Installed apps > Microsoft Edge > Modify > Repair. Then run this installer again.', mbError, MB_OK);
      Result := False; Exit;
    end;
    EdgeTried := True;
    InstallEdge;
    RunChecks;
    Result := False;   // stay on this page so you can see the new result; Next again continues
  end;
end;

// Before installing over a running radio: ask its helper to stop, so its files can be replaced
function PrepareToInstall(var NeedsRestart: Boolean): String;
var
  Code: Integer;
begin
  Exec(PS, '-NoProfile -WindowStyle Hidden -Command "try { Invoke-WebRequest http://127.0.0.1:8789/api/quit -UseBasicParsing -TimeoutSec 3 | Out-Null } catch {}; Start-Sleep -Milliseconds 800"',
    '', SW_HIDE, ewWaitUntilTerminated, Code);
  Result := '';
end;
