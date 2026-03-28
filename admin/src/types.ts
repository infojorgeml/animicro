export interface ModuleConfig {
  duration: number;
  easing: string;
  delay: number;
  margin: string;
  distance?: number;
  scale?: number;
  blur?: number;
  staggerDelay?: number;
  typingSpeed?: number;
  speed?: number;
  origin?: string;
  highlightColor?: string;
  highlightDirection?: string;
  colorBase?: string;
  colorFill?: string;
  scrollStart?: number;
  scrollEnd?: number;
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
