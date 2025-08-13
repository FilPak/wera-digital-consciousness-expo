#!/usr/bin/env node

/**
 * Test script dla WERA Background Agent
 * Uruchom: node test-background-agent.js
 */

const { WeraBackgroundAgent } = require('./tools/background-agent.ts');
const { WeraAILogicAnalyzer } = require('./tools/ai-logic-analyzer.ts');
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

async function testBackgroundAgent() {
  colorLog('cyan', '🧠 Testowanie WERA Background Agent...\n');

  try {
    // Test 1: Podstawowa inspekcja
    colorLog('blue', '📋 Test 1: Podstawowa inspekcja');
    const agent = new WeraBackgroundAgent({
      projectRoot: __dirname,
      skipNodeModulesCheck: true, // Szybszy test
      enableAILogicAnalysis: false, // Najpierw podstawy
      enableTypeScriptCheck: false
    });

    const basicResults = await agent.runFullInspection();
    colorLog('green', `✅ Podstawowa inspekcja: ${basicResults.length} wyników`);

    // Test 2: Analiza AI
    colorLog('blue', '\n🧠 Test 2: Analiza komponentów AI');
    const aiAnalyzer = new WeraAILogicAnalyzer(__dirname);
    const aiResults = await aiAnalyzer.analyzeAILogic();
    colorLog('green', `✅ Analiza AI: ${aiResults.length} wyników`);

    // Test 3: Pełna inspekcja
    colorLog('blue', '\n🔧 Test 3: Pełna inspekcja');
    const fullAgent = new WeraBackgroundAgent({
      projectRoot: __dirname,
      skipNodeModulesCheck: true,
      enableAILogicAnalysis: true,
      enableTypeScriptCheck: false // Może być wolne
    });

    const fullResults = await fullAgent.runFullInspection();
    
    // Podsumowanie
    const errors = fullResults.filter(r => r.severity === 'error').length;
    const warnings = fullResults.filter(r => r.severity === 'warning').length;
    const info = fullResults.filter(r => r.severity === 'info').length;

    colorLog('cyan', '\n📊 Podsumowanie testów:');
    colorLog('red', `   🔴 Błędy: ${errors}`);
    colorLog('yellow', `   🟡 Ostrzeżenia: ${warnings}`);
    colorLog('blue', `   🔵 Informacje: ${info}`);

    // Zapisz raport testowy
    const testReport = generateTestReport(basicResults, aiResults, fullResults);
    const reportPath = path.join(__dirname, 'test-agent-report.txt');
    fs.writeFileSync(reportPath, testReport, 'utf8');
    colorLog('green', `\n📄 Raport testowy zapisany: ${reportPath}`);

    // Test 4: Sprawdź czy kluczowe komponenty są wykrywane
    colorLog('blue', '\n🔍 Test 4: Wykrywanie komponentów WERA');
    await testWeraComponentDetection(fullResults);

    colorLog('green', '\n✅ Wszystkie testy zakończone pomyślnie!');
    
    if (errors > 0) {
      colorLog('red', '⚠️  Znaleziono błędy krytyczne - sprawdź raport');
      process.exit(1);
    } else if (warnings > 0) {
      colorLog('yellow', '⚠️  Znaleziono ostrzeżenia - sprawdź raport');
      process.exit(2);
    } else {
      colorLog('green', '🎉 Projekt wygląda dobrze!');
      process.exit(0);
    }

  } catch (error) {
    colorLog('red', `❌ Błąd podczas testowania: ${error.message}`);
    console.error(error);
    process.exit(3);
  }
}

async function testWeraComponentDetection(results) {
  const expectedComponents = [
    'WeraCore',
    'EmotionEngine',
    'AutonomyEngine',
    'ConsciousnessMonitor',
    'ThoughtProcessor'
  ];

  const detectedComponents = new Set();
  
  for (const result of results) {
    if (result.file && result.file.includes('src/core/')) {
      const componentName = path.basename(result.file, '.tsx');
      detectedComponents.add(componentName);
    }
  }

  colorLog('cyan', '   Wykryte komponenty AI:');
  for (const component of expectedComponents) {
    if (detectedComponents.has(component)) {
      colorLog('green', `   ✅ ${component}`);
    } else {
      colorLog('red', `   ❌ ${component} (nie znaleziono)`);
    }
  }

  // Sprawdź czy sandbox jest wykrywany
  const sandboxResults = results.filter(r => 
    r.category?.includes('Sandbox') || 
    r.message?.includes('sandbox')
  );
  
  if (sandboxResults.length > 0) {
    colorLog('green', '   ✅ System Sandbox wykryty');
  } else {
    colorLog('yellow', '   ⚠️  System Sandbox może nie być wykrywany');
  }
}

function generateTestReport(basicResults, aiResults, fullResults) {
  const timestamp = new Date().toLocaleString('pl-PL');
  
  let report = `🧠 WERA Background Agent - Raport Testowy\n`;
  report += `=`.repeat(50) + '\n\n';
  report += `Data testu: ${timestamp}\n\n`;

  // Podstawowa inspekcja
  report += `📋 Test 1 - Podstawowa inspekcja:\n`;
  report += `   Wyników: ${basicResults.length}\n`;
  report += `   Błędy: ${basicResults.filter(r => r.severity === 'error').length}\n`;
  report += `   Ostrzeżenia: ${basicResults.filter(r => r.severity === 'warning').length}\n\n`;

  // Analiza AI
  report += `🧠 Test 2 - Analiza AI:\n`;
  report += `   Wyników: ${aiResults.length}\n`;
  report += `   Błędy: ${aiResults.filter(r => r.severity === 'error').length}\n`;
  report += `   Ostrzeżenia: ${aiResults.filter(r => r.severity === 'warning').length}\n\n`;

  // Pełna inspekcja
  report += `🔧 Test 3 - Pełna inspekcja:\n`;
  report += `   Wyników: ${fullResults.length}\n`;
  report += `   Błędy: ${fullResults.filter(r => r.severity === 'error').length}\n`;
  report += `   Ostrzeżenia: ${fullResults.filter(r => r.severity === 'warning').length}\n`;
  report += `   Informacje: ${fullResults.filter(r => r.severity === 'info').length}\n\n`;

  // Kategorie problemów
  const categories = [...new Set(fullResults.map(r => r.category))];
  report += `📂 Kategorie problemów:\n`;
  for (const category of categories) {
    const categoryResults = fullResults.filter(r => r.category === category);
    report += `   ${category}: ${categoryResults.length}\n`;
  }

  report += `\n` + `=`.repeat(50) + '\n';
  report += `Test zakończony: ${timestamp}\n`;

  return report;
}

// Uruchom testy jeśli skrypt jest wywoływany bezpośrednio
if (require.main === module) {
  testBackgroundAgent().catch(error => {
    colorLog('red', `❌ Nieoczekiwany błąd: ${error.message}`);
    console.error(error);
    process.exit(3);
  });
}

module.exports = { testBackgroundAgent };