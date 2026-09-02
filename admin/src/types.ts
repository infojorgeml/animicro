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
  zoomScale?: number;
  direction?: string;
  bgColor?: string;
  logoUrl?: string;
  strength?: number;
  smoothness?: number;
  axis?: string;
  radius?: number;
  rotateMax?: number;
  scrambleSpeed?: number;
  spinSpeed?: number;
  spinDirection?: string;
  scrollBoost?: number;
  shape?: string;
  range?: number;
  size?: number;
  color?: string;
  hoverSize?: number;
  hoverColor?: string;
  hoverOpacity?: number;
  hoverBlur?: number;
  angle?: number;
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
  module_settings: Record<string, ModuleConfig>;
  smooth_scroll: SmoothScrollConfig;
  advanced: AdvancedConfig;
}

export interface AnimicroData {
  restUrl: string;
  nonce: string;
  settings: AnimicroSettings;
  version: string;
  isPremium: boolean;
  proPlugin: boolean;
  upgradeUrl: string;
}

/**
 * Minimal typing for the slice of `window.wp.media` we touch from the
 * PageTransitions Logo URL picker. The full surface is far larger
 * (Backbone-based, models, collections, frame events) — we only narrow
 * down to what we actually call, so TypeScript stops at "the field
 * exists" rather than imposing a Backbone dependency on this project.
 */
interface WPMediaFrame {
  on(event: 'select' | 'close', callback: () => void): void;
  open(): void;
  state(): {
    get(name: 'selection'): {
      first(): {
        toJSON(): { id: number; url: string; alt?: string; title?: string; mime?: string };
      };
    };
  };
}

interface WPMediaOptions {
  title?: string;
  button?: { text?: string };
  library?: { type?: string };
  multiple?: boolean;
}

declare global {
  interface Window {
    animicroData: AnimicroData;
    wp?: {
      media?: ((options?: WPMediaOptions) => WPMediaFrame) & Record<string, unknown>;
    };
  }
}
