# Windows local acceptance — PR #35 candidate

Tests **`876486dac91db528a5b438609a48f2c77c3eb3a4`**, regardless of the tooling branch's later commits. This package is test tooling only. **No Windows acceptance result is supplied by this PR.**

## Run in PowerShell

Required: Windows PowerShell 5.1+ or PowerShell 7 on Windows, Git for Windows on PATH, Node.js 20+, locally installed Google Chrome, existing project dependencies, and Playwright or playwright-core. No administrator rights are needed. The runner never installs packages/browsers, changes settings, or modifies/cleans the existing checkout.

Obtain the tooling in a **new** directory:

```powershell
$runnerRoot = Join-Path $env:TEMP ('qariai-windows-runner-' + [guid]::NewGuid().ToString('N'))
git clone --single-branch --branch test/windows-local-acceptance-v0.1 https://github.com/qariAI/qariai-spatial.git $runnerRoot
if ($LASTEXITCODE -ne 0) { throw 'Clone failed; stop here.' }
Set-Location $runnerRoot
```

If this new directory has no dependencies, the following are **manual, owner-initiated setup commands**, not actions performed by the runner. They install into this new tooling checkout only; they do not alter the project's dependency declarations or the owner's other checkout. `playwright-core` does not download a browser.

```powershell
npm install --no-package-lock --no-audit --no-fund
if ($LASTEXITCODE -ne 0) { throw 'Project dependency setup failed; stop here.' }
npm install --no-save --no-package-lock --no-audit --no-fund playwright-core
if ($LASTEXITCODE -ne 0) { throw 'Playwright setup failed; stop here.' }
```

Run:

```powershell
.\tools\windows-acceptance\Run-Acceptance.ps1
```

Or reuse packages already installed elsewhere (they are **copied**, never linked or written back):

```powershell
.\tools\windows-acceptance\Run-Acceptance.ps1 `
  -DependenciesPath 'C:\path\to\existing\node_modules' `
  -PlaywrightPath 'C:\path\to\tooling\node_modules\playwright-core' `
  -ChromePath 'C:\Program Files\Google\Chrome\Application\chrome.exe'
```

`-PlaywrightPath` accepts a package directory or its entry JS file. `-RepositoryPath` optionally supplies an existing repository **as a read-only Git object source**; otherwise the new tooling checkout is used. If that source lacks the exact candidate, the runner fetches only the pinned SHA from GitHub into its new temporary repository. Authentication/network failure produces a report; it never initiates login. If local execution policy blocks the PowerShell script, use your existing script-approval process; this package does not change execution policy.

## What runs

- Creates a fresh detached candidate checkout under `%TEMP%`, verifies the exact SHA and clean tree, copies existing dependencies, runs TypeScript and two production Vite builds. No `npm` or software installation is executed by the script.
- Starts loopback-only production previews and **one headed local Chrome process** with a fresh profile. No Linux/bundled Chromium fallback, custom GPU flags, hidden artwork, modified resolution sources, suppressed draws, validator replacements, or intercepted destinations.
- The **pristine build** runs seven keyboard selections/mirrored scales, real 01→02→01 buttons, Reset View, all four Harf links, registered-guide pointer traces, Undo/Redo, real completion anchors, full-scene native inspections, drag/reset/Return, camera restoration and reload/Escape.
- Normal page navigation performs every costly destination initialization. A first-stage failure stops later journeys; they remain BLOCKED. There are no automatic retries or fixture substitutions.
- A separate **diagnostic build**, visited only after the acceptance journey, adds `try/finally` timing spans to the existing atlas and sculpture constructors using an external build plugin. Candidate source files stay byte-identical. It changes no return values or rendering and produces no acceptance screenshots. Those timings are explicitly separate from pristine acceptance.
- Records actual Windows/Chrome versions, Chrome's GPU/driver/feature information, package versions, HTTP/request/console/page errors, source integrity, real screenshots and screenshot SHA-256 hashes. Reset reports new scene/atlas/geometry identities and readiness time excluding capture time.

Keep the Chrome window unobscured and the PC awake. Do not click/type in the automated window or change GPU/browser settings during the run. The viewport is 1440×1000 with DPR 1; it does not change artwork detail or source atlas resolution. Screenshots preserve normal animation; capture overhead is recorded separately.

## Timings and limits

Navigation/resource entries are Chrome Performance API observations. `ScriptDuration` is cumulative script execution at readiness, **not an exact JavaScript initialization boundary**. Amiri readiness is the first sampled loaded Amiri face. A passive React DevTools observer checks all seven native sculptures and calligraphy metadata, then waits for another normal renderer submission. Sampling is every 100 ms; it neither steps nor replaces the frame loop.

`completeSceneSubmittedMs` is a submission/readiness proxy, **not a first-pixel/scanout measurement**. Genuine screenshots and owner review establish visible completeness. First usable interaction is the first real keyboard selection reaching the existing mirrored scale. Atlas/sculpture durations come from the separate diagnostic run; constructor spans include surface generation and any constructor GPU preparation, not pure tessellation or GPU execution time. Never combine these into a fictitious single cold-start breakdown.

Default bounds: 180 seconds per acceptance stage, 30 seconds per navigation/Chrome launch, 15 seconds per screenshot, 5 minutes for checkout/dependency copying, bounded production-build subprocesses, and **30 minutes total**. Override with `-StageTimeoutSeconds 240 -RunTimeoutMinutes 40` (allowed ranges: 30–300 seconds, 5–60 minutes). The supervisor terminates only its own worker process tree on a total timeout. A timeout preserves the incremental report and attempts a bounded genuine failure capture. A stalled browser may prevent capture; that failure is recorded too.

Session evidence covers real document departures, no extra acceptance tabs, and absence of a desktop XR session. **No native immersive session is created.** End-promise/end-event teardown, physical hands, Quest stereo and hardware performance remain untested. Automated guide ink is synthetic pointer input, not a calligrapher's handwriting review.

## Results and owner review

The script prints a new report folder, defaulting to `%USERPROFILE%\Documents\QariAI-Acceptance-<timestamp>`:

- `SUMMARY.txt`, incremental `report.json`, `runner.log`, `setup.log`, `run-options.json`
- Genuine `*.png` captures (or recorded capture failures)
- `owner-review.json` with five initially **PENDING** visual checks

Review the actual headed run and PNGs for the approved Arabic/artwork, all four close-ups, camera/reset behavior and loading/readability. Check Chrome's GPU report against the recorded renderer; if needed inspect `chrome://gpu` separately without changing settings. In `owner-review.json`, enter your name, an ISO review date, PASS/FAIL and concrete notes for each check. Unseen or failed stages must never be marked PASS. Then regenerate the summary without launching another browser:

```powershell
.\tools\windows-acceptance\Run-Acceptance.ps1 -Summarize -ReportFolder 'C:\path\printed\by\the\runner'
```

Exit codes: **0 PASS**, **1 FAIL**, **2 BLOCKED**. Automation PASS alone leaves overall BLOCKED until identified owner review and confirmed GPU acceleration are present. Any recorded acceptance browser/network error or failed stage prevents PASS. Desktop GO never implies Quest readiness. `report.example.json` is an illustrative format only, not evidence.

Return `report.json`, `owner-review.json`, logs and PNGs for review. Reports contain local paths and GPU/browser details. Do not share the temporary Chrome profile or dependency tree. The isolated checkout/builds are intentionally retained at `temporaryRoot`; after review you may delete **that exact generated directory** yourself. The runner never removes the owner's checkout, existing `dist/`, or existing `node_modules/`.

## Tooling validation

```powershell
node .\tools\windows-acceptance\runner.test.cjs
```

The PR's preparation checks validate reporting, deadlines, platform refusal, timing transforms, production builds and passive production React/R3F observation on Linux. They do **not** claim the Windows PowerShell/Chrome journey has run. Stop after collecting and reviewing the Windows report; no fixes, merge or deployment are included.
