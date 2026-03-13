import { inView } from 'motion';
import { getElementConfig } from '../core/config.js';

const CURSOR_CSS_ID = 'am-typewriter-css';

function injectCursorStyles() {
  if (document.getElementById(CURSOR_CSS_ID)) return;
  const style = document.createElement('style');
  style.id = CURSOR_CSS_ID;
  style.textContent = `
.am-tw-cursor{display:inline;animation:am-tw-blink .7s steps(2) infinite}
@keyframes am-tw-blink{0%,100%{opacity:1}50%{opacity:0}}`;
  document.head.appendChild(style);
}

function typeText(el, text, speed, onDone) {
  let i = 0;
  const cursor = el.querySelector('.am-tw-cursor');

  function next() {
    if (i < text.length) {
      const char = document.createTextNode(text[i]);
      if (cursor) {
        el.insertBefore(char, cursor);
      } else {
        el.appendChild(char);
      }
      i++;
      setTimeout(next, speed * 1000);
    } else if (onDone) {
      onDone();
    }
  }

  next();
}

export function init() {
  const els = document.querySelectorAll('.am-typewriter');
  if (!els.length) return;

  injectCursorStyles();

  els.forEach((el) => {
    const cfg = getElementConfig(el, 'typewriter');
    const text = el.textContent.trim();
    if (!text) return;

    el.setAttribute('aria-label', text);
    el.textContent = '';

    const cursor = document.createElement('span');
    cursor.className = 'am-tw-cursor';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.textContent = '|';
    el.appendChild(cursor);

    el.classList.add('is-ready');

    inView(el, () => {
      const startDelay = cfg.delay * 1000;
      setTimeout(() => {
        typeText(el, text, cfg.typingSpeed, () => {
          setTimeout(() => {
            cursor.style.transition = 'opacity 0.4s';
            cursor.style.opacity = '0';
          }, 600);
        });
      }, startDelay);
    }, { margin: cfg.margin });

    el.classList.add('am-animated');
  });
}
