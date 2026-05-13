import { animate, inView } from 'motion';
import { getElementConfig } from '../core/config.js';

/**
 * Scatter Text — characters or words fly in from random offset positions
 * (translate ± radius on both axes, rotate ± rotateMax degrees) and
 * converge to their final position when the element enters the viewport.
 *
 * Visual goal: "letters flying that snap into order on arrival".
 *
 * Variants:
 *   .am-scatter-chars — split into characters (one span per glyph)
 *   .am-scatter-words — split into words (one span per word)
 *
 * Per-element data-am-* attributes routed through getElementConfig:
 *   duration, easing, delay, stagger (data-am-stagger), margin (inView)
 *
 * Module-level settings from the admin panel (NOT per-element overridable
 * by design — keeps the API utility-first; one class, global config):
 *   radius     50..500 px, default 200
 *   rotateMax  0..90 deg, default 45 (0 disables rotation entirely)
 *
 * Why a manual per-span animate() loop instead of split-text.js's
 * single animate(spans, ...) + Motion stagger(): split-text uses the
 * SAME keyframes for every span, so one collective call works. Scatter
 * needs DIFFERENT initial values per span (random x/y/rotate) so we
 * have to loop. The per-span delay (`i * staggerDelay`) is computed
 * manually to keep the cascade.
 *
 * Reduced motion + builder editors: handled upstream by main.js — this
 * init() never runs in either scenario.
 */

const globals = window.animicroFrontData || {};

function safeFloat(raw, fallback) {
  if (raw === undefined || raw === null || raw === '') return fallback;
  const v = parseFloat(raw);
  return Number.isFinite(v) ? v : fallback;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * Identical algorithm to split-text.js::splitIntoSpans, replicated here
 * rather than extracted to a shared helper to keep the module
 * self-contained. The two could be merged into core/split-helpers.js if
 * a third "split-like" module ever shows up.
 */
function splitIntoSpans(el, mode) {
  const text = el.textContent;
  el.setAttribute('aria-label', text);
  el.innerHTML = '';

  const units = mode === 'words' ? text.split(/(\s+)/) : [...text];

  units.forEach((unit) => {
    if (/^\s+$/.test(unit)) {
      el.appendChild(document.createTextNode(unit));
      return;
    }

    const span = document.createElement('span');
    span.textContent = unit;
    span.style.display = 'inline-block';
    span.style.opacity = '0';
    span.setAttribute('aria-hidden', 'true');
    el.appendChild(span);
  });

  el.classList.add('is-ready');

  return el.querySelectorAll('span');
}

export function init() {
  const els = document.querySelectorAll('.am-scatter-chars, .am-scatter-words');
  if (!els.length) return;

  const mod       = (globals.moduleSettings && globals.moduleSettings.scatter) || {};
  const radius    = clamp(safeFloat(mod.radius,    200), 50, 500);
  const rotateMax = clamp(safeFloat(mod.rotateMax, 45),  0,  90);

  els.forEach((el) => {
    const mode = el.classList.contains('am-scatter-words') ? 'words' : 'chars';
    const cfg  = getElementConfig(el, 'scatter');

    const spans = splitIntoSpans(el, mode);
    if (!spans.length) return;

    // Pre-compute the random "from" state per span and apply it as inline
    // transform BEFORE inView fires. The critical CSS keeps
    // .am-scatter-* hidden via opacity:0 until .is-ready (added by
    // splitIntoSpans above), and each span starts with style.opacity = '0'
    // too, so the user never sees the un-scattered text. When the
    // animation kicks in, it interpolates from these inline values back
    // to (0, 0, 0deg, opacity 1).
    const starts = [];
    spans.forEach((span) => {
      const sx = rand(-radius, radius);
      const sy = rand(-radius, radius);
      const sr = rotateMax > 0 ? rand(-rotateMax, rotateMax) : 0;
      starts.push({ sx, sy, sr });
      span.style.transform = `translate(${sx}px, ${sy}px) rotate(${sr}deg)`;
    });

    inView(el, () => {
      spans.forEach((span, i) => {
        const { sx, sy, sr } = starts[i];
        animate(
          span,
          { x: [sx, 0], y: [sy, 0], rotate: [sr, 0], opacity: [0, 1] },
          {
            duration: cfg.duration,
            delay:    cfg.delay + i * cfg.staggerDelay,
            ease:     cfg.easing,
          }
        );
      });
    }, { margin: cfg.margin });

    el.classList.add('am-animated');
  });
}
