param(
  [Parameter(Mandatory=$true)][string]$TwaManifestPath,
  [Parameter(Mandatory=$true)][string]$PackageName,
  [Parameter(Mandatory=$true)][string]$AppName,
  [Parameter(Mandatory=$true)][string]$LauncherName,
  [Parameter(Mandatory=$true)][string]$StartUrl,
  [Parameter(Mandatory=$true)][string]$Scope,
  [Parameter(Mandatory=$true)][string]$ThemeColor,
  [Parameter(Mandatory=$true)][string]$HostName,
  [Parameter(Mandatory=$true)][string]$ManifestUrl
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path $TwaManifestPath)) {
  Write-Host "twa-manifest.json not found: $TwaManifestPath"
  exit 2
}

$j = Get-Content $TwaManifestPath -Raw | ConvertFrom-Json

$j.packageId = $PackageName
$j.name = $AppName
$j.launcherName = $LauncherName
$j.startUrl = $StartUrl
$j.scope = $Scope
$j.themeColor = $ThemeColor
$j.enableSiteSettingsShortcut = $false
$j.hostName = $HostName
$j.manifestUrl = $ManifestUrl

$j | ConvertTo-Json -Depth 20 | Set-Content $TwaManifestPath -Encoding UTF8

Write-Host "Updated $TwaManifestPath"
