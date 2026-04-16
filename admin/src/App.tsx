import { useState } from 'react';
import './types';
import { useSettings } from './hooks/useSettings';
import TabNav, { type TabId } from './components/TabNav';
import Dashboard from './components/Dashboard';
import AdvancedSettings from './components/AdvancedSettings';
import Integrations from './components/Integrations';

export default function App() {
  const { version } = window.animicroData;
  const { settings, updateModuleSettings, updateAdvanced, toggleModule, toggleBuilder, save, isDirty, isSaving, saveMessage } = useSettings();
  const [activeTab, setActiveTab] = useState<TabId>('modules');

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Animicro</h1>
          <p className="text-sm text-gray-500">v{version}</p>
        </div>

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
      </div>

      <TabNav activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        {activeTab === 'modules' && (
          <Dashboard
            settings={settings}
            onToggleModule={toggleModule}
            onUpdateModuleSettings={updateModuleSettings}
          />
        )}
        {activeTab === 'advanced' && (
          <AdvancedSettings config={settings.advanced} onChange={updateAdvanced} />
        )}
        {activeTab === 'integrations' && (
          <Integrations settings={settings} toggleBuilder={toggleBuilder} />
        )}
      </div>
    </div>
  );
}
