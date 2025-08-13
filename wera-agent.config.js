module.exports = {
  // Podstawowa konfiguracja
  projectRoot: process.cwd(),
  
  // Kontrola sprawdzeń
  checks: {
    projectStructure: true,
    configurations: true,
    sourceCode: true,
    dependencies: true,
    aiComponents: true,
    typescript: true,
    nodeModules: false // Domyślnie pominięte dla szybkości
  },
  
  // Specjalne reguły dla WERA
  weraRules: {
    // Wymagane komponenty AI
    requiredAIComponents: [
      'src/core/WeraCore.tsx',
      'src/core/EmotionEngine.tsx',
      'src/contexts/MemoryContext.tsx',
      'src/core/ConsciousnessMonitor.tsx',
      'src/core/AutonomyEngine.tsx',
      'src/core/ThoughtProcessor.tsx',
      'src/providers/AllProviders.tsx'
    ],
    
    // Wymagane providers
    requiredProviders: [
      'WeraCoreProvider',
      'EmotionProvider', 
      'MemoryProvider',
      'ThemeProvider'
    ],
    
    // Sandbox foldery (tworzone dynamicznie)
    sandboxFolders: [
      'sandbox_memory',
      'sandbox_dreams', 
      'sandbox_thoughts',
      'sandbox_initiatives',
      'sandbox_reflections',
      'sandbox_autoscripts'
    ],
    
    // Specjalne pliki AI
    aiStateFiles: [
      'vera_identity.json',
      'vera_state.json',
      'emotion_history.log',
      'memory.jsonl'
    ],
    
    // Funkcje które muszą być obecne w WeraCore
    requiredCoreFunctions: [
      'createSandboxFolders',
      'initializeSystem',
      'wakeUp',
      'sleep',
      'saveState',
      'loadState',
      'checkSystemHealth'
    ]
  },
  
  // Reguły dla React Native + Expo
  expoRules: {
    // Wymagane zależności
    requiredDependencies: [
      'expo',
      'react',
      'react-native',
      '@react-navigation/native',
      '@react-native-async-storage/async-storage',
      'expo-file-system',
      'expo-notifications',
      'expo-background-fetch',
      'expo-device',
      'expo-constants'
    ],
    
    // Wymagane dev dependencies
    requiredDevDependencies: [
      '@babel/core',
      'typescript',
      '@types/react'
    ],
    
    // Sprawdzenia kompatybilności
    compatibilityChecks: {
      'react': {
        '19.0.0': ['react-native@0.79.x']
      }
    }
  },
  
  // Ustawienia raportowania
  reporting: {
    outputFormat: 'text', // 'text' | 'json' | 'html'
    includeSuccessMessages: false,
    groupByCategory: true,
    showSuggestions: true,
    colorOutput: true
  },
  
  // Auto-fix ustawienia
  autoFix: {
    enabled: false,
    fixableIssues: [
      'missing-dependencies',
      'outdated-dependencies',
      'simple-syntax-errors'
    ],
    backupBeforeFix: true
  },
  
  // Tryb watch
  watch: {
    enabled: false,
    debounceMs: 1000,
    watchPatterns: [
      'src/**/*.{ts,tsx,js,jsx}',
      'package.json',
      'tsconfig.json',
      'babel.config.js',
      'metro.config.js',
      'app.json'
    ],
    ignoredPatterns: [
      'node_modules/**',
      '**/*.test.{ts,tsx,js,jsx}',
      '**/.*'
    ]
  },
  
  // Integracja z CI/CD
  cicd: {
    failOnErrors: true,
    failOnWarnings: false,
    generateJunitReport: false,
    slackWebhook: null, // URL do Slack webhook dla powiadomień
    githubIntegration: {
      enabled: false,
      createPRComments: false,
      updateCheckStatus: false
    }
  },
  
  // Zaawansowane opcje
  advanced: {
    // Timeout dla sprawdzeń w ms
    timeouts: {
      typescript: 30000,
      dependencyCheck: 10000,
      sourceAnalysis: 15000
    },
    
    // Parallel processing
    maxConcurrentChecks: 5,
    
    // Memory limits
    maxMemoryUsage: '512MB',
    
    // Custom rules (funkcje JavaScript)
    customRules: [
      // Przykład: sprawdź czy wszystkie screen komponenty są w src/screens
      function checkScreensLocation(filePath, content) {
        if (filePath.includes('Screen') && !filePath.includes('src/screens/')) {
          return {
            category: 'Architektura',
            severity: 'warning',
            message: 'Screen komponenty powinny być w src/screens/',
            file: filePath,
            suggestion: `Przenieś do src/screens/`
          };
        }
        return null;
      }
    ]
  },
  
  // Exclusions - pliki/foldery do pominięcia
  exclude: {
    files: [
      '**/*.test.{ts,tsx,js,jsx}',
      '**/*.spec.{ts,tsx,js,jsx}',
      '**/node_modules/**',
      '**/.git/**',
      '**/build/**',
      '**/dist/**'
    ],
    directories: [
      'node_modules',
      '.git',
      '.expo',
      'build',
      'dist'
    ]
  }
};