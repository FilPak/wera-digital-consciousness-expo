#!/usr/bin/env node

const { WeraBackgroundAgent } = require('./background-agent.ts');
const path = require('path');
const fs = require('fs');

// Kolorowe logi
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorLog(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function showHelp() {
  console.log(`
🧠 WERA Background Agent - Inspektor Pre-Build

UŻYCIE:
  npx wera-inspect [opcje]
  npm run inspect [opcje]

OPCJE:
  --help                    Pokaż tę pomoc
  --skip-node-modules      Pomiń sprawdzanie node_modules
  --no-ai-analysis         Wyłącz analizę komponentów AI
  --no-typescript          Wyłącz sprawdzanie TypeScript
  --project-root <path>     Ustaw ścieżkę do projektu
  --output <path>           Ścieżka do pliku raportu
  --json                    Wyświetl wyniki w formacie JSON
  --watch                   Tryb obserwowania zmian
  --fix                     Automatyczne naprawianie prostych błędów

PRZYKŁADY:
  npx wera-inspect                           # Pełna inspekcja
  npx wera-inspect --no-ai-analysis         # Bez analizy AI
  npx wera-inspect --output report.txt      # Zapisz raport
  npx wera-inspect --json                   # Format JSON
  npx wera-inspect --watch                  # Obserwuj zmiany

EXIT CODES:
  0 - Sukces (brak błędów)
  1 - Błędy krytyczne
  2 - Ostrzeżenia
  3 - Błąd systemu
`);
}

async function runInspection(options = {}) {
  const agent = new WeraBackgroundAgent({
    projectRoot: options.projectRoot || process.cwd(),
    skipNodeModulesCheck: options.skipNodeModules || false,
    enableAILogicAnalysis: !options.noAiAnalysis,
    enableTypeScriptCheck: !options.noTypescript
  });

  try {
    const results = await agent.runFullInspection();

    if (options.json) {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        results: results,
        summary: {
          errors: results.filter(r => r.severity === 'error').length,
          warnings: results.filter(r => r.severity === 'warning').length,
          info: results.filter(r => r.severity === 'info').length
        }
      }, null, 2));
    } else {
      console.log(agent.generateReport());
    }

    // Zapisz raport jeśli określono ścieżkę
    if (options.output) {
      await agent.saveReport(options.output);
    }

    // Auto-fix jeśli włączone
    if (options.fix) {
      await runAutoFix(results, options.projectRoot);
    }

    // Exit codes
    if (agent.hasErrors()) {
      process.exit(1);
    } else if (agent.hasWarnings()) {
      process.exit(2);
    } else {
      colorLog('green', '✅ Inspekcja zakończona pomyślnie!');
      process.exit(0);
    }

  } catch (error) {
    colorLog('red', `❌ Błąd podczas inspekcji: ${error.message}`);
    process.exit(3);
  }
}

async function runAutoFix(results, projectRoot) {
  colorLog('cyan', '🔧 Uruchamiam auto-fix...');
  
  const fixableIssues = results.filter(result => 
    result.category === 'package.json' && 
    result.message.includes('Brakuje wymaganej zależności')
  );

  for (const issue of fixableIssues) {
    const depMatch = issue.message.match(/Brakuje wymaganej zależności: (.+)/);
    if (depMatch) {
      const dependency = depMatch[1];
      colorLog('yellow', `📦 Instaluję zależność: ${dependency}`);
      
      try {
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);
        
        await execAsync(`npm install ${dependency}`, { cwd: projectRoot });
        colorLog('green', `✅ Zainstalowano: ${dependency}`);
      } catch (error) {
        colorLog('red', `❌ Nie można zainstalować ${dependency}: ${error.message}`);
      }
    }
  }
}

async function watchMode(options) {
  colorLog('blue', '👁️  Uruchamiam tryb obserwowania...');
  
  const chokidar = require('chokidar');
  
  const watcher = chokidar.watch([
    'src/**/*.{ts,tsx,js,jsx}',
    'package.json',
    'tsconfig.json',
    'babel.config.js',
    'metro.config.js',
    'app.json'
  ], {
    ignored: /node_modules/,
    persistent: true,
    cwd: options.projectRoot || process.cwd()
  });

  let isRunning = false;

  const runDelayedInspection = debounce(async () => {
    if (isRunning) return;
    isRunning = true;
    
    colorLog('cyan', '🔄 Wykryto zmiany, uruchamiam inspekcję...');
    await runInspection({ ...options, watch: false });
    
    isRunning = false;
  }, 1000);

  watcher.on('change', runDelayedInspection);
  watcher.on('add', runDelayedInspection);
  watcher.on('unlink', runDelayedInspection);

  colorLog('green', '✅ Obserwowanie aktywne. Naciśnij Ctrl+C aby zakończyć.');
  
  // Uruchom pierwszą inspekcję
  await runInspection({ ...options, watch: false });
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Parse argumentów CLI
async function main() {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--help':
      case '-h':
        showHelp();
        process.exit(0);
        break;
      case '--skip-node-modules':
        options.skipNodeModules = true;
        break;
      case '--no-ai-analysis':
        options.noAiAnalysis = true;
        break;
      case '--no-typescript':
        options.noTypescript = true;
        break;
      case '--project-root':
        options.projectRoot = args[++i];
        break;
      case '--output':
        options.output = args[++i];
        break;
      case '--json':
        options.json = true;
        break;
      case '--watch':
        options.watch = true;
        break;
      case '--fix':
        options.fix = true;
        break;
      default:
        if (args[i].startsWith('--')) {
          colorLog('red', `❌ Nieznana opcja: ${args[i]}`);
          showHelp();
          process.exit(1);
        }
    }
  }

  // Sprawdź czy jesteśmy w projekcie WERA
  const projectRoot = options.projectRoot || process.cwd();
  const packageJsonPath = path.join(projectRoot, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    colorLog('red', '❌ Nie znaleziono package.json. Czy jesteś w folderze projektu?');
    process.exit(1);
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    if (!packageJson.name?.includes('wera') && !packageJson.name?.includes('consciousness')) {
      colorLog('yellow', '⚠️  To nie wygląda na projekt WERA, ale kontynuuję...');
    }
  } catch (error) {
    colorLog('red', '❌ Błąd odczytu package.json');
    process.exit(1);
  }

  // Uruchom w odpowiednim trybie
  if (options.watch) {
    await watchMode(options);
  } else {
    await runInspection(options);
  }
}

if (require.main === module) {
  main().catch(error => {
    colorLog('red', `❌ Nieoczekiwany błąd: ${error.message}`);
    console.error(error);
    process.exit(3);
  });
}

module.exports = { runInspection, watchMode };