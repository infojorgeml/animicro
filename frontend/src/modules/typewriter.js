import { inView } from 'motion';
import { getElementConfig } from '../core/config.js';

/** Clamp a number to [min, max] with a safe fallback for NaN. */
function clamp(n, min, max, fallback) {
  const v = Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.min(Math.max(v, min), max);
}

function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Parse a three-state boolean-ish dataset value. Returns fallback when absent. */
function parseBool(raw, fallback) {
  if (raw === undefined || raw === null || raw === '') return fallback;
  const s = String(raw).toLowerCase().trim();
  if (s === 'true' || s === '1' || s === 'yes' || s === 'on') return true;
  if (s === 'false' || s === '0' || s === 'no' || s === 'off') return false;
  return fallback;
}

/**
 * Parse the strings list from a data-am-strings attribute.
 * 1. Try JSON first (e.g. `["a", "b | c"]`).
 * 2. Fallback: split on "|", trim each piece, drop empties.
 */
function parseStrings(raw) {
  if (!raw) return [];
  const trimmed = raw.trim();
  if (trimmed.startsWith('[')) {
    try {
      const arr = JSON.parse(trimmed);
      if (Array.isArray(arr)) {
        return arr.map((s) => String(s)).filter((s) => s.length > 0);
      }
    } catch (_e) {
      // fall through to pipe-split
    }
  }
  return trimmed.split('|').map((s) => s.trim()).filter((s) => s.length > 0);
}

/** Fisher–Yates shuffle (new array). */
function shuffleArray(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function init() {
  const els = document.querySelectorAll('.am-typewriter');
  if (!els.length) return;

  const reduced = prefersReducedMotion();
  const globalMod = (window.animicroFrontData && window.animicroFrontData.moduleSettings)
    ? (window.animicroFrontData.moduleSettings.typewriter || {})
    : {};

  els.forEach((el) => {
    // Guard against double-init (hot reload / re-enqueue).
    if (el.dataset.amTypewriterReady === '1') return;

    const cfg = getElementConfig(el, 'typewriter');
    const d = el.dataset;

    // Clamp numeric config to sanitized ranges. Defaults match PHP/admin.
    const typingSpeed = clamp(cfg.typingSpeed, 0.005, 2, 0.06);
    const backSpeedRaw = d.amBackSpeed !== undefined ? d.amBackSpeed : globalMod.backSpeed;
    const backSpeed = clamp(backSpeedRaw, 0.005, 2, 0.03);
    const startDelay = clamp(cfg.delay, 0, 10, 0) * 1000;
    const backDelayRaw = d.amBackDelay !== undefined ? d.amBackDelay : globalMod.backDelay;
    const backDelay = clamp(backDelayRaw, 0, 10, 1.5) * 1000;

    const loop = parseBool(d.amLoop, globalMod.loop !== undefined ? !!globalMod.loop : true);
    const shuffle = parseBool(d.amShuffle, globalMod.shuffle !== undefined ? !!globalMod.shuffle : false);
    const cursorPersist = parseBool(
      d.amCursorPersist,
      globalMod.cursorPersist !== undefined ? !!globalMod.cursorPersist : true,
    );

    const cursorChar = (d.amCursor || globalMod.cursorChar || '|').toString().slice(0, 3) || '|';

    // Content sourcing: data-am-strings > textContent fallback.
    const prefix = d.amPrefix !== undefined ? String(d.amPrefix) : '';
    const suffix = d.amSuffix !== undefined ? String(d.amSuffix) : '';
    let strings = parseStrings(d.amStrings);

    if (strings.length === 0) {
      const fallback = el.textContent.replace(/\s+/g, ' ').trim();
      if (!fallback && !prefix && !suffix) return;
      strings = fallback ? [fallback] : [''];
    }

    // Accessibility label: the stable full phrase, so screen readers announce
    // it once rather than spamming per-character as the text node mutates.
    const ariaLabel = (prefix + strings.join(', ') + suffix).trim();
    if (ariaLabel) el.setAttribute('aria-label', ariaLabel);

    // Build structure.
    el.textContent = '';

    const prefixSpan = document.createElement('span');
    prefixSpan.className = 'am-tw-prefix';
    prefixSpan.textContent = prefix;

    const textSpan = document.createElement('span');
    textSpan.className = 'am-tw-text';
    const textNode = document.createTextNode('');
    textSpan.appendChild(textNode);

    const suffixSpan = document.createElement('span');
    suffixSpan.className = 'am-tw-suffix';
    suffixSpan.textContent = suffix;

    const cursor = document.createElement('span');
    cursor.className = 'am-tw-cursor';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.textContent = cursorChar;

    el.appendChild(prefixSpan);
    el.appendChild(textSpan);
    el.appendChild(suffixSpan);
    el.appendChild(cursor);

    el.dataset.amTypewriterReady = '1';
    el.classList.add('is-ready');
    el.classList.add('am-animated');

    // Reduced motion: render the first string fully, no cursor blink, no cycling.
    if (reduced) {
      textNode.data = strings[0] || '';
      cursor.remove();
      return;
    }

    let timerId = 0;
    let currentIndex = 0;
    let cancelled = false;

    // Precompute a (possibly shuffled) order. When shuffle is on we regenerate
    // per cycle; track last shown index to avoid back-to-back repeats.
    let order = shuffle ? shuffleArray(strings.map((_, i) => i)) : strings.map((_, i) => i);
    let orderPos = 0;
    let lastShownIndex = -1;

    function nextIndex() {
      orderPos += 1;
      if (orderPos >= order.length) {
        if (!loop) return -1;
        if (shuffle) {
          // Reshuffle, guaranteeing the next pick is not the one we just showed.
          let next = shuffleArray(strings.map((_, i) => i));
          if (strings.length > 1 && next[0] === lastShownIndex) {
            // swap first with a different index
            for (let k = 1; k < next.length; k++) {
              if (next[k] !== lastShownIndex) {
                [next[0], next[k]] = [next[k], next[0]];
                break;
              }
            }
          }
          order = next;
        }
        orderPos = 0;
      }
      return order[orderPos];
    }

    function scheduleTypeFrame(str) {
      if (cancelled) return;
      let i = textNode.data.length;
      function frame() {
        if (cancelled) return;
        if (i < str.length) {
          textNode.data += str[i++];
          timerId = window.setTimeout(frame, typingSpeed * 1000);
        } else {
          onTyped(str);
        }
      }
      frame();
    }

    function scheduleDeleteFrame(onDone) {
      if (cancelled) return;
      function frame() {
        if (cancelled) return;
        const data = textNode.data;
        if (data.length > 0) {
          textNode.data = data.slice(0, -1);
          timerId = window.setTimeout(frame, backSpeed * 1000);
        } else {
          onDone();
        }
      }
      frame();
    }

    function onTyped(justTyped) {
      lastShownIndex = currentIndex;
      // Single string, no loop: stop here. Cursor persists per config.
      if (strings.length === 1 && !loop) {
        finish();
        return;
      }
      // Last string in a non-looping sequence: stop here WITHOUT deleting.
      if (!loop) {
        const isLast = orderPos === order.length - 1;
        if (isLast) {
          finish();
          return;
        }
      }
      // Hold, then delete, then move on.
      timerId = window.setTimeout(() => {
        scheduleDeleteFrame(() => {
          const ni = nextIndex();
          if (ni === -1) {
            finish();
            return;
          }
          currentIndex = ni;
          scheduleTypeFrame(strings[currentIndex]);
        });
      }, backDelay);
    }

    function finish() {
      if (!cursorPersist) {
        // Legacy 1.6 behaviour: fade the cursor out after a short beat.
        window.setTimeout(() => {
          cursor.style.transition = 'opacity 0.4s';
          cursor.style.opacity = '0';
          window.setTimeout(() => {
            if (cursor.parentNode) cursor.remove();
          }, 450);
        }, 600);
      }
    }

    inView(el, () => {
      timerId = window.setTimeout(() => {
        currentIndex = order[orderPos];
        scheduleTypeFrame(strings[currentIndex]);
      }, startDelay);
    }, { margin: cfg.margin });

    // Exposed canceller (tests, HMR, programmatic control).
    el._amTypewriterCancel = () => {
      cancelled = true;
      if (timerId) window.clearTimeout(timerId);
      timerId = 0;
    };
  });
}
