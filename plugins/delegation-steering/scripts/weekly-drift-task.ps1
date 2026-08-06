# Weekly drift check for delegation-steering (Windows Task Scheduler wrapper).
# Register with a trigger of your choice, e.g.:
#   $action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"<path-to-this-script>`""
#   $trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday -At 09:17
#   Register-ScheduledTask -TaskName "claude-plugins-drift-check" -Action $action -Trigger $trigger
# Deterministic detection always; a metered agent launches only on confirmed
# drift, and only for read-only scoping (REMEDIATION.md step 1 - classify noise
# vs claim-affecting, write a report).
# ponytail: scoping-only automation; upgrade path is auto-PR remediation via
# claude -p with scoped allowed tools, once the scoping reports prove reliable.
$plugin = Split-Path $PSScriptRoot -Parent
$repo = Split-Path (Split-Path $plugin -Parent) -Parent
$log = Join-Path $PSScriptRoot "drift.log"
$stamp = Get-Date -Format o

node (Join-Path $PSScriptRoot "check-drift.js") *>> $log
$code = $LASTEXITCODE

if ($code -eq 1) {
    Add-Content $log "$stamp drift detected - launching scoping agent"
    Set-Location $repo
    $date = Get-Date -Format yyyy-MM-dd
    claude -p "Drift was detected by plugins/delegation-steering/scripts/check-drift.js. Follow ONLY step 1 of plugins/delegation-steering/docs/REMEDIATION.md: re-run the script to list what changed, fetch and diff each changed page against the claims mapped in the skills' Doc anchors sections, and write a report to plugins/delegation-steering/docs/DRIFT-REPORT-$date.md classifying the drift as noise or claim-affecting, with evidence per claim. Do not edit skills, hooks, or anchors.json - report only." *>> $log
    Add-Content $log "$stamp scoping agent finished (exit $LASTEXITCODE)"
} elseif ($code -eq 0) {
    Add-Content $log "$stamp no drift"
} else {
    Add-Content $log "$stamp check errored (exit $code) - see output above"
}
