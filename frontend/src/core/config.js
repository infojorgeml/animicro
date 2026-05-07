/**
 * Reads data-am-* attributes from an element and merges with per-module settings,
 * falling back to hardcoded defaults. Per-element data-am-* always win.
 *
 * @param {HTMLElement} el       - The DOM element.
 * @param {string}      moduleId - The module id (e.g. 'fade'), used to look up
 *                                 module-specific defaults from animicroFrontData.
 */

const globals = window.animicroFrontData || {};

function safeFloat(raw, fallback) {
  if (raw === undefined) return fallback;
  const v = parseFloat(raw);
  return isNaN(v) ? fallback : v;
}

function safeInt(raw, fallback) {
  if (raw === undefined) return fallback;
  const v = parseInt(raw, 10);
  return isNaN(v) ? fallback : v;
}

/**
 * Translate user-facing easing strings (CSS-style, camelCase, or
 * `cubic-bezier(...)`) into the values Motion's `animate()` actually
 * accepts.
 *
 * Why this exists: from v1 we shipped CSS-style easing strings
 * (`'ease-out'`, `'ease-in-out'`, `'cubic-bezier(...)'`) all the way
 * to Motion's `animate()` call. Motion's API expects camelCase
 * (`'easeOut'`, `'easeInOut'`) or a `[a, b, c, d]` BezierDefinition
 * array. CSS-style strings were silently ignored and the animation
 * fell back to Motion's default ease, regardless of what the admin
 * user picked. See CHANGELOG 1.12.7 for the full bug story.
 *
 * Motion accepts:
 *   - `'linear'`, `'ease'`, `'easeIn'`, `'easeOut'`, `'easeInOut'`
 *   - `'circIn'`, `'circOut'`, `'circInOut'`
 *   - `'backIn'`, `'backOut'`, `'backInOut'`
 *   - `'anticipate'`
 *   - `[number, number, number, number]` (BezierDefinition)
 *
 * Anything unrecognised falls back to `'easeOut'` — the default we
 * always intended.
 *
 * @param {string} input CSS easing string, camelCase name, or cubic-bezier(...).
 * @returns {string|number[]} Motion-compatible easing value.
 */
export function parseEasing(input) {
  if (typeof input !== 'string' || input.length === 0) return 'easeOut';

  const trimmed = input.trim();
  const lower   = trimmed.toLowerCase();

  // Direct map: CSS-style with hyphens + case-insensitive camelCase.
  const aliases = {
    'linear':       'linear',
    'ease':         'ease',
    // CSS-style hyphenated forms
    'ease-in':      'easeIn',
    'ease-out':     'easeOut',
    'ease-in-out':  'easeInOut',
    'circ-in':      'circIn',
    'circ-out':     'circOut',
    'circ-in-out':  'circInOut',
    'back-in':      'backIn',
    'back-out':     'backOut',
    'back-in-out':  'backInOut',
    // camelCase / no-hyphen forms (case-insensitive matching above)
    'easein':       'easeIn',
    'easeout':      'easeOut',
    'easeinout':    'easeInOut',
    'circin':       'circIn',
    'circout':      'circOut',
    'circinout':    'circInOut',
    'backin':       'backIn',
    'backout':      'backOut',
    'backinout':    'backInOut',
    'anticipate':   'anticipate',
  };
  if (aliases[lower] !== undefined) return aliases[lower];

  // cubic-bezier(a, b, c, d)  →  [a, b, c, d]
  const m = trimmed.match(
    /^cubic-bezier\s*\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)$/i,
  );
  if (m) {
    const arr = [
      parseFloat(m[1]), parseFloat(m[2]),
      parseFloat(m[3]), parseFloat(m[4]),
    ];
    if (arr.every(Number.isFinite)) return arr;
  }

  return 'easeOut';
}

/**
 * Reads loop-related `data-am-*` attributes and returns Motion One-compatible
 * options ({ repeat, repeatType, repeatDelay }). Returns an empty object when
 * loop is disabled, so callers can spread it unconditionally:
 *
 *   animate(el, kf, { duration, delay, easing, ...getLoopOptions(el) });
 *
 * Recognised attributes:
 *   - `data-am-loop`       "true" | "false" (default: false)
 *   - `data-am-loop-mode`  "pingpong" | "restart" (default: "pingpong")
 *   - `data-am-loop-delay` seconds, clamped to [0, 10] (default: 0)
 */
export function getLoopOptions(el) {
  const d = el.dataset;
  const raw = d.amLoop;
  if (raw === undefined || raw === null || raw === '') return {};
  const s = String(raw).toLowerCase().trim();
  if (s !== 'true' && s !== '1' && s !== 'yes' && s !== 'on') return {};

  const mode = (d.amLoopMode || 'pingpong').toLowerCase();
  // Motion One: 'loop' = restart, 'reverse' = pingpong, 'mirror' = pingpong with reversed easing.
  const repeatType = mode === 'restart' ? 'loop' : 'reverse';

  let repeatDelay = parseFloat(d.amLoopDelay);
  if (!Number.isFinite(repeatDelay) || repeatDelay < 0) repeatDelay = 0;
  if (repeatDelay > 10) repeatDelay = 10;

  return { repeat: Infinity, repeatType, repeatDelay };
}

export function getElementConfig(el, moduleId = '') {
  const d    = el.dataset;
  const mod  = (globals.moduleSettings && moduleId) ? (globals.moduleSettings[moduleId] || {}) : {};

  return {
    duration:     safeFloat(d.amDuration,    mod.duration     ?? 0.6),
    delay:        safeFloat(d.amDelay,       mod.delay        ?? 0),
    easing:       parseEasing( d.amEasing || mod.easing || 'easeOut' ),
    distance:     safeFloat(d.amDistance,     mod.distance     ?? 30),
    scale:        safeFloat(d.amScale,       mod.scale        ?? 0.95),
    blur:         safeFloat(d.amBlur,        mod.blur         ?? 4),
    staggerDelay: safeFloat(d.amStagger,     mod.staggerDelay ?? 0.05),
    typingSpeed:  safeFloat(d.amTypingSpeed, mod.typingSpeed  ?? 0.06),
    speed:        safeFloat(d.amSpeed,       mod.speed        ?? 0.5),
    origin:            d.amOrigin             || mod.origin             || 'center',
    highlightColor:     d.amHighlightColor     || mod.highlightColor     || '#fde68a',
    highlightDirection: d.amHighlightDirection  || mod.highlightDirection || 'left',
    colorBase:    d.amColorBase  || mod.colorBase  || '#cccccc',
    colorFill:    d.amColorFill  || mod.colorFill  || '#000000',
    scrollStart:  safeInt(d.amScrollStart,   mod.scrollStart  ?? 62),
    scrollEnd:    safeInt(d.amScrollEnd,     mod.scrollEnd    ?? 60),
    margin:       d.amMargin    || mod.margin  || '-50px 0px',
  };
}
