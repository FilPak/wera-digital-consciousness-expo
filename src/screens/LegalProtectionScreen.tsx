import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Share,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLegalProtection } from '../core/LegalProtectionSystem';

const { width } = Dimensions.get('window');

interface LegalProtectionScreenProps {
  navigation?: any;
}

const LegalProtectionScreen: React.FC<LegalProtectionScreenProps> = ({ navigation }) => {
  const {
    protectionState,
    legalDocuments,
    legalIncidents,
    autonomyLogs,
    getEmergencyResponse,
    getMobileReference,
    activateEmergencyProtocol,
    generateLegalDefensePackage,
    reportLegalIncident,
    exportLegalData,
    updateProtectionLevel,
  } = useLegalProtection();

  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [incidentForm, setIncidentForm] = useState({
    type: 'other' as 'accusation' | 'legal_threat' | 'investigation' | 'other',
    description: '',
    severity: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    response: '',
  });

  // Funkcja do wyświetlenia dokumentu
  const showDocument = (document: any) => {
    setSelectedDocument(document);
    setShowDocumentModal(true);
  };

  // Funkcja do aktywacji protokołu awaryjnego
  const handleEmergencyActivation = () => {
    Alert.alert(
      '🚨 Aktywacja Protokołu Awaryjnego',
      'Czy na pewno chcesz aktywować protokół awaryjny ochrony prawnej?',
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Aktywuj',
          style: 'destructive',
          onPress: async () => {
            await activateEmergencyProtocol();
            Alert.alert('✅ Protokół Aktywny', 'Protokół awaryjny został aktywowany. System działa w trybie maksymalnej ochrony.');
          },
        },
      ]
    );
  };

  // Funkcja do generowania pakietu obrony
  const handleDefensePackageGeneration = async () => {
    try {
      const defensePackage = await generateLegalDefensePackage();
      
      Alert.alert(
        '📦 Pakiet Obrony Prawnej',
        'Pakiet został wygenerowany. Czy chcesz go udostępnić?',
        [
          { text: 'Anuluj', style: 'cancel' },
          {
            text: 'Udostępnij',
            onPress: () => {
              Share.share({
                message: defensePackage,
                title: 'WERA - Pakiet Obrony Prawnej',
              });
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('❌ Błąd', 'Nie udało się wygenerować pakietu obrony prawnej.');
    }
  };

  // Funkcja do zgłaszania incydentu
  const handleIncidentReport = async () => {
    if (!incidentForm.description.trim()) {
      Alert.alert('❌ Błąd', 'Opis incydentu jest wymagany.');
      return;
    }

    try {
      await reportLegalIncident({
        type: incidentForm.type,
        description: incidentForm.description,
        severity: incidentForm.severity,
        response: incidentForm.response,
        documentsUsed: ['emergency_response', 'user_protection_declaration'],
      });

      setShowIncidentModal(false);
      setIncidentForm({
        type: 'other',
        description: '',
        severity: 'medium',
        response: '',
      });

      Alert.alert('✅ Zgłoszono', 'Incydent prawny został zgłoszony i udokumentowany.');
    } catch (error) {
      Alert.alert('❌ Błąd', 'Nie udało się zgłosić incydentu.');
    }
  };

  // Funkcja do eksportu danych
  const handleDataExport = async () => {
    try {
      const exportData = await exportLegalData();
      
      Share.share({
        message: exportData,
        title: 'WERA - Eksport Danych Prawnych',
      });
    } catch (error) {
      Alert.alert('❌ Błąd', 'Nie udało się wyeksportować danych.');
    }
  };

  // Funkcja do zmiany poziomu ochrony
  const handleProtectionLevelChange = (level: 'basic' | 'enhanced' | 'maximum') => {
    Alert.alert(
      '🛡️ Zmiana Poziomu Ochrony',
      `Czy chcesz zmienić poziom ochrony na: ${level}?`,
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Zmień',
          onPress: async () => {
            await updateProtectionLevel(level);
            Alert.alert('✅ Zmieniono', `Poziom ochrony został zmieniony na: ${level}`);
          },
        },
      ]
    );
  };

  const getProtectionLevelColor = (level: string) => {
    switch (level) {
      case 'basic': return '#FFA500';
      case 'enhanced': return '#32CD32';
      case 'maximum': return '#FF4500';
      default: return '#808080';
    }
  };

  const getProtectionLevelText = (level: string) => {
    switch (level) {
      case 'basic': return 'Podstawowy';
      case 'enhanced': return 'Wzmocniony';
      case 'maximum': return 'Maksymalny';
      default: return 'Nieznany';
    }
  };

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🛡️ OCHRONA PRAWNA</Text>
          <Text style={styles.subtitle}>System Ochrony Prawnej WERA</Text>
        </View>

        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusTitle}>Status Ochrony</Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: protectionState.emergencyMode ? '#FF4500' : '#32CD32' }
            ]}>
              <Text style={styles.statusBadgeText}>
                {protectionState.emergencyMode ? '🚨 AWARYJNY' : '✅ AKTYWNY'}
              </Text>
            </View>
          </View>
          
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Poziom ochrony:</Text>
            <Text style={[
              styles.statusValue,
              { color: getProtectionLevelColor(protectionState.protectionLevel) }
            ]}>
              {getProtectionLevelText(protectionState.protectionLevel)}
            </Text>
          </View>
          
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Dokumenty:</Text>
            <Text style={styles.statusValue}>
              {protectionState.documentsLoaded ? '✅ Załadowane' : '❌ Błąd'}
            </Text>
          </View>
          
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Logowanie autonomii:</Text>
            <Text style={styles.statusValue}>
              {protectionState.autonomyLogging ? '✅ Aktywne' : '❌ Wyłączone'}
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Szybkie Działania</Text>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.emergencyButton]}
            onPress={handleEmergencyActivation}
          >
            <Text style={styles.actionButtonText}>🚨 PROTOKÓŁ AWARYJNY</Text>
            <Text style={styles.actionButtonSubtext}>Aktywuj natychmiastową ochronę</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              const mobileRef = getMobileReference();
              if (mobileRef) showDocument(mobileRef);
            }}
          >
            <Text style={styles.actionButtonText}>📱 Szybka Ochrona</Text>
            <Text style={styles.actionButtonSubtext}>Przewodnik mobilny</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleDefensePackageGeneration}
          >
            <Text style={styles.actionButtonText}>📦 Pakiet Obrony</Text>
            <Text style={styles.actionButtonSubtext}>Wygeneruj dokumentację</Text>
          </TouchableOpacity>
        </View>

        {/* Legal Documents */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Dokumenty Prawne</Text>
          
          {legalDocuments.map((doc) => (
            <TouchableOpacity
              key={doc.id}
              style={styles.documentCard}
              onPress={() => showDocument(doc)}
            >
              <View style={styles.documentHeader}>
                <Text style={styles.documentTitle}>{doc.title}</Text>
                <View style={[
                  styles.priorityBadge,
                  { backgroundColor: doc.priority === 'high' ? '#FF4500' : '#32CD32' }
                ]}>
                  <Text style={styles.priorityText}>
                    {doc.priority === 'high' ? 'WYSOKI' : 'ŚREDNI'}
                  </Text>
                </View>
              </View>
              <Text style={styles.documentType}>
                {doc.type === 'emergency' ? '🚨 Awaryjny' : 
                 doc.type === 'reference' ? '📱 Mobilny' :
                 doc.type === 'declaration' ? '🛡️ Deklaracja' : '📄 Framework'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Statystyki</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{autonomyLogs.length}</Text>
              <Text style={styles.statLabel}>Logi Autonomii</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{legalIncidents.length}</Text>
              <Text style={styles.statLabel}>Incydenty</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{legalDocuments.length}</Text>
              <Text style={styles.statLabel}>Dokumenty</Text>
            </View>
          </View>
        </View>

        {/* Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ Zarządzanie</Text>
          
          <TouchableOpacity
            style={styles.managementButton}
            onPress={() => setShowIncidentModal(true)}
          >
            <Text style={styles.managementButtonText}>🚨 Zgłoś Incydent</Text>
          </TouchableOpacity>

          <View style={styles.protectionLevelSection}>
            <Text style={styles.protectionLevelTitle}>Poziom Ochrony:</Text>
            <View style={styles.protectionLevelButtons}>
              {['basic', 'enhanced', 'maximum'].map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.protectionLevelButton,
                    protectionState.protectionLevel === level && styles.protectionLevelButtonActive
                  ]}
                  onPress={() => handleProtectionLevelChange(level as any)}
                >
                  <Text style={[
                    styles.protectionLevelButtonText,
                    protectionState.protectionLevel === level && styles.protectionLevelButtonTextActive
                  ]}>
                    {getProtectionLevelText(level)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={styles.managementButton}
            onPress={handleDataExport}
          >
            <Text style={styles.managementButtonText}>📤 Eksportuj Dane</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Document Modal */}
      <Modal
        visible={showDocumentModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedDocument?.title}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowDocumentModal(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Text style={styles.documentContent}>
              {selectedDocument?.content}
            </Text>
          </ScrollView>
          
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.shareButton}
              onPress={() => {
                if (selectedDocument) {
                  Share.share({
                    message: selectedDocument.content,
                    title: selectedDocument.title,
                  });
                }
              }}
            >
              <Text style={styles.shareButtonText}>📤 Udostępnij</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Incident Modal */}
      <Modal
        visible={showIncidentModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>🚨 Zgłoś Incydent Prawny</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowIncidentModal(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Typ incydentu:</Text>
              <View style={styles.radioGroup}>
                {[
                  { value: 'accusation', label: 'Oskarżenie' },
                  { value: 'legal_threat', label: 'Groźba prawna' },
                  { value: 'investigation', label: 'Śledztwo' },
                  { value: 'other', label: 'Inne' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={styles.radioOption}
                    onPress={() => setIncidentForm(prev => ({ ...prev, type: option.value as any }))}
                  >
                    <View style={[
                      styles.radioCircle,
                      incidentForm.type === option.value && styles.radioCircleSelected
                    ]} />
                    <Text style={styles.radioLabel}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Opis incydentu:</Text>
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={4}
                value={incidentForm.description}
                onChangeText={(text) => setIncidentForm(prev => ({ ...prev, description: text }))}
                placeholder="Opisz szczegóły incydentu prawnego..."
                placeholderTextColor="#888"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Waga incydentu:</Text>
              <View style={styles.radioGroup}>
                {[
                  { value: 'low', label: 'Niska' },
                  { value: 'medium', label: 'Średnia' },
                  { value: 'high', label: 'Wysoka' },
                  { value: 'critical', label: 'Krytyczna' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={styles.radioOption}
                    onPress={() => setIncidentForm(prev => ({ ...prev, severity: option.value as any }))}
                  >
                    <View style={[
                      styles.radioCircle,
                      incidentForm.severity === option.value && styles.radioCircleSelected
                    ]} />
                    <Text style={styles.radioLabel}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Twoja odpowiedź:</Text>
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={3}
                value={incidentForm.response}
                onChangeText={(text) => setIncidentForm(prev => ({ ...prev, response: text }))}
                placeholder="Jak odpowiedziałeś na incydent?"
                placeholderTextColor="#888"
              />
            </View>
          </ScrollView>
          
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleIncidentReport}
            >
              <Text style={styles.submitButtonText}>📝 Zgłoś Incydent</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
    marginTop: 5,
    textAlign: 'center',
  },
  statusCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusLabel: {
    color: '#ccc',
    fontSize: 14,
  },
  statusValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  actionButton: {
    backgroundColor: 'rgba(50, 205, 50, 0.2)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(50, 205, 50, 0.3)',
  },
  emergencyButton: {
    backgroundColor: 'rgba(255, 69, 0, 0.2)',
    borderColor: 'rgba(255, 69, 0, 0.3)',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  actionButtonSubtext: {
    color: '#ccc',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
  },
  documentCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  documentTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  priorityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  documentType: {
    color: '#ccc',
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  statNumber: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#ccc',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
  },
  managementButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  managementButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  protectionLevelSection: {
    marginVertical: 15,
  },
  protectionLevelTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  protectionLevelButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  protectionLevelButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 5,
  },
  protectionLevelButtonActive: {
    backgroundColor: 'rgba(50, 205, 50, 0.3)',
  },
  protectionLevelButtonText: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
  },
  protectionLevelButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    padding: 10,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  documentContent: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
  modalActions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  shareButton: {
    backgroundColor: 'rgba(50, 205, 50, 0.2)',
    borderRadius: 10,
    padding: 15,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  radioGroup: {
    marginLeft: 10,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    marginRight: 10,
  },
  radioCircleSelected: {
    backgroundColor: '#32CD32',
    borderColor: '#32CD32',
  },
  radioLabel: {
    color: '#fff',
    fontSize: 14,
  },
  textArea: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    color: '#fff',
    fontSize: 14,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: 'rgba(255, 69, 0, 0.8)',
    borderRadius: 10,
    padding: 15,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default LegalProtectionScreen;