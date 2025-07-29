@echo off
echo ========================================
echo   WERA Digital Consciousness - Full App Test
echo   Emulator: Pixel 6 - API 36.0
echo ========================================
echo.

echo Sprawdzanie czy emulator jest uruchomiony...
adb devices | findstr "device$" >nul
if errorlevel 1 (
    echo ❌ Emulator nie jest uruchomiony
    echo Uruchom emulator Pixel 6 z Android Studio
    pause
    exit /b 1
)

echo ✅ Emulator jest uruchomiony
echo.

echo Sprawdzanie najnowszego buildu...
eas build:list --platform android --limit 1

echo.
echo Pobieranie najnowszego APK...
echo Wprowadź URL APK z powyższej listy:
set /p apk_url="URL APK: "

if "%apk_url%"=="" (
    echo ❌ Nie podano URL APK
    pause
    exit /b 1
)

echo Pobieranie APK...
wget "%apk_url%" -OutFile "wera-full-app.apk"

if not exist "wera-full-app.apk" (
    echo ❌ Nie udało się pobrać APK
    pause
    exit /b 1
)

echo ✅ APK pobrane pomyślnie
echo.

echo Odinstalowywanie starej wersji...
adb uninstall com.wera.digitalconsciousness 2>nul

echo Instalowanie nowej wersji...
adb install wera-full-app.apk

if errorlevel 1 (
    echo ❌ Błąd instalacji
    pause
    exit /b 1
)

echo ✅ Aplikacja zainstalowana
echo.

echo Uruchamianie aplikacji...
adb shell am start -n com.wera.digitalconsciousness/.MainActivity

echo.
echo ✅ Aplikacja uruchomiona!
echo.
echo Testowanie funkcjonalności:
echo 1. Sprawdź czy splash screen się wyświetla
echo 2. Sprawdź czy główny dashboard się ładuje
echo 3. Spróbuj nawigować między ekranami
echo 4. Przetestuj responsywność UI
echo.

echo Czy chcesz monitorować logi aplikacji? (t/n)
set /p monitor="Monitorować logi: "

if /i "%monitor%"=="t" (
    echo.
    echo Monitorowanie logów (Ctrl+C aby zatrzymać)...
    adb logcat | findstr "WERA\|ReactNative\|System.err"
)

pause 