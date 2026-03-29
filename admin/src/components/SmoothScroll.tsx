import type { SmoothScrollConfig } from '../types';
import Toggle from './Toggle';

interface SmoothScrollProps {
  config: SmoothScrollConfig;
  onChange: <K extends keyof SmoothScrollConfig>(key: K, value: SmoothScrollConfig[K]) => void;
}

export default function SmoothScroll({ config, onChange }: SmoothScrollProps) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Smooth Scroll</h2>
        <p className="text-sm text-gray-500 mt-1">
          Adds butter-smooth scrolling to the entire page without breaking native features like{' '}
          <code className="text-xs bg-gray-100 px-1 rounded">position: sticky</code>, IntersectionObserver,
          or page builder editors.
        </p>
      </div>

      <div className="flex items-center justify-between max-w-lg">
        <div>
          <p className="text-sm font-medium text-gray-900">Enable Smooth Scroll</p>
          <p className="text-xs text-gray-500 mt-0.5">Applies globally to the entire frontend</p>
        </div>
        <Toggle
          checked={config.enabled}
          onChange={(v) => onChange('enabled', v)}
          label="Enable smooth scroll"
        />
      </div>

      {config.enabled && (
        <div className="space-y-6 max-w-lg border-t border-gray-100 pt-6">

          {/* Lerp */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-gray-700">Lerp (smoothness)</label>
              <span className="font-mono text-brand-500 text-sm">{config.lerp}</span>
            </div>
            <input
              type="range"
              min={0.01}
              max={0.5}
              step={0.01}
              value={config.lerp}
              onChange={e => onChange('lerp', parseFloat(e.target.value))}
              className="w-full accent-brand-500"
            />
            <p className="text-xs text-gray-400 mt-1">Lower = smoother, higher = snappier. Default: 0.1</p>
          </div>

          {/* Duration */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-gray-700">Duration</label>
              <span className="font-mono text-brand-500 text-sm">{config.duration}s</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={3.0}
              step={0.1}
              value={config.duration}
              onChange={e => onChange('duration', parseFloat(e.target.value))}
              className="w-full accent-brand-500"
            />
            <p className="text-xs text-gray-400 mt-1">Scroll animation length. Only applies when lerp is not set. Default: 1.2s</p>
          </div>

          {/* Wheel Multiplier */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-gray-700">Wheel multiplier</label>
              <span className="font-mono text-brand-500 text-sm">{config.wheelMultiplier}x</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={3.0}
              step={0.1}
              value={config.wheelMultiplier}
              onChange={e => onChange('wheelMultiplier', parseFloat(e.target.value))}
              className="w-full accent-brand-500"
            />
            <p className="text-xs text-gray-400 mt-1">Scales mouse wheel scroll speed. Default: 1.0x</p>
          </div>

          {/* Smooth Wheel */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Smooth wheel</p>
              <p className="text-xs text-gray-400 mt-0.5">Smooth scroll from mouse wheel events</p>
            </div>
            <Toggle
              checked={config.smoothWheel}
              onChange={(v) => onChange('smoothWheel', v)}
              label="Smooth wheel"
            />
          </div>

          {/* Anchors */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Smooth anchor links</p>
              <p className="text-xs text-gray-400 mt-0.5">Smooth scroll when clicking # anchor links</p>
            </div>
            <Toggle
              checked={config.anchors}
              onChange={(v) => onChange('anchors', v)}
              label="Smooth anchor links"
            />
          </div>

        </div>
      )}
    </div>
  );
}
