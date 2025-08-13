import * as fs from 'fs';
import * as path from 'path';

interface AIAnalysisResult {
  category: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  file?: string;
  line?: number;
  suggestion?: string;
  aiComponent?: string;
}

interface WeraAIState {
  identity?: any;
  state?: any;
  emotions?: any[];
  memories?: any[];
  consciousness?: any;
}

export class WeraAILogicAnalyzer {
  private projectRoot: string;
  private results: AIAnalysisResult[] = [];

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  async analyzeAILogic(): Promise<AIAnalysisResult[]> {
    console.log('🧠 Analizuję logikę AI WERA...');
    
    this.results = [];
    
    // Analiza podstawowych komponentów AI
    await this.analyzeCoreAIComponents();
    
    // Analiza kontekstów i providerów
    await this.analyzeAIContexts();
    
    // Analiza silników AI
    await this.analyzeAIEngines();
    
    // Analiza sandbox i systemu plików
    await this.analyzeSandboxSystem();
    
    // Analiza stanu i pamięci (jeśli istnieją)
    await this.analyzeAIStateFiles();
    
    // Analiza przepływów danych AI
    await this.analyzeAIDataFlows();
    
    // Analiza bezpieczeństwa AI
    await this.analyzeAISecurity();
    
    return this.results;
  }

  private async analyzeCoreAIComponents(): Promise<void> {
    console.log('🔍 Sprawdzam główne komponenty AI...');
    
    const coreComponents = [
      'src/core/WeraCore.tsx',
      'src/core/WeraConsciousnessCore.tsx',
      'src/core/EmotionEngine.tsx',
      'src/core/AutonomyEngine.tsx',
      'src/core/ThoughtProcessor.tsx',
      'src/core/ConsciousnessMonitor.tsx'
    ];

    for (const component of coreComponents) {
      const componentPath = path.join(this.projectRoot, component);
      if (fs.existsSync(componentPath)) {
        await this.analyzeAIComponent(componentPath);
      } else {
        this.addResult({
          category: 'Komponenty AI',
          severity: 'error',
          message: `Brakuje kluczowego komponentu AI: ${component}`,
          file: component,
          aiComponent: path.basename(component, '.tsx')
        });
      }
    }
  }

  private async analyzeAIComponent(componentPath: string): Promise<void> {
    try {
      const content = fs.readFileSync(componentPath, 'utf8');
      const relativePath = path.relative(this.projectRoot, componentPath);
      const componentName = path.basename(componentPath, '.tsx');

      // Sprawdź czy komponent ma odpowiednią strukturę
      await this.checkAIComponentStructure(content, relativePath, componentName);
      
      // Sprawdź implementację Context API
      await this.checkContextImplementation(content, relativePath, componentName);
      
      // Sprawdź obsługę błędów w AI
      await this.checkAIErrorHandling(content, relativePath, componentName);
      
      // Sprawdź asynchroniczne operacje
      await this.checkAsyncOperations(content, relativePath, componentName);
      
      // Sprawdź integrację z systemem plików
      await this.checkFileSystemIntegration(content, relativePath, componentName);

    } catch (error) {
      this.addResult({
        category: 'Komponenty AI',
        severity: 'error',
        message: `Błąd analizy komponentu AI: ${error}`,
        file: path.relative(this.projectRoot, componentPath)
      });
    }
  }

  private async checkAIComponentStructure(content: string, filePath: string, componentName: string): Promise<void> {
    // Sprawdź czy komponent AI ma wymagane interfejsy
    if (componentName === 'WeraCore') {
      const requiredFunctions = [
        'wakeUp',
        'sleep', 
        'updateConsciousness',
        'saveState',
        'loadState',
        'checkSystemHealth',
        'initializeSystem'
      ];

      for (const func of requiredFunctions) {
        if (!content.includes(func)) {
          this.addResult({
            category: 'Struktura AI',
            severity: 'error',
            message: `WeraCore brakuje funkcji: ${func}`,
            file: filePath,
            aiComponent: componentName,
            suggestion: `Dodaj implementację funkcji ${func}`
          });
        }
      }
    }

    // Sprawdź czy EmotionEngine ma wymagane funkcje
    if (componentName === 'EmotionEngine') {
      const requiredEmotionFunctions = [
        'setEmotion',
        'getEmotionalBalance',
        'addEmotionToHistory',
        'processEmotionalTrigger'
      ];

      for (const func of requiredEmotionFunctions) {
        if (!content.includes(func)) {
          this.addResult({
            category: 'Silnik Emocji',
            severity: 'warning',
            message: `EmotionEngine może brakować funkcji: ${func}`,
            file: filePath,
            aiComponent: componentName
          });
        }
      }
    }

    // Sprawdź czy AutonomyEngine ma funkcje autonomii
    if (componentName === 'AutonomyEngine') {
      const autonomyFunctions = [
        'generateInitiative',
        'shouldWriteToUser',
        'processAutonomousAction',
        'evaluateInitiative'
      ];

      for (const func of autonomyFunctions) {
        if (!content.includes(func)) {
          this.addResult({
            category: 'Silnik Autonomii',
            severity: 'warning',
            message: `AutonomyEngine może brakować funkcji: ${func}`,
            file: filePath,
            aiComponent: componentName
          });
        }
      }
    }
  }

  private async checkContextImplementation(content: string, filePath: string, componentName: string): Promise<void> {
    // Sprawdź czy Context jest poprawnie zaimplementowany
    if (content.includes('createContext')) {
      if (!content.includes('Provider')) {
        this.addResult({
          category: 'Context AI',
          severity: 'error',
          message: 'Context bez Provider implementation',
          file: filePath,
          aiComponent: componentName
        });
      }

      if (!content.includes('useContext') && !content.includes('export')) {
        this.addResult({
          category: 'Context AI',
          severity: 'warning',
          message: 'Context może nie być eksportowany dla użycia',
          file: filePath,
          aiComponent: componentName
        });
      }
    }

    // Sprawdź czy useState jest używany odpowiednio dla AI state
    const stateMatches = content.match(/useState<([^>]+)>/g);
    if (stateMatches) {
      for (const stateMatch of stateMatches) {
        if (stateMatch.includes('any')) {
          this.addResult({
            category: 'Stan AI',
            severity: 'warning',
            message: 'Używanie typu any w stanie AI może być problematyczne',
            file: filePath,
            aiComponent: componentName,
            suggestion: 'Zdefiniuj specyficzne typy dla stanu AI'
          });
        }
      }
    }
  }

  private async checkAIErrorHandling(content: string, filePath: string, componentName: string): Promise<void> {
    // Sprawdź obsługę błędów w funkcjach AI
    const asyncFunctions = content.match(/async\s+\w+[^{]*{[^}]*}/gs);
    if (asyncFunctions) {
      for (const func of asyncFunctions) {
        if (!func.includes('try') || !func.includes('catch')) {
          this.addResult({
            category: 'Obsługa błędów AI',
            severity: 'error',
            message: 'Funkcja async AI bez obsługi błędów',
            file: filePath,
            aiComponent: componentName,
            suggestion: 'Dodaj try-catch dla bezpiecznej obsługi błędów AI'
          });
        }
      }
    }

    // Sprawdź czy są mechanizmy recovery dla AI
    if (componentName === 'WeraCore') {
      if (!content.includes('recovery') && !content.includes('fallback') && !content.includes('emergency')) {
        this.addResult({
          category: 'Bezpieczeństwo AI',
          severity: 'warning',
          message: 'Brak mechanizmów recovery w WeraCore',
          file: filePath,
          aiComponent: componentName,
          suggestion: 'Dodaj mechanizmy recovery dla krytycznych błędów AI'
        });
      }
    }
  }

  private async checkAsyncOperations(content: string, filePath: string, componentName: string): Promise<void> {
    // Sprawdź czy operacje AI są odpowiednio asynchroniczne
    const fileSystemOps = ['readFile', 'writeFile', 'mkdir', 'exists'];
    const asyncStorageOps = ['getItem', 'setItem', 'removeItem'];
    
    for (const op of [...fileSystemOps, ...asyncStorageOps]) {
      if (content.includes(op) && !content.includes(`await ${op}`) && !content.includes(`${op}(`)) {
        this.addResult({
          category: 'Operacje Async AI',
          severity: 'warning',
          message: `Operacja ${op} może wymagać await`,
          file: filePath,
          aiComponent: componentName
        });
      }
    }

    // Sprawdź race conditions w AI
    if (content.includes('setInterval') || content.includes('setTimeout')) {
      if (!content.includes('clearInterval') && !content.includes('clearTimeout')) {
        this.addResult({
          category: 'Cykle AI',
          severity: 'warning',
          message: 'Timer AI bez mechanizmu czyszczenia',
          file: filePath,
          aiComponent: componentName,
          suggestion: 'Dodaj cleanup dla timerów AI w useEffect'
        });
      }
    }
  }

  private async checkFileSystemIntegration(content: string, filePath: string, componentName: string): Promise<void> {
    // Sprawdź integrację z Expo FileSystem
    if (content.includes('FileSystem')) {
      if (!content.includes('expo-file-system')) {
        this.addResult({
          category: 'System plików AI',
          severity: 'error',
          message: 'Używanie FileSystem bez importu expo-file-system',
          file: filePath,
          aiComponent: componentName
        });
      }

      // Sprawdź czy ścieżki sandbox są poprawnie konstruowane
      if (content.includes('sandbox') && !content.includes('documentDirectory')) {
        this.addResult({
          category: 'Sandbox AI',
          severity: 'warning',
          message: 'Sandbox może nie używać documentDirectory',
          file: filePath,
          aiComponent: componentName,
          suggestion: 'Użyj FileSystem.documentDirectory dla sandbox'
        });
      }
    }
  }

  private async analyzeAIContexts(): Promise<void> {
    console.log('🔍 Analizuję konteksty AI...');
    
    const contextFiles = [
      'src/contexts/ConsciousnessContext.tsx',
      'src/contexts/EmotionContext.tsx', 
      'src/contexts/MemoryContext.tsx'
    ];

    for (const contextFile of contextFiles) {
      const contextPath = path.join(this.projectRoot, contextFile);
      if (fs.existsSync(contextPath)) {
        await this.analyzeContextFile(contextPath);
      }
    }
  }

  private async analyzeContextFile(contextPath: string): Promise<void> {
    try {
      const content = fs.readFileSync(contextPath, 'utf8');
      const relativePath = path.relative(this.projectRoot, contextPath);

      // Sprawdź czy context ma defaultValue
      if (content.includes('createContext()')) {
        this.addResult({
          category: 'Context AI',
          severity: 'warning',
          message: 'Context bez defaultValue może powodować błędy',
          file: relativePath,
          suggestion: 'Dodaj defaultValue do createContext()'
        });
      }

      // Sprawdź czy jest custom hook
      const contextName = path.basename(contextPath, '.tsx').replace('Context', '');
      const hookName = `use${contextName}`;
      
      if (!content.includes(hookName)) {
        this.addResult({
          category: 'Context AI',
          severity: 'info',
          message: `Rozważ dodanie custom hook ${hookName}`,
          file: relativePath,
          suggestion: `Dodaj export const ${hookName} = () => useContext(${contextName}Context)`
        });
      }

    } catch (error) {
      this.addResult({
        category: 'Context AI',
        severity: 'error',
        message: `Błąd analizy context: ${error}`,
        file: path.relative(this.projectRoot, contextPath)
      });
    }
  }

  private async analyzeAIEngines(): Promise<void> {
    console.log('🔍 Analizuję silniki AI...');
    
    const engines = [
      'src/core/ConversationEngine.tsx',
      'src/core/ResponseGenerator.tsx',
      'src/core/KnowledgeEngine.tsx',
      'src/core/DiagnosticsEngine.tsx',
      'src/core/EvolutionEngine.tsx'
    ];

    for (const engine of engines) {
      const enginePath = path.join(this.projectRoot, engine);
      if (fs.existsSync(enginePath)) {
        await this.analyzeAIEngine(enginePath);
      }
    }
  }

  private async analyzeAIEngine(enginePath: string): Promise<void> {
    try {
      const content = fs.readFileSync(enginePath, 'utf8');
      const relativePath = path.relative(this.projectRoot, enginePath);
      const engineName = path.basename(enginePath, '.tsx');

      // Sprawdź czy engine ma odpowiednią strukturę
      if (!content.includes('interface') && !content.includes('type')) {
        this.addResult({
          category: 'Silniki AI',
          severity: 'warning',
          message: `${engineName} może brakować definicji typów`,
          file: relativePath,
          aiComponent: engineName
        });
      }

      // Sprawdź czy engine ma mechanizmy konfiguracji
      if (!content.includes('config') && !content.includes('Config') && !content.includes('settings')) {
        this.addResult({
          category: 'Silniki AI',
          severity: 'info',
          message: `${engineName} może potrzebować konfiguracji`,
          file: relativePath,
          aiComponent: engineName,
          suggestion: 'Dodaj interfejs konfiguracji dla silnika'
        });
      }

      // Sprawdź performance considerations
      if (content.includes('setInterval') && engineName.includes('Engine')) {
        if (!content.includes('clearInterval')) {
          this.addResult({
            category: 'Performance AI',
            severity: 'warning',
            message: `${engineName} może mieć memory leak z interval`,
            file: relativePath,
            aiComponent: engineName
          });
        }
      }

    } catch (error) {
      this.addResult({
        category: 'Silniki AI',
        severity: 'error',
        message: `Błąd analizy silnika: ${error}`,
        file: path.relative(this.projectRoot, enginePath)
      });
    }
  }

  private async analyzeSandboxSystem(): Promise<void> {
    console.log('🔍 Analizuję system sandbox AI...');
    
    // Sprawdź czy SandboxFileSystem istnieje
    const sandboxPath = path.join(this.projectRoot, 'src/core/SandboxFileSystem.tsx');
    if (fs.existsSync(sandboxPath)) {
      await this.analyzeSandboxImplementation(sandboxPath);
    } else {
      this.addResult({
        category: 'Sandbox AI',
        severity: 'error',
        message: 'Brakuje implementacji SandboxFileSystem',
        file: 'src/core/SandboxFileSystem.tsx',
        suggestion: 'Stwórz SandboxFileSystem dla zarządzania plikami AI'
      });
    }

    // Sprawdź czy WeraCore tworzy sandbox folders
    const weraCorePath = path.join(this.projectRoot, 'src/core/WeraCore.tsx');
    if (fs.existsSync(weraCorePath)) {
      const content = fs.readFileSync(weraCorePath, 'utf8');
      
      if (!content.includes('createSandboxFolders')) {
        this.addResult({
          category: 'Sandbox AI',
          severity: 'error',
          message: 'WeraCore nie tworzy sandbox folders',
          file: 'src/core/WeraCore.tsx',
          suggestion: 'Dodaj funkcję createSandboxFolders do WeraCore'
        });
      }

      // Sprawdź czy sandbox folders są definiowane
      const sandboxFolders = [
        'sandbox_memory',
        'sandbox_dreams',
        'sandbox_thoughts',
        'sandbox_initiatives',
        'sandbox_reflections'
      ];

      for (const folder of sandboxFolders) {
        if (!content.includes(folder)) {
          this.addResult({
            category: 'Sandbox AI',
            severity: 'warning',
            message: `Może brakować definicji folderu: ${folder}`,
            file: 'src/core/WeraCore.tsx',
            aiComponent: 'WeraCore'
          });
        }
      }
    }
  }

  private async analyzeSandboxImplementation(sandboxPath: string): Promise<void> {
    try {
      const content = fs.readFileSync(sandboxPath, 'utf8');
      const relativePath = path.relative(this.projectRoot, sandboxPath);

      // Sprawdź czy sandbox ma odpowiednie funkcje
      const requiredSandboxFunctions = [
        'createFolder',
        'writeFile',
        'readFile',
        'deleteFile',
        'listFiles'
      ];

      for (const func of requiredSandboxFunctions) {
        if (!content.includes(func)) {
          this.addResult({
            category: 'Sandbox AI',
            severity: 'warning',
            message: `SandboxFileSystem może brakować funkcji: ${func}`,
            file: relativePath,
            aiComponent: 'SandboxFileSystem'
          });
        }
      }

      // Sprawdź bezpieczeństwo sandbox
      if (content.includes('..') || content.includes('absolute')) {
        this.addResult({
          category: 'Bezpieczeństwo Sandbox',
          severity: 'error',
          message: 'Sandbox może pozwalać na path traversal',
          file: relativePath,
          suggestion: 'Waliduj ścieżki w sandbox aby zapobiec path traversal'
        });
      }

    } catch (error) {
      this.addResult({
        category: 'Sandbox AI',
        severity: 'error',
        message: `Błąd analizy sandbox: ${error}`,
        file: path.relative(this.projectRoot, sandboxPath)
      });
    }
  }

  private async analyzeAIStateFiles(): Promise<void> {
    console.log('🔍 Analizuję pliki stanu AI...');
    
    // Te pliki będą tworzone dynamicznie, ale sprawdź czy kod je obsługuje
    const stateFiles = [
      'vera_identity.json',
      'vera_state.json', 
      'emotion_history.log',
      'memory.jsonl'
    ];

    // Sprawdź czy WeraCore ma funkcje do zarządzania tymi plikami
    const weraCorePath = path.join(this.projectRoot, 'src/core/WeraCore.tsx');
    if (fs.existsSync(weraCorePath)) {
      const content = fs.readFileSync(weraCorePath, 'utf8');

      for (const stateFile of stateFiles) {
        const fileName = stateFile.replace('.json', '').replace('.log', '').replace('.jsonl', '');
        
        if (!content.includes(fileName) && !content.includes(stateFile)) {
          this.addResult({
            category: 'Stan AI',
            severity: 'info',
            message: `WeraCore może nie obsługiwać pliku: ${stateFile}`,
            file: 'src/core/WeraCore.tsx',
            aiComponent: 'WeraCore'
          });
        }
      }

      // Sprawdź czy są funkcje save/load
      if (!content.includes('saveState') || !content.includes('loadState')) {
        this.addResult({
          category: 'Stan AI',
          severity: 'error',
          message: 'WeraCore brakuje funkcji saveState/loadState',
          file: 'src/core/WeraCore.tsx',
          aiComponent: 'WeraCore'
        });
      }
    }
  }

  private async analyzeAIDataFlows(): Promise<void> {
    console.log('🔍 Analizuję przepływy danych AI...');
    
    // Sprawdź czy providers są poprawnie połączone
    const providersPath = path.join(this.projectRoot, 'src/providers/AllProviders.tsx');
    if (fs.existsSync(providersPath)) {
      const content = fs.readFileSync(providersPath, 'utf8');
      
      const expectedProviders = [
        'WeraCoreProvider',
        'EmotionProvider',
        'MemoryProvider',
        'ConsciousnessProvider'
      ];

      for (const provider of expectedProviders) {
        if (!content.includes(provider)) {
          this.addResult({
            category: 'Przepływ danych AI',
            severity: 'warning',
            message: `AllProviders może nie zawierać: ${provider}`,
            file: 'src/providers/AllProviders.tsx',
            suggestion: `Dodaj ${provider} do AllProviders`
          });
        }
      }

      // Sprawdź kolejność providerów (ważne dla AI)
      if (content.includes('WeraCoreProvider') && content.includes('EmotionProvider')) {
        const weraCoreIndex = content.indexOf('WeraCoreProvider');
        const emotionIndex = content.indexOf('EmotionProvider');
        
        if (weraCoreIndex > emotionIndex) {
          this.addResult({
            category: 'Przepływ danych AI',
            severity: 'warning',
            message: 'WeraCoreProvider powinien być przed EmotionProvider',
            file: 'src/providers/AllProviders.tsx',
            suggestion: 'Zmień kolejność providerów - WeraCore jako pierwszy'
          });
        }
      }
    }
  }

  private async analyzeAISecurity(): Promise<void> {
    console.log('🔍 Analizuję bezpieczeństwo AI...');
    
    // Sprawdź czy SecuritySystem istnieje
    const securityPath = path.join(this.projectRoot, 'src/core/SecuritySystem.tsx');
    if (fs.existsSync(securityPath)) {
      await this.analyzeSecurityImplementation(securityPath);
    } else {
      this.addResult({
        category: 'Bezpieczeństwo AI',
        severity: 'warning',
        message: 'Brakuje SecuritySystem dla AI',
        file: 'src/core/SecuritySystem.tsx',
        suggestion: 'Rozważ implementację SecuritySystem dla ochrony AI'
      });
    }

    // Sprawdź czy są mechanizmy emergency protocol
    const emergencyPath = path.join(this.projectRoot, 'src/core/EmergencyProtocol.tsx');
    if (!fs.existsSync(emergencyPath)) {
      this.addResult({
        category: 'Bezpieczeństwo AI',
        severity: 'info',
        message: 'Brakuje EmergencyProtocol dla AI',
        file: 'src/core/EmergencyProtocol.tsx',
        suggestion: 'Rozważ dodanie EmergencyProtocol dla krytycznych sytuacji AI'
      });
    }
  }

  private async analyzeSecurityImplementation(securityPath: string): Promise<void> {
    try {
      const content = fs.readFileSync(securityPath, 'utf8');
      const relativePath = path.relative(this.projectRoot, securityPath);

      // Sprawdź czy SecuritySystem ma podstawowe funkcje
      const securityFunctions = [
        'validateInput',
        'sanitizeData',
        'checkPermissions',
        'auditLog'
      ];

      for (const func of securityFunctions) {
        if (!content.includes(func)) {
          this.addResult({
            category: 'Bezpieczeństwo AI',
            severity: 'info',
            message: `SecuritySystem może potrzebować funkcji: ${func}`,
            file: relativePath,
            aiComponent: 'SecuritySystem'
          });
        }
      }

    } catch (error) {
      this.addResult({
        category: 'Bezpieczeństwo AI',
        severity: 'error',
        message: `Błąd analizy security: ${error}`,
        file: path.relative(this.projectRoot, securityPath)
      });
    }
  }

  private addResult(result: AIAnalysisResult): void {
    this.results.push(result);
  }

  getResults(): AIAnalysisResult[] {
    return this.results;
  }

  generateAIReport(): string {
    const errors = this.results.filter(r => r.severity === 'error');
    const warnings = this.results.filter(r => r.severity === 'warning');
    const info = this.results.filter(r => r.severity === 'info');

    let report = '\n🧠 WERA AI Logic Analysis Report\n';
    report += '='.repeat(50) + '\n\n';

    report += `📊 AI Components Summary:\n`;
    report += `   🔴 Critical AI Issues: ${errors.length}\n`;
    report += `   🟡 AI Warnings: ${warnings.length}\n`;
    report += `   🔵 AI Suggestions: ${info.length}\n\n`;

    if (errors.length === 0 && warnings.length === 0) {
      report += '✅ AI Logic wygląda dobrze!\n\n';
    } else {
      report += '❌ Znaleziono problemy w logice AI:\n\n';
    }

    const categories = [...new Set(this.results.map(r => r.category))];

    for (const category of categories) {
      const categoryResults = this.results.filter(r => r.category === category);
      if (categoryResults.length === 0) continue;

      report += `🧠 ${category}:\n`;

      for (const result of categoryResults) {
        const icon = result.severity === 'error' ? '🔴' : 
                    result.severity === 'warning' ? '🟡' : '🔵';

        report += `   ${icon} ${result.message}`;

        if (result.file) {
          report += ` (${result.file}`;
          if (result.line) {
            report += `:${result.line}`;
          }
          report += ')';
        }

        if (result.aiComponent) {
          report += ` [${result.aiComponent}]`;
        }

        report += '\n';

        if (result.suggestion) {
          report += `      💡 ${result.suggestion}\n`;
        }
      }

      report += '\n';
    }

    return report;
  }
}