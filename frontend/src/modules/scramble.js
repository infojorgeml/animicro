import { inView } from 'motion';
import { getElementConfig } from '../core/config.js';

/**
 * Scramble Text — "decoding" text effect. Each character cycles through
 * random symbols and stabilises on its real value with a left-to-right
 * wave. Classic cinema/cyberpunk look.
 *
 * Class:     .am-scramble
 *
 * Per-element data-am-* (via getElementConfig):
 *   data-am-delay    seconds before the reveal starts after inView
 *   data-am-stagger  seconds between each character's "fix" point
 *                    (low = wave races across, high = slow cascade)
 *   data-am-margin   inView margin
 *
 * Module-level settings (admin panel global — utility-first like
 * scatter):
 *   scrambleSpeed   seconds between random-char rolls (low = jittery,
 *                   high = slow flicker). Default 0.05s.
 *
 * Algorithm:
 *   - Capture textContent as the source of truth, set aria-label to it
 *     so screen readers announce the final phrase, not the noise.
 *   - Walk the text with [...text] (preserves surrogates / emoji);
 *     spaces are kept as-is and never scrambled (preserves layout).
 *   - Compute revealAt[i] = baseDelay + i * staggerDelay per
 *     non-space character (LTR wave).
 *   - Tick every scrambleSpeed seconds. On each tick build the output
 *     string: chars past their revealAt show their real value, others
 *     show a random symbol from CHARSET. Spaces always show as spaces.
 *   - Stop when every char is past its revealAt.
 *
 * Reduced motion: render the final text immediately, no ticking, no
 * scrambling.
 *
 * Builder editors: gated upstream by main.js — init() never runs.
 */

// Hardcoded charset (mix ASCII glitch + alphanumeric). Easy to recognise
// as "decoding" without being so noisy it looks broken.
const CHARSET = '!@#$%^&*()_+-=[]{}|;:,.<>?/~0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const CHARSET_LEN = CHARSET.length;

function randChar() {
  return CHARSET[Math.floor(Math.random() * CHARSET_LEN)];
}

function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function safeFloat(raw, fallback) {
  if (raw === undefined || raw === null || raw === '') return fallback;
  const v = parseFloat(raw);
  return Number.isFinite(v) ? v : fallback;
}

export function init() {
  const els = document.querySelectorAll('.am-scramble');
  if (!els.length) return;

  const reduced = prefersReducedMotion();
  const globalMod = (window.animicroFrontData && window.animicroFrontData.moduleSettings)
    ? (window.animicroFrontData.moduleSettings.scramble || {})
    : {};

  const scrambleSpeedSec = clamp(safeFloat(globalMod.scrambleSpeed, 0.05), 0.02, 0.5);

  els.forEach((el) => {
    if (el.dataset.amScrambleReady === '1') return;

    const cfg = getElementConfig(el, 'scramble');
    const text = el.textContent;
    if (!text || !text.length) return;

    // Preserve original text for screen readers — the textContent will be
    // mutated rapidly during the reveal, which a11y trees do NOT need to
    // hear character-by-character.
    el.setAttribute('aria-label', text);
    el.dataset.amScrambleReady = '1';
    el.classList.add('is-ready');

    if (reduced) {
      // Skip the animation entirely — leave the original text in place.
      el.classList.add('am-animated');
      return;
    }

    // Split with [...text] so multi-codepoint glyphs (emoji, surrogates,
    // combining marks) survive as single units. Whitespace is preserved
    // as-is and never scrambled.
    const chars = [...text];
    const stagger = clamp(safeFloat(cfg.staggerDelay, 0.04), 0.005, 0.5);

    // revealAt[i] is the elapsed-time (seconds since reveal start) at
    // which char i locks to its final value. Spaces have revealAt = 0
    // so they never show as a random char.
    const revealAt = chars.map((ch, i) => {
      if (/^\s$/.test(ch)) return 0;
      // Count non-space chars before this one to keep the wave smooth
      // across short space gaps (avoids visible "skips" in the cascade).
      let nonSpaceIdx = 0;
      for (let k = 0; k < i; k++) {
        if (!/^\s$/.test(chars[k])) nonSpaceIdx++;
      }
      return nonSpaceIdx * stagger;
    });
    const totalDuration = revealAt.length > 0 ? Math.max(...revealAt) : 0;

    function tick(startMs) {
      const elapsed = (performance.now() - startMs) / 1000;
      let out = '';
      let allDone = true;

      for (let i = 0; i < chars.length; i++) {
        const ch = chars[i];
        if (/^\s$/.test(ch)) {
          out += ch;
          continue;
        }
        if (elapsed >= revealAt[i]) {
          out += ch;
        } else {
          out += randChar();
          allDone = false;
        }
      }

      el.textContent = out;

      if (!allDone && !el._amScrambleCancel) {
        el._amScrambleTimer = window.setTimeout(() => tick(startMs), scrambleSpeedSec * 1000);
      } else {
        // Safety: make sure the final state is exactly the original text,
        // including any trailing whitespace that the loop already handled.
        el.textContent = text;
        el.classList.add('am-animated');
      }
    }

    inView(el, () => {
      const startDelayMs = clamp(safeFloat(cfg.delay, 0), 0, 10) * 1000;
      window.setTimeout(() => {
        if (el._amScrambleCancel) return;
        tick(performance.now());
      }, startDelayMs);
    }, { margin: cfg.margin });

    // Exposed canceller for tests / HMR.
    el._amScrambleCancel = false;
    el._amScrambleStop = () => {
      el._amScrambleCancel = true;
      if (el._amScrambleTimer) {
        window.clearTimeout(el._amScrambleTimer);
        el._amScrambleTimer = 0;
      }
      el.textContent = text;
    };

    // `totalDuration` available for any future "stop early" guard. Not
    // used in the tick loop because we drive completion off `allDone`.
    void totalDuration;
  });
}
