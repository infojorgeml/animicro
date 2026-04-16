export interface ModuleConfig {
  duration: number;
  easing: string;
  delay: number;
  margin: string;
  distance?: number;
  scale?: number;
  typingSpeed?: number;
  highlightColor?: string;
  highlightDirection?: string;
}

export interface AdvancedConfig {
  reducedMotion: boolean;
  debugMode: boolean;
}

export interface AnimicroSettings {
  active_modules: string[];
  available_modules: string[];
  active_builders: string[];
  module_settings: Record<string, ModuleConfig>;
  advanced: AdvancedConfig;
}

export interface AnimicroData {
  restUrl: string;
  nonce: string;
  settings: AnimicroSettings;
  version: string;
  builders: Record<string, string>;
  upgradeUrl: string;
}

declare global {
  interface Window {
    animicroData: AnimicroData;
  }
}
