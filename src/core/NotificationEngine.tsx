import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as FileSystem from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: 'reminder' | 'warning' | 'info' | 'emotional' | 'system' | 'initiative';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  timestamp: Date;
  scheduledFor?: Date;
  isRead: boolean;
  isDismissed: boolean;
  emotionalContext?: {
    emotion: string;
    intensity: number;
    trigger?: string;
  };
  actionRequired?: boolean;
  actionType?: 'response' | 'acknowledge' | 'dismiss';
  metadata?: Record<string, any>;
}

interface NotificationSettings {
  enabled: boolean;
  emotionalNotifications: boolean;
  systemNotifications: boolean;
  initiativeNotifications: boolean;
  reminderNotifications: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM
    end: string; // HH:MM
  };
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  priorityFilter: 'all' | 'high' | 'urgent';
}

interface NotificationContextType {
  notifications: NotificationItem[];
  settings: NotificationSettings;
  unreadCount: number;
  pendingCount: number;
  
  // Zarządzanie powiadomieniami
  createNotification: (notification: Omit<NotificationItem, 'id' | 'timestamp' | 'isRead' | 'isDismissed'>) => Promise<string>;
  scheduleNotification: (notification: Omit<NotificationItem, 'id' | 'timestamp' | 'isRead' | 'isDismissed'>, delayMs: number) => Promise<string>;
  markAsRead: (id: string) => Promise<void>;
  dismissNotification: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  
  // Powiadomienia emocjonalne
  createEmotionalNotification: (emotion: string, intensity: number, message: string, trigger?: string) => Promise<string>;
  createInitiativeNotification: (message: string, requiresResponse?: boolean) => Promise<string>;
  createSystemNotification: (title: string, message: string, priority?: 'low' | 'normal' | 'high' | 'urgent') => Promise<string>;
  createReminderNotification: (title: string, message: string, scheduledFor: Date) => Promise<string>;
  
  // Ustawienia
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  toggleNotifications: () => Promise<void>;
  
  // Zarządzanie
  loadNotifications: () => Promise<void>;
  saveNotifications: () => Promise<void>;
  cleanupOldNotifications: () => Promise<void>;
  getNotificationStats: () => {
    total: number;
    unread: number;
    pending: number;
    byType: Record<string, number>;
    byPriority: Record<string, number>;
  };
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    emotionalNotifications: true,
    systemNotifications: true,
    initiativeNotifications: true,
    reminderNotifications: true,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    },
    soundEnabled: true,
    vibrationEnabled: true,
    priorityFilter: 'all'
  });

  const scheduledNotificationsRef = useRef<Map<string, any>>(new Map());

  // Konfiguracja Expo Notifications
  useEffect(() => {
    const configureNotifications = async () => {
      try {
        // Poproś o uprawnienia
        const { status } = await Notifications.requestPermissionsAsync();
        
        if (status !== 'granted') {
          console.log('❌ Brak uprawnień do powiadomień');
          return;
        }

        // Ustaw konfigurację
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: settings.soundEnabled,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });

        console.log('✅ Powiadomienia skonfigurowane');
      } catch (error) {
        console.error('❌ Błąd konfiguracji powiadomień:', error);
      }
    };

    configureNotifications();
  }, [settings.soundEnabled]);

  // Tworzenie powiadomienia (funkcja 170)
  const createNotification = async (notification: Omit<NotificationItem, 'id' | 'timestamp' | 'isRead' | 'isDismissed'>): Promise<string> => {
    try {
      if (!settings.enabled) {
        console.log('🔕 Powiadomienia wyłączone');
        return '';
      }

      // Sprawdź ciche godziny
      if (settings.quietHours.enabled && isInQuietHours()) {
        console.log('🔕 Ciche godziny - powiadomienie odroczone');
        return '';
      }

      const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      const newNotification: NotificationItem = {
        ...notification,
        id,
        timestamp: new Date(),
        isRead: false,
        isDismissed: false
      };

      // Dodaj do lokalnej listy
      setNotifications(prev => [newNotification, ...prev]);

      // Wyślij powiadomienie systemowe
      if (Platform.OS !== 'web') {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: newNotification.title,
            body: newNotification.body,
            data: {
              id: newNotification.id,
              type: newNotification.type,
              priority: newNotification.priority,
              emotionalContext: newNotification.emotionalContext,
              actionRequired: newNotification.actionRequired,
              actionType: newNotification.actionType,
              metadata: newNotification.metadata
            },
          },
          trigger: null, // Natychmiastowe
        });
      }

      // Zapisz do pliku
      await saveNotifications();

      console.log('📢 Powiadomienie utworzone:', newNotification.title);
      return id;
    } catch (error) {
      console.error('❌ Błąd tworzenia powiadomienia:', error);
      return '';
    }
  };

  // Planowanie powiadomienia
  const scheduleNotification = async (notification: Omit<NotificationItem, 'id' | 'timestamp' | 'isRead' | 'isDismissed'>, delayMs: number): Promise<string> => {
    try {
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      const scheduledFor = new Date(Date.now() + delayMs);
      
      const newNotification: NotificationItem = {
        ...notification,
        id,
        timestamp: new Date(),
        scheduledFor,
        isRead: false,
        isDismissed: false
      };

      // Dodaj do lokalnej listy
      setNotifications(prev => [newNotification, ...prev]);

      // Zaplanuj powiadomienie systemowe
      if (Platform.OS !== 'web') {
        const timeoutId = setTimeout(async () => {
          if (settings.enabled && !isInQuietHours()) {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: newNotification.title,
                body: newNotification.body,
                data: {
                  id: newNotification.id,
                  type: newNotification.type,
                  priority: newNotification.priority,
                  emotionalContext: newNotification.emotionalContext,
                  actionRequired: newNotification.actionRequired,
                  actionType: newNotification.actionType,
                  metadata: newNotification.metadata
                },
              },
              trigger: null,
            });
          }
          scheduledNotificationsRef.current.delete(id);
        }, delayMs);

        scheduledNotificationsRef.current.set(id, timeoutId);
      }

      // Zapisz do pliku
      await saveNotifications();

      console.log('⏰ Powiadomienie zaplanowane:', newNotification.title);
      return id;
    } catch (error) {
      console.error('❌ Błąd planowania powiadomienia:', error);
      return '';
    }
  };

  // Oznaczenie jako przeczytane
  const markAsRead = async (id: string): Promise<void> => {
    try {
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, isRead: true }
            : notification
        )
      );

      await saveNotifications();
      console.log('✅ Powiadomienie oznaczone jako przeczytane:', id);
    } catch (error) {
      console.error('❌ Błąd oznaczania jako przeczytane:', error);
    }
  };

  // Odrzucenie powiadomienia
  const dismissNotification = async (id: string): Promise<void> => {
    try {
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, isDismissed: true }
            : notification
        )
      );

      // Anuluj zaplanowane powiadomienie
      const timeoutId = scheduledNotificationsRef.current.get(id);
      if (timeoutId) {
        clearTimeout(timeoutId);
        scheduledNotificationsRef.current.delete(id);
      }

      await saveNotifications();
      console.log('❌ Powiadomienie odrzucone:', id);
    } catch (error) {
      console.error('❌ Błąd odrzucania powiadomienia:', error);
    }
  };

  // Czyszczenie wszystkich powiadomień
  const clearAllNotifications = async (): Promise<void> => {
    try {
      setNotifications([]);

      // Anuluj wszystkie zaplanowane powiadomienia
      scheduledNotificationsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
      scheduledNotificationsRef.current.clear();

      // Wyczyść powiadomienia systemowe
      if (Platform.OS !== 'web') {
        await Notifications.dismissAllNotificationsAsync();
        await Notifications.cancelAllScheduledNotificationsAsync();
      }

      await saveNotifications();
      console.log('🗑️ Wszystkie powiadomienia wyczyszczone');
    } catch (error) {
      console.error('❌ Błąd czyszczenia powiadomień:', error);
    }
  };

  // Tworzenie powiadomienia emocjonalnego
  const createEmotionalNotification = async (emotion: string, intensity: number, message: string, trigger?: string): Promise<string> => {
    if (!settings.emotionalNotifications) return '';

    const priority = intensity > 70 ? 'high' : intensity > 40 ? 'normal' : 'low';
    
    return await createNotification({
      title: `Wera - ${emotion}`,
      body: message,
      type: 'emotional',
      priority,
      emotionalContext: {
        emotion,
        intensity,
        trigger
      },
      actionRequired: intensity > 60,
      actionType: intensity > 60 ? 'response' : 'acknowledge'
    });
  };

  // Tworzenie powiadomienia inicjatywy
  const createInitiativeNotification = async (message: string, requiresResponse: boolean = false): Promise<string> => {
    if (!settings.initiativeNotifications) return '';

    return await createNotification({
      title: 'Wera ma inicjatywę',
      body: message,
      type: 'initiative',
      priority: requiresResponse ? 'high' : 'normal',
      actionRequired: requiresResponse,
      actionType: requiresResponse ? 'response' : 'acknowledge'
    });
  };

  // Tworzenie powiadomienia systemowego
  const createSystemNotification = async (title: string, message: string, priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'): Promise<string> => {
    if (!settings.systemNotifications) return '';

    return await createNotification({
      title,
      body: message,
      type: 'system',
      priority,
      actionRequired: priority === 'urgent',
      actionType: priority === 'urgent' ? 'acknowledge' : 'dismiss'
    });
  };

  // Tworzenie powiadomienia przypomnienia
  const createReminderNotification = async (title: string, message: string, scheduledFor: Date): Promise<string> => {
    if (!settings.reminderNotifications) return '';

    const delayMs = scheduledFor.getTime() - Date.now();
    if (delayMs <= 0) {
      return await createNotification({
        title,
        body: message,
        type: 'reminder',
        priority: 'normal',
        actionRequired: false,
        actionType: 'dismiss'
      });
    }

    return await scheduleNotification({
      title,
      body: message,
      type: 'reminder',
      priority: 'normal',
      actionRequired: false,
      actionType: 'dismiss'
    }, delayMs);
  };

  // Aktualizacja ustawień
  const updateSettings = async (newSettings: Partial<NotificationSettings>): Promise<void> => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      
      await SecureStore.setItemAsync('notification_settings', JSON.stringify(updatedSettings));
      console.log('⚙️ Ustawienia powiadomień zaktualizowane');
    } catch (error) {
      console.error('❌ Błąd aktualizacji ustawień:', error);
    }
  };

  // Przełączanie powiadomień
  const toggleNotifications = async (): Promise<void> => {
    await updateSettings({ enabled: !settings.enabled });
  };

  // Sprawdzenie cichych godzin
  const isInQuietHours = (): boolean => {
    if (!settings.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMinute] = settings.quietHours.start.split(':').map(Number);
    const [endHour, endMinute] = settings.quietHours.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;
    
    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Przechodzi przez północ
      return currentTime >= startTime || currentTime <= endTime;
    }
  };

  // Ładowanie powiadomień
  const loadNotifications = async (): Promise<void> => {
    try {
      const notificationsPath = FileSystem.documentDirectory + 'notifications.json';
      const fileInfo = await FileSystem.getInfoAsync(notificationsPath);
      
      if (fileInfo.exists) {
        const content = await FileSystem.readAsStringAsync(notificationsPath);
        const loadedNotifications = JSON.parse(content);
        
        // Konwertuj stringi dat z powrotem na obiekty Date
        const parsedNotifications = loadedNotifications.map((notification: any) => ({
          ...notification,
          timestamp: new Date(notification.timestamp),
          scheduledFor: notification.scheduledFor ? new Date(notification.scheduledFor) : undefined
        }));
        
        setNotifications(parsedNotifications);
        console.log('📥 Powiadomienia załadowane:', parsedNotifications.length);
      }
    } catch (error) {
      console.error('❌ Błąd ładowania powiadomień:', error);
    }
  };

  // Zapisywanie powiadomień
  const saveNotifications = async (): Promise<void> => {
    try {
      const notificationsPath = FileSystem.documentDirectory + 'notifications.json';
      await FileSystem.writeAsStringAsync(notificationsPath, JSON.stringify(notifications, null, 2));
    } catch (error) {
      console.error('❌ Błąd zapisywania powiadomień:', error);
    }
  };

  // Czyszczenie starych powiadomień
  const cleanupOldNotifications = async (): Promise<void> => {
    try {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      setNotifications(prev => 
        prev.filter(notification => 
          notification.timestamp > oneWeekAgo || notification.actionRequired
        )
      );

      await saveNotifications();
      console.log('🧹 Stare powiadomienia wyczyszczone');
    } catch (error) {
      console.error('❌ Błąd czyszczenia starych powiadomień:', error);
    }
  };

  // Statystyki powiadomień
  const getNotificationStats = () => {
    const stats = {
      total: notifications.length,
      unread: notifications.filter(n => !n.isRead).length,
      pending: notifications.filter(n => n.actionRequired && !n.isDismissed).length,
      byType: {} as Record<string, number>,
      byPriority: {} as Record<string, number>
    };

    // Liczby według typu
    notifications.forEach(notification => {
      stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;
      stats.byPriority[notification.priority] = (stats.byPriority[notification.priority] || 0) + 1;
    });

    return stats;
  };

  // Obliczanie liczby nieprzeczytanych
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const pendingCount = notifications.filter(n => n.actionRequired && !n.isDismissed).length;

  // Inicjalizacja
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        console.log('🚀 Inicjalizacja NotificationEngine...');
        
        // Załaduj ustawienia
        const savedSettings = await SecureStore.getItemAsync('notification_settings');
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        }
        
        // Załaduj powiadomienia
        await loadNotifications();
        
        // Wyczyść stare powiadomienia
        await cleanupOldNotifications();
        
        console.log('✅ NotificationEngine zainicjalizowany');
      } catch (error) {
        console.error('❌ Błąd inicjalizacji NotificationEngine:', error);
      }
    };

    initializeNotifications();
  }, []);

  // Czyszczenie przy odmontowaniu
  useEffect(() => {
    return () => {
      scheduledNotificationsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
    };
  }, []);

  const contextValue: NotificationContextType = {
    notifications,
    settings,
    unreadCount,
    pendingCount,
    createNotification,
    scheduleNotification,
    markAsRead,
    dismissNotification,
    clearAllNotifications,
    createEmotionalNotification,
    createInitiativeNotification,
    createSystemNotification,
    createReminderNotification,
    updateSettings,
    toggleNotifications,
    loadNotifications,
    saveNotifications,
    cleanupOldNotifications,
    getNotificationStats
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}; 