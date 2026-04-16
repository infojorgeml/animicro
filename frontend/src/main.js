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

  const adv = config.advanced || {};

  if (adv.reducedMotion && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const modules = config.modules || [];
  if (!modules.length) return;

  if (adv.debugMode) console.time('animicro');

  loadModules(modules);

  if (adv.debugMode) {
    console.timeEnd('animicro');
    requestAnimationFrame(() => {
      document.querySelectorAll('[class*="am-"]').forEach(el => {
        el.style.outline = '2px dashed red';
      });
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
