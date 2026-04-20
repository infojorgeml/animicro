import { useState } from 'react';

const ERROR_MESSAGES: Record<string, string> = {
  ok:                 'License valid',
  no_license:         'No license key has been entered',
  not_found:          'License key not found. Please verify the key is correct.',
  expired:            'License has expired. Please renew it.',
  disabled:           'License has been deactivated. Contact support.',
  domain_mismatch:    'Domain does not match the domain registered for this license.',
  product_mismatch:   'This license is not valid for Animicro.',
  connection_error:   'Could not connect to the license server. Check your connection.',
  server_error:       'License server error. Please try again later.',
  invalid_response:   'Invalid response from server. Please try again.',
  function_not_found: 'Validation service temporarily unavailable.',
};

interface SaveResult {
  success: boolean;
  is_premium: boolean;
  message: string;
  data: {
    valid: boolean;
    reason: string;
    plan: string | null;
    expires_at?: string;
    registered_domain?: string;
  };
}

export default function LicensePage() {
  const { restUrl, nonce, isPremium, licenseKey: initialKey } = window.animicroData;

  const [licenseKey, setLicenseKey]   = useState(initialKey ?? '');
  const [isSaving, setIsSaving]       = useState(false);
  const [result, setResult]           = useState<SaveResult | null>(null);
  const [isRemoving, setIsRemoving]   = useState(false);

  const activeLicense = isPremium || (result?.is_premium ?? false);

  async function handleSave() {
    if (!licenseKey.trim()) return;
    setIsSaving(true);
    setResult(null);

    try {
      const res = await fetch(`${restUrl}license/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': nonce,
        },
        body: JSON.stringify({ license_key: licenseKey.trim().toUpperCase() }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: SaveResult = await res.json();
      setResult(data);
    } catch {
      setResult({
        success: false,
        is_premium: false,
        message: 'Could not connect to the server.',
        data: { valid: false, reason: 'connection_error', plan: null },
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRemove() {
    setIsRemoving(true);
    setResult(null);

    try {
      const res = await fetch(`${restUrl}license/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': nonce,
        },
        body: JSON.stringify({ license_key: '' }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: SaveResult = await res.json();
      setResult(data);
      setLicenseKey('');
    } catch {
      setResult({
        success: false,
        is_premium: false,
        message: 'Could not connect to the server.',
        data: { valid: false, reason: 'connection_error', plan: null },
      });
    } finally {
      setIsRemoving(false);
    }
  }

  const currentlyPremium = result !== null ? result.is_premium : isPremium;
  const plan = result?.data?.plan ?? (isPremium ? 'pro' : 'free');

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Pro License</h2>
        <p className="text-sm text-gray-500 mt-1">
          Activate your license to unlock Pro modules.
        </p>
      </div>

      {/* Status card */}
      <div className={`
        rounded-lg border p-4 mb-6
        ${currentlyPremium ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}
      `}>
        <div className="flex items-center gap-3">
          <div className={`
            w-3 h-3 rounded-full shrink-0
            ${currentlyPremium ? 'bg-green-500' : 'bg-gray-300'}
          `} />
          <div>
            <p className="text-sm font-medium text-gray-900">
              {currentlyPremium ? 'License active' : 'No active license'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Plan:{' '}
              <span className={`font-semibold ${currentlyPremium ? 'text-green-700' : 'text-gray-500'}`}>
                {currentlyPremium ? plan?.toUpperCase() ?? 'Pro' : 'Free'}
              </span>
              {result?.data?.registered_domain && (
                <> · Domain: <span className="font-mono">{result.data.registered_domain}</span></>
              )}
              {result?.data?.expires_at && (
                <> · Expires: {new Date(result.data.expires_at).toLocaleDateString()}</>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* License key input */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          License key
        </label>
        <input
          type="text"
          value={licenseKey}
          onChange={e => setLicenseKey(e.target.value.toUpperCase())}
          placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-sm
                     focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          spellCheck={false}
        />

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={isSaving || !licenseKey.trim()}
            className={`
              rounded-lg px-4 py-2 text-sm font-medium text-white transition-all
              ${!isSaving && licenseKey.trim()
                ? 'bg-brand-500 hover:bg-brand-600 shadow-sm'
                : 'bg-gray-300 cursor-not-allowed'}
            `}
          >
            {isSaving ? 'Verifying...' : 'Activate license'}
          </button>

          {(currentlyPremium || !!initialKey) && (
            <button
              onClick={handleRemove}
              disabled={isRemoving}
              className="rounded-lg px-4 py-2 text-sm font-medium text-red-600 border border-red-200
                         hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRemoving ? 'Removing...' : 'Remove license'}
            </button>
          )}
        </div>
      </div>

      {/* Result message */}
      {result !== null && (
        <div className={`
          mt-4 rounded-lg border px-4 py-3 text-sm
          ${result.is_premium
            ? 'border-green-200 bg-green-50 text-green-800'
            : 'border-red-200 bg-red-50 text-red-800'}
        `}>
          <p className="font-medium">
            {result.is_premium ? 'License activated successfully!' : 'Error activating license'}
          </p>
          <p className="mt-0.5 text-xs opacity-80">
            {ERROR_MESSAGES[result.data?.reason] ?? result.message}
          </p>
          {result.is_premium && (
            <p className="mt-2 text-xs">
              Reload the panel page to see Pro modules unlocked.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
