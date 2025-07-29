# 🚀 Szybki Start - Testowanie na Emulatorze Android

## 📱 Emulator: Pixel 6 - API 36.0

### 1. Przygotowanie Emulatora

1. **Uruchom Android Studio**
2. **Otwórz AVD Manager** (Tools → AVD Manager)
3. **Uruchom emulator Pixel 6** z API 36.0
4. **Poczekaj** aż emulator się w pełni załaduje

### 2. Sprawdzenie Połączenia

```bash
# Sprawdź czy emulator jest podłączony
adb devices

# Powinieneś zobaczyć coś takiego:
# List of devices attached
# emulator-5554    device
```

### 3. Szybkie Testowanie

#### Opcja A: Automatyczny Skrypt (Zalecane)
```bash
# Uruchom skrypt testowy
test-android-emulator.bat
```

#### Opcja B: Ręczne Uruchomienie
```bash
# Przejdź do katalogu projektu
cd wera-digital-consciousness-expo

# Zainstaluj zależności (jeśli potrzebne)
npm install

# Uruchom aplikację na Android
npm run android
```

#### Opcja C: PowerShell (Zaawansowane)
```powershell
# Sprawdź urządzenia
.\test-emulator.ps1 -CheckDevices

# Uruchom aplikację i zrób zrzut ekranu
.\test-emulator.ps1 -StartApp -Screenshot

# Monitoruj logi
.\test-emulator.ps1 -MonitorLogs
```

### 4. Podstawowe Komendy ADB

```bash
# Sprawdź urządzenia
adb devices

# Uruchom aplikację WERA
adb shell am start -n com.wera.digitalconsciousness/.MainActivity

# Sprawdź logi aplikacji
adb logcat | grep com.wera.digitalconsciousness

# Zrzut ekranu
adb shell screencap -p /sdcard/screenshot.png
adb pull /sdcard/screenshot.png .

# Nagraj ekran (10 sekund)
adb shell screenrecord --time-limit=10 /sdcard/record.mp4
adb pull /sdcard/record.mp4 .
```

### 5. Rozwiązywanie Problemów

#### Problem: ADB nie jest rozpoznawane
```bash
# Dodaj Android SDK do PATH
# Ścieżka: C:\Users\[USERNAME]\AppData\Local\Android\Sdk\platform-tools
```

#### Problem: Emulator nie jest widoczny
```bash
# Sprawdź czy emulator jest uruchomiony
adb devices

# Jeśli nie ma urządzeń, uruchom emulator z Android Studio
```

#### Problem: Aplikacja się nie uruchamia
```bash
# Wyczyść cache Expo
npm start -- --clear

# Lub
expo start --clear
```

#### Problem: Błędy kompilacji
```bash
# Usuń node_modules i zainstaluj ponownie
rm -rf node_modules
npm install

# Wyczyść cache npm
npm cache clean --force
```

### 6. Testowanie UI

#### Sprawdź czy aplikacja się uruchomiła:
```bash
adb shell dumpsys activity activities | grep com.wera.digitalconsciousness
```

#### Sprawdź uprawnienia:
```bash
adb shell dumpsys package com.wera.digitalconsciousness | grep permission
```

#### Test wydajności:
```bash
# Użycie CPU
adb shell top -n 1 | grep com.wera.digitalconsciousness

# Użycie pamięci
adb shell dumpsys meminfo com.wera.digitalconsciousness
```

### 7. Narzędzia Testowe

#### Menu ADB Commands:
```bash
# Uruchom interaktywne menu
adb-commands.bat
```

#### PowerShell Script:
```powershell
# Pełne menu opcji
.\test-emulator.ps1
```

### 8. Struktura Plików Testowych

```
wera-digital-consciousness-expo/
├── test-android-emulator.bat    # Główny skrypt testowy
├── adb-commands.bat             # Menu komend ADB
├── test-emulator.ps1            # PowerShell script
├── QUICK_START_ANDROID.md       # Ten plik
└── README.md                    # Pełna dokumentacja
```

### 9. Przydatne Skróty

| Skrót | Opis |
|-------|------|
| `test-android-emulator.bat` | Szybkie uruchomienie testów |
| `adb-commands.bat` | Menu komend ADB |
| `.\test-emulator.ps1 -StartApp` | Uruchom aplikację |
| `.\test-emulator.ps1 -Screenshot` | Zrzut ekranu |
| `.\test-emulator.ps1 -MonitorLogs` | Monitorowanie logów |

### 10. Następne Kroki

Po udanym uruchomieniu aplikacji na emulatorze:

1. **Przetestuj wszystkie ekrany** aplikacji
2. **Sprawdź responsywność** na różnych rozdzielczościach
3. **Przetestuj funkcje** (nawigacja, motywy, itp.)
4. **Sprawdź logi** pod kątem błędów
5. **Zrób zrzuty ekranu** dla dokumentacji

---

**💡 Wskazówka:** Użyj `test-android-emulator.bat` jako głównego narzędzia do testowania - automatycznie sprawdzi połączenie z emulatorem i uruchomi aplikację. 