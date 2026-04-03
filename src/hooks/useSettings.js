import { useState } from 'react';
import { STORAGE_KEYS } from '../utils/storageManager';

export const DEFAULT_SETTINGS = {
  theme: 'dark',
  notifications: true,
  shareLocation: true,
  visibility: 'online',
  photoPrivacy: 'public',
};

/**
 * Hook for persisting user settings to localStorage.
 * Returns the current settings object and a setter that updates both state and localStorage.
 *
 * @returns {[object, Function]} [settings, setSettings]
 */
export function useSettings() {
  const [settings, setSettingsState] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER_SETTINGS);
      return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const setSettings = (value) => {
    try {
      const next = value instanceof Function ? value(settings) : value;
      setSettingsState(next);
      localStorage.setItem(STORAGE_KEYS.USER_SETTINGS, JSON.stringify(next));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  return [settings, setSettings];
}
