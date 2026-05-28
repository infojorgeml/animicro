import { DATA_ATTRIBUTES } from '../data/modules';
import CopyClassButton from './CopyClassButton';

/**
 * Per-module data-am-* attributes panel.
 *
 * Renders a compact table of `data-am-*` attributes that apply to the
 * current module, filtered out of the global DATA_ATTRIBUTES list. The
 * filtering reads the `usedBy` string each attribute carries and matches
 * either:
 *   - the literal "All" (generic attributes: duration, delay, easing,
 *     margin),
 *   - the exact module id as a token in the comma/semicolon-separated
 *     list (e.g. "fade, scale, slide-*" matches `fade`),
 *   - or a wildcard token like "slide-*" (matches `slide-up`, etc.).
 *
 * Description text after an em-dash (—) or open paren is stripped from
 * the tokenisation so we don't try to match against value lists like
 * "pingpong | restart".
 *
 * Goal: keep each module's drill-down focused. Instead of forcing users
 * to scroll through the entire Cheat Sheet looking for which attributes
 * apply to `am-fade`, this panel shows only the relevant ones inline
 * under the module's controls.
 */

interface ModuleDataAttributesProps {
  moduleId: string;
}

function appliesTo(usedBy: string, moduleId: string): boolean {
  if (usedBy === 'All') return true;
  // Take only the portion before description punctuation. The text
  // after the first em-dash or "(" is just human-readable description
  // (e.g. "magnet — pull strength as %" → we only look at "magnet").
  const head = usedBy.split(/[—(]/)[0];
  const tokens = head
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
  for (const token of tokens) {
    if (token === moduleId) return true;
    // Wildcard support: "slide-*" matches "slide-up", "slide-down", etc.
    if (token.endsWith('-*')) {
      const prefix = token.slice(0, -2);
      if (moduleId.startsWith(prefix + '-')) return true;
    }
  }
  return false;
}

export default function ModuleDataAttributes({ moduleId }: ModuleDataAttributesProps) {
  const attrs = DATA_ATTRIBUTES.filter((a) => appliesTo(a.usedBy, moduleId));
  if (!attrs.length) return null;

  return (
    <div className="mt-10">
      <h3 className="text-sm font-semibold text-gray-900">Per-element attributes</h3>
      <p className="mt-1 text-xs text-gray-500 mb-3">
        Override these settings on individual elements by adding the matching <code className="rounded bg-gray-100 px-1 py-0.5 text-[11px]">data-am-*</code> attribute on the HTML tag. Per-element values always win over the global defaults above.
      </p>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Attribute</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Type</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Default</th>
              <th className="px-3 py-2 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {attrs.map((a) => (
              <tr key={a.attribute} className="hover:bg-gray-50/50">
                <td className="px-3 py-2">
                  <code className="rounded bg-green-50 px-1.5 py-0.5 text-green-700 text-[11px]">
                    {a.attribute}
                  </code>
                </td>
                <td className="px-3 py-2 text-gray-500">{a.type}</td>
                <td className="px-3 py-2 font-mono text-gray-700">{a.defaultValue}</td>
                <td className="px-3 py-2">
                  <CopyClassButton
                    text={`${a.attribute}="${a.defaultValue}"`}
                    label={`Copy ${a.attribute}`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
