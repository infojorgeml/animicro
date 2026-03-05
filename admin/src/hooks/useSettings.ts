import { useState, useCallback, useRef } from 'react';
import type { AnimicroSettings, ModuleConfig } from '../types';

interface UseSettingsReturn {
  settings: AnimicroSettings;
  updateSettings: (partial: Partial<AnimicroSettings>) => void;
  updateModuleSettings: (moduleId: string, partial: Partial<ModuleConfig>) => void;
  toggleModule: (moduleId: string) => void;
  save: () => Promise<boolean>;
  isDirty: boolean;
  isSaving: boolean;
  saveMessage: string;
}

export function useSettings(): UseSettingsReturn {
  const initial = useRef(window.animicroData.settings);
  const [settings, setSettings] = useState<AnimicroSettings>(initial.current);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const updateSettings = useCallback((partial: Partial<AnimicroSettings>) => {
    setSettings(prev => ({ ...prev, ...partial }));
    setIsDirty(true);
    setSaveMessage('');
  }, []);

  const updateModuleSettings = useCallback((moduleId: string, partial: Partial<ModuleConfig>) => {
    setSettings(prev => ({
      ...prev,
      module_settings: {
        ...prev.module_settings,
        [moduleId]: {
          ...prev.module_settings[moduleId],
          ...partial,
        },
      },
    }));
    setIsDirty(true);
    setSaveMessage('');
  }, []);

  const toggleModule = useCallback((moduleId: string) => {
    setSettings(prev => {
      const active = prev.active_modules.includes(moduleId)
        ? prev.active_modules.filter(m => m !== moduleId)
        : [...prev.active_modules, moduleId];
      return { ...prev, active_modules: active };
    });
    setIsDirty(true);
    setSaveMessage('');
  }, []);

  const save = useCallback(async (): Promise<boolean> => {
    setIsSaving(true);
    setSaveMessage('');

    try {
      const { restUrl, nonce } = window.animicroData;
      const res = await fetch(`${restUrl}settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': nonce,
        },
        body: JSON.stringify({
          active_modules:  settings.active_modules,
          active_builder:  settings.active_builder,
          module_settings: settings.module_settings,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const saved = await res.json();
      setSettings(prev => ({ ...prev, ...saved }));
      initial.current = { ...initial.current, ...saved };
      setIsDirty(false);
      setSaveMessage('Saved');
      setTimeout(() => setSaveMessage(''), 2500);
      return true;
    } catch {
      setSaveMessage('Error saving');
      setTimeout(() => setSaveMessage(''), 3000);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [settings]);

  return { settings, updateSettings, updateModuleSettings, toggleModule, save, isDirty, isSaving, saveMessage };
}
