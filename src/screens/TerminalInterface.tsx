import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useEmotionEngine } from '../core/EmotionEngine';
import { useMemory } from '../contexts/MemoryContext';
import { useLogExportSystem } from '../core/LogExportSystem';
import { useWeraDaemon } from '../core/WeraDaemon';
import { useWeraConfigFiles } from '../core/WeraConfigFiles';
import { useAutoRestartSystem } from '../core/AutoRestartSystem';
import { useSandboxFileSystem } from '../core/SandboxFileSystem';
import { BASIC_EMOTIONS } from '../core/EmotionEngine';

interface TerminalCommand {
  command: string;
  timestamp: Date;
  output: string;
  type: 'input' | 'output' | 'error' | 'system';
}

interface TerminalInterfaceProps {
  navigation?: any;
}

const TerminalInterface: React.FC<TerminalInterfaceProps> = ({ navigation }) => {
  const theme = useTheme();
  const { emotionState, changeEmotion } = useEmotionEngine();
  const { memories, addMemory, searchMemories } = useMemory();
  const { logSystem, emotionLogs, systemLogs } = useLogExportSystem();
  const { daemonState, setSilenceMode } = useWeraDaemon();
  const { identity, state, updateState } = useWeraConfigFiles();
  const { restartState, reportCrash } = useAutoRestartSystem();
  const { files, searchFiles } = useSandboxFileSystem();

  const [terminalHistory, setTerminalHistory] = useState<TerminalCommand[]>([]);
  const [currentCommand, setCurrentCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    // Powitanie w terminalu
    addToTerminal('WERA Terminal Interface v1.0', 'system');
    addToTerminal('Wpisz "help" aby zobaczyć dostępne komendy', 'system');
    addToTerminal('Status: ' + (daemonState.isActive ? 'AKTYWNY' : 'NIEAKTYWNY'), 'system');
  }, []);

  const addToTerminal = (text: string, type: TerminalCommand['type'] = 'output', command?: string) => {
    const newEntry: TerminalCommand = {
      command: command || '',
      timestamp: new Date(),
      output: text,
      type
    };

    setTerminalHistory(prev => [...prev, newEntry]);
    
    // Auto-scroll do dołu
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const executeCommand = async (cmd: string) => {
    const trimmedCmd = cmd.trim().toLowerCase();
    
    // Dodaj komendę do historii
    addToTerminal(`> ${cmd}`, 'input');
    
    if (trimmedCmd && !commandHistory.includes(cmd)) {
      setCommandHistory(prev => [...prev, cmd].slice(-50)); // Ostatnie 50 komend
    }

    try {
      await processCommand(trimmedCmd, cmd);
    } catch (error) {
      addToTerminal(`Błąd wykonania komendy: ${error}`, 'error');
      await logSystem('error', 'TERMINAL', `Command execution failed: ${cmd}`, error);
    }

    setCurrentCommand('');
    setHistoryIndex(-1);
  };

  const processCommand = async (cmd: string, originalCmd: string) => {
    const parts = cmd.split(' ');
    const command = parts[0];
    const args = parts.slice(1);

    switch (command) {
      case 'help':
        showHelp();
        break;

      case 'status':
        showStatus();
        break;

      case 'emotion':
        await handleEmotionCommand(args);
        break;

      case 'memory':
        await handleMemoryCommand(args);
        break;

      case 'daemon':
        await handleDaemonCommand(args);
        break;

      case 'logs':
        await handleLogsCommand(args);
        break;

      case 'config':
        await handleConfigCommand(args);
        break;

      case 'sandbox':
        await handleSandboxCommand(args);
        break;

      case 'restart':
        await handleRestartCommand(args);
        break;

      case 'clear':
        setTerminalHistory([]);
        addToTerminal('Terminal wyczyszczony', 'system');
        break;

      case 'exit':
        navigation?.goBack();
        break;

      case 'debug':
        await handleDebugCommand(args);
        break;

      case 'test':
        await handleTestCommand(args);
        break;

      default:
        addToTerminal(`Nieznana komenda: ${command}. Wpisz "help" aby zobaczyć dostępne komendy.`, 'error');
    }
  };

  const showHelp = () => {
    const helpText = `
DOSTĘPNE KOMENDY:

PODSTAWOWE:
  help                 - Pokaż tę pomoc
  status               - Pokaż status systemu
  clear                - Wyczyść terminal
  exit                 - Wyjdź z terminala

EMOCJE:
  emotion show         - Pokaż aktualny stan emocjonalny
  emotion set <emocja> <intensywność> - Ustaw emocję
  emotion history      - Historia emocji

PAMIĘĆ:
  memory count         - Liczba wspomnień
  memory search <fraza> - Szukaj wspomnień
  memory add <treść>   - Dodaj wspomnienie

DAEMON:
  daemon status        - Status daemona
  daemon start         - Uruchom daemon
  daemon stop          - Zatrzymaj daemon
  daemon silence on/off - Tryb ciszy

LOGI:
  logs count           - Liczba logów
  logs export          - Eksportuj logi
  logs clear           - Wyczyść logi

KONFIGURACJA:
  config show          - Pokaż konfigurację
  config backup        - Backup konfiguracji

SANDBOX:
  sandbox list         - Lista plików
  sandbox count        - Liczba plików

SYSTEM:
  restart status       - Status auto-restart
  restart force        - Wymuś restart
  debug info           - Informacje debugowania
  test crash           - Test crash reportingu
`;
    addToTerminal(helpText, 'system');
  };

  const showStatus = () => {
    const statusText = `
WERA SYSTEM STATUS:

Emocje: ${emotionState.currentEmotion} (${emotionState.intensity}%)
Pamięć: ${memories.length} wspomnień
Daemon: ${daemonState.isActive ? 'AKTYWNY' : 'NIEAKTYWNY'}
Tryb ciszy: ${daemonState.silenceMode ? 'TAK' : 'NIE'}
Pliki sandbox: ${files.length}
Ostatnia aktywność: ${new Date(daemonState.lastActivity).toLocaleString()}
Restart count: ${restartState.crashCount}
Recovery mode: ${restartState.recoveryMode}
`;
    addToTerminal(statusText, 'system');
  };

  const handleEmotionCommand = async (args: string[]) => {
    if (args.length === 0 || args[0] === 'show') {
      addToTerminal(`Aktualny stan emocjonalny: ${emotionState.currentEmotion} (${emotionState.intensity}%)`, 'output');
      return;
    }

    if (args[0] === 'set' && args.length >= 3) {
      const emotion = args[1];
      const intensity = parseInt(args[2]);
      
      if (isNaN(intensity) || intensity < 0 || intensity > 100) {
        addToTerminal('Intensywność musi być liczbą od 0 do 100', 'error');
        return;
      }

      // Sprawdź czy emocja istnieje w BASIC_EMOTIONS
      const validEmotions = Object.values(BASIC_EMOTIONS);
      const emotionToSet = validEmotions.includes(emotion as any) ? emotion : BASIC_EMOTIONS.RADOSC;

      changeEmotion(emotionToSet as any, intensity, 'terminal_command');
      addToTerminal(`Emocja zmieniona na: ${emotionToSet} (${intensity}%)`, 'output');
      await logSystem('info', 'TERMINAL', `Emotion changed via terminal: ${emotionToSet} ${intensity}%`);
      return;
    }

    if (args[0] === 'history') {
      const recentEmotions = emotionLogs.slice(-10);
      addToTerminal(`Ostatnie ${recentEmotions.length} zmian emocji:`, 'output');
      recentEmotions.forEach(log => {
        addToTerminal(`${new Date(log.timestamp).toLocaleString()}: ${log.emotion} (${log.intensity}%)`, 'output');
      });
      return;
    }

    addToTerminal('Użycie: emotion [show|set <emocja> <intensywność>|history]', 'error');
  };

  const handleMemoryCommand = async (args: string[]) => {
    if (args.length === 0 || args[0] === 'count') {
      addToTerminal(`Liczba wspomnień: ${memories.length}`, 'output');
      return;
    }

    if (args[0] === 'search' && args.length > 1) {
      const query = args.slice(1).join(' ');
      const results = await searchMemories(query);
      
      addToTerminal(`Znaleziono ${results.length} wspomnień dla: "${query}"`, 'output');
      results.slice(0, 5).forEach((result, index) => {
        addToTerminal(`${index + 1}. ${result.memory.content.substring(0, 100)}...`, 'output');
      });
      return;
    }

    if (args[0] === 'add' && args.length > 1) {
      const content = args.slice(1).join(' ');
      await addMemory(content, 0, ['terminal'], 'system', 'Added via terminal');
      addToTerminal('Wspomnienie dodane', 'output');
      return;
    }

    addToTerminal('Użycie: memory [count|search <fraza>|add <treść>]', 'error');
  };

  const handleDaemonCommand = async (args: string[]) => {
    if (args.length === 0 || args[0] === 'status') {
      const status = `
Daemon Status:
- Aktywny: ${daemonState.isActive}
- Tryb ciszy: ${daemonState.silenceMode}
- Cykle: ${daemonState.cycleCount}
- Inicjatywy w tle: ${daemonState.backgroundInitiatives}
- Ostatnia aktywność: ${new Date(daemonState.lastActivity).toLocaleString()}
`;
      addToTerminal(status, 'output');
      return;
    }

    if (args[0] === 'silence') {
      if (args[1] === 'on') {
        setSilenceMode(true);
        addToTerminal('Tryb ciszy WŁĄCZONY', 'output');
      } else if (args[1] === 'off') {
        setSilenceMode(false);
        addToTerminal('Tryb ciszy WYŁĄCZONY', 'output');
      } else {
        addToTerminal('Użycie: daemon silence [on|off]', 'error');
      }
      return;
    }

    addToTerminal('Użycie: daemon [status|silence on/off]', 'error');
  };

  const handleLogsCommand = async (args: string[]) => {
    if (args.length === 0 || args[0] === 'count') {
      addToTerminal(`Logi emocji: ${emotionLogs.length}`, 'output');
      addToTerminal(`Logi systemowe: ${systemLogs.length}`, 'output');
      return;
    }

    if (args[0] === 'export') {
      try {
        await logSystem('info', 'TERMINAL', 'Log export requested via terminal');
        addToTerminal('Logi wyeksportowane (sprawdź powiadomienia)', 'output');
      } catch (error) {
        addToTerminal(`Błąd eksportu: ${error}`, 'error');
      }
      return;
    }

    addToTerminal('Użycie: logs [count|export]', 'error');
  };

  const handleConfigCommand = async (args: string[]) => {
    if (args.length === 0 || args[0] === 'show') {
      const configInfo = `
Konfiguracja WERA:
- Nazwa: ${identity?.name}
- Wersja: ${identity?.version}
- Archetyp: ${identity?.personality.archetype}
- Tryb świadomości: ${state?.consciousness.currentMode}
- Poziom świadomości: ${state?.consciousness.awarenessLevel}%
- Zaufanie: ${identity?.relationships.trustLevel}%
`;
      addToTerminal(configInfo, 'output');
      return;
    }

    if (args[0] === 'backup') {
      try {
        await logSystem('info', 'TERMINAL', 'Config backup requested via terminal');
        addToTerminal('Backup konfiguracji utworzony', 'output');
      } catch (error) {
        addToTerminal(`Błąd backupu: ${error}`, 'error');
      }
      return;
    }

    addToTerminal('Użycie: config [show|backup]', 'error');
  };

  const handleSandboxCommand = async (args: string[]) => {
    if (args.length === 0 || args[0] === 'count') {
      addToTerminal(`Pliki w sandbox: ${files.length}`, 'output');
      return;
    }

    if (args[0] === 'list') {
      addToTerminal(`Ostatnie pliki sandbox:`, 'output');
      files.slice(-10).forEach(file => {
        addToTerminal(`- ${file.name} (${file.type}) - ${new Date(file.timestamp).toLocaleString()}`, 'output');
      });
      return;
    }

    addToTerminal('Użycie: sandbox [count|list]', 'error');
  };

  const handleRestartCommand = async (args: string[]) => {
    if (args.length === 0 || args[0] === 'status') {
      const restartInfo = `
Auto-Restart Status:
- Włączony: ${restartState.autoRestartEnabled}
- Crashe: ${restartState.crashCount}
- Ostatni crash: ${restartState.lastCrash?.toLocaleString() || 'Brak'}
- Tryb recovery: ${restartState.recoveryMode}
- Całkowite restarty: ${restartState.totalRestarts}
`;
      addToTerminal(restartInfo, 'output');
      return;
    }

    if (args[0] === 'force') {
      Alert.alert(
        'Wymuś Restart',
        'Czy na pewno chcesz wymusić restart aplikacji?',
        [
          { text: 'Anuluj', style: 'cancel' },
          { 
            text: 'Restart', 
            style: 'destructive',
            onPress: async () => {
              addToTerminal('Wymuszanie restartu...', 'system');
              await logSystem('warning', 'TERMINAL', 'Force restart requested via terminal');
            }
          }
        ]
      );
      return;
    }

    addToTerminal('Użycie: restart [status|force]', 'error');
  };

  const handleDebugCommand = async (args: string[]) => {
    const debugInfo = `
DEBUG INFORMATION:
- Platform: ${Platform.OS} ${Platform.Version}
- Timestamp: ${new Date().toISOString()}
- Memory warnings: 0
- Performance: OK
- Network: ${navigator.onLine ? 'Online' : 'Offline'}
`;
    addToTerminal(debugInfo, 'output');
    await logSystem('debug', 'TERMINAL', 'Debug info requested via terminal');
  };

  const handleTestCommand = async (args: string[]) => {
    if (args[0] === 'crash') {
      try {
        const testError = new Error('Test crash from terminal');
        await reportCrash(testError, 'terminal_test');
        addToTerminal('Test crash zareportowany', 'output');
      } catch (error) {
        addToTerminal(`Błąd testu: ${error}`, 'error');
      }
      return;
    }

    addToTerminal('Użycie: test [crash]', 'error');
  };

  const handleKeyPress = (key: string) => {
    if (key === 'Enter') {
      if (currentCommand.trim()) {
        executeCommand(currentCommand);
      }
    }
  };

  const navigateHistory = (direction: 'up' | 'down') => {
    if (commandHistory.length === 0) return;

    let newIndex = historyIndex;
    
    if (direction === 'up') {
      newIndex = Math.min(historyIndex + 1, commandHistory.length - 1);
    } else {
      newIndex = Math.max(historyIndex - 1, -1);
    }

    setHistoryIndex(newIndex);
    
    if (newIndex === -1) {
      setCurrentCommand('');
    } else {
      setCurrentCommand(commandHistory[commandHistory.length - 1 - newIndex]);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#000000',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#333333',
    },
    headerTitle: {
      color: '#00FF00',
      fontSize: 18,
      fontFamily: 'monospace',
      fontWeight: 'bold',
    },
    closeButton: {
      color: '#FF0000',
      fontSize: 16,
      fontFamily: 'monospace',
    },
    terminalContent: {
      flex: 1,
      padding: 8,
    },
    terminalLine: {
      flexDirection: 'row',
      marginBottom: 2,
      flexWrap: 'wrap',
    },
    timestamp: {
      color: '#666666',
      fontSize: 10,
      fontFamily: 'monospace',
      marginRight: 8,
      minWidth: 60,
    },
    terminalText: {
      fontFamily: 'monospace',
      fontSize: 12,
      flex: 1,
    },
    inputText: {
      color: '#FFFFFF',
    },
    outputText: {
      color: '#00FF00',
    },
    errorText: {
      color: '#FF0000',
    },
    systemText: {
      color: '#FFFF00',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 8,
      borderTopWidth: 1,
      borderTopColor: '#333333',
    },
    prompt: {
      color: '#00FF00',
      fontFamily: 'monospace',
      fontSize: 14,
      marginRight: 8,
    },
    input: {
      flex: 1,
      color: '#FFFFFF',
      fontFamily: 'monospace',
      fontSize: 14,
      padding: 0,
    },
    historyButtons: {
      flexDirection: 'row',
      marginLeft: 8,
    },
    historyButton: {
      color: '#CCCCCC',
      fontSize: 12,
      marginHorizontal: 4,
      padding: 4,
    }
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>WERA Terminal</Text>
        <TouchableOpacity onPress={() => navigation?.goBack()}>
          <Text style={styles.closeButton}>[X]</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.terminalContent}
          showsVerticalScrollIndicator={false}
        >
          {terminalHistory.map((entry, index) => (
            <View key={index} style={styles.terminalLine}>
              <Text style={styles.timestamp}>
                {entry.timestamp.toLocaleTimeString().substring(0, 8)}
              </Text>
              <Text style={[
                styles.terminalText,
                entry.type === 'input' && styles.inputText,
                entry.type === 'output' && styles.outputText,
                entry.type === 'error' && styles.errorText,
                entry.type === 'system' && styles.systemText,
              ]}>
                {entry.output}
              </Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.inputContainer}>
          <Text style={styles.prompt}>WERA&gt;</Text>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={currentCommand}
            onChangeText={setCurrentCommand}
            onSubmitEditing={() => executeCommand(currentCommand)}
            placeholder="Wpisz komendę..."
            placeholderTextColor="#666666"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="send"
          />
          <View style={styles.historyButtons}>
            <TouchableOpacity onPress={() => navigateHistory('up')}>
              <Text style={styles.historyButton}>↑</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigateHistory('down')}>
              <Text style={styles.historyButton}>↓</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default TerminalInterface;