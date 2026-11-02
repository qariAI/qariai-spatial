& {
 $ErrorActionPreference='Stop'
 if ($env:OS -ne 'Windows_NT') { throw 'Run this on the Windows recording PC.' }
 $pw=$null; $chrome=$null
 $roots=@([Environment]::GetFolderPath('MyDocuments'),(Join-Path $env:USERPROFILE 'Documents')) | Select-Object -Unique
 foreach($root in $roots){
  foreach($folder in (Get-ChildItem $root -Directory -Filter 'QariAI-Acceptance-*' -ErrorAction SilentlyContinue)){
   try{
    $r=Get-Content (Join-Path $folder.FullName 'report.json') -Raw | ConvertFrom-Json
    $o=$null; $options=Join-Path $folder.FullName 'run-options.json'
    if(Test-Path $options){$o=Get-Content $options -Raw | ConvertFrom-Json}
    $p=$o.playwright; $c=$o.chrome
    if(!$p){$p=$r.environment.playwrightEntry};if(!$c){$c=$r.environment.chromePath}
    if($p -and $c -and (Test-Path $p) -and (Test-Path $c)){$pw=$p;$chrome=$c}
   }catch{}
  }
 }
 if(!$pw -or !$chrome){throw 'Saved Chrome/Playwright paths not found. No recording started.'}
 $source=Split-Path $PSScriptRoot -Parent
 $out=Join-Path ([Environment]::GetFolderPath('MyDocuments')) ('QariAI-XR-Guided-'+[guid]::NewGuid())
 New-Item -ItemType Directory -Path $out | Out-Null
 $npm=(Get-Command npm.cmd -ErrorAction Stop).Source
 $node=(Get-Command node -ErrorAction Stop).Source
 $priorModule=$env:IWER_MODULE; $priorVideo=$env:QARIAI_VIDEO
 Push-Location $source
 try{
  & $npm install --no-audit --no-fund
  if($LASTEXITCODE -ne 0){throw 'Source dependency installation failed.'}
  $sdk=Join-Path $out 'emulator-tools'
  & $npm install --prefix $sdk --ignore-scripts --no-audit --no-fund 'iwer@2.1.0'
  if($LASTEXITCODE -ne 0){throw 'Emulator dependency installation failed.'}
  $env:IWER_MODULE=Join-Path $sdk 'node_modules/iwer/lib/index.js'
  $env:QARIAI_VIDEO='1'
  & $node (Join-Path $source 'scripts/check-xr-guides.cjs') $pw $chrome $out
  if($LASTEXITCODE -ne 0){Write-Warning "Sequence failed. Keep report.json in $out"}
 }finally{
  Pop-Location
  $env:IWER_MODULE=$priorModule; $env:QARIAI_VIDEO=$priorVideo
  Start-Process explorer.exe -ArgumentList ('"'+$out+'"')
 }
}
