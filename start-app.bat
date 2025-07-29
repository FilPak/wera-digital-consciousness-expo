@echo off
echo ========================================
echo   WERA Digital Consciousness - Expo
echo ========================================
echo.
echo Uruchamianie aplikacji...
echo.

REM Sprawdź czy node_modules istnieje
if not exist "node_modules" (
    echo Instalowanie zależności...
    npm install
    echo.
)

REM Uruchom aplikację
echo Uruchamianie serwera deweloperskiego...
echo.
echo Opcje:
echo - Naciśnij 'w' aby otworzyć w przeglądarce
echo - Naciśnij 'a' aby uruchomić na Android
echo - Naciśnij 'i' aby uruchomić na iOS (macOS)
echo - Naciśnij 'r' aby przeładować
echo - Naciśnij 'm' aby przełączyć menu
echo - Naciśnij 'j' aby otworzyć debugger
echo.
echo Naciśnij Ctrl+C aby zatrzymać
echo.

npm start

pause 