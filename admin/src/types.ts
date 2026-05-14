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
  page?: string;
  proPlugin: boolean;
  upgradeUrl: string;
}

/**
 * Shape returned by GET /animicro/v1/license/status.
 *
 * `state` is the canonical UI flag for the LicensePage component:
 *  - `dev`          — running on localhost / *.local / *.test, Pro is
 *                     unlocked locally without contacting the server.
 *  - `connected`    — connection_id + secret stored, validation OK.
 *  - `disconnected` — fresh install or after an explicit Disconnect.
 */
export interface LicenseStatus {
  state: 'dev' | 'connected' | 'disconnected';
  is_premium: boolean;
  is_dev: boolean;
  has_connection: boolean;
  connection_id: string;
  // From LicenSuite v4, plan is an object with display metadata. The PHP
  // layer normalizes any shape (legacy strings included) to this canonical
  // object before it reaches the UI. The React code is also defensive
  // against unknown shapes via the formatPlanLabel() helper.
  plan: { slug: string; name: string; max_sites: number | null } | string | null;
  expires_at: string | null;
  sites: { used: number; max: number | null; unlimited: boolean } | null;
  connect_error: { reason: string; message: string } | null;
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
