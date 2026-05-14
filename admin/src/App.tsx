import { useState } from 'react';
import './types';
import { useSettings } from './hooks/useSettings';
import TabNav, { type TabId } from './components/TabNav';
import Dashboard from './components/Dashboard';
import CheatSheet from './components/CheatSheet';
import SmoothScroll from './components/SmoothScroll';
import AdvancedSettings from './components/AdvancedSettings';
import PageTransitions from './components/PageTransitions';
import LicensePage from './components/LicensePage';

export default function App() {
  const { version, page, isPremium } = window.animicroData;
  const { settings, updateModuleSettings, updateSmoothScroll, updateAdvanced, toggleModule, save, isDirty, isSaving, saveMessage } = useSettings();
  const [activeTab, setActiveTab] = useState<TabId>('modules');

  const isLicensePage = page === 'license';

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Animicro</h1>
          <p className="text-sm text-gray-500">
            v{version}
            {isPremium && (
              <span className="ml-2 rounded bg-[#ffeeb5] px-2 py-1 text-xs font-semibold uppercase text-[#ad8700]">
                Pro
              </span>
            )}
          </p>
        </div>

        {!isLicensePage && (
          <div className="flex items-center gap-3">
            {saveMessage && (
              <span className={`text-sm ${saveMessage === 'Saved' ? 'text-green-600' : 'text-red-600'}`}>
                {saveMessage}
              </span>
            )}
            <button
              onClick={save}
              disabled={!isDirty || isSaving}
              className={`
                rounded-lg px-4 py-2 text-sm font-medium text-white transition-all
                ${isDirty && !isSaving
                  ? 'bg-brand-500 hover:bg-brand-600 shadow-sm'
                  : 'bg-gray-300 cursor-not-allowed'}
              `}
            >
              {isSaving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        )}
      </div>

      {isLicensePage ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <LicensePage />
        </div>
      ) : (
        <>
          <TabNav activeTab={activeTab} onTabChange={setActiveTab} isPremium={isPremium} />

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            {activeTab === 'modules' && (
              <Dashboard
                settings={settings}
                isPremium={isPremium}
                onToggleModule={toggleModule}
                onUpdateModuleSettings={updateModuleSettings}
              />
            )}
            {activeTab === 'page-transitions' && (
              <PageTransitions
                settings={settings}
                onToggleModule={toggleModule}
                onUpdateModuleSettings={updateModuleSettings}
              />
            )}
            {activeTab === 'cheatsheet' && isPremium && <CheatSheet />}
            {activeTab === 'smooth-scroll' && isPremium && (
              <SmoothScroll config={settings.smooth_scroll} onChange={updateSmoothScroll} />
            )}
            {activeTab === 'advanced' && (
              <AdvancedSettings config={settings.advanced} onChange={updateAdvanced} />
            )}
          </div>
        </>
      )}
    </div>
  );
}
