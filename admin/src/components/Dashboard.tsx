import { useState } from 'react';
import Toggle from './Toggle';
import ModuleSettings from './ModuleSettings';
import { MODULE_INFO } from '../data/modules';
import type { AnimicroSettings, ModuleConfig } from '../types';

const DEFAULT_MODULE_CONFIG: ModuleConfig = {
  duration: 0.6,
  easing:   'ease-out',
  delay:    0,
  margin:   '-50px 0px',
};

interface DashboardProps {
  settings: AnimicroSettings;
  isPremium: boolean;
  onToggleModule: (id: string) => void;
  onUpdateModuleSettings: (moduleId: string, partial: Partial<ModuleConfig>) => void;
}

export default function Dashboard({ settings, isPremium, onToggleModule, onUpdateModuleSettings }: DashboardProps) {
  const [settingsFor, setSettingsFor] = useState<string | null>(null);

  if (settingsFor) {
    const cfg = settings.module_settings?.[settingsFor] ?? DEFAULT_MODULE_CONFIG;
    return (
      <ModuleSettings
        moduleId={settingsFor}
        config={cfg}
        onUpdate={(partial) => onUpdateModuleSettings(settingsFor, partial)}
        onBack={() => setSettingsFor(null)}
      />
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Módulos de animación</h2>
        <p className="text-sm text-gray-500">
          Activa los módulos que necesites. Solo se carga el JS de los módulos activos.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {MODULE_INFO.map(mod => {
          const isLocked  = mod.isPro && !isPremium;
          const isActive  = !isLocked && settings.active_modules.includes(mod.id);

          return (
            <div
              key={mod.id}
              className={`
                rounded-lg border p-4 transition-colors
                ${isLocked
                  ? 'border-gray-200 bg-gray-50 opacity-60'
                  : isActive
                    ? 'border-blue-200 bg-blue-50/50'
                    : 'border-gray-200 bg-white'}
              `}
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0 mr-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-medium ${isLocked ? 'text-gray-400' : 'text-gray-900'}`}>
                      {mod.name}
                    </span>
                    <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
                      {mod.cssClass}
                    </code>
                    {mod.isPro && (
                      <span className={`
                        rounded-full px-2 py-0.5 text-xs font-semibold
                        ${isPremium
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-gray-200 text-gray-500'}
                      `}>
                        Pro
                      </span>
                    )}
                  </div>
                  <p className={`mt-1 text-sm ${isLocked ? 'text-gray-400' : 'text-gray-500'}`}>
                    {mod.description}
                  </p>
                  {isLocked && (
                    <p className="mt-1.5 text-xs text-amber-600">
                      Requiere licencia Pro.{' '}
                      <a
                        href="?page=animicro-license"
                        className="underline hover:text-amber-700"
                      >
                        Activar licencia
                      </a>
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isLocked ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-5 h-5 text-gray-300"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <>
                      {isActive && (
                        <button
                          onClick={() => setSettingsFor(mod.id)}
                          title={`Ajustes de ${mod.name}`}
                          className="rounded-md p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                          </svg>
                        </button>
                      )}
                      <Toggle
                        checked={isActive}
                        onChange={() => onToggleModule(mod.id)}
                        label={`Toggle ${mod.name}`}
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
