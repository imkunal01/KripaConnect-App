$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSCommandPath
$varsCmd = Join-Path $root 'twa.vars.cmd'

if (-not (Test-Path $varsCmd)) {
  throw "Missing $varsCmd"
}

# Load TWA_* variables by running the CMD vars file and printing environment.
$envLines = cmd /v:on /c "call `"$varsCmd`" & set TWA_" 2>$null
$cfg = @{}
foreach ($line in $envLines) {
  if ($line -match '^([A-Za-z0-9_]+)=(.*)$') {
    $cfg[$matches[1]] = $matches[2]
  }
}

function Require([string]$key) {
  if (-not $cfg.ContainsKey($key) -or [string]::IsNullOrWhiteSpace($cfg[$key])) {
    throw "Missing required config: $key (edit twa.vars.cmd)"
  }
  return $cfg[$key]
}

$domain = Require 'TWA_DOMAIN'
$manifestUrl = Require 'TWA_MANIFEST_URL'
$packageName = Require 'TWA_PACKAGE_NAME'
$appName = Require 'TWA_APP_NAME'
$launcherName = Require 'TWA_LAUNCHER_NAME'
$startUrl = Require 'TWA_START_URL'
$scope = Require 'TWA_SCOPE'
$themeColor = Require 'TWA_THEME_COLOR'

$keystorePath = Require 'TWA_KEYSTORE_PATH'
$keyAlias = Require 'TWA_KEY_ALIAS'
$storePass = Require 'TWA_KEYSTORE_PASSWORD'
$keyPass = Require 'TWA_KEY_PASSWORD'

$keystoreDir = Split-Path -Parent $keystorePath
New-Item -ItemType Directory -Force -Path $keystoreDir | Out-Null

# Resolve keytool
$keytool = $null
$cmd = Get-Command keytool -ErrorAction SilentlyContinue
if ($cmd) { $keytool = $cmd.Source }

if (-not $keytool -and $env:JAVA_HOME) {
  $candidate = Join-Path $env:JAVA_HOME 'bin\\keytool.exe'
  if (Test-Path $candidate) { $keytool = $candidate }
}

if (-not $keytool) {
  $bubblewrapRoot = Join-Path $env:USERPROFILE '.bubblewrap\\jdk'
  if (Test-Path $bubblewrapRoot) {
    $candidate = Get-ChildItem -Path $bubblewrapRoot -Recurse -Filter keytool.exe -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($candidate) { $keytool = $candidate.FullName }
  }
}

if (-not $keytool) {
  throw 'keytool.exe not found. Run 01_config.cmd first so Bubblewrap installs JDK, or set JAVA_HOME.'
}

if (-not (Test-Path $keystorePath)) {
  Write-Host "Generating keystore: $keystorePath"
  & $keytool -genkeypair -v -storetype JKS -keystore $keystorePath -alias $keyAlias -keyalg RSA -keysize 2048 -validity 10000 -storepass $storePass -keypass $keyPass -dname "CN=$appName, OU=Internal, O=YourCompany, L=NA, S=NA, C=US"
}

$shaLine = & $keytool -list -v -keystore $keystorePath -alias $keyAlias -storepass $storePass |
  Select-String -Pattern 'SHA256:' |
  Select-Object -First 1

if (-not $shaLine) {
  throw 'Could not extract SHA256 fingerprint from keytool output.'
}

$fingerprint = $shaLine.Line.Split(':',2)[1].Trim()
Write-Host "SHA256: $fingerprint"

# Update assetlinks template in repo
$assetlinksPath = Join-Path (Resolve-Path (Join-Path $root '..\\frontend\\public\\.well-known')).Path 'assetlinks.json'
if (Test-Path $assetlinksPath) {
  $parsed = Get-Content $assetlinksPath -Raw | ConvertFrom-Json
  $arr = @()
  if ($parsed -is [System.Array]) { $arr = $parsed } else { $arr = @($parsed) }

  if (-not $arr[0].target) {
    $arr[0] = [pscustomobject]@{
      relation = @('delegate_permission/common.handle_all_urls')
      target = [pscustomobject]@{
        namespace = 'android_app'
        package_name = $packageName
        sha256_cert_fingerprints = @($fingerprint)
      }
    }
  } else {
    $arr[0].target.package_name = $packageName
    $arr[0].target.sha256_cert_fingerprints = @($fingerprint)
  }

  $arr | ConvertTo-Json -Depth 10 | Set-Content $assetlinksPath -Encoding UTF8
  Write-Host "Updated assetlinks.json: $assetlinksPath"
} else {
  Write-Host "WARN: assetlinks.json not found at $assetlinksPath"
}

# Initialize Bubblewrap project (may prompt)
$appDir = Join-Path $root 'app'
if (Test-Path $appDir) { Remove-Item -Recurse -Force $appDir }
New-Item -ItemType Directory -Force -Path $appDir | Out-Null

Push-Location $appDir
try {
  Write-Host "Running Bubblewrap init for: $manifestUrl"
  npx --yes @bubblewrap/cli init --manifest=$manifestUrl --directory=$appDir
} finally {
  Pop-Location
}

# Post-init tweaks
$twaManifestPath = Join-Path $appDir 'twa-manifest.json'
if (Test-Path $twaManifestPath) {
  $m = Get-Content $twaManifestPath -Raw | ConvertFrom-Json
  $m.packageId = $packageName
  $m.name = $appName
  $m.launcherName = $launcherName
  $m.startUrl = $startUrl
  $m.scope = $scope
  $m.themeColor = $themeColor
  $m.enableSiteSettingsShortcut = $false
  $m.hostName = $domain
  $m.manifestUrl = $manifestUrl
  $m | ConvertTo-Json -Depth 20 | Set-Content $twaManifestPath -Encoding UTF8
}

# keystore.properties for Gradle builds
$androidDir = Join-Path $appDir 'android'
if (Test-Path $androidDir) {
  $props = Join-Path $androidDir 'keystore.properties'
  @(
    "storeFile=$keystorePath",
    "storePassword=$storePass",
    "keyAlias=$keyAlias",
    "keyPassword=$keyPass"
  ) | Set-Content $props -Encoding ASCII
}

Write-Host ''
Write-Host 'Init complete.'
Write-Host "For NO address bar, deploy assetlinks.json to: https://$domain/.well-known/assetlinks.json"
