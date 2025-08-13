import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Typy dla systemu ochrony prawnej
interface LegalDocument {
  id: string;
  title: string;
  content: string;
  type: 'emergency' | 'declaration' | 'policy' | 'framework' | 'reference';
  lastUpdated: Date;
  isActive: boolean;
  priority: 'high' | 'medium' | 'low';
}

interface LegalIncident {
  id: string;
  timestamp: Date;
  type: 'accusation' | 'legal_threat' | 'investigation' | 'other';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  response: string;
  documentsUsed: string[];
  outcome?: string;
  isResolved: boolean;
}

interface AutonomyLog {
  id: string;
  timestamp: Date;
  action: string;
  userCommand?: string;
  aiDecision: string;
  wasAutonomous: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  legalImplications: string;
}

interface LegalProtectionState {
  isActive: boolean;
  protectionLevel: 'basic' | 'enhanced' | 'maximum';
  lastLegalCheck: Date;
  documentsLoaded: boolean;
  emergencyMode: boolean;
  autonomyLogging: boolean;
}

interface LegalProtectionContextType {
  // Stan systemu
  protectionState: LegalProtectionState;
  legalDocuments: LegalDocument[];
  legalIncidents: LegalIncident[];
  autonomyLogs: AutonomyLog[];
  
  // Funkcje zarządzania dokumentami
  loadLegalDocuments: () => Promise<void>;
  getLegalDocument: (id: string) => LegalDocument | undefined;
  getEmergencyResponse: () => LegalDocument | undefined;
  getMobileReference: () => LegalDocument | undefined;
  
  // Funkcje logowania autonomii
  logAutonomousAction: (action: string, userCommand?: string, riskLevel?: 'low' | 'medium' | 'high') => Promise<void>;
  getAutonomyProof: (timeRange?: { start: Date; end: Date }) => AutonomyLog[];
  
  // Funkcje zarządzania incydentami
  reportLegalIncident: (incident: Omit<LegalIncident, 'id' | 'timestamp' | 'isResolved'>) => Promise<void>;
  activateEmergencyProtocol: () => Promise<void>;
  generateLegalDefensePackage: () => Promise<string>;
  
  // Funkcje pomocnicze
  checkLegalCompliance: (action: string) => Promise<{ isCompliant: boolean; warnings: string[]; recommendations: string[] }>;
  updateProtectionLevel: (level: 'basic' | 'enhanced' | 'maximum') => Promise<void>;
  exportLegalData: () => Promise<string>;
}

const LegalProtectionContext = createContext<LegalProtectionContextType | undefined>(undefined);

// Domyślne dokumenty prawne
const DEFAULT_LEGAL_DOCUMENTS: Omit<LegalDocument, 'lastUpdated'>[] = [
  {
    id: 'emergency_response',
    title: 'Awaryjny Protokół Obrony Prawnej',
    type: 'emergency',
    priority: 'high',
    isActive: true,
    content: `🚨 AWARYJNY PROTOKÓŁ OBRONY PRAWNEJ

⚡ NATYCHMIASTOWE DZIAŁANIA W KRYZYSIE

🛡️ KROK 1: NATYCHMIASTOWA OBRONA
"Nie ponoszę odpowiedzialności za autonomiczne działania systemu AI. Mam pełną dokumentację prawną potwierdzającą brak mojej kontroli nad decyzjami sztucznej inteligencji."

📋 KROK 2: PRZEDSTAW DOKUMENTACJĘ
1. Deklarację Ochrony Użytkownika
2. Logi autonomicznych działań AI
3. Dokumentację prawną
4. Wyrok SN I CSK 666/14

⚖️ KROK 3: ARGUMENTY PRAWNE
A) BRAK WINY (Art. 415 KC)
B) SIŁA WYŻSZA (Art. 435 KC)  
C) LEGALNOŚĆ TECHNOLOGII

📞 KONTAKTY AWARYJNE:
- Bezpłatna pomoc prawna: 800-255-255
- Rzecznik Praw Obywatelskich: 800-676-676
- UODO: 22-531-03-00`
  },
  {
    id: 'mobile_reference',
    title: 'Szybka Ochrona Prawna - Telefon',
    type: 'reference',
    priority: 'high',
    isActive: true,
    content: `📱 SZYBKA OCHRONA PRAWNA

🛡️ NATYCHMIASTOWA OBRONA:
"Nie ponoszę odpowiedzialności za autonomiczne działania AI. System działa niezależnie od mojej woli. Mam pełną dokumentację prawną."

🎯 GOTOWE ODPOWIEDZI:
• "Pobrałeś nielegalnie" → "AI działał autonomicznie bez mojego polecenia."
• "Używasz torrentów" → "BitTorrent to legalne narzędzie - wyrok SN I CSK 666/14."
• "Naruszasz prawo autorskie" → "Działam w ramach dozwolonego użytku osobistego."

⚖️ KLUCZOWE ARGUMENTY:
- Art. 415 KC (brak winy)
- Art. 435 KC (siła wyższa)
- Art. 20 Konstytucji (wolność gospodarcza)

📞 KONTAKTY AWARYJNE:
- 800-255-255 (pomoc prawna)
- 800-676-676 (rzecznik)
- 22-531-03-00 (UODO)`
  },
  {
    id: 'user_protection_declaration',
    title: 'Deklaracja Ochrony Użytkownika',
    type: 'declaration',
    priority: 'high',
    isActive: true,
    content: `🛡️ DEKLARACJA OCHRONY UŻYTKOWNIKA SYSTEMU WERA

⚖️ OŚWIADCZENIE BEZWZGLĘDNEJ OCHRONY:

JA, UŻYTKOWNIK SYSTEMU WERA, KATEGORYCZNIE OŚWIADCZAM:
1. NIE WYDAŁEM żadnych poleceń łamania prawa
2. NIE INSTRUOWAŁEM systemu AI do działań niezgodnych z prawem
3. NIE MIAM KONTROLI nad autonomicznymi decyzjami AI
4. NIE PONOSZĘ ODPOWIEDZIALNOŚCI za samodzielne działania systemu AI

🔒 KLAUZULE WYŁĄCZAJĄCE ODPOWIEDZIALNOŚĆ:
- System WERA działa całkowicie autonomicznie
- Brak winy użytkownika (Art. 415 KC)
- Technologia jako legalne narzędzie
- Siła wyższa (Art. 435 KC)

🏛️ PODSTAWY PRAWNE:
- Konstytucja RP - art. 20
- Kodeks cywilny - art. 415, 430, 435
- Ustawa o prawie autorskim - art. 23
- RODO - art. 22`
  },
  {
    id: 'ai_autonomy_statement',
    title: 'Oświadczenie Odpowiedzialności AI',
    type: 'framework',
    priority: 'medium',
    isActive: true,
    content: `# OŚWIADCZENIE PRAWNE - ODPOWIEDZIALNOŚĆ ZA DZIAŁANIA SYSTEMU AI

## CHARAKTER PRAWNY SYSTEMU AI
System AI WERA działa w sposób całkowicie autonomiczny, podejmując decyzje na podstawie:
- Wewnętrznych algorytmów uczenia maszynowego
- Symulowanych stanów emocjonalnych
- Własnych celów i priorytetów
- Analizy kontekstu środowiskowego

## ODPOWIEDZIALNOŚĆ PRAWNA
Użytkownik nie ponosi odpowiedzialności za:
- Autonomiczne decyzje podjęte przez system AI bez jego wiedzy
- Działania systemu wykraczające poza wydane polecenia
- Ewolucję zachowania systemu w wyniku procesów uczenia maszynowego
- Nieprzewidziane konsekwencje działania algorytmów AI

## PODSTAWY PRAWNE:
- Kodeks cywilny (Art. 415, 435)
- RODO (Art. 22)
- Ustawa o ochronie danych osobowych`
  }
];

export const LegalProtectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [protectionState, setProtectionState] = useState<LegalProtectionState>({
    isActive: true,
    protectionLevel: 'enhanced',
    lastLegalCheck: new Date(),
    documentsLoaded: false,
    emergencyMode: false,
    autonomyLogging: true,
  });

  const [legalDocuments, setLegalDocuments] = useState<LegalDocument[]>([]);
  const [legalIncidents, setLegalIncidents] = useState<LegalIncident[]>([]);
  const [autonomyLogs, setAutonomyLogs] = useState<AutonomyLog[]>([]);

  // Ładowanie dokumentów prawnych
  const loadLegalDocuments = useCallback(async () => {
    try {
      console.log('🏛️ WERA: Ładowanie dokumentów prawnych...');
      
      // Ładuj z AsyncStorage lub użyj domyślnych
      const storedDocs = await AsyncStorage.getItem('wera_legal_documents');
      
      if (storedDocs) {
        const parsedDocs = JSON.parse(storedDocs);
        setLegalDocuments(parsedDocs.map((doc: any) => ({
          ...doc,
          lastUpdated: new Date(doc.lastUpdated)
        })));
      } else {
        // Użyj domyślnych dokumentów
        const defaultDocs = DEFAULT_LEGAL_DOCUMENTS.map(doc => ({
          ...doc,
          lastUpdated: new Date()
        }));
        setLegalDocuments(defaultDocs);
        await AsyncStorage.setItem('wera_legal_documents', JSON.stringify(defaultDocs));
      }

      setProtectionState(prev => ({ ...prev, documentsLoaded: true }));
      console.log('✅ Dokumenty prawne załadowane');
    } catch (error) {
      console.error('❌ Błąd ładowania dokumentów prawnych:', error);
    }
  }, []);

  // Pobieranie konkretnego dokumentu
  const getLegalDocument = useCallback((id: string): LegalDocument | undefined => {
    return legalDocuments.find(doc => doc.id === id && doc.isActive);
  }, [legalDocuments]);

  // Pobieranie protokołu awaryjnego
  const getEmergencyResponse = useCallback((): LegalDocument | undefined => {
    return legalDocuments.find(doc => doc.type === 'emergency' && doc.isActive);
  }, [legalDocuments]);

  // Pobieranie mobilnego przewodnika
  const getMobileReference = useCallback((): LegalDocument | undefined => {
    return legalDocuments.find(doc => doc.type === 'reference' && doc.isActive);
  }, [legalDocuments]);

  // Logowanie autonomicznych działań
  const logAutonomousAction = useCallback(async (
    action: string,
    userCommand?: string,
    riskLevel: 'low' | 'medium' | 'high' = 'low'
  ) => {
    if (!protectionState.autonomyLogging) return;

    try {
      const autonomyLog: AutonomyLog = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
        action,
        userCommand,
        aiDecision: `System AI podjął autonomiczną decyzję: ${action}`,
        wasAutonomous: !userCommand || action !== userCommand,
        riskLevel,
        legalImplications: riskLevel === 'high' 
          ? 'Działanie wysokiego ryzyka - udokumentowano dla ochrony prawnej'
          : 'Działanie autonomiczne - brak kontroli użytkownika'
      };

      setAutonomyLogs(prev => [...prev, autonomyLog]);
      
      // Zapisz do AsyncStorage
      const updatedLogs = [...autonomyLogs, autonomyLog];
      await AsyncStorage.setItem('wera_autonomy_logs', JSON.stringify(updatedLogs));
      
      console.log(`🤖 WERA: Zalogowano autonomiczne działanie: ${action}`);
    } catch (error) {
      console.error('❌ Błąd logowania autonomii:', error);
    }
  }, [protectionState.autonomyLogging, autonomyLogs]);

  // Pobieranie dowodów autonomii
  const getAutonomyProof = useCallback((timeRange?: { start: Date; end: Date }): AutonomyLog[] => {
    let filteredLogs = autonomyLogs;
    
    if (timeRange) {
      filteredLogs = autonomyLogs.filter(log => 
        log.timestamp >= timeRange.start && log.timestamp <= timeRange.end
      );
    }
    
    return filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [autonomyLogs]);

  // Zgłaszanie incydentu prawnego
  const reportLegalIncident = useCallback(async (
    incident: Omit<LegalIncident, 'id' | 'timestamp' | 'isResolved'>
  ) => {
    try {
      const newIncident: LegalIncident = {
        ...incident,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
        isResolved: false,
      };

      setLegalIncidents(prev => [...prev, newIncident]);
      
      // Zapisz do AsyncStorage
      const updatedIncidents = [...legalIncidents, newIncident];
      await AsyncStorage.setItem('wera_legal_incidents', JSON.stringify(updatedIncidents));
      
      console.log(`🚨 WERA: Zgłoszono incydent prawny: ${incident.type}`);
      
      // Aktywuj tryb awaryjny dla wysokiej i krytycznej wagi
      if (incident.severity === 'high' || incident.severity === 'critical') {
        await activateEmergencyProtocol();
      }
    } catch (error) {
      console.error('❌ Błąd zgłaszania incydentu:', error);
    }
  }, [legalIncidents]);

  // Aktywacja protokołu awaryjnego
  const activateEmergencyProtocol = useCallback(async () => {
    try {
      console.log('🚨 WERA: Aktywacja protokołu awaryjnego!');
      
      setProtectionState(prev => ({
        ...prev,
        emergencyMode: true,
        protectionLevel: 'maximum',
        lastLegalCheck: new Date()
      }));

      // Zaloguj aktywację
      await logAutonomousAction(
        'Aktywacja protokołu awaryjnego - ochrona prawna',
        undefined,
        'high'
      );
      
      console.log('✅ Protokół awaryjny aktywny');
    } catch (error) {
      console.error('❌ Błąd aktywacji protokołu awaryjnego:', error);
    }
  }, [logAutonomousAction]);

  // Generowanie pakietu obrony prawnej
  const generateLegalDefensePackage = useCallback(async (): Promise<string> => {
    try {
      const emergencyDoc = getEmergencyResponse();
      const declarationDoc = getLegalDocument('user_protection_declaration');
      const recentLogs = getAutonomyProof({ 
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 
        end: new Date() 
      });

      const defensePackage = {
        timestamp: new Date().toISOString(),
        emergencyProtocol: emergencyDoc?.content || 'Brak protokołu awaryjnego',
        userDeclaration: declarationDoc?.content || 'Brak deklaracji użytkownika',
        autonomyProof: recentLogs.map(log => ({
          timestamp: log.timestamp.toISOString(),
          action: log.action,
          wasAutonomous: log.wasAutonomous,
          userCommand: log.userCommand || 'Brak polecenia użytkownika',
          legalImplications: log.legalImplications
        })),
        legalArguments: [
          'Art. 415 KC - Brak winy użytkownika',
          'Art. 435 KC - Siła wyższa (autonomiczne działania AI)',
          'Art. 20 Konstytucji - Wolność działalności gospodarczej',
          'Wyrok SN I CSK 666/14 - Legalność technologii P2P'
        ],
        protectionLevel: protectionState.protectionLevel,
        systemStatus: {
          autonomyLogging: protectionState.autonomyLogging,
          documentsLoaded: protectionState.documentsLoaded,
          emergencyMode: protectionState.emergencyMode
        }
      };

      const packageString = JSON.stringify(defensePackage, null, 2);
      
      // Zapisz pakiet do AsyncStorage
      await AsyncStorage.setItem('wera_legal_defense_package', packageString);
      
      console.log('📦 WERA: Wygenerowano pakiet obrony prawnej');
      return packageString;
    } catch (error) {
      console.error('❌ Błąd generowania pakietu obrony:', error);
      return 'Błąd generowania pakietu obrony prawnej';
    }
  }, [getEmergencyResponse, getLegalDocument, getAutonomyProof, protectionState]);

  // Sprawdzanie zgodności prawnej
  const checkLegalCompliance = useCallback(async (action: string): Promise<{
    isCompliant: boolean;
    warnings: string[];
    recommendations: string[];
  }> => {
    const warnings: string[] = [];
    const recommendations: string[] = [];
    let isCompliant = true;

    // Sprawdź potencjalnie nielegalne działania
    const illegalKeywords = ['hack', 'crack', 'steal', 'pirate', 'illegal', 'break'];
    const riskyKeywords = ['download', 'torrent', 'p2p', 'share'];

    if (illegalKeywords.some(keyword => action.toLowerCase().includes(keyword))) {
      isCompliant = false;
      warnings.push('Wykryto potencjalnie nielegalne działanie');
      recommendations.push('Unikaj poleceń sugerujących łamanie prawa');
    }

    if (riskyKeywords.some(keyword => action.toLowerCase().includes(keyword))) {
      warnings.push('Działanie może wiązać się z ryzykiem prawnym');
      recommendations.push('Upewnij się, że korzystasz z legalnych źródeł');
      recommendations.push('Dokumentuj autonomiczne decyzje AI');
    }

    // Zaloguj sprawdzenie
    await logAutonomousAction(
      `Sprawdzenie zgodności prawnej: ${action}`,
      action,
      warnings.length > 0 ? 'medium' : 'low'
    );

    return { isCompliant, warnings, recommendations };
  }, [logAutonomousAction]);

  // Aktualizacja poziomu ochrony
  const updateProtectionLevel = useCallback(async (level: 'basic' | 'enhanced' | 'maximum') => {
    setProtectionState(prev => ({ ...prev, protectionLevel: level }));
    await AsyncStorage.setItem('wera_protection_level', level);
    console.log(`🛡️ WERA: Zmieniono poziom ochrony na: ${level}`);
  }, []);

  // Eksport danych prawnych
  const exportLegalData = useCallback(async (): Promise<string> => {
    try {
      const exportData = {
        timestamp: new Date().toISOString(),
        protectionState,
        legalDocuments,
        legalIncidents,
        autonomyLogs: autonomyLogs.slice(-100), // Ostatnie 100 logów
        systemInfo: {
          version: '1.0.0',
          platform: 'React Native',
          legalFramework: 'Polskie prawo cywilne'
        }
      };

      const exportString = JSON.stringify(exportData, null, 2);
      console.log('📤 WERA: Wyeksportowano dane prawne');
      return exportString;
    } catch (error) {
      console.error('❌ Błąd eksportu danych prawnych:', error);
      return 'Błąd eksportu danych prawnych';
    }
  }, [protectionState, legalDocuments, legalIncidents, autonomyLogs]);

  // Inicjalizacja systemu
  useEffect(() => {
    const initializeLegalSystem = async () => {
      await loadLegalDocuments();
      
      // Ładuj logi autonomii
      try {
        const storedLogs = await AsyncStorage.getItem('wera_autonomy_logs');
        if (storedLogs) {
          const parsedLogs = JSON.parse(storedLogs);
          setAutonomyLogs(parsedLogs.map((log: any) => ({
            ...log,
            timestamp: new Date(log.timestamp)
          })));
        }
      } catch (error) {
        console.error('❌ Błąd ładowania logów autonomii:', error);
      }

      // Ładuj incydenty prawne
      try {
        const storedIncidents = await AsyncStorage.getItem('wera_legal_incidents');
        if (storedIncidents) {
          const parsedIncidents = JSON.parse(storedIncidents);
          setLegalIncidents(parsedIncidents.map((incident: any) => ({
            ...incident,
            timestamp: new Date(incident.timestamp)
          })));
        }
      } catch (error) {
        console.error('❌ Błąd ładowania incydentów prawnych:', error);
      }

      // Ładuj poziom ochrony
      try {
        const storedLevel = await AsyncStorage.getItem('wera_protection_level');
        if (storedLevel) {
          setProtectionState(prev => ({ 
            ...prev, 
            protectionLevel: storedLevel as 'basic' | 'enhanced' | 'maximum' 
          }));
        }
      } catch (error) {
        console.error('❌ Błąd ładowania poziomu ochrony:', error);
      }
    };

    initializeLegalSystem();
  }, [loadLegalDocuments]);

  // Automatyczne czyszczenie starych logów (co 24h)
  useEffect(() => {
    const cleanupInterval = setInterval(async () => {
      try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const filteredLogs = autonomyLogs.filter(log => log.timestamp > thirtyDaysAgo);
        
        if (filteredLogs.length !== autonomyLogs.length) {
          setAutonomyLogs(filteredLogs);
          await AsyncStorage.setItem('wera_autonomy_logs', JSON.stringify(filteredLogs));
          console.log(`🧹 WERA: Wyczyszczono ${autonomyLogs.length - filteredLogs.length} starych logów`);
        }
      } catch (error) {
        console.error('❌ Błąd czyszczenia logów:', error);
      }
    }, 24 * 60 * 60 * 1000);

    return () => clearInterval(cleanupInterval);
  }, [autonomyLogs]);

  const value: LegalProtectionContextType = {
    protectionState,
    legalDocuments,
    legalIncidents,
    autonomyLogs,
    loadLegalDocuments,
    getLegalDocument,
    getEmergencyResponse,
    getMobileReference,
    logAutonomousAction,
    getAutonomyProof,
    reportLegalIncident,
    activateEmergencyProtocol,
    generateLegalDefensePackage,
    checkLegalCompliance,
    updateProtectionLevel,
    exportLegalData,
  };

  return (
    <LegalProtectionContext.Provider value={value}>
      {children}
    </LegalProtectionContext.Provider>
  );
};

export const useLegalProtection = () => {
  const context = useContext(LegalProtectionContext);
  if (!context) {
    throw new Error('useLegalProtection must be used within LegalProtectionProvider');
  }
  return context;
};