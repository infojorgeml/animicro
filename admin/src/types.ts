export interface ModuleConfig {
  duration: number;
  easing: string;
  delay: number;
  margin: string;
  distance?: number;
}

export interface AnimicroSettings {
  active_modules: string[];
  available_modules: string[];
  active_builders: string[];
  module_settings: Record<string, ModuleConfig>;
}

export interface AnimicroData {
  restUrl: string;
  nonce: string;
  settings: AnimicroSettings;
  version: string;
  builders: Record<string, string>;
  isPremium: boolean;
  licenseKey: string;
  page?: string;
}

declare global {
  interface Window {
    animicroData: AnimicroData;
  }
}
