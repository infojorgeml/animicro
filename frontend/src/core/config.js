/**
 * Reads data-* attributes from an element and merges with per-module settings,
 * falling back to hardcoded defaults. Per-element data-* always win.
 *
 * @param {HTMLElement} el       - The DOM element.
 * @param {string}      moduleId - The module id (e.g. 'fade'), used to look up
 *                                 module-specific defaults from animicroFrontData.
 */

const globals = window.animicroFrontData || {};

export function getElementConfig(el, moduleId = '') {
  const d    = el.dataset;
  const mod  = (globals.moduleSettings && moduleId) ? (globals.moduleSettings[moduleId] || {}) : {};

  return {
    duration:  d.duration  !== undefined ? parseFloat(d.duration)  : (mod.duration  ?? 0.6),
    delay:     d.delay     !== undefined ? parseFloat(d.delay)     : (mod.delay     ?? 0),
    easing:    d.easing    || mod.easing  || 'ease-out',
    distance:  d.distance  !== undefined ? parseFloat(d.distance)  : 30,
    margin:    d.margin    || mod.margin  || '-50px 0px',
  };
}
