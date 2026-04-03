export const STORAGE_KEYS = {
  USER_PROFILE: 'pulse_user_profile',
  APP_STATE: 'pulse_app_state',
  ACTIVE_POD: 'pulse_active_pod',
  PODS_HISTORY: 'pulse_pods_history',
  EXCHANGES: 'pulse_exchanges',
  STORAGE_VERSION: 'pulse_storage_version',
  USER_PHOTOS: 'pulse_user_photos',
  USER_SETTINGS: 'pulse_user_settings',
  CHAT_END_TIME: 'pulse_chat_end_time',
  MISSED_CONNECTIONS: 'pulse_missed_connections',
};

const CURRENT_VERSION = '1.0.0';

/**
 * Utility helpers for reading, writing, and clearing Pulse's localStorage data.
 */
export const storageManager = {
  /** Return all stored data as a single object. Returns null on parse errors. */
  getAllData: () => {
    try {
      return {
        userProfile: JSON.parse(
          localStorage.getItem(STORAGE_KEYS.USER_PROFILE) || 'null'
        ),
        appState: JSON.parse(
          localStorage.getItem(STORAGE_KEYS.APP_STATE) || 'null'
        ),
        activePod: JSON.parse(
          localStorage.getItem(STORAGE_KEYS.ACTIVE_POD) || 'null'
        ),
        podsHistory: JSON.parse(
          localStorage.getItem(STORAGE_KEYS.PODS_HISTORY) || '[]'
        ),
        exchanges: JSON.parse(
          localStorage.getItem(STORAGE_KEYS.EXCHANGES) || '[]'
        ),
        userPhotos: JSON.parse(
          localStorage.getItem(STORAGE_KEYS.USER_PHOTOS) || '[]'
        ),
        userSettings: JSON.parse(
          localStorage.getItem(STORAGE_KEYS.USER_SETTINGS) || '{}'
        ),
      };
    } catch (error) {
      console.error('Error reading storage:', error);
      return null;
    }
  },

  /** Remove all Pulse data from localStorage (preserves version key). */
  clearAllData: () => {
    try {
      Object.entries(STORAGE_KEYS).forEach(([, key]) => {
        if (key !== STORAGE_KEYS.STORAGE_VERSION) {
          localStorage.removeItem(key);
        }
      });
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  },

  /** Returns true if a completed user profile is stored. */
  hasCompletedProfile: () => {
    try {
      const profile = JSON.parse(
        localStorage.getItem(STORAGE_KEYS.USER_PROFILE) || 'null'
      );
      return !!(profile && profile.username && profile.phone);
    } catch {
      return false;
    }
  },

  /** Run any necessary data migrations and stamp the current version. */
  migrateData: () => {
    const version = localStorage.getItem(STORAGE_KEYS.STORAGE_VERSION);
    if (version !== CURRENT_VERSION) {
      // Future migration logic goes here.
      localStorage.setItem(STORAGE_KEYS.STORAGE_VERSION, CURRENT_VERSION);
    }
  },
};
