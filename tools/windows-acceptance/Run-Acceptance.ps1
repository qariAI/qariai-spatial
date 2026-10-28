[CmdletBinding()]
param(
    [string]$RepositoryPath = (Join-Path $PSScriptRoot '..\..'),
    [string]$DependenciesPath = '',
    [string]$PlaywrightPath = '',
    [string]$ChromePath = '',
    [string]$ReportFolder = '',
    [ValidateRange(30,300)][int]$StageTimeoutSeconds = 180,
    [ValidateRange(5,60)][int]$RunTimeoutMinutes = 30,
    [switch]$Summarize
)
$ErrorActionPreference = 'Stop'
if ($env:OS -ne 'Windows_NT') { throw 'This runner requires actual Windows and locally installed Google Chrome.' }
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    if (-not $ReportFolder) {
        $stamp = [DateTime]::UtcNow.ToString('yyyy-MM-ddTHH-mm-ss-fffZ')
        $ReportFolder = Join-Path ([Environment]::GetFolderPath('MyDocuments')) ('QariAI-Acceptance-' + $stamp)
    }
    if (Test-Path $ReportFolder) { throw 'Node.js is missing and the report folder already exists. Choose a new folder.' }
    New-Item -ItemType Directory -Path $ReportFolder | Out-Null
    $message = 'BLOCKED: Node.js 20+ is required. Install it yourself, reopen PowerShell, then rerun. Nothing was installed.'
    @{ baseline = '876486dac91db528a5b438609a48f2c77c3eb3a4'; preflightError = $message;
       summary = @{ overall = 'BLOCKED'; decision = 'NO-GO for Windows acceptance sign-off' } } |
        ConvertTo-Json -Depth 4 | Set-Content -Encoding UTF8 (Join-Path $ReportFolder 'report.json')
    $message | Set-Content -Encoding UTF8 (Join-Path $ReportFolder 'SUMMARY.txt')
    [Console]::Error.WriteLine($message + ' Report: ' + $ReportFolder)
    exit 2
}
$runner = Join-Path $PSScriptRoot 'runner.cjs'
$arguments = @($runner, '--repository', $RepositoryPath,
    '--stage-seconds', [string]$StageTimeoutSeconds, '--run-minutes', [string]$RunTimeoutMinutes)
if ($DependenciesPath) { $arguments += @('--dependencies', $DependenciesPath) }
if ($PlaywrightPath) { $arguments += @('--playwright', $PlaywrightPath) }
if ($ChromePath) { $arguments += @('--chrome', $ChromePath) }
if ($ReportFolder) { $arguments += @('--report', $ReportFolder) }
if ($Summarize) { $arguments += '--summarize' }
& node @arguments
exit $LASTEXITCODE
