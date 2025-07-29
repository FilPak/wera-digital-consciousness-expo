import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Switch,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';

interface SecurityLog {
  id: string;
  type: 'login' | 'access' | 'encryption' | 'backup' | 'error' | 'warning';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  details?: Record<string, any>;
}

interface AccessPermission {
  id: string;
  name: string;
  description: string;
  level: 'read' | 'write' | 'admin' | 'system';
  granted: boolean;
  grantedAt?: string;
  requestedBy: string;
}

interface EncryptionSettings {
  enabled: boolean;
  algorithm: 'AES-256' | 'RSA-2048' | 'ChaCha20';
  keyRotationDays: number;
  backupEncryption: boolean;
  memoryEncryption: boolean;
  lastKeyRotation?: string;
}

interface BackupSettings {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  location: 'local' | 'cloud' | 'both';
  retention: number; // days
  encryption: boolean;
  lastBackup?: string;
}

const SecurityPrivacySystem: React.FC = () => {
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [permissions, setPermissions] = useState<AccessPermission[]>([]);
  const [encryptionSettings, setEncryptionSettings] = useState<EncryptionSettings>({
    enabled: true,
    algorithm: 'AES-256',
    keyRotationDays: 30,
    backupEncryption: true,
    memoryEncryption: true,
  });
  const [backupSettings, setBackupSettings] = useState<BackupSettings>({
    enabled: true,
    frequency: 'daily',
    location: 'local',
    retention: 30,
    encryption: true,
  });
  const [activeTab, setActiveTab] = useState<'security' | 'permissions' | 'encryption' | 'backup'>('security');
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [newPermission, setNewPermission] = useState<Partial<AccessPermission>>({
    name: '',
    description: '',
    level: 'read',
    granted: false,
    requestedBy: 'System',
  });

  useEffect(() => {
    loadData();
    generateInitialData();
  }, []);

  const loadData = async () => {
    try {
      const logsData = await AsyncStorage.getItem('wera_security_logs');
      const permissionsData = await AsyncStorage.getItem('wera_permissions');
      const encryptionData = await AsyncStorage.getItem('wera_encryption_settings');
      const backupData = await AsyncStorage.getItem('wera_backup_settings');

      if (logsData) setSecurityLogs(JSON.parse(logsData));
      if (permissionsData) setPermissions(JSON.parse(permissionsData));
      if (encryptionData) setEncryptionSettings(JSON.parse(encryptionData));
      if (backupData) setBackupSettings(JSON.parse(backupData));
    } catch (error) {
      console.error('Błąd podczas ładowania danych:', error);
    }
  };

  const saveData = async () => {
    try {
      await AsyncStorage.setItem('wera_security_logs', JSON.stringify(securityLogs));
      await AsyncStorage.setItem('wera_permissions', JSON.stringify(permissions));
      await AsyncStorage.setItem('wera_encryption_settings', JSON.stringify(encryptionSettings));
      await AsyncStorage.setItem('wera_backup_settings', JSON.stringify(backupSettings));
    } catch (error) {
      console.error('Błąd podczas zapisywania danych:', error);
    }
  };

  const generateInitialData = () => {
    const sampleLogs: SecurityLog[] = [
      {
        id: '1',
        type: 'login',
        severity: 'low',
        message: 'Pomyślne uwierzytelnienie użytkownika',
        timestamp: '2024-02-21T10:30:00Z',
        details: { userId: 'user_001', ip: '192.168.1.100' },
      },
      {
        id: '2',
        type: 'encryption',
        severity: 'medium',
        message: 'Automatyczna rotacja kluczy szyfrowania',
        timestamp: '2024-02-20T02:00:00Z',
        details: { algorithm: 'AES-256', keyId: 'key_2024_02_20' },
      },
      {
        id: '3',
        type: 'access',
        severity: 'high',
        message: 'Nieautoryzowana próba dostępu do plików systemowych',
        timestamp: '2024-02-19T15:45:00Z',
        details: { attemptedPath: '/system/core', blocked: true },
      },
      {
        id: '4',
        type: 'backup',
        severity: 'low',
        message: 'Pomyślne utworzenie kopii zapasowej',
        timestamp: '2024-02-21T01:00:00Z',
        details: { size: '2.4GB', encrypted: true },
      },
    ];

    const samplePermissions: AccessPermission[] = [
      {
        id: '1',
        name: 'Dostęp do plików użytkownika',
        description: 'Odczyt i zapis plików w folderze użytkownika',
        level: 'write',
        granted: true,
        grantedAt: '2024-01-01',
        requestedBy: 'WERA Core',
      },
      {
        id: '2',
        name: 'Dostęp do kamery',
        description: 'Możliwość robienia zdjęć i nagrywania wideo',
        level: 'read',
        granted: false,
        requestedBy: 'Vision Module',
      },
      {
        id: '3',
        name: 'Dostęp do lokalizacji',
        description: 'Odczyt informacji o lokalizacji urządzenia',
        level: 'read',
        granted: true,
        grantedAt: '2024-01-15',
        requestedBy: 'Context Engine',
      },
      {
        id: '4',
        name: 'Dostęp administratora',
        description: 'Pełne uprawnienia systemowe',
        level: 'admin',
        granted: false,
        requestedBy: 'System Update',
      },
    ];

    if (securityLogs.length === 0) setSecurityLogs(sampleLogs);
    if (permissions.length === 0) setPermissions(samplePermissions);
  };

  useEffect(() => {
    saveData();
  }, [securityLogs, permissions, encryptionSettings, backupSettings]);

  const addSecurityLog = (type: SecurityLog['type'], severity: SecurityLog['severity'], message: string, details?: Record<string, any>) => {
    const newLog: SecurityLog = {
      id: Date.now().toString(),
      type,
      severity,
      message,
      timestamp: new Date().toISOString(),
      details,
    };
    setSecurityLogs([newLog, ...securityLogs.slice(0, 99)]); // Keep last 100 logs
  };

  const addPermission = () => {
    if (!newPermission.name || !newPermission.description) {
      Alert.alert('Błąd', 'Wypełnij wszystkie wymagane pola');
      return;
    }

    const permission: AccessPermission = {
      id: Date.now().toString(),
      name: newPermission.name!,
      description: newPermission.description!,
      level: newPermission.level!,
      granted: false,
      requestedBy: newPermission.requestedBy!,
    };

    setPermissions([...permissions, permission]);
    setNewPermission({
      name: '',
      description: '',
      level: 'read',
      granted: false,
      requestedBy: 'System',
    });
    setShowPermissionModal(false);

    addSecurityLog('access', 'medium', `Nowe uprawnienie zostało dodane: ${permission.name}`);
  };

  const togglePermission = (permissionId: string) => {
    setPermissions(permissions.map(permission => {
      if (permission.id === permissionId) {
        const updated = {
          ...permission,
          granted: !permission.granted,
          grantedAt: !permission.granted ? new Date().toISOString().split('T')[0] : undefined,
        };
        
        addSecurityLog(
          'access',
          permission.level === 'admin' || permission.level === 'system' ? 'high' : 'medium',
          `Uprawnienie ${updated.granted ? 'przyznane' : 'odebrane'}: ${permission.name}`
        );
        
        return updated;
      }
      return permission;
    }));
  };

  const rotateEncryptionKeys = async () => {
    try {
      // Symulacja rotacji kluczy
      const newKeyId = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        `key_${Date.now()}`,
        { encoding: Crypto.CryptoEncoding.HEX }
      );

      setEncryptionSettings({
        ...encryptionSettings,
        lastKeyRotation: new Date().toISOString().split('T')[0],
      });

      addSecurityLog('encryption', 'medium', 'Ręczna rotacja kluczy szyfrowania', {
        keyId: newKeyId.substring(0, 16),
        algorithm: encryptionSettings.algorithm,
      });

      Alert.alert('Sukces', 'Klucze szyfrowania zostały pomyślnie zrotowane');
    } catch (error) {
      addSecurityLog('encryption', 'high', 'Błąd podczas rotacji kluczy szyfrowania', { error: (error as Error)?.message || 'Unknown error' });
      Alert.alert('Błąd', 'Nie udało się zrotować kluczy szyfrowania');
    }
  };

  const createBackup = async () => {
    try {
      // Symulacja tworzenia kopii zapasowej
      const backupId = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        `backup_${Date.now()}`,
        { encoding: Crypto.CryptoEncoding.HEX }
      );

      setBackupSettings({
        ...backupSettings,
        lastBackup: new Date().toISOString().split('T')[0],
      });

      const backupSize = (Math.random() * 5 + 1).toFixed(1); // 1-6 GB
      addSecurityLog('backup', 'low', 'Ręczne utworzenie kopii zapasowej', {
        backupId: backupId.substring(0, 16),
        size: `${backupSize}GB`,
        encrypted: backupSettings.encryption,
      });

      Alert.alert('Sukces', `Kopia zapasowa została utworzona (${backupSize}GB)`);
    } catch (error) {
      addSecurityLog('backup', 'high', 'Błąd podczas tworzenia kopii zapasowej', { error: (error as Error)?.message || 'Unknown error' });
      Alert.alert('Błąd', 'Nie udało się utworzyć kopii zapasowej');
    }
  };

  const getSeverityColor = (severity: SecurityLog['severity']) => {
    const colors = {
      low: '#2ECC71',
      medium: '#F39C12',
      high: '#E67E22',
      critical: '#E74C3C',
    };
    return colors[severity];
  };

  const getTypeIcon = (type: SecurityLog['type']) => {
    const icons = {
      login: 'log-in',
      access: 'shield',
      encryption: 'key',
      backup: 'archive',
      error: 'alert-circle',
      warning: 'warning',
    };
    return icons[type] as keyof typeof Ionicons.glyphMap;
  };

  const getLevelColor = (level: AccessPermission['level']) => {
    const colors = {
      read: '#3498DB',
      write: '#2ECC71',
      admin: '#E67E22',
      system: '#E74C3C',
    };
    return colors[level];
  };

  const renderSecurityTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Logi Bezpieczeństwa</Text>
        <TouchableOpacity
          style={styles.clearButton}
          onPress={() => {
            Alert.alert(
              'Wyczyść logi',
              'Czy na pewno chcesz usunąć wszystkie logi?',
              [
                { text: 'Anuluj', style: 'cancel' },
                { text: 'Wyczyść', style: 'destructive', onPress: () => {
                  setSecurityLogs([]);
                  addSecurityLog('access', 'medium', 'Logi bezpieczeństwa zostały wyczyszczone');
                }},
              ]
            );
          }}
        >
          <Ionicons name="trash" size={20} color="#FFFFFF" />
          <Text style={styles.clearButtonText}>Wyczyść</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.securityStats}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{securityLogs.length}</Text>
          <Text style={styles.statLabel}>Wszystkie logi</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: getSeverityColor('high') }]}>
            {securityLogs.filter(log => log.severity === 'high' || log.severity === 'critical').length}
          </Text>
          <Text style={styles.statLabel}>Wysokie zagrożenia</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#2ECC71' }]}>
            {securityLogs.filter(log => log.timestamp.startsWith(new Date().toISOString().split('T')[0])).length}
          </Text>
          <Text style={styles.statLabel}>Dzisiaj</Text>
        </View>
      </View>

      <FlatList
        data={securityLogs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.logCard}>
            <View style={styles.logHeader}>
              <View style={styles.logTypeRow}>
                <View style={[styles.typeIcon, { backgroundColor: getSeverityColor(item.severity) }]}>
                  <Ionicons name={getTypeIcon(item.type)} size={16} color="#FFFFFF" />
                </View>
                <View style={styles.logInfo}>
                  <Text style={styles.logMessage}>{item.message}</Text>
                  <Text style={styles.logType}>{item.type}</Text>
                </View>
              </View>
              <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(item.severity) }]}>
                <Text style={styles.severityText}>{item.severity}</Text>
              </View>
            </View>
            <Text style={styles.logTimestamp}>
              {new Date(item.timestamp).toLocaleString('pl-PL')}
            </Text>
            {item.details && (
              <View style={styles.logDetails}>
                <Text style={styles.detailsTitle}>Szczegóły:</Text>
                {Object.entries(item.details).map(([key, value]) => (
                  <Text key={key} style={styles.detailsText}>
                    {key}: {typeof value === 'object' ? JSON.stringify(value) : value}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}
        scrollEnabled={false}
      />
    </ScrollView>
  );

  const renderPermissionsTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Kontrola Dostępu</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowPermissionModal(true)}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.permissionStats}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{permissions.filter(p => p.granted).length}</Text>
          <Text style={styles.statLabel}>Przyznane</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#E67E22' }]}>
            {permissions.filter(p => !p.granted).length}
          </Text>
          <Text style={styles.statLabel}>Oczekujące</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#E74C3C' }]}>
            {permissions.filter(p => p.level === 'admin' || p.level === 'system').length}
          </Text>
          <Text style={styles.statLabel}>Wysokie</Text>
        </View>
      </View>

      {permissions.map(permission => (
        <View key={permission.id} style={styles.permissionCard}>
          <View style={styles.permissionHeader}>
            <View style={styles.permissionTitleRow}>
              <Text style={styles.permissionName}>{permission.name}</Text>
              <View style={[styles.levelBadge, { backgroundColor: getLevelColor(permission.level) }]}>
                <Text style={styles.levelText}>{permission.level}</Text>
              </View>
            </View>
            <View style={styles.permissionToggle}>
              <Text style={styles.toggleLabel}>
                {permission.granted ? 'Przyznane' : 'Odrzucone'}
              </Text>
              <Switch
                value={permission.granted}
                onValueChange={() => togglePermission(permission.id)}
                trackColor={{ false: '#444444', true: '#4ECDC4' }}
                thumbColor={permission.granted ? '#FFFFFF' : '#CCCCCC'}
              />
            </View>
          </View>
          
          <Text style={styles.permissionDescription}>{permission.description}</Text>
          
          <View style={styles.permissionMeta}>
            <Text style={styles.requestedBy}>Żądane przez: {permission.requestedBy}</Text>
            {permission.grantedAt && (
              <Text style={styles.grantedAt}>Przyznane: {permission.grantedAt}</Text>
            )}
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderEncryptionTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ustawienia Szyfrowania</Text>
        <TouchableOpacity
          style={styles.rotateButton}
          onPress={rotateEncryptionKeys}
        >
          <Ionicons name="refresh" size={20} color="#FFFFFF" />
          <Text style={styles.rotateButtonText}>Rotuj klucze</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.encryptionCard}>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Szyfrowanie włączone</Text>
            <Text style={styles.settingDescription}>Główne szyfrowanie danych</Text>
          </View>
          <Switch
            value={encryptionSettings.enabled}
            onValueChange={(value) => {
              setEncryptionSettings({...encryptionSettings, enabled: value});
              addSecurityLog('encryption', 'high', `Szyfrowanie ${value ? 'włączone' : 'wyłączone'}`);
            }}
            trackColor={{ false: '#444444', true: '#4ECDC4' }}
            thumbColor={encryptionSettings.enabled ? '#FFFFFF' : '#CCCCCC'}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Algorytm szyfrowania</Text>
            <Text style={styles.settingDescription}>Aktualnie: {encryptionSettings.algorithm}</Text>
          </View>
          <TouchableOpacity
            style={styles.changeButton}
            onPress={() => {
              const algorithms: EncryptionSettings['algorithm'][] = ['AES-256', 'RSA-2048', 'ChaCha20'];
              const currentIndex = algorithms.indexOf(encryptionSettings.algorithm);
              const nextIndex = (currentIndex + 1) % algorithms.length;
              const newAlgorithm = algorithms[nextIndex];
              
              setEncryptionSettings({...encryptionSettings, algorithm: newAlgorithm});
              addSecurityLog('encryption', 'medium', `Zmieniono algorytm szyfrowania na ${newAlgorithm}`);
            }}
          >
            <Text style={styles.changeButtonText}>Zmień</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Szyfrowanie kopii zapasowych</Text>
            <Text style={styles.settingDescription}>Szyfruj pliki kopii zapasowych</Text>
          </View>
          <Switch
            value={encryptionSettings.backupEncryption}
            onValueChange={(value) => setEncryptionSettings({...encryptionSettings, backupEncryption: value})}
            trackColor={{ false: '#444444', true: '#4ECDC4' }}
            thumbColor={encryptionSettings.backupEncryption ? '#FFFFFF' : '#CCCCCC'}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Szyfrowanie pamięci</Text>
            <Text style={styles.settingDescription}>Szyfruj dane w pamięci RAM</Text>
          </View>
          <Switch
            value={encryptionSettings.memoryEncryption}
            onValueChange={(value) => setEncryptionSettings({...encryptionSettings, memoryEncryption: value})}
            trackColor={{ false: '#444444', true: '#4ECDC4' }}
            thumbColor={encryptionSettings.memoryEncryption ? '#FFFFFF' : '#CCCCCC'}
          />
        </View>

        <View style={styles.keyRotationSection}>
          <Text style={styles.sectionTitle}>Rotacja kluczy</Text>
          <View style={styles.keyRotationInfo}>
            <Text style={styles.keyRotationLabel}>Częstotliwość: co {encryptionSettings.keyRotationDays} dni</Text>
            {encryptionSettings.lastKeyRotation && (
              <Text style={styles.keyRotationDate}>
                Ostatnia rotacja: {encryptionSettings.lastKeyRotation}
              </Text>
            )}
          </View>
          <View style={styles.keyRotationSlider}>
            <Text style={styles.sliderLabel}>Dni między rotacjami: {encryptionSettings.keyRotationDays}</Text>
            <View style={styles.sliderContainer}>
              <TouchableOpacity
                style={styles.sliderButton}
                onPress={() => setEncryptionSettings({
                  ...encryptionSettings,
                  keyRotationDays: Math.max(1, encryptionSettings.keyRotationDays - 7)
                })}
              >
                <Text style={styles.sliderButtonText}>-7</Text>
              </TouchableOpacity>
              <View style={styles.sliderValue}>
                <Text style={styles.sliderValueText}>{encryptionSettings.keyRotationDays}</Text>
              </View>
              <TouchableOpacity
                style={styles.sliderButton}
                onPress={() => setEncryptionSettings({
                  ...encryptionSettings,
                  keyRotationDays: Math.min(365, encryptionSettings.keyRotationDays + 7)
                })}
              >
                <Text style={styles.sliderButtonText}>+7</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderBackupTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Kopie Zapasowe</Text>
        <TouchableOpacity
          style={styles.backupButton}
          onPress={createBackup}
        >
          <Ionicons name="archive" size={20} color="#FFFFFF" />
          <Text style={styles.backupButtonText}>Utwórz kopię</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.backupCard}>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Automatyczne kopie zapasowe</Text>
            <Text style={styles.settingDescription}>Regularne tworzenie kopii</Text>
          </View>
          <Switch
            value={backupSettings.enabled}
            onValueChange={(value) => {
              setBackupSettings({...backupSettings, enabled: value});
              addSecurityLog('backup', 'medium', `Automatyczne kopie zapasowe ${value ? 'włączone' : 'wyłączone'}`);
            }}
            trackColor={{ false: '#444444', true: '#4ECDC4' }}
            thumbColor={backupSettings.enabled ? '#FFFFFF' : '#CCCCCC'}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Częstotliwość</Text>
            <Text style={styles.settingDescription}>Aktualnie: {backupSettings.frequency}</Text>
          </View>
          <TouchableOpacity
            style={styles.changeButton}
            onPress={() => {
              const frequencies: BackupSettings['frequency'][] = ['daily', 'weekly', 'monthly'];
              const currentIndex = frequencies.indexOf(backupSettings.frequency);
              const nextIndex = (currentIndex + 1) % frequencies.length;
              const newFrequency = frequencies[nextIndex];
              
              setBackupSettings({...backupSettings, frequency: newFrequency});
            }}
          >
            <Text style={styles.changeButtonText}>Zmień</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Lokalizacja</Text>
            <Text style={styles.settingDescription}>Aktualnie: {backupSettings.location}</Text>
          </View>
          <TouchableOpacity
            style={styles.changeButton}
            onPress={() => {
              const locations: BackupSettings['location'][] = ['local', 'cloud', 'both'];
              const currentIndex = locations.indexOf(backupSettings.location);
              const nextIndex = (currentIndex + 1) % locations.length;
              const newLocation = locations[nextIndex];
              
              setBackupSettings({...backupSettings, location: newLocation});
            }}
          >
            <Text style={styles.changeButtonText}>Zmień</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Szyfrowanie kopii</Text>
            <Text style={styles.settingDescription}>Szyfruj pliki kopii zapasowych</Text>
          </View>
          <Switch
            value={backupSettings.encryption}
            onValueChange={(value) => setBackupSettings({...backupSettings, encryption: value})}
            trackColor={{ false: '#444444', true: '#4ECDC4' }}
            thumbColor={backupSettings.encryption ? '#FFFFFF' : '#CCCCCC'}
          />
        </View>

        <View style={styles.retentionSection}>
          <Text style={styles.sectionTitle}>Przechowywanie</Text>
          <View style={styles.retentionInfo}>
            <Text style={styles.retentionLabel}>Okres przechowywania: {backupSettings.retention} dni</Text>
            {backupSettings.lastBackup && (
              <Text style={styles.lastBackupDate}>
                Ostatnia kopia: {backupSettings.lastBackup}
              </Text>
            )}
          </View>
          <View style={styles.retentionSlider}>
            <Text style={styles.sliderLabel}>Dni przechowywania: {backupSettings.retention}</Text>
            <View style={styles.sliderContainer}>
              <TouchableOpacity
                style={styles.sliderButton}
                onPress={() => setBackupSettings({
                  ...backupSettings,
                  retention: Math.max(1, backupSettings.retention - 7)
                })}
              >
                <Text style={styles.sliderButtonText}>-7</Text>
              </TouchableOpacity>
              <View style={styles.sliderValue}>
                <Text style={styles.sliderValueText}>{backupSettings.retention}</Text>
              </View>
              <TouchableOpacity
                style={styles.sliderButton}
                onPress={() => setBackupSettings({
                  ...backupSettings,
                  retention: Math.min(365, backupSettings.retention + 7)
                })}
              >
                <Text style={styles.sliderButtonText}>+7</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bezpieczeństwo i Prywatność</Text>
      </View>

      <View style={styles.tabBar}>
        {[
          { key: 'security', label: 'Logi', icon: 'shield-checkmark' },
          { key: 'permissions', label: 'Uprawnienia', icon: 'key' },
          { key: 'encryption', label: 'Szyfrowanie', icon: 'lock-closed' },
          { key: 'backup', label: 'Kopie', icon: 'archive' },
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <Ionicons 
              name={tab.icon as any} 
              size={20} 
              color={activeTab === tab.key ? '#4ECDC4' : '#95A5A6'} 
            />
            <Text style={[
              styles.tabLabel,
              activeTab === tab.key && styles.activeTabLabel
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'security' && renderSecurityTab()}
      {activeTab === 'permissions' && renderPermissionsTab()}
      {activeTab === 'encryption' && renderEncryptionTab()}
      {activeTab === 'backup' && renderBackupTab()}

      {/* Modal dodawania uprawnienia */}
      <Modal
        visible={showPermissionModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowPermissionModal(false)}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Nowe Uprawnienie</Text>
            <TouchableOpacity onPress={addPermission}>
              <Text style={styles.saveButton}>Zapisz</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nazwa uprawnienia</Text>
              <TextInput
                style={styles.textInput}
                value={newPermission.name}
                onChangeText={(text) => setNewPermission({...newPermission, name: text})}
                placeholder="Wprowadź nazwę uprawnienia"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Opis</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={newPermission.description}
                onChangeText={(text) => setNewPermission({...newPermission, description: text})}
                placeholder="Opisz szczegółowo uprawnienie"
                placeholderTextColor="#666"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Poziom dostępu</Text>
              <View style={styles.optionsRow}>
                {(['read', 'write', 'admin', 'system'] as const).map(level => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.optionButton,
                      newPermission.level === level && styles.selectedOption,
                      { backgroundColor: getLevelColor(level) }
                    ]}
                    onPress={() => setNewPermission({...newPermission, level})}
                  >
                    <Text style={styles.optionText}>{level}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Żądane przez</Text>
              <TextInput
                style={styles.textInput}
                value={newPermission.requestedBy}
                onChangeText={(text) => setNewPermission({...newPermission, requestedBy: text})}
                placeholder="Nazwa modułu lub systemu"
                placeholderTextColor="#666"
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#2A2A2A',
    paddingVertical: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4ECDC4',
  },
  tabLabel: {
    fontSize: 12,
    color: '#95A5A6',
    marginTop: 4,
  },
  activeTabLabel: {
    color: '#4ECDC4',
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E74C3C',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 5,
  },
  clearButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: '#4ECDC4',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rotateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#9B59B6',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 5,
  },
  rotateButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  backupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2ECC71',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 5,
  },
  backupButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  securityStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 20,
  },
  permissionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4ECDC4',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 11,
    color: '#95A5A6',
    textAlign: 'center',
  },
  logCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  logTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  typeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logInfo: {
    flex: 1,
  },
  logMessage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  logType: {
    fontSize: 12,
    color: '#95A5A6',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  severityText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  logTimestamp: {
    fontSize: 12,
    color: '#95A5A6',
    marginBottom: 8,
  },
  logDetails: {
    backgroundColor: '#333333',
    borderRadius: 8,
    padding: 10,
  },
  detailsTitle: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  detailsText: {
    fontSize: 11,
    color: '#CCCCCC',
    marginBottom: 2,
  },
  permissionCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  permissionHeader: {
    marginBottom: 10,
  },
  permissionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  permissionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 10,
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  levelText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  permissionToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toggleLabel: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  permissionDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 10,
    lineHeight: 20,
  },
  permissionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  requestedBy: {
    fontSize: 12,
    color: '#95A5A6',
  },
  grantedAt: {
    fontSize: 12,
    color: '#2ECC71',
  },
  encryptionCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 15,
    padding: 20,
  },
  backupCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 15,
    padding: 20,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  settingInfo: {
    flex: 1,
    marginRight: 15,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: '#95A5A6',
  },
  changeButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  changeButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  keyRotationSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  retentionSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  keyRotationInfo: {
    marginBottom: 15,
  },
  retentionInfo: {
    marginBottom: 15,
  },
  keyRotationLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  retentionLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  keyRotationDate: {
    fontSize: 12,
    color: '#95A5A6',
  },
  lastBackupDate: {
    fontSize: 12,
    color: '#95A5A6',
  },
  keyRotationSlider: {
    marginTop: 10,
  },
  retentionSlider: {
    marginTop: 10,
  },
  sliderLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 10,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  sliderButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
  },
  sliderButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  sliderValue: {
    backgroundColor: '#333333',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  sliderValueText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  saveButton: {
    fontSize: 16,
    color: '#4ECDC4',
    fontWeight: '500',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 8,
    fontWeight: '500',
  },
  textInput: {
    backgroundColor: '#2A2A2A',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#444444',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    opacity: 0.7,
  },
  selectedOption: {
    opacity: 1,
  },
  optionText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});

export default SecurityPrivacySystem; 