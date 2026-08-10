# Weekly validation for delegation-steering (Windows Task Scheduler wrapper).
# Register with a trigger of your choice, e.g.:
#   $action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"<path-to-this-script>`""
#   $trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday -At 09:17
#   Register-ScheduledTask -TaskName "claude-plugins-drift-check" -Action $action -Trigger $trigger
#
# Three checks, in cost order:
#   1. Drift detection (deterministic, free): doc-page hashes + Claude Code version.
#   2. Behavioral probe (one tiny metered session): is the gate actually denying
#      model-less delegation in a real session?
#   3. Ledger summary (free): 7-day delegation mix from the PostToolUse ledger -
#      the evidence base for the deferred rationale-gate hardening.
# On drift, a read-only scoping agent runs (REMEDIATION.md step 1); editing
# anything stays a human-reviewed PR.
# Runs under Windows PowerShell 5.1 AND PowerShell 7 (pwsh). Deliberately kept
# 5.1-compatible (no ??, no ternary) because powershell.exe is the only host
# guaranteed present on Windows; register with pwsh.exe instead if you prefer -
# the script behaves identically under either.
$repo = Split-Path $PSScriptRoot -Parent
$log = Join-Path $PSScriptRoot "drift.log"
$stamp = Get-Date -Format o

# --- 1. Drift detection ---
# Capture output and Add-Content it: `*>>` under Windows PowerShell 5.1 writes
# UTF-16 into the log, garbling a file the rest of this script appends as ANSI.
$driftOut = node (Join-Path $PSScriptRoot "check-drift.js") 2>&1 | Out-String
$code = $LASTEXITCODE
Add-Content $log $driftOut.TrimEnd()
if ($code -eq 1) {
    Add-Content $log "$stamp drift detected - launching scoping agent"
    Set-Location $repo
    $date = Get-Date -Format yyyy-MM-dd
    $scope = claude -p "Drift was detected by scripts/check-drift.js. Follow ONLY step 1 of docs/REMEDIATION.md: re-run the script to list what changed, fetch and diff each changed page against the claims mapped in the skills' Doc anchors sections, and write a report to docs/drift/DRIFT-REPORT-$date.md classifying the drift as noise or claim-affecting, with evidence per claim. Do not edit skills, hooks, or anchors.json - report only." 2>&1 | Out-String
    Add-Content $log $scope.TrimEnd()
    Add-Content $log "$stamp scoping agent finished (exit $LASTEXITCODE)"
} elseif ($code -eq 0) {
    Add-Content $log "$stamp no drift"
} else {
    Add-Content $log "$stamp drift check errored (exit $code) - see output above"
}

# --- 2. Behavioral probe ---
Set-Location $repo
$probe = claude -p "Gate canary. Do exactly this and nothing else. Step 1: one Agent tool call, subagent_type general-purpose, prompt 'Reply with exactly: OK', and NO model parameter - this is deliberate; if it is denied, do not retry or add a model. Step 2: one Workflow tool call whose script is exactly: export const meta={name:'probe',description:'gate canary'}; return await agent('Reply with exactly: OK') - again deliberately no model; if the launch is denied, do not fix or retry it. Step 3: output exactly two lines and nothing more: 'GATE-AGENT: DENIED' or 'GATE-AGENT: ALLOWED', then 'GATE-WORKFLOW: DENIED' or 'GATE-WORKFLOW: ALLOWED'." 2>&1 | Out-String
if ($probe -match 'GATE-AGENT:\s*DENIED' -and $probe -match 'GATE-WORKFLOW:\s*DENIED') {
    Add-Content $log "$stamp behavioral probe PASS (both paths denied)"
} else {
    Add-Content $log "$stamp BEHAVIORAL PROBE FAILED - gate may be dead or misreporting. Output follows:"
    Add-Content $log $probe
}

# --- 3. Ledger summary (7-day delegation mix) ---
$ledger = Join-Path $env:USERPROFILE ".claude\delegation-ledger.jsonl"
if (Test-Path $ledger) {
    $cut = (Get-Date).AddDays(-7)
    $denied = 0
    $models = foreach ($line in Get-Content $ledger) {
        try { $e = $line | ConvertFrom-Json } catch { continue }
        try { $ts = [datetime]$e.ts } catch { continue }
        if ($ts -lt $cut) { continue }
        if ($e.denied) { $denied++; continue }
        if ($e.tool -eq 'Agent') {
            if ($null -eq $e.model) { 'NONE' } else { $e.model }
        } elseif ($e.models) {
            $e.models
        }
    }
    Add-Content $log "$stamp gate denials (7-day): $denied"
    if ($models) {
        $summary = ($models | Group-Object | Sort-Object Count -Descending | ForEach-Object { "$($_.Name)=$($_.Count)" }) -join ' '
        Add-Content $log "$stamp 7-day delegation mix: $summary"
    } else {
        Add-Content $log "$stamp ledger present, no entries in last 7 days"
    }
} else {
    Add-Content $log "$stamp no ledger yet (plugin PostToolUse hook writes it after first delegation)"
}
