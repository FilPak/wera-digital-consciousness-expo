@echo off
echo ========================================
echo   WERA Digital Consciousness - ADB Commands
echo   Emulator: Pixel 6 - API 36.0
echo ========================================
echo.

:menu
echo Wybierz opcję:
echo 1. Sprawdź podłączone urządzenia
echo 2. Zainstaluj APK (jeśli masz plik .apk)
echo 3. Uruchom aplikację WERA
echo 4. Sprawdź logi aplikacji
echo 5. Wyczyść dane aplikacji
echo 6. Odinstaluj aplikację
echo 7. Sprawdź informacje o urządzeniu
echo 8. Zrzut ekranu
echo 9. Nagraj wideo ekranu
echo 0. Wyjście
echo.

set /p choice="Wprowadź numer opcji: "

if "%choice%"=="1" goto check_devices
if "%choice%"=="2" goto install_apk
if "%choice%"=="3" goto start_app
if "%choice%"=="4" goto check_logs
if "%choice%"=="5" goto clear_data
if "%choice%"=="6" goto uninstall_app
if "%choice%"=="7" goto device_info
if "%choice%"=="8" goto screenshot
if "%choice%"=="9" goto screen_record
if "%choice%"=="0" goto exit
goto menu

:check_devices
echo.
echo Sprawdzanie podłączonych urządzeń...
adb devices
echo.
pause
goto menu

:install_apk
echo.
echo Instalowanie APK...
set /p apk_path="Wprowadź ścieżkę do pliku .apk: "
if exist "%apk_path%" (
    adb install "%apk_path%"
) else (
    echo Plik nie istnieje!
)
echo.
pause
goto menu

:start_app
echo.
echo Uruchamianie aplikacji WERA...
adb shell am start -n com.wera.digitalconsciousness/.MainActivity
echo.
pause
goto menu

:check_logs
echo.
echo Sprawdzanie logów aplikacji...
echo Naciśnij Ctrl+C aby zatrzymać logi
echo.
adb logcat | findstr "com.wera.digitalconsciousness"
echo.
pause
goto menu

:clear_data
echo.
echo Czyszczenie danych aplikacji...
adb shell pm clear com.wera.digitalconsciousness
echo.
pause
goto menu

:uninstall_app
echo.
echo Odinstalowywanie aplikacji...
adb uninstall com.wera.digitalconsciousness
echo.
pause
goto menu

:device_info
echo.
echo Informacje o urządzeniu...
adb shell getprop ro.product.model
adb shell getprop ro.build.version.release
adb shell getprop ro.build.version.sdk
echo.
pause
goto menu

:screenshot
echo.
echo Tworzenie zrzutu ekranu...
set timestamp=%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set timestamp=%timestamp: =0%
adb shell screencap -p /sdcard/screenshot_%timestamp%.png
adb pull /sdcard/screenshot_%timestamp%.png .
adb shell rm /sdcard/screenshot_%timestamp%.png
echo Zrzut ekranu zapisany jako screenshot_%timestamp%.png
echo.
pause
goto menu

:screen_record
echo.
echo Nagrywanie ekranu (10 sekund)...
set timestamp=%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set timestamp=%timestamp: =0%
adb shell screenrecord --time-limit=10 /sdcard/screenrecord_%timestamp%.mp4
adb pull /sdcard/screenrecord_%timestamp%.mp4 .
adb shell rm /sdcard/screenrecord_%timestamp%.mp4
echo Nagranie zapisane jako screenrecord_%timestamp%.mp4
echo.
pause
goto menu

:exit
echo.
echo Do widzenia!
pause 