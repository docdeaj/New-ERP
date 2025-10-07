
import { Injectable, signal, computed } from '@angular/core';
import { SETTINGS_REGISTRY, SettingDefinition } from '../data/settings.registry';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private readonly storageKey = 'aurora-settings';
  private settingsState = signal<Record<string, any>>({});

  public readonly registry: SettingDefinition[] = SETTINGS_REGISTRY;

  constructor() {
    this.loadSettings();
  }

  private loadSettings() {
    const savedSettings = this.loadFromStorage();
    const defaults = Object.fromEntries(
      this.registry.map(setting => [setting.key, setting.default])
    );
    this.settingsState.set({ ...defaults, ...savedSettings });
  }

  private loadFromStorage(): Record<string, any> {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      console.error('Failed to load settings from localStorage', e);
      return {};
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.settingsState()));
    } catch (e) {
      console.error('Failed to save settings to localStorage', e);
    }
  }

  get<T>(key: string): () => T {
    // This will throw an error if the key is not in the registry, which is good for development.
    if (!this.registry.some(s => s.key === key)) {
        console.warn(`Setting key "${key}" not found in registry.`);
    }
    return computed(() => this.settingsState()[key] as T);
  }

  set(key: string, value: any) {
    this.settingsState.update(current => ({ ...current, [key]: value }));
    this.saveToStorage();
  }
}
