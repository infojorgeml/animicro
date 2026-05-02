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
  page?: string;
  proPlugin: boolean;
  upgradeUrl: string;
}

/**
 * Shape returned by GET /animicro/v1/license/status.
 *
 * `state` is the canonical UI flag for the LicensePage component:
 *  - `dev`               — running on localhost / *.local / *.test, Pro is
 *                          unlocked locally without contacting the server.
 *  - `pending_reconnect` — legacy v1.11.x license_key found, user must
 *                          re-do the Connect flow.
 *  - `connected`         — connection_id + secret stored, validation OK.
 *  - `disconnected`      — fresh install or after an explicit Disconnect.
 */
export interface LicenseStatus {
  state: 'dev' | 'pending_reconnect' | 'connected' | 'disconnected';
  is_premium: boolean;
  is_dev: boolean;
  pending_reconnect: boolean;
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

declare global {
  interface Window {
    animicroData: AnimicroData;
  }
}
