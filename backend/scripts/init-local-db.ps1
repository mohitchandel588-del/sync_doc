$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$dataDir = Join-Path $projectRoot ".postgres-data"
$logFile = Join-Path $dataDir "server.log"
$port = 5433
$dbUser = "syncdoc"
$dbName = "syncdoc"

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

$binPath = Get-PostgresBinPath
$initdb = Join-Path $binPath "initdb.exe"
$pgCtl = Join-Path $binPath "pg_ctl.exe"
$createdb = Join-Path $binPath "createdb.exe"
$psql = Join-Path $binPath "psql.exe"

if (-not (Test-Path $dataDir)) {
  & $initdb -D $dataDir -U $dbUser --auth=trust --encoding=UTF8
}

$statusOutput = & $pgCtl -D $dataDir status 2>$null

if ($LASTEXITCODE -ne 0) {
  & $pgCtl -D $dataDir -l $logFile -o " -p $port" start | Out-Null
  Start-Sleep -Seconds 2
}

$dbExists = & $psql -h localhost -p $port -U $dbUser -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$dbName';"

if ($dbExists.Trim() -ne "1") {
  & $createdb -h localhost -p $port -U $dbUser $dbName
}

Write-Host "Local SyncDoc PostgreSQL is ready on port $port."
