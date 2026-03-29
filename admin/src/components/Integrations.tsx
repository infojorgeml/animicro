import type { AnimicroSettings } from '../types';

interface IntegrationsProps {
  settings: AnimicroSettings;
  toggleBuilder: (builderId: string) => void;
}

export default function Integrations({ settings, toggleBuilder }: IntegrationsProps) {
  const builders = window.animicroData.builders;

  const handleToggle = (id: string) => {
    if (id === 'none') {
      const currentlyActive = settings.active_builders.includes('none');
      if (!currentlyActive) {
        settings.active_builders
          .filter((b: string) => b !== 'none')
          .forEach((b: string) => toggleBuilder(b));
      }
      toggleBuilder('none');
    } else {
      if (settings.active_builders.includes('none')) {
        toggleBuilder('none');
      }
      toggleBuilder(id);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Builder Compatibility</h2>
        <p className="text-sm text-gray-500">
          Select the page builders you use. Animicro generates CSS so elements stay
          visible inside those editors; animations only run on the live frontend.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
        {Object.entries(builders).map(([id, name]) => {
          const isSelected = settings.active_builders.includes(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => handleToggle(id)}
              className={`
                flex items-center gap-3 rounded-lg border-2 p-4 text-left transition-all
                ${isSelected
                  ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500'
                  : 'border-gray-200 bg-white hover:border-gray-300'}
              `}
            >
              <span
                className={`
                  flex h-5 w-5 shrink-0 items-center justify-center rounded border-2
                  ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}
                `}
              >
                {isSelected && (
                  <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
              <span className={`text-sm font-medium ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>
                {name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
