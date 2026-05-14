import CopyClassButton from './CopyClassButton';
import { EASING_OPTIONS, MODULE_INFO, DEFAULT_PAGE_CURTAIN_CONFIG } from '../data/modules';
import type { ModuleConfig } from '../types';

/**
 * Settings page for the page-curtain module. Mirrors the structure of
 * ModuleSettings.tsx (back button → breadcrumb with class chips → form)
 * so the Page Transitions tab feels consistent with the Modules
 * dashboard's drilldown UX. Reached from PageTransitions.tsx after the
 * user clicks the gear icon on an active card.
 */

interface PageCurtainSettingsProps {
  config: ModuleConfig;
  onUpdate: (partial: Partial<ModuleConfig>) => void;
  onBack: () => void;
}

const DURATION_PRESET = { min: 0.1, max: 3, step: 0.05 };
const DELAY_PRESET    = { min: 0,   max: 2, step: 0.05 };

/**
 * Open the WordPress media library picker and resolve to the selected
 * image URL. Falls back to window.prompt() if wp.media is unavailable.
 */
function openMediaPicker(onSelect: (url: string) => void) {
  const media = window.wp?.media;
  if (typeof media !== 'function') {
    const url = window.prompt('Logo URL:');
    if (url) onSelect(url);
    return;
  }
  const frame = media({
    title:    'Select logo',
    button:   { text: 'Use this image' },
    library:  { type: 'image' },
    multiple: false,
  });
  frame.on('select', () => {
    const attachment = frame.state().get('selection').first().toJSON();
    if (attachment?.url) onSelect(attachment.url);
  });
  frame.open();
}

export default function PageCurtainSettings({ config, onUpdate, onBack }: PageCurtainSettingsProps) {
  const mod = MODULE_INFO.find(m => m.id === 'page-curtain');
  const cfg = config ?? DEFAULT_PAGE_CURTAIN_CONFIG;

  return (
    <div>
      {/* Breadcrumb header — same pattern as ModuleSettings */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Page Transitions
        </button>
        <span className="text-gray-300">/</span>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-gray-900">{mod?.name ?? 'Page Curtain'}</span>
          {(mod?.cssClass ?? '').trim().split(/\s+/).filter(Boolean).map((cls, i) => (
            <span key={i} className="inline-flex items-center gap-1">
              <code className="rounded bg-white px-1.5 py-0.5 text-[11px] text-gray-600">{cls}</code>
              <CopyClassButton text={cls} label={`Copy ${cls}`} />
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-8 max-w-lg">
        {/* Direction */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Direction</label>
          <p className="text-xs text-gray-400 mb-2">
            How the cortina travels. Slide directions are mirrored between entry and exit, so the cortina appears to keep moving in the same direction across the navigation.
          </p>
          <select
            value={cfg.direction ?? 'fade'}
            onChange={e => onUpdate({ direction: e.target.value })}
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
              onChange={e => onUpdate({ bgColor: e.target.value })}
              className="h-9 w-12 rounded border border-gray-300 cursor-pointer"
            />
            <input
              type="text"
              value={cfg.bgColor ?? '#000000'}
              onChange={e => onUpdate({ bgColor: e.target.value })}
              className="font-mono text-sm rounded-md border border-gray-300 px-2.5 py-1.5 w-32"
            />
          </div>
        </div>

        {/* Logo (optional) — WordPress media-library picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Logo (optional)</label>
          <p className="text-xs text-gray-400 mb-2">
            Image centered inside the overlay during the transition. Capped at 200×200px. Leave empty for a plain color overlay.
          </p>
          <div className="flex items-center gap-3">
            {cfg.logoUrl ? (
              <div className="flex items-center gap-2">
                <div className="h-12 w-12 rounded border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                  <img
                    src={cfg.logoUrl}
                    alt=""
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => openMediaPicker(url => onUpdate({ logoUrl: url }))}
                  className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Change
                </button>
                <button
                  type="button"
                  onClick={() => onUpdate({ logoUrl: '' })}
                  className="rounded-md border border-transparent px-2 py-1.5 text-sm text-gray-500 hover:text-red-600"
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => openMediaPicker(url => onUpdate({ logoUrl: url }))}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Select image…
              </button>
            )}
          </div>
          {cfg.logoUrl && (
            <p className="mt-2 text-xs text-gray-400 font-mono break-all">{cfg.logoUrl}</p>
          )}
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
            onChange={e => onUpdate({ duration: parseFloat(e.target.value) })}
            className="w-full accent-brand-500"
          />
        </div>

        {/* Easing */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Easing</label>
          <select
            value={cfg.easing}
            onChange={e => onUpdate({ easing: e.target.value })}
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
            onChange={e => onUpdate({ delay: parseFloat(e.target.value) })}
            className="w-full accent-brand-500"
          />
        </div>
      </div>
    </div>
  );
}
