/**
 * Animicro Frontend Entry Point
 *
 * Reads global settings from animicroFrontData (localized by PHP)
 * and dynamically loads only the active animation modules.
 */

import './style.css';
import { loadModules } from './core/registry.js';

const config = window.animicroFrontData || {};

function init() {
  const modules = config.modules || [];
  if (!modules.length) return;
  loadModules(modules);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
