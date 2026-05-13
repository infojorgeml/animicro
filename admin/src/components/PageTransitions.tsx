import Toggle from './Toggle';
import { EASING_OPTIONS, MODULE_INFO, DEFAULT_PAGE_CURTAIN_CONFIG } from '../data/modules';
import type { AnimicroSettings, ModuleConfig } from '../types';

/**
 * Page Transitions tab — renders the single page-curtain module with its
 * toggle and inline settings.
 *
 * page-curtain is symmetric: when active it animates the overlay OUT on
 * page load and IN on internal link clicks (intercepting navigation,
 * waiting for the cortina to cover the viewport, then doing the actual
 * navigation). This single module replaces what 1.14.0 originally
 * shipped as two separate modules (page-fade + page-curtain).
 */

interface PageTransitionsProps {
  settings: AnimicroSettings;
  onToggleModule: (id: string) => void;
  onUpdateModuleSettings: (moduleId: string, partial: Partial<ModuleConfig>) => void;
}

const DURATION_PRESET = { min: 0.1, max: 3, step: 0.05 };
const DELAY_PRESET    = { min: 0,   max: 2, step: 0.05 };

export default function PageTransitions({ settings, onToggleModule, onUpdateModuleSettings }: PageTransitionsProps) {
  const pageModules = MODULE_INFO.filter(m => m.category === 'page');

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Page Transitions</h2>
        <p className="text-sm text-gray-500">
          Symmetric overlay that covers the screen during navigation: it animates OUT once a page finishes loading, and IN when the visitor clicks an internal link — only then does the new page actually load. Builder-safe (skipped inside Bricks / Elementor / etc. editors) and honors{' '}
          <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">prefers-reduced-motion</code>.
        </p>
        <p className="text-xs text-gray-400 mt-2">
          Per-link opt-out: add <code className="bg-gray-100 px-1 py-0.5 rounded">class="no-curtain"</code> or <code className="bg-gray-100 px-1 py-0.5 rounded">data-no-curtain</code> to any <code>&lt;a&gt;</code> you want to navigate instantly (downloads, ajax-driven UIs, etc.). External links, <code>target="_blank"</code>, <code>#anchor</code> links, and modifier-key / middle-clicks are never intercepted.
        </p>
      </div>

      <div className="space-y-4">
        {pageModules.map(mod => {
          const isActive = settings.active_modules.includes(mod.id);
          const cfg = settings.module_settings?.[mod.id] ?? DEFAULT_PAGE_CURTAIN_CONFIG;

          return (
            <div
              key={mod.id}
              className={`
                rounded-lg border p-4 transition-colors
                ${isActive ? 'border-brand-200 bg-brand-50/50' : 'border-gray-200 bg-white'}
              `}
            >
              {/* Header: name + description + toggle */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-[14px] text-gray-900">{mod.name}</p>
                  <p className="mt-1 text-[13px] text-gray-500">{mod.description}</p>
                </div>
                <Toggle
                  checked={isActive}
                  onChange={() => onToggleModule(mod.id)}
                />
              </div>

              {/* Inline settings, only when active */}
              {isActive && (
                <div className="mt-4 pt-4 border-t border-brand-100 space-y-4">
                  {/* Direction */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Direction</label>
                    <p className="text-xs text-gray-400 mb-2">
                      How the cortina travels. Slide directions are mirrored between entry and exit, so the cortina appears to keep moving in the same direction across the navigation.
                    </p>
                    <select
                      value={cfg.direction ?? 'fade'}
                      onChange={e => onUpdateModuleSettings(mod.id, { direction: e.target.value })}
                      className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm bg-white"
                    >
                      <option value="fade">Fade — opacity in / out</option>
                      <option value="slide-up">Slide Up — cortina rises across the screen</option>
                      <option value="slide-down">Slide Down — cortina descends across the screen</option>
                    </select>
                  </div>

                  {/* Background color */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Background color</label>
                    <p className="text-xs text-gray-400 mb-2">
                      Color of the overlay. Use your brand color, your site background (white for light themes, near-black for dark themes), or anything you want.
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={cfg.bgColor ?? '#000000'}
                        onChange={e => onUpdateModuleSettings(mod.id, { bgColor: e.target.value })}
                        className="h-9 w-12 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={cfg.bgColor ?? '#000000'}
                        onChange={e => onUpdateModuleSettings(mod.id, { bgColor: e.target.value })}
                        className="font-mono text-sm rounded-md border border-gray-300 px-2.5 py-1.5 w-32"
                      />
                    </div>
                  </div>

                  {/* Logo URL (optional) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL (optional)</label>
                    <p className="text-xs text-gray-400 mb-2">
                      If provided, the image is centered inside the overlay. Capped at 200×200px. Leave empty for a plain color overlay.
                    </p>
                    <input
                      type="text"
                      value={cfg.logoUrl ?? ''}
                      placeholder="https://example.com/logo.svg"
                      onChange={e => onUpdateModuleSettings(mod.id, { logoUrl: e.target.value })}
                      className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm font-mono"
                    />
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">
                      Duration
                      <span className="font-mono text-brand-500">{cfg.duration}s</span>
                    </label>
                    <p className="text-xs text-gray-400 mb-2">
                      Length of each half (entry and exit). Total perceived transition is roughly 2× this value plus the new page's load time.
                    </p>
                    <input
                      type="range"
                      min={DURATION_PRESET.min}
                      max={DURATION_PRESET.max}
                      step={DURATION_PRESET.step}
                      value={cfg.duration}
                      onChange={e => onUpdateModuleSettings(mod.id, { duration: parseFloat(e.target.value) })}
                      className="w-full accent-brand-500"
                    />
                  </div>

                  {/* Easing */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Easing</label>
                    <select
                      value={cfg.easing}
                      onChange={e => onUpdateModuleSettings(mod.id, { easing: e.target.value })}
                      className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm bg-white"
                    >
                      {EASING_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Delay */}
                  <div>
                    <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">
                      Delay
                      <span className="font-mono text-brand-500">{cfg.delay}s</span>
                    </label>
                    <p className="text-xs text-gray-400 mb-2">
                      Pause before the entry animation starts (the cortina sits opaque for this long after the page loads). Has no effect on the exit transition — that always starts immediately on click for snappy feedback.
                    </p>
                    <input
                      type="range"
                      min={DELAY_PRESET.min}
                      max={DELAY_PRESET.max}
                      step={DELAY_PRESET.step}
                      value={cfg.delay}
                      onChange={e => onUpdateModuleSettings(mod.id, { delay: parseFloat(e.target.value) })}
                      className="w-full accent-brand-500"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
