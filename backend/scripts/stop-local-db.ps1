$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$dataDir = Join-Path $projectRoot ".postgres-data"

function Get-PostgresBinPath {
  $postgresRoot = "C:\Program Files\PostgreSQL"

  if (-not (Test-Path $postgresRoot)) {
    throw "PostgreSQL is not installed under C:\Program Files\PostgreSQL."
  }

  $versionDir = Get-ChildItem $postgresRoot -Directory |
    Sort-Object Name -Descending |
    Select-Object -First 1

  if (-not $versionDir) {
    throw "No PostgreSQL version folder was found."
  }

  $binPath = Join-Path $versionDir.FullName "bin"

  if (-not (Test-Path (Join-Path $binPath "pg_ctl.exe"))) {
    throw "Could not find PostgreSQL binaries under $binPath."
  }

  return $binPath
}

if (-not (Test-Path $dataDir)) {
  throw "Local database cluster not found."
}

$pgCtl = Join-Path (Get-PostgresBinPath) "pg_ctl.exe"
$statusOutput = & $pgCtl -D $dataDir status 2>$null

if ($LASTEXITCODE -ne 0) {
  Write-Host "Local SyncDoc PostgreSQL is not running."
  exit 0
}

& $pgCtl -D $dataDir stop
