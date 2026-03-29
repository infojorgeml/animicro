import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

export function init(config) {
  const lenis = new Lenis({
    lerp: config.lerp ?? 0.1,
    duration: config.duration ?? 1.2,
    smoothWheel: config.smoothWheel ?? true,
    wheelMultiplier: config.wheelMultiplier ?? 1.0,
    anchors: config.anchors ?? true,
    autoRaf: true,
  });

  window.__animicroLenis = lenis;
}
