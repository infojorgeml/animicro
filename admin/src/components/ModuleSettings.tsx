import { EASING_OPTIONS, MARGIN_OPTIONS, MODULE_INFO } from '../data/modules';
import type { ModuleConfig } from '../types';

interface ModuleSettingsProps {
  moduleId: string;
  config: ModuleConfig;
  onUpdate: (partial: Partial<ModuleConfig>) => void;
  onBack: () => void;
}

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
          Módulos
        </button>
        <span className="text-gray-300">/</span>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900">{mod?.name ?? moduleId}</span>
          <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">{mod?.cssClass}</code>
        </div>
      </div>

      <div className="space-y-8 max-w-lg">

        {/* Duración */}
        <div>
          <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">
            Duración
            <span className="font-mono text-blue-600">{config.duration}s</span>
          </label>
          <p className="text-xs text-gray-400 mb-2">
            Define si la animación se siente rápida y eléctrica, o suave y cinematográfica.
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
            <span>0.1s — Eléctrico</span>
            <span>2.0s — Cinematográfico</span>
          </div>
        </div>

        {/* Easing */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Curva de aceleración
          </label>
          <p className="text-xs text-gray-400 mb-2">
            Controla cómo acelera y desacelera la animación a lo largo del tiempo.
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

        {/* Delay */}
        <div>
          <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">
            Delay
            <span className="font-mono text-blue-600">{config.delay}s</span>
          </label>
          <p className="text-xs text-gray-400 mb-2">
            Tiempo de espera antes de que comience la animación.
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
            <span>0s — Inmediato</span>
            <span>2.0s</span>
          </div>
        </div>

        {/* Margen de activación */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Margen de activación
          </label>
          <p className="text-xs text-gray-400 mb-2">
            Define qué tan adentro de la pantalla debe entrar el elemento antes de animarse.
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
          <p className="mt-2 text-xs text-gray-400 font-mono">
            Valor: <code>{config.margin}</code>
            {' · '}
            <span className="not-italic">Se puede sobrescribir con </span>
            <code>data-margin</code>
          </p>
        </div>

      </div>
    </div>
  );
}
