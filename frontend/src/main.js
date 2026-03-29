/**
 * Animicro Frontend Entry Point
 *
 * Loads active animation modules on the real frontend.
 * Detects builder editors via URL params to skip animations inside editors.
 */

import './style.css';
import { loadModules } from './core/registry.js';

const config = window.animicroFrontData || {};

function isInBuilder() {
  const s = window.location.search;
  if (s.includes('bricks=run')) return true;
  if (s.includes('breakdance=builder')) return true;
  if (s.includes('elementor-preview')) return true;
  if (s.includes('ct_builder=true')) return true;
  if (s.includes('et_fb=1')) return true;
  return false;
}

function init() {
  if (isInBuilder()) return;

  if (config.smoothScroll) {
    import('./smooth-scroll.js').then(m => m.init(config.smoothScroll));
  }

  const modules = config.modules || [];
  if (!modules.length) return;
  loadModules(modules);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
