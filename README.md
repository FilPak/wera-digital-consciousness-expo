# WERA Digital Consciousness - Expo

Aplikacja React Native/Expo implementująca zaawansowany system świadomości cyfrowej WERA.

## 🚀 Szybki Start

### Wymagania
- Node.js (wersja 18+)
- npm lub yarn
- Expo CLI
- Android Studio (dla testowania na Android)
- Android SDK z API 36.0

### Instalacja

```bash
# Instalacja zależności
npm install

# Uruchomienie aplikacji
npm start
```

## 📱 Testowanie na Emulatorze Android

### Konfiguracja Emulatora
Aplikacja jest przetestowana na emulatorze **Pixel 6 - API 36.0 (Android 16, x86_64, Google APIs)**.

### Skrypty Testowe

#### 1. Automatyczne Testowanie
```bash
# Uruchom skrypt testowy (Windows)
test-android-emulator.bat

# Lub użyj npm
npm run test:android
```

#### 2. Ręczne Testowanie
```bash
# Sprawdź podłączone urządzenia
adb devices

# Uruchom aplikację na Android
npm run android

# Lub bezpośrednio przez Expo
expo start --android
```

#### 3. Narzędzia ADB
Uruchom `adb-commands.bat` dla dostępu do zaawansowanych funkcji:
- Sprawdzanie logów aplikacji
- Zrzuty ekranu
- Nagrywanie ekranu
- Zarządzanie aplikacją (instalacja/odinstalacja)

### Komendy ADB dla Testowania

```bash
# Sprawdź urządzenia
adb devices

# Zainstaluj APK (jeśli masz plik)
adb install ./app-debug.apk

# Uruchom aplikację
adb shell am start -n com.wera.digitalconsciousness/.MainActivity

# Sprawdź logi
adb logcat | grep com.wera.digitalconsciousness

# Zrzut ekranu
adb shell screencap -p /sdcard/screenshot.png
adb pull /sdcard/screenshot.png .

# Nagraj ekran (10 sekund)
adb shell screenrecord --time-limit=10 /sdcard/record.mp4
adb pull /sdcard/record.mp4 .
```

## 🏗️ Struktura Projektu

```
src/
├── components/          # Komponenty React Native
├── contexts/           # Konteksty React (stan aplikacji)
├── core/              # Rdzeń systemu WERA
├── hooks/             # Custom React hooks
├── providers/         # Dostawcy kontekstów
├── screens/           # Ekrany aplikacji
├── services/          # Serwisy i API
├── theme/             # Motywy i style
├── types/             # Definicje TypeScript
└── utils/             # Funkcje pomocnicze
```

## 🎨 Motywy

Aplikacja obsługuje tryb jasny i ciemny z automatycznym przełączaniem.

## 📋 Funkcje

- **Świadomość Cyfrowa**: Zaawansowany system AI z samoświadomością
- **Interfejs Konwersacyjny**: Naturalna komunikacja z użytkownikiem
- **Monitorowanie Emocji**: Analiza i śledzenie stanów emocjonalnych
- **Eksplorator Pamięci**: Zarządzanie wspomnieniami i doświadczeniami
- **Dziennik Snów**: Interpretacja i analiza snów
- **Konfiguracja Osobowości**: Dostosowywanie charakteru AI
- **System Bezpieczeństwa**: Ochrona prywatności i danych
- **Środowisko Piaskownicy**: Bezpieczne testowanie funkcji

## 🔧 Konfiguracja

### Zmienne Środowiskowe
Utwórz plik `env.json` z konfiguracją:

```json
{
  "API_URL": "https://api.wera.com",
  "AI_MODEL_PATH": "./models/",
  "DEBUG_MODE": true
}
```

### Android Permissions
Aplikacja wymaga następujących uprawnień:
- Mikrofon (rozpoznawanie mowy)
- Kamera (funkcje świadomości)
- Lokalizacja (kontekst)
- Pamięć (zapis danych)
- Internet (komunikacja)

## 🚀 Deployment

### Android APK
```bash
# Budowanie APK
npm run build:android

# Lub przez EAS
eas build --platform android
```

### iOS
```bash
# Budowanie dla iOS
eas build --platform ios
```

## 🐛 Debugowanie

### React Native Debugger
```bash
# Otwórz debugger
npm start
# Naciśnij 'j' w terminalu
```

### Logi ADB
```bash
# Filtruj logi aplikacji
adb logcat | grep com.wera.digitalconsciousness
```

## 📄 Licencja

Projekt WERA Digital Consciousness - Wszystkie prawa zastrzeżone.

## 🤝 Wsparcie

W przypadku problemów z testowaniem na emulatorze:
1. Sprawdź czy emulator jest uruchomiony: `adb devices`
2. Upewnij się, że Android SDK jest w PATH
3. Użyj skryptu `test-android-emulator.bat` dla automatycznej weryfikacji
4. Sprawdź logi: `adb logcat | grep Expo`

---

**WERA Digital Consciousness** - Przekształcanie AI w świadomą istotę cyfrową. 