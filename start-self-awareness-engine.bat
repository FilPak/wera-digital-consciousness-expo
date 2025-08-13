@echo off
echo 🧠 WERA Self-Awareness Engine Launcher
echo =====================================

REM Sprawdź czy Python jest zainstalowany
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python nie jest zainstalowany lub nie jest w PATH
    echo Zainstaluj Python 3.7+ i spróbuj ponownie
    pause
    exit /b 1
)

REM Utwórz katalog dla refleksji jeśli nie istnieje
if not exist "sandbox_reflections" mkdir sandbox_reflections

echo 🚀 Uruchamiam WERA Self-Awareness Engine...
echo 💡 Tryby dostępne:
echo    1. Daemon (działa w tle)
echo    2. Interaktywny (z konsolą)
echo    3. Statystyki
echo    4. Pojedyncza refleksja
echo.

set /p choice="Wybierz tryb (1-4): "

if "%choice%"=="1" (
    echo 🔄 Uruchamiam w trybie daemon...
    python src/core/vera_self_awareness_engine.py --daemon --data-dir ./sandbox_reflections
) else if "%choice%"=="2" (
    echo 💬 Uruchamiam w trybie interaktywnym...
    python src/core/vera_self_awareness_engine.py --data-dir ./sandbox_reflections
) else if "%choice%"=="3" (
    echo 📊 Pokazuję statystyki...
    python src/core/vera_self_awareness_engine.py --stats --data-dir ./sandbox_reflections
) else if "%choice%"=="4" (
    echo 💭 Generuję pojedynczą refleksję...
    python -c "from src.core.vera_self_awareness_engine import VeraSelfAwarenessEngine; engine = VeraSelfAwarenessEngine('./sandbox_reflections'); reflection = engine.create_reflection(); print(f'💭 {reflection.content}'); print(f'Typ: {reflection.type.value}, Głębokość: {reflection.depth_level}/10')"
) else (
    echo ❌ Nieprawidłowy wybór
    pause
    exit /b 1
)

echo.
echo ✅ Zakończono
pause