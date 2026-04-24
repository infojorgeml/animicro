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
  backSpeed?: number;
  backDelay?: number;
  loop?: boolean;
  shuffle?: boolean;
  cursorChar?: string;
  cursorPersist?: boolean;
  speed?: number;
  origin?: string;
  highlightColor?: string;
  highlightDirection?: string;
  colorBase?: string;
  colorFill?: string;
  scrollStart?: number;
  scrollEnd?: number;
  amplitude?: number;
  scaleMax?: number;
  skew?: number;
}

export interface SmoothScrollConfig {
  enabled: boolean;
  lerp: number;
  duration: number;
  smoothWheel: boolean;
  wheelMultiplier: number;
  anchors: boolean;
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
  smooth_scroll: SmoothScrollConfig;
  advanced: AdvancedConfig;
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
  proPlugin: boolean;
  upgradeUrl: string;
}

declare global {
  interface Window {
    animicroData: AnimicroData;
  }
}
