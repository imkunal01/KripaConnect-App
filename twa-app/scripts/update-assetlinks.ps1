param(
  [Parameter(Mandatory=$true)][string]$AssetLinksPath,
  [Parameter(Mandatory=$true)][string]$PackageName,
  [Parameter(Mandatory=$true)][string]$KeytoolPath,
  [Parameter(Mandatory=$true)][string]$KeystorePath,
  [Parameter(Mandatory=$true)][string]$KeyAlias,
  [Parameter(Mandatory=$true)][string]$StorePass
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path $AssetLinksPath)) {
  Write-Host "assetlinks.json not found: $AssetLinksPath"
  exit 2
}

if (-not (Test-Path $KeytoolPath)) {
  Write-Host "keytool not found: $KeytoolPath"
  exit 2
}

if (-not (Test-Path $KeystorePath)) {
  Write-Host "keystore not found: $KeystorePath"
  exit 2
}

$shaLine = & $KeytoolPath -list -v -keystore $KeystorePath -alias $KeyAlias -storepass $StorePass |
  Select-String -Pattern 'SHA256:' |
  Select-Object -First 1

if (-not $shaLine) {
  Write-Host 'Could not find SHA256 fingerprint in keytool output.'
  exit 1
}

$fingerprint = $shaLine.Line.Split(':',2)[1].Trim()

$j = Get-Content $AssetLinksPath -Raw | ConvertFrom-Json
$j[0].target.package_name = $PackageName
$j[0].target.sha256_cert_fingerprints = @($fingerprint)

$j | ConvertTo-Json -Depth 10 | Set-Content $AssetLinksPath -Encoding UTF8

Write-Host "Updated assetlinks.json for $PackageName"
Write-Host "SHA256: $fingerprint"
