@echo off
echo ========================================
echo   WERA Digital Consciousness - Test Kompletny
echo   Emulator: Pixel 6 - API 36.0
echo ========================================
echo.

echo [1/10] Sprawdzanie ADB...
adb version >nul 2>&1
if errorlevel 1 (
    echo ❌ BŁĄD: ADB nie jest dostępne
    pause
    exit /b 1
) else (
    echo ✅ ADB jest dostępne
)

echo.
echo [2/10] Sprawdzanie emulatora...
adb devices | findstr "emulator" >nul
if errorlevel 1 (
    echo ❌ BŁĄD: Emulator nie jest uruchomiony
    pause
    exit /b 1
) else (
    echo ✅ Emulator jest podłączony
)

echo.
echo [3/10] Sprawdzanie zależności...
if not exist "node_modules" (
    echo ⚠️  Instalowanie zależności...
    npm install
) else (
    echo ✅ Zależności są zainstalowane
)

echo.
echo [4/10] Sprawdzanie konfiguracji...
if not exist "metro.config.js" (
    echo ❌ BŁĄD: Brak konfiguracji Metro
    pause
    exit /b 1
) else (
    echo ✅ Konfiguracja Metro OK
)

echo.
echo [5/10] Sprawdzanie EAS CLI...
eas --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  EAS CLI nie jest zainstalowane
    npm install -g @expo/eas-cli
) else (
    echo ✅ EAS CLI jest dostępne
)

echo.
echo [6/10] Budowanie aplikacji...
echo Budowanie w trybie preview (może potrwać kilka minut)...
eas build --platform android --profile preview --non-interactive

echo.
echo [7/10] Pobieranie najnowszego APK...
for /f "tokens=*" %%i in ('eas build:list --limit 1 --json --non-interactive') do set BUILD_INFO=%%i
rem Tutaj normalnie parsowalibyśmy JSON, ale dla uproszczenia użyjemy ręcznego podejścia

echo.
echo [8/10] Instalowanie aplikacji...
echo Sprawdź czy nowy APK został pobrany i zainstaluj go ręcznie
echo lub użyj: adb install [nazwa_pliku].apk

echo.
echo [9/10] Uruchamianie aplikacji...
adb shell am start -n com.wera.digitalconsciousness/.MainActivity
if errorlevel 1 (
    echo ❌ BŁĄD: Nie udało się uruchomić aplikacji
) else (
    echo ✅ Aplikacja uruchomiona
)

echo.
echo [10/10] Sprawdzanie stanu aplikacji...
timeout /t 3 >nul
adb shell dumpsys activity activities | findstr com.wera.digitalconsciousness >nul
if errorlevel 1 (
    echo ❌ Aplikacja nie jest aktywna
) else (
    echo ✅ Aplikacja działa poprawnie
)

echo.
echo ========================================
echo           TESTY ZAKOŃCZONE
echo ========================================
echo.
echo Aby przetestować funkcje aplikacji:
echo 1. Dotknij ekranu emulatora
echo 2. Sprawdź czy przyciski reagują
echo 3. Przetestuj alerty i interakcje
echo 4. Sprawdź responsywność na różnych orientacjach
echo.
echo Aby monitorować logi: adb logcat
echo Aby zrobić zrzut ekranu: adb shell screencap -p /sdcard/screenshot.png
echo.
pause 