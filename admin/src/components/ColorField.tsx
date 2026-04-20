import { useEffect, useMemo, useState } from 'react';

interface ColorFieldProps {
  value: string;
  onChange: (next: string) => void;
  /** Fallback color shown in the native picker when value isn't a hex. */
  fallbackHex?: string;
}

/** Matches #RGB, #RGBA, #RRGGBB, #RRGGBBAA. */
const HEX_RE = /^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

function normalizeHex(hex: string): string {
  // Expand short forms to #RRGGBB / #RRGGBBAA.
  if (/^#[0-9a-fA-F]{3,4}$/.test(hex)) {
    const parts = hex.slice(1).split('').map(c => c + c).join('');
    return '#' + parts;
  }
  return hex;
}

function parseAlphaFromHex(hex: string): number {
  const norm = normalizeHex(hex);
  if (!/^#[0-9a-fA-F]{8}$/.test(norm)) return 1;
  return parseInt(norm.slice(7, 9), 16) / 255;
}

function hexBase(hex: string): string {
  const norm = normalizeHex(hex);
  if (/^#[0-9a-fA-F]{6,8}$/.test(norm)) return norm.slice(0, 7);
  return hex;
}

function setHexAlpha(hex: string, alpha: number): string {
  const base = hexBase(hex);
  if (!/^#[0-9a-fA-F]{6}$/.test(base)) return hex;
  if (alpha >= 1) return base; // drop alpha channel when fully opaque
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, '0');
  return base + a;
}

export default function ColorField({ value, onChange, fallbackHex = '#fde68a' }: ColorFieldProps) {
  // Local text state so the user can type freely without every keystroke committing.
  const [text, setText] = useState(value ?? '');

  useEffect(() => {
    setText(value ?? '');
  }, [value]);

  const isHex       = HEX_RE.test(text);
  const isVarOrFunc = /^(var\(|rgb|hsl)/i.test(text.trim());
  const alpha       = useMemo(() => (isHex ? parseAlphaFromHex(text) : 1), [text, isHex]);
  const pickerValue = isHex ? hexBase(normalizeHex(text)) : fallbackHex;

  function commit(next: string) {
    setText(next);
    onChange(next);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        {/* Native picker — only drives the RGB channels; alpha is kept from the current value. */}
        <div
          className="relative h-10 w-10 shrink-0 rounded-lg border border-gray-300 overflow-hidden"
          style={{
            // Checkerboard under transparent colors.
            backgroundImage:
              'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
            backgroundSize: '10px 10px',
            backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px',
          }}
        >
          <div
            className="absolute inset-0"
            style={{ background: isVarOrFunc ? text : (isHex ? text : pickerValue) }}
          />
          <input
            type="color"
            value={pickerValue}
            onChange={e => commit(setHexAlpha(e.target.value, alpha))}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label="Pick color"
          />
        </div>

        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          onBlur={() => onChange(text.trim())}
          onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
          placeholder="#fde68a, rgba(…), var(--brand-100)"
          spellCheck={false}
          className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-sm
                     focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      {/* Opacity slider — only meaningful for hex colors. rgba/hsla/var already carry their own alpha. */}
      <div>
        <label className="flex items-center justify-between text-xs font-medium text-gray-500 mb-1">
          Opacity
          <span className="font-mono text-gray-600">
            {isHex ? Math.round(alpha * 100) + '%' : '—'}
          </span>
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={isHex ? alpha : 1}
          disabled={!isHex}
          onChange={e => commit(setHexAlpha(text, parseFloat(e.target.value)))}
          className="w-full accent-brand-500 disabled:opacity-40 disabled:cursor-not-allowed"
        />
        {!isHex && text.trim() !== '' && (
          <p className="mt-1 text-[11px] text-gray-400">
            Opacity is controlled inside the value itself for{' '}
            <code className="rounded bg-gray-100 px-1 py-0.5">rgba()</code>,{' '}
            <code className="rounded bg-gray-100 px-1 py-0.5">hsla()</code>, and{' '}
            <code className="rounded bg-gray-100 px-1 py-0.5">var(--…)</code>.
          </p>
        )}
      </div>
    </div>
  );
}
