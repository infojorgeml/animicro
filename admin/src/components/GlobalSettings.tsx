import { EASING_OPTIONS } from '../data/modules';
import type { AnimicroSettings } from '../types';

interface GlobalSettingsProps {
  settings: AnimicroSettings;
  onUpdate: (partial: Partial<AnimicroSettings>) => void;
}

export default function GlobalSettings({ settings, onUpdate }: GlobalSettingsProps) {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Ajustes globales</h2>
        <p className="text-sm text-gray-500">
          Valores por defecto para todas las animaciones. Se pueden sobrescribir por elemento con atributos data-*.
        </p>
      </div>

      <div className="space-y-6 max-w-lg">
        <div>
          <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
            Duración
            <span className="font-mono text-blue-600">{settings.global_duration}s</span>
          </label>
          <input
            type="range"
            min="0.1"
            max="3"
            step="0.1"
            value={settings.global_duration}
            onChange={e => onUpdate({ global_duration: parseFloat(e.target.value) })}
            className="w-full accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0.1s</span>
            <span>3.0s</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Easing
          </label>
          <select
            value={settings.global_easing}
            onChange={e => onUpdate({ global_easing: e.target.value })}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm
                       focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {EASING_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
            Delay
            <span className="font-mono text-blue-600">{settings.global_delay}s</span>
          </label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={settings.global_delay}
            onChange={e => onUpdate({ global_delay: parseFloat(e.target.value) })}
            className="w-full accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0s</span>
            <span>2.0s</span>
          </div>
        </div>
      </div>
    </div>
  );
}
