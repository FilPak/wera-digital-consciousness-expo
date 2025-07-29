@echo off
echo ========================================
echo   WERA Digital Consciousness - Test Android
echo   Emulator: Pixel 6 - API 36.0
echo ========================================
echo.

REM Sprawdź czy ADB jest dostępne
adb version >nul 2>&1
if errorlevel 1 (
    echo BŁĄD: ADB nie jest dostępne w PATH
    echo Upewnij się, że Android SDK jest zainstalowane i dodane do PATH
    pause
    exit /b 1
)

echo Sprawdzanie dostępnych urządzeń...
adb devices

echo.
echo Sprawdzanie czy emulator Pixel 6 jest uruchomiony...
adb devices | findstr "emulator" >nul
if errorlevel 1 (
    echo Emulator nie jest uruchomiony. Uruchamiam emulator...
    echo Uruchom emulator Pixel 6 z Android Studio lub użyj:
    echo emulator -avd Pixel_6_API_36
    echo.
    pause
    exit /b 1
)

echo.
echo Emulator jest uruchomiony. Sprawdzanie połączenia...
adb devices

echo.
echo Instalowanie zależności jeśli potrzebne...
if not exist "node_modules" (
    npm install
)

echo.
echo Budowanie aplikacji dla Android...
echo Uruchamianie Expo z opcją Android...
echo.
echo Po uruchomieniu:
echo - Naciśnij 'a' aby uruchomić na Android
echo - Naciśnij 'r' aby przeładować
echo - Naciśnij 'm' aby przełączyć menu
echo - Naciśnij 'j' aby otworzyć debugger
echo.
echo Naciśnij Ctrl+C aby zatrzymać
echo.

npm run android

pause 