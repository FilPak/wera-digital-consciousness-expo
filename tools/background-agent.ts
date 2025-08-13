#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface InspectionResult {
  category: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  file?: string;
  line?: number;
  suggestion?: string;
}

interface WeraInspectionConfig {
  projectRoot: string;
  skipNodeModulesCheck: boolean;
  enableAILogicAnalysis: boolean;
  enableTypeScriptCheck: boolean;
  customRules: string[];
}

class WeraBackgroundAgent {
  private config: WeraInspectionConfig;
  private results: InspectionResult[] = [];
  
  constructor(config: Partial<WeraInspectionConfig> = {}) {
    this.config = {
      projectRoot: process.cwd(),
      skipNodeModulesCheck: false,
      enableAILogicAnalysis: true,
      enableTypeScriptCheck: true,
      customRules: [],
      ...config
    };
  }

  async runFullInspection(): Promise<InspectionResult[]> {
    console.log('🧠 WERA Background Agent - Rozpoczynam inspekcję pre-build...\n');
    
    this.results = [];
    
    // Podstawowe sprawdzenia struktury projektu
    await this.checkProjectStructure();
    
    // Walidacja plików konfiguracyjnych
    await this.validateConfigurations();
    
    // Analiza kodu źródłowego
    await this.analyzeSourceCode();
    
    // Sprawdzenie zależności
    await this.checkDependencies();
    
    // Specjalna analiza komponentów AI WERA
    if (this.config.enableAILogicAnalysis) {
      await this.analyzeWeraAIComponents();
    }
    
    // TypeScript sprawdzenia
    if (this.config.enableTypeScriptCheck) {
      await this.runTypeScriptCheck();
    }
    
    return this.results;
  }

  private async checkProjectStructure(): Promise<void> {
    console.log('📁 Sprawdzam strukturę projektu...');
    
    const requiredDirs = [
      'src',
      'assets',
      'src/components',
      'src/contexts',
      'src/core',
      'src/screens',
      'src/providers'
    ];
    
    const requiredFiles = [
      'package.json',
      'tsconfig.json',
      'babel.config.js',
      'metro.config.js',
      'app.json',
      'App.tsx',
      'index.ts'
    ];
    
    // Sprawdź wymagane foldery
    for (const dir of requiredDirs) {
      const dirPath = path.join(this.config.projectRoot, dir);
      if (!fs.existsSync(dirPath)) {
        this.addResult({
          category: 'Struktura projektu',
          severity: 'error',
          message: `Brakuje wymaganego folderu: ${dir}`,
          suggestion: `Utwórz folder: mkdir -p ${dir}`
        });
      }
    }
    
    // Sprawdź wymagane pliki
    for (const file of requiredFiles) {
      const filePath = path.join(this.config.projectRoot, file);
      if (!fs.existsSync(filePath)) {
        this.addResult({
          category: 'Struktura projektu',
          severity: 'error',
          message: `Brakuje wymaganego pliku: ${file}`,
          file: file
        });
      }
    }
    
    // Sprawdź node_modules (jeśli nie pominięte)
    if (!this.config.skipNodeModulesCheck) {
      const nodeModulesPath = path.join(this.config.projectRoot, 'node_modules');
      if (!fs.existsSync(nodeModulesPath)) {
        this.addResult({
          category: 'Zależności',
          severity: 'error',
          message: 'Brakuje folderu node_modules',
          suggestion: 'Uruchom: npm install lub yarn install'
        });
      }
    }
  }

  private async validateConfigurations(): Promise<void> {
    console.log('⚙️ Waliduje pliki konfiguracyjne...');
    
    await this.validatePackageJson();
    await this.validateTsConfig();
    await this.validateBabelConfig();
    await this.validateMetroConfig();
    await this.validateAppJson();
  }

  private async validatePackageJson(): Promise<void> {
    const packagePath = path.join(this.config.projectRoot, 'package.json');
    
    try {
      const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      // Sprawdź wymagane pola
      const requiredFields = ['name', 'version', 'main', 'dependencies', 'scripts'];
      for (const field of requiredFields) {
        if (!packageContent[field]) {
          this.addResult({
            category: 'package.json',
            severity: 'error',
            message: `Brakuje pola: ${field}`,
            file: 'package.json'
          });
        }
      }
      
      // Sprawdź wymagane zależności dla WERA
      const requiredDeps = [
        'expo',
        'react',
        'react-native',
        '@react-navigation/native',
        '@react-native-async-storage/async-storage',
        'expo-file-system',
        'expo-notifications'
      ];
      
      for (const dep of requiredDeps) {
        if (!packageContent.dependencies?.[dep]) {
          this.addResult({
            category: 'package.json',
            severity: 'warning',
            message: `Brakuje wymaganej zależności: ${dep}`,
            file: 'package.json',
            suggestion: `Dodaj: npm install ${dep}`
          });
        }
      }
      
      // Sprawdź kompatybilność wersji React/React Native
      const reactVersion = packageContent.dependencies?.react;
      const rnVersion = packageContent.dependencies?.['react-native'];
      
      if (reactVersion && rnVersion) {
        // Podstawowa walidacja kompatybilności
        if (reactVersion.includes('19.') && !rnVersion.includes('0.79')) {
          this.addResult({
            category: 'package.json',
            severity: 'warning',
            message: 'Potencjalna niezgodność wersji React/React Native',
            file: 'package.json'
          });
        }
      }
      
    } catch (error) {
      this.addResult({
        category: 'package.json',
        severity: 'error',
        message: `Błąd parsowania package.json: ${error}`,
        file: 'package.json'
      });
    }
  }

  private async validateTsConfig(): Promise<void> {
    const tsconfigPath = path.join(this.config.projectRoot, 'tsconfig.json');
    
    try {
      const tsconfigContent = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
      
      // Sprawdź czy extends expo/tsconfig.base
      if (!tsconfigContent.extends?.includes('expo/tsconfig.base')) {
        this.addResult({
          category: 'tsconfig.json',
          severity: 'warning',
          message: 'Brak extends "expo/tsconfig.base"',
          file: 'tsconfig.json'
        });
      }
      
      // Sprawdź strict mode (zalecane dla WERA)
      if (!tsconfigContent.compilerOptions?.strict) {
        this.addResult({
          category: 'tsconfig.json',
          severity: 'info',
          message: 'Zalecane włączenie strict mode',
          file: 'tsconfig.json',
          suggestion: 'Dodaj "strict": true w compilerOptions'
        });
      }
      
    } catch (error) {
      this.addResult({
        category: 'tsconfig.json',
        severity: 'error',
        message: `Błąd parsowania tsconfig.json: ${error}`,
        file: 'tsconfig.json'
      });
    }
  }

  private async validateBabelConfig(): Promise<void> {
    const babelPath = path.join(this.config.projectRoot, 'babel.config.js');
    
    try {
      const babelContent = fs.readFileSync(babelPath, 'utf8');
      
      // Sprawdź preset expo
      if (!babelContent.includes('babel-preset-expo')) {
        this.addResult({
          category: 'babel.config.js',
          severity: 'error',
          message: 'Brakuje babel-preset-expo',
          file: 'babel.config.js'
        });
      }
      
      // Sprawdź plugin reanimated (wymagany dla WERA)
      if (!babelContent.includes('react-native-reanimated/plugin')) {
        this.addResult({
          category: 'babel.config.js',
          severity: 'warning',
          message: 'Brakuje react-native-reanimated/plugin',
          file: 'babel.config.js',
          suggestion: 'Dodaj plugin do listy plugins'
        });
      }
      
    } catch (error) {
      this.addResult({
        category: 'babel.config.js',
        severity: 'error',
        message: `Błąd odczytu babel.config.js: ${error}`,
        file: 'babel.config.js'
      });
    }
  }

  private async validateMetroConfig(): Promise<void> {
    const metroPath = path.join(this.config.projectRoot, 'metro.config.js');
    
    try {
      const metroContent = fs.readFileSync(metroPath, 'utf8');
      
      // Sprawdź czy używa expo/metro-config
      if (!metroContent.includes('expo/metro-config')) {
        this.addResult({
          category: 'metro.config.js',
          severity: 'warning',
          message: 'Zalecane użycie expo/metro-config',
          file: 'metro.config.js'
        });
      }
      
    } catch (error) {
      this.addResult({
        category: 'metro.config.js',
        severity: 'error',
        message: `Błąd odczytu metro.config.js: ${error}`,
        file: 'metro.config.js'
      });
    }
  }

  private async validateAppJson(): Promise<void> {
    const appJsonPath = path.join(this.config.projectRoot, 'app.json');
    
    try {
      const appJsonContent = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
      const expo = appJsonContent.expo;
      
      if (!expo) {
        this.addResult({
          category: 'app.json',
          severity: 'error',
          message: 'Brakuje sekcji expo w app.json',
          file: 'app.json'
        });
        return;
      }
      
      // Sprawdź wymagane pola
      const requiredFields = ['name', 'slug', 'version', 'platforms'];
      for (const field of requiredFields) {
        if (!expo[field]) {
          this.addResult({
            category: 'app.json',
            severity: 'error',
            message: `Brakuje pola expo.${field}`,
            file: 'app.json'
          });
        }
      }
      
      // Sprawdź ikony
      if (!expo.icon || !fs.existsSync(path.join(this.config.projectRoot, expo.icon))) {
        this.addResult({
          category: 'app.json',
          severity: 'warning',
          message: 'Brakuje pliku ikony lub nieprawidłowa ścieżka',
          file: 'app.json'
        });
      }
      
    } catch (error) {
      this.addResult({
        category: 'app.json',
        severity: 'error',
        message: `Błąd parsowania app.json: ${error}`,
        file: 'app.json'
      });
    }
  }

  private async analyzeSourceCode(): Promise<void> {
    console.log('🔍 Analizuję kod źródłowy...');
    
    const srcPath = path.join(this.config.projectRoot, 'src');
    if (!fs.existsSync(srcPath)) return;
    
    await this.analyzeDirectory(srcPath);
  }

  private async analyzeDirectory(dirPath: string): Promise<void> {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        await this.analyzeDirectory(itemPath);
      } else if (item.match(/\.(tsx?|jsx?)$/)) {
        await this.analyzeSourceFile(itemPath);
      }
    }
  }

  private async analyzeSourceFile(filePath: string): Promise<void> {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(this.config.projectRoot, filePath);
      
      // Sprawdź importy
      await this.checkImports(content, relativePath);
      
      // Sprawdź składnię React
      await this.checkReactSyntax(content, relativePath);
      
      // Sprawdź TypeScript issues
      await this.checkTypeScriptIssues(content, relativePath);
      
    } catch (error) {
      this.addResult({
        category: 'Analiza kodu',
        severity: 'error',
        message: `Błąd analizy pliku: ${error}`,
        file: path.relative(this.config.projectRoot, filePath)
      });
    }
  }

  private async checkImports(content: string, filePath: string): Promise<void> {
    const importLines = content.split('\n').filter(line => 
      line.trim().startsWith('import ') || line.trim().startsWith('from ')
    );
    
    for (let i = 0; i < importLines.length; i++) {
      const line = importLines[i];
      
      // Sprawdź relative imports
      if (line.includes('../') || line.includes('./')) {
        const match = line.match(/from ['"]([^'"]+)['"]/);
        if (match) {
          const importPath = match[1];
          const resolvedPath = path.resolve(path.dirname(path.join(this.config.projectRoot, filePath)), importPath);
          
          // Sprawdź czy plik istnieje (z różnymi rozszerzeniami)
          const possibleExtensions = ['', '.ts', '.tsx', '.js', '.jsx'];
          let exists = false;
          
          for (const ext of possibleExtensions) {
            if (fs.existsSync(resolvedPath + ext)) {
              exists = true;
              break;
            }
          }
          
          if (!exists) {
            this.addResult({
              category: 'Importy',
              severity: 'error',
              message: `Nie można znaleźć modułu: ${importPath}`,
              file: filePath,
              line: i + 1
            });
          }
        }
      }
    }
  }

  private async checkReactSyntax(content: string, filePath: string): Promise<void> {
    // Sprawdź czy React jest zaimportowany gdy używany
    if (content.includes('<') && content.includes('>')) {
      if (!content.includes("import React") && !content.includes("import * as React")) {
        this.addResult({
          category: 'React',
          severity: 'warning',
          message: 'Używasz JSX bez importu React',
          file: filePath,
          suggestion: 'Dodaj: import React from "react";'
        });
      }
    }
    
    // Sprawdź hooks
    const hooksUsed = content.match(/use[A-Z]\w*/g);
    if (hooksUsed && !content.includes('import React') && !content.includes('import {')) {
      this.addResult({
        category: 'React Hooks',
        severity: 'warning',
        message: 'Używasz hooks bez odpowiednich importów',
        file: filePath
      });
    }
  }

  private async checkTypeScriptIssues(content: string, filePath: string): Promise<void> {
    // Sprawdź any types (zalecane unikanie)
    const anyMatches = content.match(/:\s*any\b/g);
    if (anyMatches && anyMatches.length > 0) {
      this.addResult({
        category: 'TypeScript',
        severity: 'info',
        message: `Znaleziono ${anyMatches.length} użyć typu 'any'`,
        file: filePath,
        suggestion: 'Rozważ użycie bardziej specyficznych typów'
      });
    }
    
    // Sprawdź unused imports (podstawowe)
    const importMatches = content.match(/import\s+{([^}]+)}\s+from/g);
    if (importMatches) {
      for (const importMatch of importMatches) {
        const imported = importMatch.match(/import\s+{([^}]+)}/)?.[1];
        if (imported) {
          const items = imported.split(',').map(item => item.trim());
          for (const item of items) {
            if (!content.includes(item.replace(/\s+as\s+\w+/, ''))) {
              this.addResult({
                category: 'TypeScript',
                severity: 'info',
                message: `Prawdopodobnie nieużywany import: ${item}`,
                file: filePath
              });
            }
          }
        }
      }
    }
  }

  private async checkDependencies(): Promise<void> {
    console.log('📦 Sprawdzam zależności...');
    
    try {
      // Sprawdź czy package-lock.json lub yarn.lock istnieje
      const hasPackageLock = fs.existsSync(path.join(this.config.projectRoot, 'package-lock.json'));
      const hasYarnLock = fs.existsSync(path.join(this.config.projectRoot, 'yarn.lock'));
      
      if (!hasPackageLock && !hasYarnLock) {
        this.addResult({
          category: 'Zależności',
          severity: 'warning',
          message: 'Brakuje pliku lock (package-lock.json lub yarn.lock)',
          suggestion: 'Uruchom npm install lub yarn install'
        });
      }
      
      // Sprawdź npm outdated (jeśli npm jest dostępne)
      try {
        const { stdout } = await execAsync('npm outdated --json', { 
          cwd: this.config.projectRoot,
          timeout: 10000 
        });
        
        if (stdout.trim()) {
          const outdated = JSON.parse(stdout);
          const outdatedCount = Object.keys(outdated).length;
          
          if (outdatedCount > 0) {
            this.addResult({
              category: 'Zależności',
              severity: 'info',
              message: `${outdatedCount} przestarzałych zależności`,
              suggestion: 'Uruchom npm update lub sprawdź npm outdated'
            });
          }
        }
      } catch (error) {
        // npm outdated może zwrócić exit code 1 gdy są outdated packages
        // To jest normalne zachowanie
      }
      
    } catch (error) {
      this.addResult({
        category: 'Zależności',
        severity: 'warning',
        message: `Nie można sprawdzić zależności: ${error}`
      });
    }
  }

  private async analyzeWeraAIComponents(): Promise<void> {
    console.log('🧠 Analizuję komponenty AI WERA...');
    
    // Sprawdź główne komponenty AI
    const aiComponents = [
      'src/core/WeraCore.tsx',
      'src/core/EmotionEngine.tsx',
      'src/core/MemoryContext.tsx',
      'src/core/ConsciousnessMonitor.tsx',
      'src/core/AutonomyEngine.tsx',
      'src/core/ThoughtProcessor.tsx'
    ];
    
    for (const component of aiComponents) {
      const componentPath = path.join(this.config.projectRoot, component);
      if (fs.existsSync(componentPath)) {
        await this.analyzeAIComponent(componentPath);
      } else {
        this.addResult({
          category: 'Komponenty AI',
          severity: 'warning',
          message: `Brakuje komponentu AI: ${component}`,
          file: component
        });
      }
    }
    
    // Sprawdź providers
    await this.checkAIProviders();
    
    // Sprawdź sandbox structure
    await this.checkSandboxStructure();
  }

  private async analyzeAIComponent(componentPath: string): Promise<void> {
    try {
      const content = fs.readFileSync(componentPath, 'utf8');
      const relativePath = path.relative(this.config.projectRoot, componentPath);
      
      // Sprawdź czy komponent eksportuje Context
      if (content.includes('createContext') && !content.includes('export')) {
        this.addResult({
          category: 'Komponenty AI',
          severity: 'warning',
          message: 'Context nie jest eksportowany',
          file: relativePath
        });
      }
      
      // Sprawdź czy Provider jest poprawnie zaimplementowany
      if (content.includes('Provider') && !content.includes('children')) {
        this.addResult({
          category: 'Komponenty AI',
          severity: 'error',
          message: 'Provider nie obsługuje children',
          file: relativePath
        });
      }
      
      // Sprawdź AsyncStorage usage
      if (content.includes('AsyncStorage') && !content.includes('@react-native-async-storage')) {
        this.addResult({
          category: 'Komponenty AI',
          severity: 'error',
          message: 'Nieprawidłowy import AsyncStorage',
          file: relativePath,
          suggestion: 'Użyj @react-native-async-storage/async-storage'
        });
      }
      
      // Sprawdź error handling w async functions
      const asyncFunctions = content.match(/async\s+\w+\s*\([^)]*\)\s*{[^}]*}/g);
      if (asyncFunctions) {
        for (const func of asyncFunctions) {
          if (!func.includes('try') && !func.includes('catch')) {
            this.addResult({
              category: 'Komponenty AI',
              severity: 'warning',
              message: 'Funkcja async bez obsługi błędów',
              file: relativePath,
              suggestion: 'Dodaj try-catch block'
            });
          }
        }
      }
      
    } catch (error) {
      this.addResult({
        category: 'Komponenty AI',
        severity: 'error',
        message: `Błąd analizy komponentu AI: ${error}`,
        file: path.relative(this.config.projectRoot, componentPath)
      });
    }
  }

  private async checkAIProviders(): Promise<void> {
    const providersPath = path.join(this.config.projectRoot, 'src/providers/AllProviders.tsx');
    
    if (!fs.existsSync(providersPath)) {
      this.addResult({
        category: 'Providers AI',
        severity: 'error',
        message: 'Brakuje AllProviders.tsx',
        file: 'src/providers/AllProviders.tsx'
      });
      return;
    }
    
    try {
      const content = fs.readFileSync(providersPath, 'utf8');
      
      // Sprawdź czy wszystkie wymagane providers są włączone
      const requiredProviders = [
        'WeraCoreProvider',
        'EmotionProvider',
        'MemoryProvider',
        'ThemeProvider'
      ];
      
      for (const provider of requiredProviders) {
        if (!content.includes(provider)) {
          this.addResult({
            category: 'Providers AI',
            severity: 'warning',
            message: `Brakuje provider: ${provider}`,
            file: 'src/providers/AllProviders.tsx'
          });
        }
      }
      
    } catch (error) {
      this.addResult({
        category: 'Providers AI',
        severity: 'error',
        message: `Błąd analizy AllProviders: ${error}`,
        file: 'src/providers/AllProviders.tsx'
      });
    }
  }

  private async checkSandboxStructure(): Promise<void> {
    // Sprawdź czy sandbox folders będą utworzone poprawnie
    const sandboxFolders = [
      'sandbox_memory',
      'sandbox_dreams',
      'sandbox_thoughts',
      'sandbox_initiatives',
      'sandbox_reflections',
      'sandbox_autoscripts'
    ];
    
    // Te foldery będą tworzone dynamicznie, ale sprawdź czy kod je obsługuje
    const weraCorePath = path.join(this.config.projectRoot, 'src/core/WeraCore.tsx');
    if (fs.existsSync(weraCorePath)) {
      const content = fs.readFileSync(weraCorePath, 'utf8');
      
      if (!content.includes('createSandboxFolders')) {
        this.addResult({
          category: 'Sandbox AI',
          severity: 'warning',
          message: 'Brakuje funkcji createSandboxFolders w WeraCore',
          file: 'src/core/WeraCore.tsx'
        });
      }
    }
  }

  private async runTypeScriptCheck(): Promise<void> {
    console.log('🔧 Uruchamiam sprawdzenie TypeScript...');
    
    try {
      const { stdout, stderr } = await execAsync('npx tsc --noEmit', {
        cwd: this.config.projectRoot,
        timeout: 30000
      });
      
      if (stderr) {
        const errors = stderr.split('\n').filter(line => line.includes('error TS'));
        
        for (const error of errors) {
          const match = error.match(/([^(]+)\((\d+),(\d+)\): error TS\d+: (.+)/);
          if (match) {
            const [, file, line, , message] = match;
            this.addResult({
              category: 'TypeScript',
              severity: 'error',
              message: message.trim(),
              file: path.relative(this.config.projectRoot, file),
              line: parseInt(line)
            });
          }
        }
      }
      
    } catch (error: unknown) {
      // TypeScript errors są oczekiwane w stderr
      if (error && typeof error === 'object' && 'stderr' in error) {
        const errorObj = error as { stderr: string };
        const errors = errorObj.stderr.split('\n').filter((line: string) => line.includes('error TS'));
        
        for (const errorLine of errors) {
          const match = errorLine.match(/([^(]+)\((\d+),(\d+)\): error TS\d+: (.+)/);
          if (match) {
            const [, file, line, , message] = match;
            this.addResult({
              category: 'TypeScript',
              severity: 'error',
              message: message.trim(),
              file: path.relative(this.config.projectRoot, file),
              line: parseInt(line)
            });
          }
        }
      }
    }
  }

  private addResult(result: InspectionResult): void {
    this.results.push(result);
  }

  generateReport(): string {
    const errors = this.results.filter(r => r.severity === 'error');
    const warnings = this.results.filter(r => r.severity === 'warning');
    const info = this.results.filter(r => r.severity === 'info');
    
    let report = '\n🧠 WERA Background Agent - Raport Inspekcji\n';
    report += '='.repeat(50) + '\n\n';
    
    report += `📊 Podsumowanie:\n`;
    report += `   🔴 Błędy: ${errors.length}\n`;
    report += `   🟡 Ostrzeżenia: ${warnings.length}\n`;
    report += `   🔵 Informacje: ${info.length}\n\n`;
    
    if (errors.length === 0 && warnings.length === 0) {
      report += '✅ Projekt jest gotowy do build!\n\n';
    } else {
      report += '❌ Znaleziono problemy wymagające uwagi:\n\n';
    }
    
    const categories = [...new Set(this.results.map(r => r.category))];
    
    for (const category of categories) {
      const categoryResults = this.results.filter(r => r.category === category);
      if (categoryResults.length === 0) continue;
      
      report += `📂 ${category}:\n`;
      
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
        
        report += '\n';
        
        if (result.suggestion) {
          report += `      💡 ${result.suggestion}\n`;
        }
      }
      
      report += '\n';
    }
    
    report += '='.repeat(50) + '\n';
    report += `Inspekcja zakończona: ${new Date().toLocaleString('pl-PL')}\n`;
    
    return report;
  }

  async saveReport(outputPath?: string): Promise<void> {
    const report = this.generateReport();
    const filePath = outputPath || path.join(this.config.projectRoot, 'wera-inspection-report.txt');
    
    fs.writeFileSync(filePath, report, 'utf8');
    console.log(`📄 Raport zapisany: ${filePath}`);
  }

  hasErrors(): boolean {
    return this.results.some(r => r.severity === 'error');
  }

  hasWarnings(): boolean {
    return this.results.some(r => r.severity === 'warning');
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const config: Partial<WeraInspectionConfig> = {};
  
  // Parse CLI arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--skip-node-modules':
        config.skipNodeModulesCheck = true;
        break;
      case '--no-ai-analysis':
        config.enableAILogicAnalysis = false;
        break;
      case '--no-typescript':
        config.enableTypeScriptCheck = false;
        break;
      case '--project-root':
        config.projectRoot = args[++i];
        break;
    }
  }
  
  const agent = new WeraBackgroundAgent(config);
  
  try {
    const results = await agent.runFullInspection();
    
    console.log(agent.generateReport());
    
    // Zapisz raport
    await agent.saveReport();
    
    // Exit code based on severity
    if (agent.hasErrors()) {
      process.exit(1);
    } else if (agent.hasWarnings()) {
      process.exit(2);
    } else {
      process.exit(0);
    }
    
  } catch (error) {
    console.error('❌ Błąd podczas inspekcji:', error);
    process.exit(3);
  }
}

// Export for programmatic use
export { WeraBackgroundAgent, InspectionResult, WeraInspectionConfig };

// Run CLI if called directly
if (require.main === module) {
  main();
}