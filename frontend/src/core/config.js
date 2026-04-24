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
    easing:       d.amEasing    || mod.easing  || 'ease-out',
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
