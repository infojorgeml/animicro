import { useCallback, useState } from 'react';

const BTN_IDLE =
  'rounded-md p-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 transition-colors shrink-0';
const BTN_COPIED =
  'rounded-md p-1.5 bg-emerald-50 text-emerald-700 transition-colors shrink-0';

interface CopyClassButtonProps {
  text: string;
  /** Shown in title when not copied */
  label?: string;
}

export default function CopyClassButton({ text, label }: CopyClassButtonProps) {
  const [copied, setCopied] = useState(false);

  const handle = useCallback(async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
      } finally {
        document.body.removeChild(ta);
      }
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }, [text]);

  const title = copied ? 'Copied!' : label ?? `Copy ${text}`;

  return (
    <button
      type="button"
      onClick={handle}
      title={title}
      aria-label={title}
      className={copied ? BTN_COPIED : BTN_IDLE}
    >
      {copied ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 8.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v8.25A2.25 2.25 0 006 16.5h2.25m8.25-8.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-8.25A2.25 2.25 0 017.5 18v-7.5a2.25 2.25 0 012.25-2.25H9"
          />
        </svg>
      )}
    </button>
  );
}
