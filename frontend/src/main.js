/**
 * Animicro Frontend Entry Point
 *
 * Loads active animation modules on the real frontend.
 * Detects builder editors via URL param (?bricks=run) to skip animations.
 */

import './style.css';
import { loadModules } from './core/registry.js';

const config = window.animicroFrontData || {};

function isInBuilder() {
  if (window.location.search.includes('bricks=run')) return true;
  return false;
}

function init() {
  if (isInBuilder()) return;
  const modules = config.modules || [];
  if (!modules.length) return;
  loadModules(modules);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
