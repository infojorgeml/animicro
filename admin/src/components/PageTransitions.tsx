import { useState } from 'react';
import Toggle from './Toggle';
import PageCurtainSettings from './PageCurtainSettings';
import { MODULE_INFO, DEFAULT_PAGE_CURTAIN_CONFIG } from '../data/modules';
import type { AnimicroSettings, ModuleConfig } from '../types';

/**
 * Page Transitions tab — lists every module with `category: 'page'` as a
 * compact toggleable card (same shape as Dashboard.tsx for module cards).
 * Clicking the gear icon on an active card drills down into a dedicated
 * settings page (PageCurtainSettings), mirroring the Modules → Settings
 * pattern. Keeps the UX consistent across tabs.
 */

interface PageTransitionsProps {
  settings: AnimicroSettings;
  onToggleModule: (id: string) => void;
  onUpdateModuleSettings: (moduleId: string, partial: Partial<ModuleConfig>) => void;
}

export default function PageTransitions({ settings, onToggleModule, onUpdateModuleSettings }: PageTransitionsProps) {
  const [settingsFor, setSettingsFor] = useState<string | null>(null);
  const pageModules = MODULE_INFO.filter(m => m.category === 'page');

  // Drilldown view: render the dedicated settings component for the
  // selected module. Currently only `page-curtain` exists; if more
  // page-level modules are added later, branch here on settingsFor.
  if (settingsFor === 'page-curtain') {
    const cfg = settings.module_settings?.['page-curtain'] ?? DEFAULT_PAGE_CURTAIN_CONFIG;
    return (
      <PageCurtainSettings
        config={cfg}
        onUpdate={(partial) => onUpdateModuleSettings('page-curtain', partial)}
        onBack={() => setSettingsFor(null)}
      />
    );
  }

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

      <div className="space-y-3">
        {pageModules.map(mod => {
          const isActive = settings.active_modules.includes(mod.id);

          return (
            <div
              key={mod.id}
              className={`
                rounded-lg border p-4 transition-colors
                ${isActive ? 'border-white bg-[#f6f6f6]' : 'border-gray-200 bg-white'}
              `}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 mr-3">
                  <p className="font-medium text-[14px] text-gray-900">{mod.name}</p>
                  <p className="mt-1 text-[13px] text-gray-500">{mod.description}</p>
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
}
