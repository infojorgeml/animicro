export type TabId = 'modules' | 'advanced' | 'integrations';

interface Tab {
  id: TabId;
  label: string;
}

const TABS: Tab[] = [
  { id: 'modules',      label: 'Modules' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'advanced',      label: 'Advanced' },
];

interface TabNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export default function TabNav({ activeTab, onTabChange }: TabNavProps) {
  return (
    <nav className="flex border-b border-gray-200 mb-6">
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`
            px-4 py-2.5 text-sm font-medium -mb-px border-b-2 transition-colors
            ${activeTab === tab.id
              ? 'border-brand-500 text-brand-500'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
          `}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
