import { DEFAULT_FADE_CONFIG, DEFAULT_SCALE_CONFIG, DEFAULT_SLIDE_UP_CONFIG, DEFAULT_SLIDE_DOWN_CONFIG, DEFAULT_SLIDE_RIGHT_CONFIG, DEFAULT_SLIDE_LEFT_CONFIG, DEFAULT_BLUR_CONFIG, DEFAULT_SPLIT_CONFIG, DEFAULT_TEXT_REVEAL_CONFIG, DEFAULT_TYPEWRITER_CONFIG, DEFAULT_STAGGER_CONFIG, DEFAULT_GRID_REVEAL_CONFIG, DEFAULT_HIGHLIGHT_CONFIG, DEFAULT_TEXT_FILL_SCROLL_CONFIG, DEFAULT_PARALLAX_CONFIG, EASING_OPTIONS, MARGIN_OPTIONS, MODULE_INFO } from '../data/modules';
import type { ModuleConfig } from '../types';
import AnimationPreview from './AnimationPreview';
import CopyClassButton from './CopyClassButton';

interface ModuleSettingsProps {
  moduleId: string;
  config: ModuleConfig;
  onUpdate: (partial: Partial<ModuleConfig>) => void;
  onBack: () => void;
}

const DEFAULTS: Record<string, typeof DEFAULT_FADE_CONFIG> = {
  fade: DEFAULT_FADE_CONFIG,
  scale: DEFAULT_SCALE_CONFIG,
  'slide-up': DEFAULT_SLIDE_UP_CONFIG,
  'slide-down': DEFAULT_SLIDE_DOWN_CONFIG,
  'slide-right': DEFAULT_SLIDE_RIGHT_CONFIG,
  'slide-left': DEFAULT_SLIDE_LEFT_CONFIG,
  blur: DEFAULT_BLUR_CONFIG,
  split: DEFAULT_SPLIT_CONFIG,
  'text-reveal': DEFAULT_TEXT_REVEAL_CONFIG,
  typewriter: DEFAULT_TYPEWRITER_CONFIG,
  stagger: DEFAULT_STAGGER_CONFIG,
  'grid-reveal': DEFAULT_GRID_REVEAL_CONFIG,
  highlight: DEFAULT_HIGHLIGHT_CONFIG,
  'text-fill-scroll': DEFAULT_TEXT_FILL_SCROLL_CONFIG,
  parallax: DEFAULT_PARALLAX_CONFIG,
};

const hasDistance = (id: string) => id.startsWith('slide-') || id === 'split' || id === 'stagger' || id === 'grid-reveal';

const ORIGIN_OPTIONS: { value: string; label: string; row: number; col: number }[] = [
  { value: 'top-left',     label: '\u2196', row: 0, col: 0 },
  { value: 'top',          label: '\u2191', row: 0, col: 1 },
  { value: 'top-right',    label: '\u2197', row: 0, col: 2 },
  { value: 'left',         label: '\u2190', row: 1, col: 0 },
  { value: 'center',       label: '\u25CF', row: 1, col: 1 },
  { value: 'right',        label: '\u2192', row: 1, col: 2 },
  { value: 'bottom-left',  label: '\u2199', row: 2, col: 0 },
  { value: 'bottom',       label: '\u2193', row: 2, col: 1 },
  { value: 'bottom-right', label: '\u2198', row: 2, col: 2 },
];

export default function ModuleSettings({ moduleId, config, onUpdate, onBack }: ModuleSettingsProps) {
  const mod = MODULE_INFO.find(m => m.id === moduleId);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Modules
        </button>
        <span className="text-gray-300">/</span>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-gray-900">{mod?.name ?? moduleId}</span>
          {(mod?.cssClass ?? '').trim().split(/\s+/).filter(Boolean).map((cls, i) => (
            <span key={i} className="inline-flex items-center gap-1">
              <code className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-600">{cls}</code>
              <CopyClassButton text={cls} label={`Copy ${cls}`} />
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-8 items-start">

      <div className="space-y-8 max-w-lg">

        {/* Parallax speed (parallax only) */}
        {moduleId === 'parallax' && (
          <div>
            <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">
              Speed
              <span className="font-mono text-brand-500">{config.speed ?? 0.5}</span>
            </label>
            <p className="text-xs text-gray-400 mb-2">
              Movement intensity. Higher values produce stronger parallax displacement as the user scrolls.
            </p>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={config.speed ?? 0.5}
              onChange={e => onUpdate({ speed: parseFloat(e.target.value) })}
              className="w-full accent-brand-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0.1 — Subtle</span>
              <span>1.0 — Dramatic</span>
            </div>
          </div>
        )}

        {/* Typing speed (typewriter only) */}
        {moduleId === 'typewriter' && (
          <div>
            <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">
              Typing speed
              <span className="font-mono text-brand-500">{config.typingSpeed ?? 0.06}s</span>
            </label>
            <p className="text-xs text-gray-400 mb-2">
              Delay between each character. Lower values type faster.
            </p>
            <input
              type="range"
              min="0.02"
              max="0.15"
              step="0.01"
              value={config.typingSpeed ?? 0.06}
              onChange={e => onUpdate({ typingSpeed: parseFloat(e.target.value) })}
              className="w-full accent-brand-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0.02s — Very fast</span>
              <span>0.15s — Slow, dramatic</span>
            </div>
          </div>
        )}

        {/* Duration (hidden for typewriter, parallax, text-fill-scroll) */}
        {moduleId !== 'typewriter' && moduleId !== 'parallax' && moduleId !== 'text-fill-scroll' && (
        <div>
          <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">
            Duration
            <span className="font-mono text-brand-500">{config.duration}s</span>
          </label>
          <p className="text-xs text-gray-400 mb-2">
            Defines whether the animation feels fast and snappy, or smooth and cinematic.
          </p>
          <input
            type="range"
            min="0.1"
            max="2"
            step="0.1"
            value={config.duration}
            onChange={e => onUpdate({ duration: parseFloat(e.target.value) })}
            className="w-full accent-brand-500"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0.1s — Snappy</span>
            <span>2.0s — Cinematic</span>
          </div>
        </div>
        )}

        {/* Delay (hidden for parallax, text-fill-scroll) */}
        {moduleId !== 'parallax' && moduleId !== 'text-fill-scroll' && (
        <div>
          <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">
            Delay
            <span className="font-mono text-brand-500">{config.delay}s</span>
          </label>
          <p className="text-xs text-gray-400 mb-2">
            Wait time before the animation starts.
          </p>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={config.delay}
            onChange={e => onUpdate({ delay: parseFloat(e.target.value) })}
            className="w-full accent-brand-500"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0s — Immediate</span>
            <span>2.0s</span>
          </div>
        </div>
        )}

        {/* Scale factor (scale module only) */}
        {moduleId === 'scale' && (
          <div>
            <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">
              Scale factor
              <span className="font-mono text-brand-500">{config.scale ?? 0.95}</span>
            </label>
            <p className="text-xs text-gray-400 mb-2">
              Starting scale of the element before it grows to full size.
            </p>
            <input
              type="range"
              min="0.5"
              max="1"
              step="0.05"
              value={config.scale ?? 0.95}
              onChange={e => onUpdate({ scale: parseFloat(e.target.value) })}
              className="w-full accent-brand-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0.5 — Half size</span>
              <span>1.0 — No scale</span>
            </div>
          </div>
        )}

        {/* Blur amount (blur module only) */}
        {moduleId === 'blur' && (
          <div>
            <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">
              Blur amount
              <span className="font-mono text-brand-500">{config.blur ?? 4}px</span>
            </label>
            <p className="text-xs text-gray-400 mb-2">
              Initial blur intensity before it clears to sharp.
            </p>
            <input
              type="range"
              min="1"
              max="20"
              step="1"
              value={config.blur ?? 4}
              onChange={e => onUpdate({ blur: parseInt(e.target.value, 10) })}
              className="w-full accent-brand-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>1px — Subtle</span>
              <span>20px — Heavy</span>
            </div>
          </div>
        )}

        {/* Stagger delay (split, text-reveal, stagger, grid-reveal) */}
        {(moduleId === 'split' || moduleId === 'text-reveal' || moduleId === 'stagger' || moduleId === 'grid-reveal') && (
          <div>
            <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">
              Stagger delay
              <span className="font-mono text-brand-500">{config.staggerDelay ?? (moduleId === 'text-reveal' ? 0.12 : moduleId === 'stagger' ? 0.1 : moduleId === 'grid-reveal' ? 0.08 : 0.05)}s</span>
            </label>
            <p className="text-xs text-gray-400 mb-2">
              {moduleId === 'text-reveal'
                ? 'Time between each line starting its reveal.'
                : moduleId === 'stagger'
                ? 'Time between each child element starting its animation.'
                : moduleId === 'grid-reveal'
                ? 'Controls how spread out the ripple wave feels across all items.'
                : 'Time between each letter or word starting its animation.'}
            </p>
            <input
              type="range"
              min={moduleId === 'text-reveal' ? '0.05' : moduleId === 'stagger' ? '0.03' : moduleId === 'grid-reveal' ? '0.03' : '0.01'}
              max={moduleId === 'text-reveal' ? '0.3' : moduleId === 'stagger' ? '0.5' : moduleId === 'grid-reveal' ? '0.3' : '0.2'}
              step="0.01"
              value={config.staggerDelay ?? (moduleId === 'text-reveal' ? 0.12 : moduleId === 'stagger' ? 0.1 : moduleId === 'grid-reveal' ? 0.08 : 0.05)}
              onChange={e => onUpdate({ staggerDelay: parseFloat(e.target.value) })}
              className="w-full accent-brand-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>{moduleId === 'text-reveal' ? '0.05s — Quick' : moduleId === 'stagger' ? '0.03s — Fast cascade' : moduleId === 'grid-reveal' ? '0.03s — Tight ripple' : '0.01s — Fast cascade'}</span>
              <span>{moduleId === 'text-reveal' ? '0.3s — Dramatic' : moduleId === 'stagger' ? '0.5s — Slow sequence' : moduleId === 'grid-reveal' ? '0.3s — Wide wave' : '0.2s — Slow reveal'}</span>
            </div>
          </div>
        )}

        {/* Distance (slide, split, stagger modules) */}
        {hasDistance(moduleId) && (
          <div>
            <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">
              Distance
              <span className="font-mono text-brand-500">{config.distance ?? (moduleId === 'split' ? 15 : moduleId === 'stagger' ? 20 : 30)}px</span>
            </label>
            <p className="text-xs text-gray-400 mb-2">
              {moduleId === 'split'
                ? 'How far each letter/word slides up before reaching its final position.'
                : moduleId === 'stagger'
                ? 'How far each child element slides up before reaching its final position.'
                : 'How far the element travels before reaching its final position.'}
            </p>
            <input
              type="range"
              min={moduleId === 'split' ? '5' : '10'}
              max={moduleId === 'split' ? '50' : '100'}
              step="5"
              value={config.distance ?? (moduleId === 'split' ? 15 : moduleId === 'stagger' ? 20 : 30)}
              onChange={e => onUpdate({ distance: parseInt(e.target.value, 10) })}
              className="w-full accent-brand-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>{moduleId === 'split' ? '5px — Subtle' : '10px — Subtle'}</span>
              <span>{moduleId === 'split' ? '50px — Dramatic' : '100px — Dramatic'}</span>
            </div>
          </div>
        )}

        {/* Origin (grid-reveal only) */}
        {moduleId === 'grid-reveal' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Origin point
            </label>
            <p className="text-xs text-gray-400 mb-2">
              Where the ripple animation starts. Items closest to this point appear first.
            </p>
            <div className="grid grid-cols-3 gap-1.5 w-fit mb-2">
              {ORIGIN_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => onUpdate({ origin: opt.value })}
                  title={opt.value}
                  className={`
                    w-10 h-10 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center
                    ${config.origin === opt.value
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'}
                  `}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => onUpdate({ origin: 'random' })}
              className={`
                rounded-lg border px-3 py-2 text-sm font-medium transition-colors
                ${config.origin === 'random'
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'}
              `}
            >
              Random
            </button>
            <p className="mt-1.5 text-xs text-gray-400">
              Current: <span className="font-mono text-brand-500">{config.origin ?? 'center'}</span>
            </p>
          </div>
        )}

        {/* Highlight color (highlight only) */}
        {moduleId === 'highlight' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Highlight color
            </label>
            <p className="text-xs text-gray-400 mb-2">
              The marker color drawn behind the text. Override per-element with <code className="rounded bg-gray-100 px-1 py-0.5 text-[11px]">data-am-highlight-color</code>.
            </p>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={config.highlightColor ?? '#fde68a'}
                onChange={e => onUpdate({ highlightColor: e.target.value })}
                className="h-10 w-10 cursor-pointer rounded-lg border border-gray-300 p-0.5"
              />
              <span className="font-mono text-sm text-gray-600">{config.highlightColor ?? '#fde68a'}</span>
            </div>
          </div>
        )}

        {/* Highlight direction (highlight only) */}
        {moduleId === 'highlight' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Direction
            </label>
            <p className="text-xs text-gray-400 mb-2">
              The direction the highlight sweeps across the text.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: 'left',   label: 'Left → Right', icon: '→' },
                { value: 'right',  label: 'Right → Left', icon: '←' },
                { value: 'center', label: 'Center Out',   icon: '↔' },
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => onUpdate({ highlightDirection: opt.value })}
                  className={`
                    rounded-lg border px-3 py-2.5 text-left transition-colors
                    ${config.highlightDirection === opt.value
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'}
                  `}
                >
                  <span className="block text-sm font-medium">{opt.icon}</span>
                  <span className="block text-xs text-gray-400 mt-0.5">{opt.label}</span>
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-gray-400">
              Current: <span className="font-mono text-brand-500">{config.highlightDirection ?? 'left'}</span>
            </p>
          </div>
        )}

        {/* Text Fill on Scroll colors */}
        {moduleId === 'text-fill-scroll' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Base color
            </label>
            <p className="text-xs text-gray-400 mb-2">
              The muted color words start with before being filled. Override per-element with <code className="rounded bg-gray-100 px-1 py-0.5 text-[11px]">data-am-color-base</code>.
            </p>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={config.colorBase ?? '#cccccc'}
                onChange={e => onUpdate({ colorBase: e.target.value })}
                className="h-10 w-10 cursor-pointer rounded-lg border border-gray-300 p-0.5"
              />
              <span className="font-mono text-sm text-gray-600">{config.colorBase ?? '#cccccc'}</span>
            </div>
          </div>
        )}

        {moduleId === 'text-fill-scroll' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fill color
            </label>
            <p className="text-xs text-gray-400 mb-2">
              The color words transition to as you scroll. Override per-element with <code className="rounded bg-gray-100 px-1 py-0.5 text-[11px]">data-am-color-fill</code>.
            </p>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={config.colorFill ?? '#000000'}
                onChange={e => onUpdate({ colorFill: e.target.value })}
                className="h-10 w-10 cursor-pointer rounded-lg border border-gray-300 p-0.5"
              />
              <span className="font-mono text-sm text-gray-600">{config.colorFill ?? '#000000'}</span>
            </div>
          </div>
        )}

        {/* Text Fill on Scroll offsets */}
        {moduleId === 'text-fill-scroll' && (
          <div>
            <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">
              Scroll start
              <span className="font-mono text-brand-500">{config.scrollStart ?? 62}%</span>
            </label>
            <p className="text-xs text-gray-400 mb-2">
              Viewport position where the first word begins to fill.
            </p>
            <input
              type="range"
              min="40"
              max="80"
              step="1"
              value={config.scrollStart ?? 62}
              onChange={e => onUpdate({ scrollStart: parseInt(e.target.value, 10) })}
              className="w-full accent-brand-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>40% — Early</span>
              <span>80% — Late</span>
            </div>
          </div>
        )}

        {moduleId === 'text-fill-scroll' && (
          <div>
            <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">
              Scroll end
              <span className="font-mono text-brand-500">{config.scrollEnd ?? 60}%</span>
            </label>
            <p className="text-xs text-gray-400 mb-2">
              Viewport position where each word finishes filling.
            </p>
            <input
              type="range"
              min="40"
              max="80"
              step="1"
              value={config.scrollEnd ?? 60}
              onChange={e => onUpdate({ scrollEnd: parseInt(e.target.value, 10) })}
              className="w-full accent-brand-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>40% — Early</span>
              <span>80% — Late</span>
            </div>
          </div>
        )}

        {/* Easing (hidden for typewriter, parallax, text-fill-scroll) */}
        {moduleId !== 'typewriter' && moduleId !== 'parallax' && moduleId !== 'text-fill-scroll' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Easing curve
          </label>
          <p className="text-xs text-gray-400 mb-2">
            Controls how the animation accelerates and decelerates over time.
          </p>
          <select
            value={config.easing}
            onChange={e => onUpdate({ easing: e.target.value })}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm
                       focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            {EASING_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {EASING_OPTIONS.find(o => o.value === config.easing)?.description && (
            <p className="mt-1.5 text-xs text-gray-400">
              {EASING_OPTIONS.find(o => o.value === config.easing)?.description}
            </p>
          )}
        </div>
        )}

        {/* Activation margin (hidden for parallax, text-fill-scroll) */}
        {moduleId !== 'parallax' && moduleId !== 'text-fill-scroll' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Activation margin
          </label>
          <p className="text-xs text-gray-400 mb-2">
            How far into the viewport the element must enter before animating.
          </p>
          <div className="grid grid-cols-3 gap-2">
            {MARGIN_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => onUpdate({ margin: opt.value })}
                className={`
                  rounded-lg border px-3 py-2.5 text-left transition-colors
                  ${config.margin === opt.value
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'}
                `}
              >
                <span className="block text-sm font-medium">{opt.label}</span>
                <span className="block text-xs text-gray-400 mt-0.5">{opt.description}</span>
              </button>
            ))}
          </div>
        </div>
        )}

      </div>

      <div className="hidden lg:block sticky top-8">
        <AnimationPreview
          moduleId={moduleId}
          config={config}
          onReset={DEFAULTS[moduleId] ? () => onUpdate(DEFAULTS[moduleId]) : undefined}
        />
      </div>

      </div>
    </div>
  );
}
