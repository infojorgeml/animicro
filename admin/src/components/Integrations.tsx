import type { AnimicroSettings } from '../types';

interface IntegrationsProps {
  settings: AnimicroSettings;
  onUpdate: (partial: Partial<AnimicroSettings>) => void;
}

export default function Integrations({ settings, onUpdate }: IntegrationsProps) {
  const builders = window.animicroData.builders;

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Builder Compatibility</h2>
        <p className="text-sm text-gray-500">
          Select your main page builder. Animicro generates CSS that avoids conflicts
          with editor mode, ensuring animations only run on the frontend.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
        {Object.entries(builders).map(([id, name]) => {
          const isSelected = settings.active_builder === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onUpdate({ active_builder: id })}
              className={`
                flex items-center gap-3 rounded-lg border-2 p-4 text-left transition-all
                ${isSelected
                  ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500'
                  : 'border-gray-200 bg-white hover:border-gray-300'}
              `}
            >
              <span
                className={`
                  flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2
                  ${isSelected ? 'border-blue-500' : 'border-gray-300'}
                `}
              >
                {isSelected && (
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
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
