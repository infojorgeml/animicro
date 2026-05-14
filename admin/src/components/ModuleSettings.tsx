import { DEFAULT_FADE_CONFIG, DEFAULT_SCALE_CONFIG, DEFAULT_SLIDE_UP_CONFIG, DEFAULT_SLIDE_DOWN_CONFIG, DEFAULT_SLIDE_RIGHT_CONFIG, DEFAULT_SLIDE_LEFT_CONFIG, DEFAULT_BLUR_CONFIG, DEFAULT_SPLIT_CONFIG, DEFAULT_TEXT_REVEAL_CONFIG, DEFAULT_TYPEWRITER_CONFIG, DEFAULT_STAGGER_CONFIG, DEFAULT_GRID_REVEAL_CONFIG, DEFAULT_HIGHLIGHT_CONFIG, DEFAULT_TEXT_FILL_SCROLL_CONFIG, DEFAULT_PARALLAX_CONFIG, DEFAULT_FLOAT_CONFIG, DEFAULT_PULSE_CONFIG, DEFAULT_SKEW_UP_CONFIG, DEFAULT_HOVER_ZOOM_CONFIG, DEFAULT_IMG_PARALLAX_CONFIG, DEFAULT_MAGNET_CONFIG, DEFAULT_MAGNETIC_CONFIG, DEFAULT_SCATTER_CONFIG, DEFAULT_SCRAMBLE_CONFIG, DEFAULT_SPIN_CONFIG, DEFAULT_CLIP_REVEAL_CONFIG, EASING_OPTIONS, MARGIN_OPTIONS, MODULE_INFO } from '../data/modules';
import type { ModuleConfig } from '../types';
import AnimationPreview from './AnimationPreview';
import ColorField from './ColorField';
import CopyClassButton from './CopyClassButton';
import Toggle from './Toggle';

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
  float: DEFAULT_FLOAT_CONFIG,
  pulse: DEFAULT_PULSE_CONFIG,
  'skew-up': DEFAULT_SKEW_UP_CONFIG,
  'hover-zoom': DEFAULT_HOVER_ZOOM_CONFIG,
  'img-parallax': DEFAULT_IMG_PARALLAX_CONFIG,
  magnet: DEFAULT_MAGNET_CONFIG,
  magnetic: DEFAULT_MAGNETIC_CONFIG,
  scatter: DEFAULT_SCATTER_CONFIG,
  scramble: DEFAULT_SCRAMBLE_CONFIG,
  spin: DEFAULT_SPIN_CONFIG,
  'clip-reveal': DEFAULT_CLIP_REVEAL_CONFIG,
};

const hasDistance = (id: string) => id.startsWith('slide-') || id === 'skew-up' || id === 'split' || id === 'stagger' || id === 'grid-reveal';

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

        {/* Image Parallax speed (img-parallax only) */}
        {moduleId === 'img-parallax' && (
          <div>
            <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">
              Speed
              <span className="font-mono text-brand-500">{config.speed ?? 0.2}</span>
            </label>
            <p className="text-xs text-gray-400 mb-2">
              How far the inner image travels inside its frame. Higher values produce a stronger window effect.
            </p>
            <input
              type="range"
              min="0.05"
              max="1"
              step="0.05"
              value={config.speed ?? 0.2}
              onChange={e => onUpdate({ speed: parseFloat(e.target.value) })}
              className="w-full accent-brand-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0.05 — Subtle</span>
              <span>1.0 — Dramatic</span>
            </div>
            <p className="mt-2 text-[11px] text-gray-500">
              Tip: place an <code className="rounded bg-gray-100 px-1 py-0.5">&lt;img&gt;</code> inside an element with <code className="rounded bg-gray-100 px-1 py-0.5">overflow: hidden</code>. The image translates inside its frame as the user scrolls.
            </p>
          </div>
        )}

        {/* Zoom scale (hover-zoom only) */}
        {moduleId === 'hover-zoom' && (
          <div>
            <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">
              Zoom scale
              <span className="font-mono text-brand-500">{config.zoomScale ?? 1.08}</span>
            </label>
            <p className="text-xs text-gray-400 mb-2">
              Final scale on hover. Subtle values (1.05–1.10) feel premium; higher values feel playful.
            </p>
            <input
              type="range"
              min="1.01"
              max="1.5"
              step="0.01"
              value={config.zoomScale ?? 1.08}
              onChange={e => onUpdate({ zoomScale: parseFloat(e.target.value) })}
              className="w-full accent-brand-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>1.01 — Whisper</span>
              <span>1.5 — Bold</span>
            </div>
            <p className="mt-2 text-[11px] text-gray-500">
              Tip: the parent of the image needs <code className="rounded bg-gray-100 px-1 py-0.5">overflow: hidden</code> so the zoom stays within the card frame.
            </p>
          </div>
        )}

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

        {/* Typewriter controls: typing + back speed, back delay, cursor char, loop/shuffle/persist */}
        {moduleId === 'typewriter' && (
          <>
            <div>
              <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">
                Typing speed
                <span className="font-mono text-brand-500">{config.typingSpeed ?? 0.06}s</span>
              </label>
              <p className="text-xs text-gray-400 mb-2">
                Delay between each character when typing forward. Lower values type faster.
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

            <div>
              <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">
                Back speed
                <span className="font-mono text-brand-500">{config.backSpeed ?? 0.03}s</span>
              </label>
              <p className="text-xs text-gray-400 mb-2">
                Delay between each character when deleting. Typically faster than typing.
              </p>
              <input
                type="range"
                min="0.01"
                max="0.15"
                step="0.01"
                value={config.backSpeed ?? 0.03}
                onChange={e => onUpdate({ backSpeed: parseFloat(e.target.value) })}
                className="w-full accent-brand-500"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0.01s — Instant</span>
                <span>0.15s — Deliberate</span>
              </div>
            </div>

            <div>
              <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">
                Back delay
                <span className="font-mono text-brand-500">{config.backDelay ?? 1.5}s</span>
              </label>
              <p className="text-xs text-gray-400 mb-2">
                Hold time after a word finishes typing, before it starts deleting.
              </p>
              <input
                type="range"
                min="0"
                max="5"
                step="0.1"
                value={config.backDelay ?? 1.5}
                onChange={e => onUpdate({ backDelay: parseFloat(e.target.value) })}
                className="w-full accent-brand-500"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0s — No hold</span>
                <span>5s — Long pause</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cursor character
              </label>
              <p className="text-xs text-gray-400 mb-2">
                The blinking cursor character. Override per-element with <code className="rounded bg-gray-100 px-1 py-0.5 text-[11px]">data-am-cursor</code>.
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={3}
                  value={config.cursorChar ?? '|'}
                  onChange={e => onUpdate({ cursorChar: e.target.value.slice(0, 3) })}
                  className="w-20 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-mono
                             focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  placeholder="|"
                />
                <span className="inline-flex items-center gap-1 text-sm text-gray-500">
                  Preview:
                  <span className="font-mono text-gray-900">Type</span>
                  <span className="font-mono text-brand-500 animate-pulse">{config.cursorChar || '|'}</span>
                </span>
              </div>
            </div>

            <div>
              <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
                <span>Loop through strings</span>
                <Toggle
                  checked={config.loop ?? true}
                  onChange={next => onUpdate({ loop: next })}
                  label="Loop"
                />
              </label>
              <p className="text-xs text-gray-400">
                When multiple <code className="rounded bg-gray-100 px-1 py-0.5 text-[11px]">data-am-strings</code> are set, cycle through them forever. Off: run once and stop on the last string (without deleting it).
              </p>
            </div>

            <div>
              <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
                <span>Shuffle order</span>
                <Toggle
                  checked={config.shuffle ?? false}
                  onChange={next => onUpdate({ shuffle: next })}
                  label="Shuffle"
                />
              </label>
              <p className="text-xs text-gray-400">
                Randomize the order each cycle. No back-to-back repeats.
              </p>
            </div>

            <div>
              <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
                <span>Cursor stays after typing</span>
                <Toggle
                  checked={config.cursorPersist ?? true}
                  onChange={next => onUpdate({ cursorPersist: next })}
                  label="Cursor persist"
                />
              </label>
              <p className="text-xs text-gray-400">
                Keep the blinking cursor visible once the animation finishes (the classic typewriter look). Turn off to fade it out.
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <p className="text-xs font-medium text-gray-700 mb-2">Example — rotating strings</p>
              <pre className="overflow-x-auto text-[11px] leading-relaxed text-gray-700 font-mono">{`<h1 class="am-typewriter"
  data-am-prefix="We "
  data-am-strings="design|code|launch"
  data-am-suffix=" for you!">
</h1>`}</pre>
              <p className="mt-2 text-[11px] text-gray-500">
                Separate strings with <code className="rounded bg-white px-1 py-0.5">|</code>. For strings that contain a <code>|</code>, pass a JSON array: <code className="rounded bg-white px-1 py-0.5">data-am-strings='["copy", "paste"]'</code>.
              </p>
            </div>
          </>
        )}

        {/* Cycle duration (float, pulse — continuous loops) */}
        {(moduleId === 'float' || moduleId === 'pulse') && (
          <div>
            <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">
              Cycle duration
              <span className="font-mono text-brand-500">{config.duration}s</span>
            </label>
            <p className="text-xs text-gray-400 mb-2">
              Length of one full loop ({moduleId === 'float' ? 'up then back down' : 'grow then shrink'}). Longer values feel calmer; shorter values feel more urgent.
            </p>
            <input
              type="range"
              min="0.3"
              max="10"
              step="0.1"
              value={config.duration}
              onChange={e => onUpdate({ duration: parseFloat(e.target.value) })}
              className="w-full accent-brand-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0.3s — Urgent</span>
              <span>10s — Calm</span>
            </div>
          </div>
        )}

        {/* Amplitude (float only) */}
        {moduleId === 'float' && (
          <div>
            <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">
              Amplitude
              <span className="font-mono text-brand-500">{config.amplitude ?? 12}px</span>
            </label>
            <p className="text-xs text-gray-400 mb-2">
              How far the element drifts up at the peak of each cycle.
            </p>
            <input
              type="range"
              min="2"
              max="50"
              step="1"
              value={config.amplitude ?? 12}
              onChange={e => onUpdate({ amplitude: parseInt(e.target.value, 10) })}
              className="w-full accent-brand-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>2px — Subtle</span>
              <span>50px — Dramatic</span>
            </div>
          </div>
        )}

        {/* Scale max (pulse only) */}
        {moduleId === 'pulse' && (
          <div>
            <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">
              Peak scale
              <span className="font-mono text-brand-500">{config.scaleMax ?? 1.05}</span>
            </label>
            <p className="text-xs text-gray-400 mb-2">
              Maximum size at the top of each pulse. Values close to 1.00 feel like a gentle breath; higher values feel attention-grabbing.
            </p>
            <input
              type="range"
              min="1.01"
              max="1.5"
              step="0.01"
              value={config.scaleMax ?? 1.05}
              onChange={e => onUpdate({ scaleMax: parseFloat(e.target.value) })}
              className="w-full accent-brand-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>1.01 — Breath</span>
              <span>1.5 — Heartbeat</span>
            </div>
          </div>
        )}

        {/* Clip Reveal — Shape selector */}
        {moduleId === 'clip-reveal' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reveal shape
            </label>
            <p className="text-xs text-gray-400 mb-2">
              How the image is uncovered when it enters the viewport. Default for elements that don't specify <code className="bg-gray-100 px-1 py-0.5 rounded">data-am-shape</code>.
            </p>
            <select
              value={config.shape ?? 'curtain-down'}
              onChange={e => onUpdate({ shape: e.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm
                         focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <optgroup label="Curtain">
                <option value="curtain-down">Curtain down (top → bottom)</option>
                <option value="curtain-up">Curtain up (bottom → top)</option>
                <option value="curtain-left">Curtain right (left → right)</option>
                <option value="curtain-right">Curtain left (right → left)</option>
              </optgroup>
              <optgroup label="Center split">
                <option value="center-h">Center horizontal (line splits sideways)</option>
                <option value="center-v">Center vertical (line splits up + down)</option>
              </optgroup>
              <optgroup label="Circle">
                <option value="circle">Circle expand (from center)</option>
              </optgroup>
            </select>
            <p className="mt-1.5 text-xs text-gray-400">
              Current: <span className="font-mono text-brand-500">{config.shape ?? 'curtain-down'}</span>
            </p>
          </div>
        )}

        {/* Spin — Speed (degrees per second) */}
        {moduleId === 'spin' && (
          <div>
            <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">
              Speed
              <span className="font-mono text-brand-500">{config.spinSpeed ?? 30}°/s</span>
            </label>
            <p className="text-xs text-gray-400 mb-2">
              Baseline rotation speed in degrees per second. Per-element override via <code className="bg-gray-100 px-1 py-0.5 rounded">data-am-speed</code>.
            </p>
            <input
              type="range"
              min="1"
              max="360"
              step="5"
              value={config.spinSpeed ?? 30}
              onChange={e => onUpdate({ spinSpeed: parseInt(e.target.value, 10) })}
              className="w-full accent-brand-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>1°/s — Subtle</span>
              <span>360°/s — Fast</span>
            </div>
          </div>
        )}

        {/* Spin — Direction (CW / CCW) */}
        {moduleId === 'spin' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Direction
            </label>
            <p className="text-xs text-gray-400 mb-2">
              Default rotation sense. Per-element override via <code className="bg-gray-100 px-1 py-0.5 rounded">data-am-direction="left"</code> or <code className="bg-gray-100 px-1 py-0.5 rounded">"right"</code>.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: 'right', label: 'Right (CW)',  icon: '↻' },
                { value: 'left',  label: 'Left (CCW)',  icon: '↺' },
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => onUpdate({ spinDirection: opt.value })}
                  className={`
                    rounded-lg border px-3 py-2.5 text-left transition-colors
                    ${(config.spinDirection ?? 'right') === opt.value
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
              Current: <span className="font-mono text-brand-500">{config.spinDirection ?? 'right'}</span>
            </p>
          </div>
        )}

        {/* Spin — Scroll boost */}
        {moduleId === 'spin' && (
          <div>
            <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">
              Scroll boost
              <span className="font-mono text-brand-500">{config.scrollBoost ?? 5}</span>
            </label>
            <p className="text-xs text-gray-400 mb-2">
              How much the scroll velocity adds to the rotation speed momentarily. <strong>0</strong> = scroll has no effect (constant baseline). Higher values make the rotation react more dramatically to scroll.
            </p>
            <input
              type="range"
              min="0"
              max="20"
              step="1"
              value={config.scrollBoost ?? 5}
              onChange={e => onUpdate({ scrollBoost: parseInt(e.target.value, 10) })}
              className="w-full accent-brand-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0 — No scroll reaction</span>
              <span>20 — Wild</span>
            </div>
          </div>
        )}

        {/* Magnetic — Range */}
        {moduleId === 'magnetic' && (
          <div>
            <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">
              Range
              <span className="font-mono text-brand-500">{config.range ?? 100}px</span>
            </label>
            <p className="text-xs text-gray-400 mb-2">
              Attraction radius around the element. The cursor has to enter this distance from the element's centre before the pull kicks in. Larger values make the effect feel "field-like"; smaller values feel "snappy & precise".
            </p>
            <input
              type="range"
              min="20"
              max="600"
              step="10"
              value={config.range ?? 100}
              onChange={e => onUpdate({ range: parseInt(e.target.value, 10) })}
              className="w-full accent-brand-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>20px — Tight</span>
              <span>600px — Wide field</span>
            </div>
          </div>
        )}

        {/* Magnetic — Strength */}
        {moduleId === 'magnetic' && (
          <div>
            <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">
              Strength
              <span className="font-mono text-brand-500">{config.strength ?? 30}</span>
            </label>
            <p className="text-xs text-gray-400 mb-2">
              How far the element travels toward the cursor, as a percentage of the cursor-to-centre distance.
            </p>
            <input
              type="range"
              min="1"
              max="100"
              step="1"
              value={config.strength ?? 30}
              onChange={e => onUpdate({ strength: parseInt(e.target.value, 10) })}
              className="w-full accent-brand-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>1 — Whisper</span>
              <span>100 — Stuck to cursor</span>
            </div>
          </div>
        )}

        {/* Magnetic — Smoothness */}
        {moduleId === 'magnetic' && (
          <div>
            <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">
              Smoothness
              <span className="font-mono text-brand-500">{config.smoothness ?? 0.15}</span>
            </label>
            <p className="text-xs text-gray-400 mb-2">
              Per-frame interpolation factor (LERP). Lower values feel heavy with inertia; higher values feel light and snappy.
            </p>
            <input
              type="range"
              min="0.01"
              max="1"
              step="0.01"
              value={config.smoothness ?? 0.15}
              onChange={e => onUpdate({ smoothness: parseFloat(e.target.value) })}
              className="w-full accent-brand-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0.01 — Heavy</span>
              <span>1 — Instant</span>
            </div>
          </div>
        )}

        {/* Magnetic — Axis */}
        {moduleId === 'magnetic' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Axis
            </label>
            <p className="text-xs text-gray-400 mb-2">
              Restrict movement to a single axis. Useful for nav links (horizontal only) or sidebars (vertical only).
            </p>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: 'both', label: 'Both',       icon: '✛' },
                { value: 'x',    label: 'Horizontal', icon: '↔' },
                { value: 'y',    label: 'Vertical',   icon: '↕' },
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => onUpdate({ axis: opt.value })}
                  className={`
                    rounded-lg border px-3 py-2.5 text-left transition-colors
                    ${(config.axis ?? 'both') === opt.value
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
              Current: <span className="font-mono text-brand-500">{config.axis ?? 'both'}</span>
            </p>
          </div>
        )}

        {/* Magnet — Strength */}
        {moduleId === 'magnet' && (
          <div>
            <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">
              Strength
              <span className="font-mono text-brand-500">{config.strength ?? 15}</span>
            </label>
            <p className="text-xs text-gray-400 mb-2">
              How far the element drifts toward the cursor, as a percentage of the mouse-to-centre offset. Higher values make the element follow the mouse more dramatically.
            </p>
            <input
              type="range"
              min="1"
              max="100"
              step="1"
              value={config.strength ?? 15}
              onChange={e => onUpdate({ strength: parseInt(e.target.value, 10) })}
              className="w-full accent-brand-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>1 — Whisper</span>
              <span>100 — Sticky</span>
            </div>
          </div>
        )}

        {/* Magnet — Smoothness */}
        {moduleId === 'magnet' && (
          <div>
            <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">
              Smoothness
              <span className="font-mono text-brand-500">{config.smoothness ?? 0.08}</span>
            </label>
            <p className="text-xs text-gray-400 mb-2">
              Per-frame interpolation factor (LERP). Lower values feel heavy with inertia and drag; higher values feel light and snappy.
            </p>
            <input
              type="range"
              min="0.01"
              max="1"
              step="0.01"
              value={config.smoothness ?? 0.08}
              onChange={e => onUpdate({ smoothness: parseFloat(e.target.value) })}
              className="w-full accent-brand-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0.01 — Heavy</span>
              <span>1 — Instant</span>
            </div>
          </div>
        )}

        {/* Magnet — Axis */}
        {moduleId === 'magnet' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Axis
            </label>
            <p className="text-xs text-gray-400 mb-2">
              Restrict the element's movement to a single axis. Useful for headlines (horizontal only) or sidebars (vertical only).
            </p>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: 'both', label: 'Both',       icon: '✛' },
                { value: 'x',    label: 'Horizontal', icon: '↔' },
                { value: 'y',    label: 'Vertical',   icon: '↕' },
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => onUpdate({ axis: opt.value })}
                  className={`
                    rounded-lg border px-3 py-2.5 text-left transition-colors
                    ${(config.axis ?? 'both') === opt.value
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
              Current: <span className="font-mono text-brand-500">{config.axis ?? 'both'}</span>
            </p>
          </div>
        )}

        {/* Skew angle (skew-up only) */}
        {moduleId === 'skew-up' && (
          <div>
            <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">
              Skew angle
              <span className="font-mono text-brand-500">{config.skew ?? 5}°</span>
            </label>
            <p className="text-xs text-gray-400 mb-2">
              Starting vertical skew. Straightens to 0° as the element settles. Stripe / Vercel-style default is a subtle 5°.
            </p>
            <input
              type="range"
              min="-20"
              max="20"
              step="1"
              value={config.skew ?? 5}
              onChange={e => onUpdate({ skew: parseInt(e.target.value, 10) })}
              className="w-full accent-brand-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>-20° — Left lean</span>
              <span>20° — Right lean</span>
            </div>
          </div>
        )}

        {/* Duration (hidden for typewriter, parallax, text-fill-scroll, float, pulse, img-parallax, magnet, scramble, spin, magnetic) */}
        {moduleId !== 'typewriter' && moduleId !== 'parallax' && moduleId !== 'text-fill-scroll' && moduleId !== 'float' && moduleId !== 'pulse' && moduleId !== 'img-parallax' && moduleId !== 'magnet' && moduleId !== 'scramble' && moduleId !== 'spin' && moduleId !== 'magnetic' && (
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

        {/* Delay (hidden for parallax, text-fill-scroll, img-parallax, hover-zoom, magnet, spin, magnetic) */}
        {moduleId !== 'parallax' && moduleId !== 'text-fill-scroll' && moduleId !== 'img-parallax' && moduleId !== 'hover-zoom' && moduleId !== 'magnet' && moduleId !== 'spin' && moduleId !== 'magnetic' && (
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

        {/* Stagger delay (split, text-reveal, stagger, grid-reveal, scatter, scramble) */}
        {(moduleId === 'split' || moduleId === 'text-reveal' || moduleId === 'stagger' || moduleId === 'grid-reveal' || moduleId === 'scatter' || moduleId === 'scramble') && (
          <div>
            <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">
              Stagger delay
              <span className="font-mono text-brand-500">{config.staggerDelay ?? (moduleId === 'text-reveal' ? 0.12 : moduleId === 'stagger' ? 0.1 : moduleId === 'grid-reveal' ? 0.08 : moduleId === 'scramble' ? 0.04 : 0.05)}s</span>
            </label>
            <p className="text-xs text-gray-400 mb-2">
              {moduleId === 'text-reveal'
                ? 'Time between each line starting its reveal.'
                : moduleId === 'stagger'
                ? 'Time between each child element starting its animation.'
                : moduleId === 'grid-reveal'
                ? 'Controls how spread out the ripple wave feels across all items.'
                : moduleId === 'scatter'
                ? 'Time between each letter or word starting its convergence.'
                : moduleId === 'scramble'
                ? 'Time between each character locking to its final value (controls how fast the decode wave races across).'
                : 'Time between each letter or word starting its animation.'}
            </p>
            <input
              type="range"
              min={moduleId === 'text-reveal' ? '0.05' : moduleId === 'stagger' ? '0.03' : moduleId === 'grid-reveal' ? '0.03' : moduleId === 'scramble' ? '0.01' : '0.01'}
              max={moduleId === 'text-reveal' ? '0.3' : moduleId === 'stagger' ? '0.5' : moduleId === 'grid-reveal' ? '0.3' : moduleId === 'scramble' ? '0.2' : '0.2'}
              step="0.01"
              value={config.staggerDelay ?? (moduleId === 'text-reveal' ? 0.12 : moduleId === 'stagger' ? 0.1 : moduleId === 'grid-reveal' ? 0.08 : moduleId === 'scramble' ? 0.04 : 0.05)}
              onChange={e => onUpdate({ staggerDelay: parseFloat(e.target.value) })}
              className="w-full accent-brand-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>{moduleId === 'text-reveal' ? '0.05s — Quick' : moduleId === 'stagger' ? '0.03s — Fast cascade' : moduleId === 'grid-reveal' ? '0.03s — Tight ripple' : moduleId === 'scramble' ? '0.01s — Snappy decode' : '0.01s — Fast cascade'}</span>
              <span>{moduleId === 'text-reveal' ? '0.3s — Dramatic' : moduleId === 'stagger' ? '0.5s — Slow sequence' : moduleId === 'grid-reveal' ? '0.3s — Wide wave' : moduleId === 'scramble' ? '0.2s — Slow reveal' : '0.2s — Slow reveal'}</span>
            </div>
          </div>
        )}

        {/* Scramble — Scramble speed */}
        {moduleId === 'scramble' && (
          <div>
            <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">
              Scramble speed
              <span className="font-mono text-brand-500">{config.scrambleSpeed ?? 0.05}s</span>
            </label>
            <p className="text-xs text-gray-400 mb-2">
              How often each unrevealed character swaps to a new random symbol. Lower values feel jittery and "live"; higher values feel like a slow flicker.
            </p>
            <input
              type="range"
              min="0.02"
              max="0.2"
              step="0.01"
              value={config.scrambleSpeed ?? 0.05}
              onChange={e => onUpdate({ scrambleSpeed: parseFloat(e.target.value) })}
              className="w-full accent-brand-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0.02s — Jittery</span>
              <span>0.2s — Slow flicker</span>
            </div>
          </div>
        )}

        {/* Scatter — Radius */}
        {moduleId === 'scatter' && (
          <div>
            <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">
              Scatter distance
              <span className="font-mono text-brand-500">{config.radius ?? 200}px</span>
            </label>
            <p className="text-xs text-gray-400 mb-2">
              How far each character/word starts from its final position. Spans are placed at a random offset within ± this value on both axes.
            </p>
            <input
              type="range"
              min="50"
              max="500"
              step="10"
              value={config.radius ?? 200}
              onChange={e => onUpdate({ radius: parseInt(e.target.value, 10) })}
              className="w-full accent-brand-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>50px — Tight</span>
              <span>500px — Chaos</span>
            </div>
          </div>
        )}

        {/* Scatter — Rotation max */}
        {moduleId === 'scatter' && (
          <div>
            <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">
              Rotation
              <span className="font-mono text-brand-500">{config.rotateMax ?? 45}°</span>
            </label>
            <p className="text-xs text-gray-400 mb-2">
              Maximum random rotation applied to each span at the starting position. Spans rotate back to 0° as they converge. Set to 0° to disable rotation entirely.
            </p>
            <input
              type="range"
              min="0"
              max="90"
              step="5"
              value={config.rotateMax ?? 45}
              onChange={e => onUpdate({ rotateMax: parseInt(e.target.value, 10) })}
              className="w-full accent-brand-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0° — Off</span>
              <span>90° — Heavy spin</span>
            </div>
          </div>
        )}

        {/* Distance (slide, split, stagger modules) */}
        {hasDistance(moduleId) && (
          <div>
            <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">
              Distance
              <span className="font-mono text-brand-500">{config.distance ?? (moduleId === 'split' ? 15 : moduleId === 'stagger' ? 20 : moduleId === 'skew-up' ? 40 : 30)}px</span>
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
              value={config.distance ?? (moduleId === 'split' ? 15 : moduleId === 'stagger' ? 20 : moduleId === 'skew-up' ? 40 : 30)}
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
              The marker color drawn behind the text. Accepts hex, <code className="rounded bg-gray-100 px-1 py-0.5 text-[11px]">rgba()</code>, or <code className="rounded bg-gray-100 px-1 py-0.5 text-[11px]">var(--my-token)</code>. Override per-element with <code className="rounded bg-gray-100 px-1 py-0.5 text-[11px]">data-am-highlight-color</code>.
            </p>
            <ColorField
              value={config.highlightColor ?? '#fde68a'}
              onChange={next => onUpdate({ highlightColor: next })}
              fallbackHex="#fde68a"
            />
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
              The muted color words start with before being filled. Accepts hex, <code className="rounded bg-gray-100 px-1 py-0.5 text-[11px]">rgba()</code>, or <code className="rounded bg-gray-100 px-1 py-0.5 text-[11px]">var(--my-token)</code>. Override per-element with <code className="rounded bg-gray-100 px-1 py-0.5 text-[11px]">data-am-color-base</code>.
            </p>
            <ColorField
              value={config.colorBase ?? '#cccccc'}
              onChange={next => onUpdate({ colorBase: next })}
              fallbackHex="#cccccc"
            />
          </div>
        )}

        {moduleId === 'text-fill-scroll' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fill color
            </label>
            <p className="text-xs text-gray-400 mb-2">
              The color words transition to as you scroll. Accepts hex, <code className="rounded bg-gray-100 px-1 py-0.5 text-[11px]">rgba()</code>, or <code className="rounded bg-gray-100 px-1 py-0.5 text-[11px]">var(--my-token)</code>. Override per-element with <code className="rounded bg-gray-100 px-1 py-0.5 text-[11px]">data-am-color-fill</code>.
            </p>
            <ColorField
              value={config.colorFill ?? '#000000'}
              onChange={next => onUpdate({ colorFill: next })}
              fallbackHex="#000000"
            />
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

        {/* Easing (hidden for typewriter, parallax, text-fill-scroll, img-parallax, magnet, scramble, spin, magnetic) */}
        {moduleId !== 'typewriter' && moduleId !== 'parallax' && moduleId !== 'text-fill-scroll' && moduleId !== 'img-parallax' && moduleId !== 'magnet' && moduleId !== 'scramble' && moduleId !== 'spin' && moduleId !== 'magnetic' && (
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

        {/* Activation margin (hidden for parallax, text-fill-scroll, img-parallax, hover-zoom, magnet, spin, magnetic) */}
        {moduleId !== 'parallax' && moduleId !== 'text-fill-scroll' && moduleId !== 'img-parallax' && moduleId !== 'hover-zoom' && moduleId !== 'magnet' && moduleId !== 'spin' && moduleId !== 'magnetic' && (
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
