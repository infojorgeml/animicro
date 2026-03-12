/**
 * Reads data-am-* attributes from an element and merges with per-module settings,
 * falling back to hardcoded defaults. Per-element data-am-* always win.
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
    duration:  d.amDuration  !== undefined ? parseFloat(d.amDuration)  : (mod.duration  ?? 0.6),
    delay:     d.amDelay     !== undefined ? parseFloat(d.amDelay)     : (mod.delay     ?? 0),
    easing:    d.amEasing    || mod.easing  || 'ease-out',
    distance:  d.amDistance  !== undefined ? parseFloat(d.amDistance)  : (mod.distance  ?? 30),
    margin:    d.amMargin    || mod.margin  || '-50px 0px',
  };
}
