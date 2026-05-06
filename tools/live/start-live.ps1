param(
  [ValidateSet('server','open','both')]
  [string]$Mode = 'both',
  [int]$Port = 4173
)

$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$node = Join-Path $projectRoot '.tools\node-portable\node.exe'
$serverScript = Join-Path $projectRoot 'tools\live\server.js'
$openScript = Join-Path $projectRoot 'tools\live\open-dashboard.js'

if (-not (Test-Path $node)) {
  Write-Error "Portable Node not found at $node"
  exit 1
}

if ($Mode -eq 'server' -or $Mode -eq 'both') {
  Start-Process powershell -ArgumentList @(
    '-NoExit',
    '-Command',
    "& '$node' '$serverScript'"
  ) -WorkingDirectory $projectRoot
}

if ($Mode -eq 'open' -or $Mode -eq 'both') {
  Start-Sleep -Seconds 2
  $env:LIA_BASE_URL = "http://127.0.0.1:$Port/dashboard.html"
  & $node $openScript
}
