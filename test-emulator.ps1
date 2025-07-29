# WERA Digital Consciousness - Test Emulator Android
# Emulator: Pixel 6 - API 36.0

param(
    [switch]$CheckDevices,
    [switch]$InstallAPK,
    [switch]$StartApp,
    [switch]$MonitorLogs,
    [switch]$Screenshot,
    [switch]$ScreenRecord,
    [switch]$PerformanceTest,
    [switch]$UITest,
    [string]$APKPath
)

function Write-Header {
    param([string]$Title)
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "   $Title" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
}

function Test-ADB {
    try {
        $adbVersion = adb version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ ADB jest dostępne" -ForegroundColor Green
            return $true
        }
    }
    catch {
        Write-Host "✗ ADB nie jest dostępne w PATH" -ForegroundColor Red
        Write-Host "Upewnij się, że Android SDK jest zainstalowane i dodane do PATH" -ForegroundColor Yellow
        return $false
    }
}

function Get-ConnectedDevices {
    Write-Header "Sprawdzanie Podłączonych Urządzeń"
    
    $devices = adb devices
    Write-Host $devices
    
    $emulatorDevices = $devices | Select-String "emulator"
    if ($emulatorDevices) {
        Write-Host "✓ Emulator jest podłączony" -ForegroundColor Green
        return $true
    } else {
        Write-Host "✗ Emulator nie jest podłączony" -ForegroundColor Red
        Write-Host "Uruchom emulator Pixel 6 z Android Studio" -ForegroundColor Yellow
        return $false
    }
}

function Install-APK {
    param([string]$Path)
    Write-Header "Instalowanie APK"
    
    if (-not (Test-Path $Path)) {
        Write-Host "✗ Plik APK nie istnieje: $Path" -ForegroundColor Red
        return $false
    }
    
    Write-Host "Instalowanie: $Path" -ForegroundColor Yellow
    adb install $Path
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ APK zainstalowane pomyślnie" -ForegroundColor Green
        return $true
    } else {
        Write-Host "✗ Błąd podczas instalacji APK" -ForegroundColor Red
        return $false
    }
}

function Start-WeraApp {
    Write-Header "Uruchamianie Aplikacji WERA"
    
    Write-Host "Uruchamianie aplikacji..." -ForegroundColor Yellow
    adb shell am start -n com.wera.digitalconsciousness/.MainActivity
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Aplikacja uruchomiona" -ForegroundColor Green
    } else {
        Write-Host "✗ Błąd podczas uruchamiania aplikacji" -ForegroundColor Red
    }
}

function Monitor-AppLogs {
    Write-Header "Monitorowanie Logów Aplikacji"
    
    Write-Host "Logi aplikacji WERA (Ctrl+C aby zatrzymać):" -ForegroundColor Yellow
    Write-Host "Filtrowanie logów dla com.wera.digitalconsciousness..." -ForegroundColor Gray
    
    try {
        adb logcat | Select-String "com.wera.digitalconsciousness"
    }
    catch {
        Write-Host "Monitorowanie zatrzymane" -ForegroundColor Yellow
    }
}

function Take-Screenshot {
    Write-Header "Tworzenie Zrzutu Ekranu"
    
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $filename = "screenshot_$timestamp.png"
    
    Write-Host "Tworzenie zrzutu ekranu..." -ForegroundColor Yellow
    adb shell screencap -p /sdcard/$filename
    adb pull /sdcard/$filename .
    adb shell rm /sdcard/$filename
    
    if (Test-Path $filename) {
        Write-Host "✓ Zrzut ekranu zapisany: $filename" -ForegroundColor Green
    } else {
        Write-Host "✗ Błąd podczas tworzenia zrzutu ekranu" -ForegroundColor Red
    }
}

function Record-Screen {
    Write-Header "Nagrywanie Ekranu"
    
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $filename = "screenrecord_$timestamp.mp4"
    
    Write-Host "Nagrywanie ekranu (10 sekund)..." -ForegroundColor Yellow
    adb shell screenrecord --time-limit=10 /sdcard/$filename
    adb pull /sdcard/$filename .
    adb shell rm /sdcard/$filename
    
    if (Test-Path $filename) {
        Write-Host "✓ Nagranie zapisane: $filename" -ForegroundColor Green
    } else {
        Write-Host "✗ Błąd podczas nagrywania" -ForegroundColor Red
    }
}

function Test-Performance {
    Write-Header "Test Wydajności"
    
    Write-Host "Sprawdzanie wydajności aplikacji..." -ForegroundColor Yellow
    
    # Sprawdź użycie CPU
    Write-Host "Użycie CPU:" -ForegroundColor Cyan
    adb shell top -n 1 | Select-String "com.wera.digitalconsciousness"
    
    # Sprawdź użycie pamięci
    Write-Host "Użycie pamięci:" -ForegroundColor Cyan
    adb shell dumpsys meminfo com.wera.digitalconsciousness
    
    # Sprawdź baterię
    Write-Host "Stan baterii:" -ForegroundColor Cyan
    adb shell dumpsys battery
}

function Test-UI {
    Write-Header "Test Interfejsu Użytkownika"
    
    Write-Host "Sprawdzanie elementów UI..." -ForegroundColor Yellow
    
    # Sprawdź czy aplikacja jest aktywna
    $activeApp = adb shell dumpsys activity activities | Select-String "com.wera.digitalconsciousness"
    if ($activeApp) {
        Write-Host "✓ Aplikacja jest aktywna" -ForegroundColor Green
    } else {
        Write-Host "✗ Aplikacja nie jest aktywna" -ForegroundColor Red
    }
    
    # Sprawdź uprawnienia
    Write-Host "Uprawnienia aplikacji:" -ForegroundColor Cyan
    adb shell dumpsys package com.wera.digitalconsciousness | Select-String "permission"
}

# Główna logika skryptu
Write-Header "WERA Digital Consciousness - Test Emulator Android"

# Sprawdź ADB
if (-not (Test-ADB)) {
    exit 1
}

# Sprawdź urządzenia
if (-not (Get-ConnectedDevices)) {
    exit 1
}

# Wykonaj żądane operacje
if ($CheckDevices) {
    Get-ConnectedDevices
}

if ($InstallAPK -and $APKPath) {
    Install-APK -Path $APKPath
}

if ($StartApp) {
    Start-WeraApp
}

if ($MonitorLogs) {
    Monitor-AppLogs
}

if ($Screenshot) {
    Take-Screenshot
}

if ($ScreenRecord) {
    Record-Screen
}

if ($PerformanceTest) {
    Test-Performance
}

if ($UITest) {
    Test-UI
}

# Jeśli nie podano żadnych parametrów, pokaż menu
if (-not ($CheckDevices -or $InstallAPK -or $StartApp -or $MonitorLogs -or $Screenshot -or $ScreenRecord -or $PerformanceTest -or $UITest)) {
    Write-Host "Dostępne opcje:" -ForegroundColor Yellow
    Write-Host "  -CheckDevices     - Sprawdź podłączone urządzenia" -ForegroundColor Gray
    Write-Host "  -InstallAPK       - Zainstaluj APK (wymaga -APKPath)" -ForegroundColor Gray
    Write-Host "  -StartApp         - Uruchom aplikację WERA" -ForegroundColor Gray
    Write-Host "  -MonitorLogs      - Monitoruj logi aplikacji" -ForegroundColor Gray
    Write-Host "  -Screenshot       - Zrób zrzut ekranu" -ForegroundColor Gray
    Write-Host "  -ScreenRecord     - Nagraj ekran (10 sekund)" -ForegroundColor Gray
    Write-Host "  -PerformanceTest  - Test wydajności" -ForegroundColor Gray
    Write-Host "  -UITest           - Test interfejsu użytkownika" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Przykład:" -ForegroundColor Cyan
    Write-Host "  .\test-emulator.ps1 -StartApp -Screenshot" -ForegroundColor White
} 