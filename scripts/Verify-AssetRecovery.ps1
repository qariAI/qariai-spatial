param(
 [Parameter(Mandatory=$true)][ValidatePattern('^[a-f0-9]{40}$')][string]$CandidateCommit,
 [string]$PreviousReport = (Get-Location).Path
)
$ErrorActionPreference = 'Stop'
if ($env:OS -ne 'Windows_NT') { throw 'Run on Windows with locally installed Google Chrome.' }
$reportDir = Join-Path ([Environment]::GetFolderPath('MyDocuments')) ('QariAI-Recovery-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory $reportDir | Out-Null
$started = $false
$saved = @{}
foreach ($key in @('CHROMIUM_PATH','PLAYWRIGHT_MODULE','GIT_TERMINAL_PROMPT')) { $saved[$key] = [Environment]::GetEnvironmentVariable($key,'Process') }
function Run([string]$Program,[string[]]$Arguments) {
 & $Program @Arguments
 if ($LASTEXITCODE -ne 0) { throw "$Program failed with exit code $LASTEXITCODE" }
}
try {
 $node = (Get-Command node -CommandType Application -ErrorAction Stop).Source
 $git = (Get-Command git -CommandType Application -ErrorAction Stop).Source
 if ([int]((& $node --version).TrimStart('v').Split('.')[0]) -lt 20) { throw 'Node 20 or later is required. No software will be installed.' }
 $old = Get-Content (Join-Path $PreviousReport 'report.json') -Raw | ConvertFrom-Json
 $options = $null
 $optionsPath = Join-Path $PreviousReport 'run-options.json'
 if (Test-Path $optionsPath) { $options = Get-Content $optionsPath -Raw | ConvertFrom-Json }
 $deps = Join-Path $old.temporaryRoot 'candidate/node_modules'
 if (!(Test-Path (Join-Path $deps 'typescript/bin/tsc'))) { $deps = $options.dependencies }
 $pw = $options.playwright
 if (!$pw) { $pw = $old.environment.playwrightEntry }
 $chrome = $options.chrome
 if (!$chrome) { $chrome = $old.environment.chromePath }
 foreach ($item in @($deps,$pw,$chrome)) {
  if (!$item -or !(Test-Path $item)) { throw 'An existing dependency/Playwright/Chrome path from the previous report is missing. Restore the existing paths or select the original PR #36 report folder; this script never installs software.' }
 }
 if ([IO.Path]::GetFileName($chrome) -ne 'chrome.exe') { throw 'The saved browser must be locally installed Google Chrome (chrome.exe).' }
 $tempRoot = Join-Path $env:TEMP ('qariai-recovery-' + [guid]::NewGuid().ToString('N'))
 $candidate = Join-Path $tempRoot 'candidate'
 New-Item -ItemType Directory $candidate | Out-Null
 $env:GIT_TERMINAL_PROMPT = '0'
 Run $git @('init','--quiet',$candidate)
 Run $git @('-C',$candidate,'config','core.autocrlf','false')
 Run $git @('-C',$candidate,'fetch','--depth=2','--no-tags','https://github.com/qariAI/qariai-spatial.git',$CandidateCommit)
 Run $git @('-C',$candidate,'checkout','--detach','FETCH_HEAD')
 if ((& $git -C $candidate rev-parse HEAD) -ne $CandidateCommit) { throw 'Candidate commit mismatch.' }
 if ((& $git -C $candidate rev-parse 'HEAD^') -ne 'bfcad0fa452f43bef85c7b0be9e76bdc501d6dbc') { throw 'Candidate parent is not exact PR #38.' }
 $copy = Join-Path $tempRoot 'copy-dependencies.cjs'
 @'
const fs=require('node:fs'),path=require('node:path');
fs.cpSync(process.argv[2],process.argv[3],{recursive:true,dereference:true,filter:f=>!['.vite','.cache'].includes(path.basename(f))});
'@ | Set-Content -Encoding ASCII $copy
 Run $node @($copy,$deps,(Join-Path $candidate 'node_modules'))
 $env:CHROMIUM_PATH = $chrome
 $env:PLAYWRIGHT_MODULE = $pw
 $started = $true
 Push-Location $candidate
 try {
  Run $node @('node_modules/typescript/bin/tsc','--noEmit')
  Run $node @('node_modules/vite/bin/vite.js','build')
  Run $node @('scripts/check-asset-recovery.cjs',(Join-Path $reportDir 'lifecycle.json'))
  Run $node @('scripts/check-asset-recovery-scope.cjs',(Join-Path $reportDir 'scope.json'))
  Run $node @('scripts/check-reset-view-browser.cjs','-',(Join-Path $reportDir 'normal'))
  Run $node @('scripts/check-asset-recovery-browser.cjs',(Join-Path $reportDir 'recovery'))
  Run $git @('diff','--exit-code','HEAD','--')
 } finally { Pop-Location }
 $normal = Get-Content (Join-Path $reportDir 'normal/browser.json') -Raw | ConvertFrom-Json
 $recovery = Get-Content (Join-Path $reportDir 'recovery/recovery.json') -Raw | ConvertFrom-Json
 if (!$normal.success -or !$recovery.success -or $normal.platform -ne 'win32' -or $recovery.platform -ne 'win32' -or $normal.chrome.product -notmatch '^Chrome/') { throw 'Windows production Chrome report requirements failed.' }
 @("PASS - automated focused Windows checks","Commit: $CandidateCommit","Chrome: $($normal.chrome.product)","Renderer: $($normal.gpu.gpu.auxAttributes.glRenderer)","Normal production: seven letters, two phases, nine stable-resource resets, native inspection/Return, Harf roundtrip.","Separate injected build: original Amiri rejection/retry, terminal sculpture error/retry/Return; all four real registered guides and Undo/Redo.","Owner visual review: PENDING - inspect genuine normal and injected screenshots separately.","No full 32-step acceptance or physical Quest claim.","Temporary checkout: $tempRoot") | Set-Content -Encoding UTF8 (Join-Path $reportDir 'SUMMARY.txt')
} catch {
 $status = 'BLOCKED'; if ($started) { $status = 'FAIL' }
 @("$status - $($_.Exception.Message)","Commit: $CandidateCommit","Temporary checkout: $tempRoot") | Set-Content -Encoding UTF8 (Join-Path $reportDir 'SUMMARY.txt')
 Write-Host "$status - $($_.Exception.Message)"
} finally {
 foreach ($key in $saved.Keys) { [Environment]::SetEnvironmentVariable($key,$saved[$key],'Process') }
 Write-Host "Results: $reportDir"
}
