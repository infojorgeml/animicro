import { DEFAULT_FADE_CONFIG, DEFAULT_SCALE_CONFIG, DEFAULT_SLIDE_UP_CONFIG, DEFAULT_SLIDE_DOWN_CONFIG, DEFAULT_SLIDE_RIGHT_CONFIG, DEFAULT_SLIDE_LEFT_CONFIG, DEFAULT_BLUR_CONFIG, DEFAULT_SPLIT_CONFIG, EASING_OPTIONS, MARGIN_OPTIONS, MODULE_INFO } from '../data/modules';
import type { ModuleConfig } from '../types';
import AnimationPreview from './AnimationPreview';

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
};

const hasDistance = (id: string) => id.startsWith('slide-') || id === 'split';

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
            <code key={i} className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-600">{cls}</code>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-8 items-start">

      <div className="space-y-8 max-w-lg">

        {/* Duration */}
        <div>
          <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">
            Duration
            <span className="font-mono text-blue-600">{config.duration}s</span>
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
            className="w-full accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0.1s — Snappy</span>
            <span>2.0s — Cinematic</span>
          </div>
        </div>

        {/* Delay */}
        <div>
          <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">
            Delay
            <span className="font-mono text-blue-600">{config.delay}s</span>
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
            className="w-full accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0s — Immediate</span>
            <span>2.0s</span>
          </div>
        </div>

        {/* Scale factor (scale module only) */}
        {moduleId === 'scale' && (
          <div>
            <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">
              Scale factor
              <span className="font-mono text-blue-600">{config.scale ?? 0.95}</span>
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
              className="w-full accent-blue-600"
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
              <span className="font-mono text-blue-600">{config.blur ?? 4}px</span>
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
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>1px — Subtle</span>
              <span>20px — Heavy</span>
            </div>
          </div>
        )}

        {/* Stagger delay (split module only) */}
        {moduleId === 'split' && (
          <div>
            <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">
              Stagger delay
              <span className="font-mono text-blue-600">{config.staggerDelay ?? 0.05}s</span>
            </label>
            <p className="text-xs text-gray-400 mb-2">
              Time between each letter or word starting its animation.
            </p>
            <input
              type="range"
              min="0.01"
              max="0.2"
              step="0.01"
              value={config.staggerDelay ?? 0.05}
              onChange={e => onUpdate({ staggerDelay: parseFloat(e.target.value) })}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0.01s — Fast cascade</span>
              <span>0.2s — Slow reveal</span>
            </div>
          </div>
        )}

        {/* Distance (slide and split modules) */}
        {hasDistance(moduleId) && (
          <div>
            <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">
              Distance
              <span className="font-mono text-blue-600">{config.distance ?? (moduleId === 'split' ? 15 : 30)}px</span>
            </label>
            <p className="text-xs text-gray-400 mb-2">
              {moduleId === 'split'
                ? 'How far each letter/word slides up before reaching its final position.'
                : 'How far the element travels before reaching its final position.'}
            </p>
            <input
              type="range"
              min={moduleId === 'split' ? '5' : '10'}
              max={moduleId === 'split' ? '50' : '100'}
              step="5"
              value={config.distance ?? (moduleId === 'split' ? 15 : 30)}
              onChange={e => onUpdate({ distance: parseInt(e.target.value, 10) })}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>{moduleId === 'split' ? '5px — Subtle' : '10px — Subtle'}</span>
              <span>{moduleId === 'split' ? '50px — Dramatic' : '100px — Dramatic'}</span>
            </div>
          </div>
        )}

        {/* Easing */}
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
                       focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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

        {/* Activation margin */}
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
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'}
                `}
              >
                <span className="block text-sm font-medium">{opt.label}</span>
                <span className="block text-xs text-gray-400 mt-0.5">{opt.description}</span>
              </button>
            ))}
          </div>
        </div>

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
