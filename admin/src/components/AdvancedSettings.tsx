import type { AdvancedConfig } from '../types';
import Toggle from './Toggle';

interface AdvancedSettingsProps {
  config: AdvancedConfig;
  onChange: <K extends keyof AdvancedConfig>(key: K, value: AdvancedConfig[K]) => void;
}

export default function AdvancedSettings({ config, onChange }: AdvancedSettingsProps) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Advanced</h2>
        <p className="text-sm text-gray-500 mt-1">
          Global behaviour settings that apply to all animation modules.
        </p>
      </div>

      <div className="space-y-6 max-w-lg divide-y divide-gray-100">

        {/* 1. Reduced Motion (Free) */}
        <div className="flex items-center justify-between pt-6 first:pt-0">
          <div className="pr-4">
            <p className="text-sm font-medium text-gray-900">Respect Reduced Motion</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Skip all animations when the visitor's OS has reduced motion enabled.
              Recommended for accessibility compliance (WCAG 2.1).
            </p>
          </div>
          <Toggle
            checked={config.reducedMotion}
            onChange={(v) => onChange('reducedMotion', v)}
            label="Respect reduced motion"
          />
        </div>

        {/* 2. Debug Mode (Free) */}
        <div className="flex items-center justify-between pt-6">
          <div className="pr-4">
            <p className="text-sm font-medium text-gray-900">Debug Mode</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Draws a red dashed outline around all <code className="text-xs bg-gray-100 px-1 rounded">.am-*</code> elements
              and logs JS load time to the browser console. Useful for troubleshooting.
            </p>
          </div>
          <Toggle
            checked={config.debugMode}
            onChange={(v) => onChange('debugMode', v)}
            label="Debug mode"
          />
        </div>

      </div>
    </div>
  );
}
