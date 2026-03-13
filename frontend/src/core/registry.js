/**
 * Module registry with dynamic imports.
 * Only active modules are loaded (code-splitting via Vite).
 */

const MODULES = {
  'fade':        () => import('../modules/fade.js'),
  'slide-up':    () => import('../modules/slide.js'),
  'slide-down':  () => import('../modules/slide.js'),
  'slide-right': () => import('../modules/slide.js'),
  'slide-left':  () => import('../modules/slide.js'),
  'scale':       () => import('../modules/scale.js'),
  'blur':        () => import('../modules/blur.js'),
  'stagger':     () => import('../modules/stagger.js'),
  'parallax':    () => import('../modules/parallax.js'),
  'split':       () => import('../modules/split-text.js'),
  'text-reveal': () => import('../modules/text-reveal.js'),
};

export async function loadModules(activeModules) {
  const loaded = new Set();

  for (const name of activeModules) {
    const loader = MODULES[name];
    if (!loader) continue;

    const key = loader.toString();
    const mod = await loader();

    if (loaded.has(key)) {
      mod.init(name);
    } else {
      loaded.add(key);
      mod.init(name);
    }
  }
}
