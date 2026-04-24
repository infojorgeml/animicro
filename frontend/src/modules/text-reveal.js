import { animate, stagger, inView } from 'motion';
import { getElementConfig } from '../core/config.js';

/**
 * Splits an element's text into line-level mask containers.
 *
 * 1. Wraps every word in an inline-block span to measure offsetTop.
 * 2. Groups words sharing the same offsetTop into a "line".
 * 3. Replaces DOM with: mask (overflow:hidden, block) > inner (block, translateY(100%)).
 */
function splitIntoLines(el) {
  const text = el.textContent.trim();
  if (!text) return [];

  el.setAttribute('aria-label', text);

  const words = text.split(/(\s+)/);
  el.innerHTML = '';

  const wordSpans = [];
  words.forEach((word) => {
    if (/^\s+$/.test(word)) {
      el.appendChild(document.createTextNode(' '));
      return;
    }
    const span = document.createElement('span');
    span.textContent = word;
    span.style.display = 'inline-block';
    el.appendChild(span);
    wordSpans.push(span);
  });

  const lines = [];
  let currentLine = [];
  let currentTop = null;

  wordSpans.forEach((span) => {
    const top = span.offsetTop;
    if (currentTop !== null && top !== currentTop) {
      lines.push(currentLine);
      currentLine = [];
    }
    currentTop = top;
    currentLine.push(span.textContent);
  });
  if (currentLine.length) lines.push(currentLine);

  el.innerHTML = '';

  const innerSpans = [];
  lines.forEach((lineWords) => {
    const mask = document.createElement('span');
    mask.style.display = 'block';
    mask.style.overflow = 'hidden';

    const inner = document.createElement('span');
    inner.style.display = 'block';
    inner.style.transform = 'translateY(100%)';
    inner.textContent = lineWords.join(' ');
    inner.setAttribute('aria-hidden', 'true');

    mask.appendChild(inner);
    el.appendChild(mask);
    innerSpans.push(inner);
  });

  el.classList.add('is-ready');

  return innerSpans;
}

export function init() {
  const els = document.querySelectorAll('.am-text-reveal');
  if (!els.length) return;

  // Line splitting depends on offsetTop, which is only accurate once custom
  // web fonts are loaded. Wait for document.fonts.ready so cold loads with
  // Google Fonts / self-hosted fonts don't collapse all words into one line.
  const run = () => {
    els.forEach((el) => {
      const cfg = getElementConfig(el, 'text-reveal');
      const innerSpans = splitIntoLines(el);
      if (!innerSpans.length) return;

      inView(el, () => {
        animate(
          innerSpans,
          { y: ['100%', '0%'] },
          {
            duration: cfg.duration,
            delay: stagger(cfg.staggerDelay, { start: cfg.delay }),
            easing: cfg.easing,
          }
        );
      }, { margin: cfg.margin });

      el.classList.add('am-animated');
    });
  };

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(run);
  } else {
    run();
  }
}
