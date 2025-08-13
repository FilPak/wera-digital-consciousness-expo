# 🧠 WERA Background Agent

Inteligentny inspektor pre-build dla aplikacji WERA Digital Consciousness.

## Przegląd

WERA Background Agent to specjalistyczne narzędzie do analizy kodu aplikacji AI przed kompilacją. Sprawdza strukturę projektu, konfiguracje, kod źródłowy oraz specjalne komponenty AI systemu WERA.

## Funkcje

### ✅ Podstawowe sprawdzenia
- **Struktura projektu** - Weryfikacja wymaganych folderów i plików
- **Konfiguracje** - Walidacja package.json, tsconfig.json, babel.config.js, metro.config.js
- **Kod źródłowy** - Analiza plików .tsx, .js, .json pod kątem błędów
- **Zależności** - Sprawdzanie brakujących i przestarzałych pakietów
- **TypeScript** - Sprawdzenie typów i składni

### 🧠 Specjalne sprawdzenia AI
- **Komponenty AI** - Weryfikacja WeraCore, EmotionEngine, AutonomyEngine
- **Konteksty AI** - Sprawdzenie implementacji Context API
- **Silniki AI** - Analiza ConversationEngine, ResponseGenerator, etc.
- **System Sandbox** - Weryfikacja SandboxFileSystem i folderów
- **Stan AI** - Sprawdzenie plików vera_state.json, emotion_history.log
- **Bezpieczeństwo AI** - Analiza SecuritySystem i EmergencyProtocol

## Instalacja

Background Agent jest już zintegrowany z projektem WERA. Wymagane zależności:

```bash
npm install chokidar ts-node --save-dev
```

## Użycie

### Podstawowe uruchomienie
```bash
npm run inspect
```

### Tryb obserwowania (watch)
```bash
npm run inspect:watch
```

### Auto-fix prostych błędów
```bash
npm run inspect:fix
```

### Format JSON
```bash
npm run inspect:json
```

### Ręczne uruchomienie z opcjami
```bash
node tools/wera-inspect.js --help
```

## Opcje CLI

| Opcja | Opis |
|-------|------|
| `--help` | Pokaż pomoc |
| `--skip-node-modules` | Pomiń sprawdzanie node_modules |
| `--no-ai-analysis` | Wyłącz analizę komponentów AI |
| `--no-typescript` | Wyłącz sprawdzanie TypeScript |
| `--project-root <path>` | Ustaw ścieżkę do projektu |
| `--output <path>` | Ścieżka do pliku raportu |
| `--json` | Wyświetl wyniki w formacie JSON |
| `--watch` | Tryb obserwowania zmian |
| `--fix` | Automatyczne naprawianie |

## Integracja z build

Background Agent jest automatycznie uruchamiany przed:
- `npm run build:android`
- `npm run prebuild`
- `npm run publish`
- `npm run precommit` (git hook)

## Konfiguracja

Ustawienia można dostosować w pliku `wera-agent.config.js`:

```javascript
module.exports = {
  checks: {
    projectStructure: true,
    configurations: true,
    sourceCode: true,
    dependencies: true,
    aiComponents: true,
    typescript: true
  },
  
  weraRules: {
    requiredAIComponents: [
      'src/core/WeraCore.tsx',
      'src/core/EmotionEngine.tsx',
      // ...
    ],
    
    requiredProviders: [
      'WeraCoreProvider',
      'EmotionProvider',
      // ...
    ]
  },
  
  // ... więcej opcji
};
```

## Exit Codes

| Code | Znaczenie |
|------|-----------|
| 0 | Sukces (brak błędów) |
| 1 | Błędy krytyczne |
| 2 | Ostrzeżenia |
| 3 | Błąd systemu |

## Przykłady użycia

### Szybka inspekcja przed commitem
```bash
npm run inspect
```

### Ciągła obserwacja podczas developmentu
```bash
npm run inspect:watch
```

### Inspekcja z automatycznym naprawianiem
```bash
npm run inspect:fix
```

### Eksport raportu do pliku
```bash
npm run inspect -- --output inspection-report.txt
```

### Tylko sprawdzenia podstawowe (bez AI)
```bash
npm run inspect -- --no-ai-analysis
```

## Typy błędów

### 🔴 Błędy krytyczne
- Brakujące wymagane pliki
- Błędy składni TypeScript
- Nieprawidłowe importy
- Brakujące kluczowe komponenty AI

### 🟡 Ostrzeżenia
- Brakujące zależności opcjonalne
- Potencjalne problemy z kodem
- Niezalecane praktyki
- Brakujące funkcje AI

### 🔵 Informacje
- Sugestie ulepszeń
- Optymalizacje
- Dodatkowe funkcje AI
- Best practices

## Specjalne sprawdzenia WERA

### Komponenty AI
Agent sprawdza czy wszystkie kluczowe komponenty AI są obecne i poprawnie zaimplementowane:

- **WeraCore** - Główny silnik AI
- **EmotionEngine** - System emocji
- **AutonomyEngine** - System autonomii
- **ThoughtProcessor** - Procesor myśli
- **ConsciousnessMonitor** - Monitor świadomości

### System Sandbox
Weryfikuje czy system sandbox dla AI jest poprawnie skonfigurowany:

- Foldery sandbox (sandbox_memory, sandbox_dreams, etc.)
- SandboxFileSystem implementation
- Bezpieczeństwo ścieżek

### Stan AI
Sprawdza obsługę plików stanu AI:

- vera_identity.json
- vera_state.json
- emotion_history.log
- memory.jsonl

## Rozszerzanie

### Custom Rules
Możesz dodać własne reguły w konfiguracji:

```javascript
// wera-agent.config.js
module.exports = {
  advanced: {
    customRules: [
      function checkCustomRule(filePath, content) {
        if (/* warunek */) {
          return {
            category: 'Custom',
            severity: 'warning',
            message: 'Custom rule violation',
            file: filePath,
            suggestion: 'Fix suggestion'
          };
        }
        return null;
      }
    ]
  }
};
```

### Integracja z CI/CD
```yaml
# GitHub Actions example
- name: Run WERA Inspection
  run: |
    npm run inspect
    if [ $? -eq 1 ]; then
      echo "Critical errors found!"
      exit 1
    fi
```

## Troubleshooting

### Błąd "Cannot find module"
```bash
npm install
npm run inspect
```

### Timeout podczas sprawdzania TypeScript
```bash
npm run inspect -- --no-typescript
```

### Zbyt wiele ostrzeżeń
```bash
npm run inspect -- --no-ai-analysis
```

## Wsparcie

Jeśli napotkasz problemy z Background Agent:

1. Sprawdź czy wszystkie zależności są zainstalowane
2. Uruchom `npm run inspect --help` dla opcji
3. Sprawdź plik `wera-agent.config.js`
4. Sprawdź logi w `wera-inspection-report.txt`

## Roadmap

Planowane funkcje:
- [ ] Integracja z GitHub Actions
- [ ] Slack notifications
- [ ] HTML reports
- [ ] Performance profiling
- [ ] AI model validation
- [ ] Memory leak detection
- [ ] Security vulnerability scanning

---

**WERA Background Agent** - Inteligentny strażnik Twojego kodu AI 🧠✨