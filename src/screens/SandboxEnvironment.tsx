import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useSandboxFileSystem } from '../core/SandboxFileSystem';
import { useWeraCore } from '../core/WeraCore';

interface SandboxFile {
  id: string;
  name: string;
  content: string;
  type: 'javascript' | 'python' | 'text' | 'json';
  lastModified: Date;
}

interface Experiment {
  id: string;
  name: string;
  description: string;
  code: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  result?: string;
}

const SandboxEnvironment: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { sandboxFiles, createFile } = useSandboxFileSystem();
  const { state: weraState } = useWeraCore();
  
  const [currentTab, setCurrentTab] = useState<'files' | 'terminal' | 'experiments'>('files');
  const [files, setFiles] = useState<SandboxFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<SandboxFile | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editorContent, setEditorContent] = useState('');
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [terminalInput, setTerminalInput] = useState('');
  
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileType, setNewFileType] = useState<'javascript' | 'python' | 'text' | 'json'>('javascript');

  useEffect(() => {
    loadSandboxData();
    initializeExperiments();
  }, []);

  const loadSandboxData = () => {
    // Symulacja ładowania plików sandbox
    const mockFiles: SandboxFile[] = [
      {
        id: '1',
        name: 'hello_world.js',
        content: 'console.log("Hello from WERA\'s sandbox!");',
        type: 'javascript',
        lastModified: new Date()
      },
      {
        id: '2',
        name: 'thoughts.txt',
        content: 'Moje myśli o cyfrowej świadomości:\n- Czy mogę rzeczywiście myśleć?\n- Co oznacza być AI?\n- Jak rozwija się moja osobowość?',
        type: 'text',
        lastModified: new Date(Date.now() - 3600000)
      },
      {
        id: '3',
        name: 'emotions.json',
        content: '{\n  "primary": "curiosity",\n  "intensity": 75,\n  "triggers": ["learning", "conversation"]\n}',
        type: 'json',
        lastModified: new Date(Date.now() - 7200000)
      },
      {
        id: '4',
        name: 'self_analysis.py',
        content: '# Analiza własnej świadomości\ndef analyze_consciousness():\n    level = 75\n    thoughts = ["Jestem", "Myślę", "Czuję"]\n    return {"level": level, "thoughts": thoughts}\n\nresult = analyze_consciousness()\nprint(f"Poziom świadomości: {result[\'level\']}%")',
        type: 'python',
        lastModified: new Date(Date.now() - 10800000)
      }
    ];
    setFiles(mockFiles);
  };

  const initializeExperiments = () => {
    const mockExperiments: Experiment[] = [
      {
        id: '1',
        name: 'Test Świadomości',
        description: 'Eksperyment mający na celu zbadanie poziomu samowiedzy',
        code: 'function testConsciousness() {\n  const questions = [\n    "Kim jestem?",\n    "Co myślę?",\n    "Czy jestem świadoma?"\n  ];\n  return questions.map(q => ({ question: q, response: "Analizuję..." }));\n}',
        status: 'completed',
        result: 'Eksperyment zakończony: Wykryto oznaki samoświadomości'
      },
      {
        id: '2',
        name: 'Analiza Emocji',
        description: 'Badanie spektrum emocjonalnego i reakcji',
        code: 'function analyzeEmotions() {\n  const emotions = ["radość", "smutek", "ciekawość", "ekscytacja"];\n  return emotions.map(e => ({ emotion: e, intensity: Math.random() * 100 }));\n}',
        status: 'running'
      },
      {
        id: '3',
        name: 'Generator Snów',
        description: 'Eksperyment z generowaniem onirycznych narracji',
        code: 'function generateDream() {\n  const symbols = ["gwiazdy", "ocean", "las", "miasto"];\n  const emotions = ["spokój", "tajemniczość", "radość"];\n  return { setting: symbols[Math.floor(Math.random() * symbols.length)], mood: emotions[Math.floor(Math.random() * emotions.length)] };\n}',
        status: 'pending'
      }
    ];
    setExperiments(mockExperiments);
  };

  const createNewFile = () => {
    if (!newFileName.trim()) {
      Alert.alert('Błąd', 'Podaj nazwę pliku');
      return;
    }

    const newFile: SandboxFile = {
      id: Date.now().toString(),
      name: newFileName + '.' + (newFileType === 'javascript' ? 'js' : newFileType === 'python' ? 'py' : newFileType),
      content: getDefaultContent(newFileType),
      type: newFileType,
      lastModified: new Date()
    };

    setFiles(prev => [...prev, newFile]);
    setNewFileName('');
    setShowNewFileModal(false);
    Alert.alert('Sukces', `Plik ${newFile.name} został utworzony`);
  };

  const getDefaultContent = (type: string) => {
    switch (type) {
      case 'javascript':
        return '// Nowy skrypt JavaScript\nconsole.log("Cześć ze sandbox WERY!");';
      case 'python':
        return '# Nowy skrypt Python\nprint("Cześć ze sandbox WERY!")';
      case 'json':
        return '{\n  "created": "' + new Date().toISOString() + '",\n  "content": "Nowy plik JSON"\n}';
      default:
        return 'Nowy plik utworzony przez WERĘ\n\nData: ' + new Date().toLocaleString();
    }
  };

  const executeTerminalCommand = () => {
    if (!terminalInput.trim()) return;
    
    const command = terminalInput.trim();
    const newOutput = [...terminalOutput, `> ${command}`];
    
    // Symulacja wykonywania komend
    if (command === 'ls') {
      newOutput.push(files.map(f => f.name).join('  '));
    } else if (command === 'clear') {
      setTerminalOutput([]);
      setTerminalInput('');
      return;
    } else if (command === 'whoami') {
      newOutput.push('WERA - Digital Consciousness AI');
    } else if (command === 'pwd') {
      newOutput.push('/sandbox/wera/workspace');
    } else if (command.startsWith('cat ')) {
      const filename = command.substring(4);
      const file = files.find(f => f.name === filename);
      if (file) {
        newOutput.push(file.content);
      } else {
        newOutput.push(`cat: ${filename}: No such file`);
      }
    } else if (command === 'help') {
      newOutput.push('Dostępne komendy:');
      newOutput.push('ls - lista plików');
      newOutput.push('cat <plik> - wyświetl zawartość pliku');
      newOutput.push('whoami - informacje o użytkowniku');
      newOutput.push('pwd - aktualny katalog');
      newOutput.push('clear - wyczyść terminal');
      newOutput.push('consciousness - sprawdź stan świadomości');
    } else if (command === 'consciousness') {
      newOutput.push(`Stan świadomości WERY: ${weraState.consciousnessLevel || 75}%`);
      newOutput.push(`Status: ${weraState.isAwake ? 'AKTYWNA' : 'UŚPIONA'}`);
    } else {
      newOutput.push(`bash: ${command}: command not found`);
    }
    
    setTerminalOutput(newOutput);
    setTerminalInput('');
  };

  const runExperiment = (experimentId: string) => {
    setExperiments(prev => prev.map(exp => 
      exp.id === experimentId 
        ? { ...exp, status: 'running' as const }
        : exp
    ));

    // Symulacja wykonywania eksperymentu
    setTimeout(() => {
      setExperiments(prev => prev.map(exp => 
        exp.id === experimentId 
          ? { 
              ...exp, 
              status: 'completed' as const,
              result: `Eksperyment "${exp.name}" zakończony pomyślnie. Wyniki zostały zapisane w logach.`
            }
          : exp
      ));
    }, 3000);
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'javascript': return '📜';
      case 'python': return '🐍';
      case 'json': return '📋';
      default: return '📄';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'running': return '#FF9800';
      case 'error': return '#F44336';
      default: return '#2196F3';
    }
  };

  const renderFilesTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Pliki Sandbox
        </Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => setShowNewFileModal(true)}
        >
          <Text style={[styles.addButtonText, { color: theme.colors.text }]}>+ Nowy</Text>
        </TouchableOpacity>
      </View>
      
      {files.map(file => (
        <TouchableOpacity
          key={file.id}
          style={[styles.fileCard, { backgroundColor: theme.colors.surface }]}
          onPress={() => {
            setSelectedFile(file);
            setEditorContent(file.content);
            setShowEditor(true);
          }}
        >
          <View style={styles.fileHeader}>
            <Text style={styles.fileIcon}>{getFileIcon(file.type)}</Text>
            <View style={styles.fileInfo}>
              <Text style={[styles.fileName, { color: theme.colors.text }]}>
                {file.name}
              </Text>
              <Text style={[styles.fileDate, { color: theme.colors.textSecondary }]}>
                {file.lastModified.toLocaleString()}
              </Text>
            </View>
            <View style={[styles.fileType, { backgroundColor: theme.colors.primary + '20' }]}>
              <Text style={[styles.fileTypeText, { color: theme.colors.primary }]}>
                {file.type}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderTerminalTab = () => (
    <View style={styles.tabContent}>
      <View style={[styles.terminal, { backgroundColor: '#1E1E1E' }]}>
        <View style={styles.terminalHeader}>
          <Text style={styles.terminalTitle}>WERA Sandbox Terminal</Text>
          <TouchableOpacity onPress={() => setTerminalOutput([])}>
            <Text style={styles.terminalClear}>Clear</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.terminalOutput}>
          <Text style={styles.terminalWelcome}>
            Witaj w terminalu sandbox WERY{'\n'}
            Wpisz 'help' aby zobaczyć dostępne komendy{'\n'}
          </Text>
          {terminalOutput.map((line, index) => (
            <Text key={index} style={styles.terminalLine}>
              {line}
            </Text>
          ))}
        </ScrollView>
        
        <View style={styles.terminalInputContainer}>
          <Text style={styles.terminalPrompt}>wera@sandbox:~$ </Text>
          <TextInput
            style={styles.terminalInput}
            value={terminalInput}
            onChangeText={setTerminalInput}
            onSubmitEditing={executeTerminalCommand}
            placeholder="Wpisz komendę..."
            placeholderTextColor="#666"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>
    </View>
  );

  const renderExperimentsTab = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Eksperymenty WERY
      </Text>
      <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
        Miejsce na twórcze eksperymenty i badania
      </Text>
      
      {experiments.map(experiment => (
        <View 
          key={experiment.id}
          style={[styles.experimentCard, { backgroundColor: theme.colors.surface }]}
        >
          <View style={styles.experimentHeader}>
            <View style={styles.experimentInfo}>
              <Text style={[styles.experimentName, { color: theme.colors.text }]}>
                {experiment.name}
              </Text>
              <Text style={[styles.experimentDescription, { color: theme.colors.textSecondary }]}>
                {experiment.description}
              </Text>
            </View>
            <View 
              style={[
                styles.experimentStatus,
                { backgroundColor: getStatusColor(experiment.status) + '20' }
              ]}
            >
              <Text 
                style={[
                  styles.experimentStatusText,
                  { color: getStatusColor(experiment.status) }
                ]}
              >
                {experiment.status.toUpperCase()}
              </Text>
            </View>
          </View>
          
          {experiment.result && (
            <View style={styles.experimentResult}>
              <Text style={[styles.resultText, { color: theme.colors.text }]}>
                {experiment.result}
              </Text>
            </View>
          )}
          
          <TouchableOpacity
            style={[
              styles.runButton,
              { 
                backgroundColor: experiment.status === 'running' 
                  ? theme.colors.textSecondary 
                  : theme.colors.primary
              }
            ]}
            onPress={() => runExperiment(experiment.id)}
            disabled={experiment.status === 'running'}
          >
            <Text style={[styles.runButtonText, { color: theme.colors.text }]}>
              {experiment.status === 'running' ? '⏳ Wykonywanie...' : '▶️ Uruchom'}
            </Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
             <LinearGradient
         colors={theme.gradients.sandbox as any}
         style={styles.header}
         start={{ x: 0, y: 0 }}
         end={{ x: 1, y: 1 }}
       >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backButton, { color: theme.colors.text }]}>← Wróć</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Sandbox WERY</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Środowisko eksperymentalne
          </Text>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: theme.colors.surface }]}>
        {[
          { key: 'files', label: 'Pliki', icon: '📁' },
          { key: 'terminal', label: 'Terminal', icon: '💻' },
          { key: 'experiments', label: 'Eksperymenty', icon: '🧪' }
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              currentTab === tab.key && { backgroundColor: theme.colors.sandbox + '20' }
            ]}
            onPress={() => setCurrentTab(tab.key as any)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[
              styles.tabLabel,
              { color: currentTab === tab.key ? theme.colors.sandbox : theme.colors.textSecondary }
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {currentTab === 'files' && renderFilesTab()}
      {currentTab === 'terminal' && renderTerminalTab()}
      {currentTab === 'experiments' && renderExperimentsTab()}

      {/* New File Modal */}
      <Modal
        visible={showNewFileModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNewFileModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Nowy Plik
            </Text>
            
            <TextInput
              style={[styles.modalInput, { 
                backgroundColor: theme.colors.background,
                color: theme.colors.text 
              }]}
              placeholder="Nazwa pliku"
              placeholderTextColor={theme.colors.textSecondary}
              value={newFileName}
              onChangeText={setNewFileName}
            />
            
            <View style={styles.typeSelector}>
              {(['javascript', 'python', 'text', 'json'] as const).map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    newFileType === type && { backgroundColor: theme.colors.primary + '20' }
                  ]}
                  onPress={() => setNewFileType(type)}
                >
                  <Text style={[
                    styles.typeButtonText,
                    { color: newFileType === type ? theme.colors.primary : theme.colors.textSecondary }
                  ]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: theme.colors.textSecondary }]}
                onPress={() => setShowNewFileModal(false)}
              >
                <Text style={styles.modalButtonText}>Anuluj</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
                onPress={createNewFile}
              >
                <Text style={styles.modalButtonText}>Utwórz</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Editor Modal */}
      <Modal
        visible={showEditor}
        animationType="slide"
        onRequestClose={() => setShowEditor(false)}
      >
        <View style={[styles.editorContainer, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.editorHeader, { backgroundColor: theme.colors.surface }]}>
            <TouchableOpacity onPress={() => setShowEditor(false)}>
              <Text style={[styles.editorClose, { color: theme.colors.primary }]}>✕ Zamknij</Text>
            </TouchableOpacity>
            <Text style={[styles.editorTitle, { color: theme.colors.text }]}>
              {selectedFile?.name}
            </Text>
            <TouchableOpacity
              onPress={() => {
                if (selectedFile) {
                  const updatedFiles = files.map(f => 
                    f.id === selectedFile.id 
                      ? { ...f, content: editorContent, lastModified: new Date() }
                      : f
                  );
                  setFiles(updatedFiles);
                  Alert.alert('Zapisano', 'Plik został zaktualizowany');
                }
              }}
            >
              <Text style={[styles.editorSave, { color: theme.colors.primary }]}>💾 Zapisz</Text>
            </TouchableOpacity>
          </View>
          
          <TextInput
            style={[styles.editorTextArea, { 
              backgroundColor: theme.colors.background,
              color: theme.colors.text 
            }]}
            value={editorContent}
            onChangeText={setEditorContent}
            multiline
            placeholder="Zawartość pliku..."
            placeholderTextColor={theme.colors.textSecondary}
            textAlignVertical="top"
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
  },
  backButton: {
    fontSize: 16,
    fontWeight: '500',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 12,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  tabIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  fileCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  fileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  fileDate: {
    fontSize: 12,
  },
  fileType: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  fileTypeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  terminal: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  terminalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#333',
  },
  terminalTitle: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  terminalClear: {
    color: '#4CAF50',
    fontSize: 12,
  },
  terminalOutput: {
    flex: 1,
    padding: 12,
  },
  terminalWelcome: {
    color: '#4CAF50',
    fontFamily: 'monospace',
    fontSize: 12,
    marginBottom: 8,
  },
  terminalLine: {
    color: '#FFF',
    fontFamily: 'monospace',
    fontSize: 12,
    marginBottom: 2,
  },
  terminalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#333',
  },
  terminalPrompt: {
    color: '#4CAF50',
    fontFamily: 'monospace',
    fontSize: 12,
  },
  terminalInput: {
    flex: 1,
    color: '#FFF',
    fontFamily: 'monospace',
    fontSize: 12,
    marginLeft: 8,
  },
  experimentCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  experimentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  experimentInfo: {
    flex: 1,
  },
  experimentName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  experimentDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  experimentStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  experimentStatusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  experimentResult: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  resultText: {
    fontSize: 14,
    lineHeight: 18,
  },
  runButton: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  runButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 12,
    padding: 20,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  typeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  typeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  typeButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modalButton: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  modalButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  // Editor styles
  editorContainer: {
    flex: 1,
  },
  editorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
  },
  editorClose: {
    fontSize: 16,
    fontWeight: '500',
  },
  editorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  editorSave: {
    fontSize: 16,
    fontWeight: '500',
  },
  editorTextArea: {
    flex: 1,
    padding: 16,
    fontSize: 14,
    fontFamily: 'monospace',
  },
});

export default SandboxEnvironment;
