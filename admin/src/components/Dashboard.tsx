import { useState } from 'react';
import CopyClassButton from './CopyClassButton';
import Toggle from './Toggle';
import ModuleSettings from './ModuleSettings';
import { MODULE_INFO, MODULE_CATEGORIES } from '../data/modules';
import type { AnimicroSettings, ModuleConfig } from '../types';

const DEFAULT_MODULE_CONFIG: ModuleConfig = {
  duration: 0.6,
  easing:   'ease-out',
  delay:    0,
  margin:   '-50px 0px',
};

interface DashboardProps {
  settings: AnimicroSettings;
  onToggleModule: (id: string) => void;
  onUpdateModuleSettings: (moduleId: string, partial: Partial<ModuleConfig>) => void;
}

export default function Dashboard({ settings, onToggleModule, onUpdateModuleSettings }: DashboardProps) {
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
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Animation modules</h2>
        <p className="text-sm text-gray-500">
          Enable the modules you need. Only the JS of active modules is loaded.
        </p>
      </div>

      <div className="space-y-8">
        {MODULE_CATEGORIES.map(cat => {
          const modules = MODULE_INFO.filter(m => m.category === cat.id);
          if (!modules.length) return null;

          return (
            <div key={cat.id}>
              <div className="mb-3">
                <h2 className="text-sm font-semibold text-gray-700">{cat.label}</h2>
                <p className="text-[14px] text-gray-400">{cat.description}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {modules.map(mod => {
                  const isActive = settings.active_modules.includes(mod.id);

                  return (
                    <div
                      key={mod.id}
                      className={`
                        rounded-lg border p-4 transition-colors
                        ${isActive
                          ? 'border-brand-200 bg-brand-50/50'
                          : 'border-gray-200 bg-white'}
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 mr-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-[14px] text-gray-900">
                              {mod.name}
                            </span>
                            {(mod.cssClass ?? '').trim().split(/\s+/).filter(Boolean).map((cls, i) => (
                              <span key={i} className="inline-flex items-center gap-1">
                                <code className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-600">{cls}</code>
                                <CopyClassButton text={cls} label={`Copy ${cls}`} />
                              </span>
                            ))}
                          </div>
                          <p className="mt-1 text-[13px] text-gray-500">
                            {mod.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isActive && (
                            <button
                              onClick={() => setSettingsFor(mod.id)}
                              title={`Settings for ${mod.name}`}
                              className="rounded-md p-1.5 bg-brand-500 text-white hover:bg-brand-600 hover:text-white transition-colors"
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
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
        <p>
          <strong>Important:</strong> Use only one animation class per element. Do not combine <code className="rounded bg-amber-100 px-1 text-[11px]">.am-fade</code> with <code className="rounded bg-amber-100 px-1 text-[11px]">.am-slide-up</code> (or other entry animations) on the same element — it can cause flicker.
        </p>
      </div>
    </div>
  );
}
