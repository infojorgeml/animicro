import { useState } from 'react';
import { MODULE_INFO, DATA_ATTRIBUTES } from '../data/modules';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      onClick={handleCopy}
      className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600
                 hover:bg-gray-200 transition-colors"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

export default function CheatSheet() {
  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <strong>Important:</strong> Use only one animation class per element. Do not combine <code className="rounded bg-amber-100 px-1">.am-fade</code> with <code className="rounded bg-amber-100 px-1">.am-slide-up</code> (or other entry animations) on the same element — it can cause flicker.
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">CSS Classes</h2>
        <p className="text-sm text-gray-500 mb-4">
          Add these classes to any element in your builder.
        </p>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium text-gray-700">Module</th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-700">Class</th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-700">Description</th>
                <th className="px-4 py-2.5 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {MODULE_INFO.map(mod => (
                <tr key={mod.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-2.5 font-medium text-gray-900">{mod.name}</td>
                  <td className="px-4 py-2.5">
                    <code className="rounded bg-blue-50 px-1.5 py-0.5 text-blue-700 text-xs">
                      {mod.cssClass}
                    </code>
                  </td>
                  <td className="px-4 py-2.5 text-gray-500">{mod.description}</td>
                  <td className="px-4 py-2.5">
                    <CopyButton text={mod.cssClass} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Data Attributes</h2>
        <p className="text-sm text-gray-500 mb-4">
          Override global values per element.
        </p>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium text-gray-700">Attribute</th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-700">Type</th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-700">Default</th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-700">Used by</th>
                <th className="px-4 py-2.5 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {DATA_ATTRIBUTES.map(attr => (
                <tr key={attr.attribute} className="hover:bg-gray-50/50">
                  <td className="px-4 py-2.5">
                    <code className="rounded bg-green-50 px-1.5 py-0.5 text-green-700 text-xs">
                      {attr.attribute}
                    </code>
                  </td>
                  <td className="px-4 py-2.5 text-gray-500">{attr.type}</td>
                  <td className="px-4 py-2.5 font-mono text-gray-700">{attr.defaultValue}</td>
                  <td className="px-4 py-2.5 text-gray-500">{attr.usedBy}</td>
                  <td className="px-4 py-2.5">
                    <CopyButton text={`${attr.attribute}="${attr.defaultValue}"`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
