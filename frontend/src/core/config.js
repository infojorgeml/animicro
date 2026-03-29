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
