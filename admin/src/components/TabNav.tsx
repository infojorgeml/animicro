export type TabId = 'modules' | 'cheatsheet' | 'smooth-scroll' | 'integrations';

interface Tab {
  id: TabId;
  label: string;
  isPro?: boolean;
}

const TABS: Tab[] = [
  { id: 'modules',      label: 'Modules' },
  { id: 'cheatsheet',   label: 'Cheat Sheet', isPro: true },
  { id: 'smooth-scroll', label: 'Smooth Scroll', isPro: true },
  { id: 'integrations', label: 'Integrations' },
];

interface TabNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  isPremium: boolean;
}

export default function TabNav({ activeTab, onTabChange, isPremium }: TabNavProps) {
  return (
    <nav className="flex border-b border-gray-200 mb-6">
      {TABS.map(tab => {
        const locked = tab.isPro && !isPremium;
        return (
          <button
            key={tab.id}
            onClick={() => !locked && onTabChange(tab.id)}
            className={`
              px-4 py-2.5 text-sm font-medium -mb-px border-b-2 transition-colors flex items-center gap-1.5
              ${locked
                ? 'border-transparent text-gray-300 cursor-not-allowed'
                : activeTab === tab.id
                  ? 'border-brand-500 text-brand-500'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
          >
            {tab.label}
            {tab.isPro && (
              <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 leading-none">
                Pro
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
