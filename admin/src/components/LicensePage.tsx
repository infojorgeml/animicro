import { useEffect, useState } from 'react';
import type { LicenseStatus } from '../types';

/**
 * LicenSuite v3 — Connect-flow license page.
 *
 * Renders four states based on the `state` field returned by
 * GET /animicro/v1/license/status:
 *
 *   - "dev"               : neutral card, Pro unlocked locally.
 *   - "pending_reconnect" : orange banner; user upgraded from 1.11.x and
 *                           must reconnect (legacy license_key still on disk).
 *   - "connected"         : green card with plan / expires / sites + Disconnect.
 *   - "disconnected"      : prompt with the primary "Connect" button.
 *
 * The Connect button calls /license/connect-url to get the dashboard URL,
 * then opens it in a new tab. The dashboard redirects back to
 * ?action=connect-callback&token=…&state=… which Animicro_Admin handles
 * server-side and then bounces to the clean license page; we re-fetch the
 * status here on mount via the standard React lifecycle.
 */
export default function LicensePage() {
  const { restUrl, nonce } = window.animicroData;

  const [status, setStatus]         = useState<LicenseStatus | null>(null);
  const [loading, setLoading]       = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [transientError, setTransientError] = useState<string | null>(null);

  async function fetchStatus() {
    setLoading(true);
    try {
      const res = await fetch(`${restUrl}license/status`, {
        headers: { 'X-WP-Nonce': nonce },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: LicenseStatus = await res.json();
      setStatus(data);
    } catch {
      setTransientError('Could not load license status. Refresh the page to retry.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStatus();
  }, []);

  async function handleConnect() {
    setConnecting(true);
    setTransientError(null);
    try {
      const res = await fetch(`${restUrl}license/connect-url`, {
        headers: { 'X-WP-Nonce': nonce },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: { url: string } = await res.json();
      window.open(data.url, '_blank', 'noopener');
    } catch {
      setTransientError('Could not start the Connect flow. Try again.');
    } finally {
      setConnecting(false);
    }
  }

  async function handleDisconnect() {
    if (!confirm('Disconnect this site from your license? Pro modules will lock until you reconnect.')) {
      return;
    }
    setDisconnecting(true);
    setTransientError(null);
    try {
      const res = await fetch(`${restUrl}license/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': nonce },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await fetchStatus();
    } catch {
      setTransientError('Could not disconnect. Try again.');
    } finally {
      setDisconnecting(false);
    }
  }

  if (loading || !status) {
    return (
      <div className="max-w-xl">
        <Header />
        <p className="text-sm text-gray-500">Loading license status…</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <Header />

      {/* Connect-flow error from the previous redirect, surfaced once */}
      {status.connect_error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <p className="font-medium">Connection failed</p>
          <p className="mt-0.5 text-xs opacity-80">{status.connect_error.message}</p>
        </div>
      )}

      {transientError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {transientError}
        </div>
      )}

      {status.state === 'dev' && <DevModeCard />}

      {status.state === 'pending_reconnect' && (
        <PendingReconnectCard
          onReconnect={handleConnect}
          isConnecting={connecting}
        />
      )}

      {status.state === 'connected' && (
        <ConnectedCard
          status={status}
          onDisconnect={handleDisconnect}
          isDisconnecting={disconnecting}
        />
      )}

      {status.state === 'disconnected' && (
        <DisconnectedCard
          onConnect={handleConnect}
          isConnecting={connecting}
        />
      )}
    </div>
  );
}

function Header() {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-gray-900">Pro License</h2>
      <p className="text-sm text-gray-500 mt-1">
        Connect this site to your account to unlock Pro modules.
      </p>
    </div>
  );
}

function DevModeCard() {
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
      <div className="flex items-start gap-3">
        <div className="w-3 h-3 rounded-full bg-blue-500 shrink-0 mt-1.5" />
        <div>
          <p className="text-sm font-medium text-gray-900">Development mode</p>
          <p className="text-xs text-gray-600 mt-1">
            This site is running on a local domain
            (<code className="font-mono text-[11px] bg-blue-100 px-1 rounded">localhost</code>,
            <code className="font-mono text-[11px] bg-blue-100 px-1 rounded">.local</code>,
            <code className="font-mono text-[11px] bg-blue-100 px-1 rounded">.test</code>,
            …). Pro features are unlocked automatically — no Connect needed.
          </p>
          <p className="text-xs text-gray-500 mt-2">
            To test the real Connect flow locally, add{' '}
            <code className="font-mono text-[11px] bg-blue-100 px-1 rounded">add_filter('animicro_is_development_domain', '__return_false');</code>{' '}
            to your <code className="font-mono text-[11px]">wp-config.php</code>.
          </p>
        </div>
      </div>
    </div>
  );
}

function DisconnectedCard({
  onConnect,
  isConnecting,
}: {
  onConnect: () => void;
  isConnecting: boolean;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-3 h-3 rounded-full bg-gray-300 shrink-0" />
        <p className="text-sm font-medium text-gray-900">Not connected</p>
      </div>

      <p className="text-sm text-gray-600 mb-5">
        Click <strong>Connect</strong> below. We will open your LicenSuite dashboard in a new tab,
        you log in, pick the license you want to use on this site, and you are sent back here
        connected. No license key to copy or paste.
      </p>

      <button
        onClick={onConnect}
        disabled={isConnecting}
        className={`
          rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-all
          ${isConnecting
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-brand-500 hover:bg-brand-600 shadow-sm'}
        `}
      >
        {isConnecting ? 'Opening dashboard…' : 'Connect to your account'}
      </button>
    </div>
  );
}

function PendingReconnectCard({
  onReconnect,
  isConnecting,
}: {
  onReconnect: () => void;
  isConnecting: boolean;
}) {
  return (
    <div className="rounded-lg border-2 border-orange-300 bg-orange-50 p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-3 h-3 rounded-full bg-orange-500 shrink-0" />
        <p className="text-sm font-semibold text-orange-900">Reconnect required</p>
      </div>

      <p className="text-sm text-orange-900 mb-2">
        Animicro Pro upgraded its licensing system to a more secure connection-based flow
        (no more pasting keys). Your existing license is still valid — you just need to
        link it to this site one more time.
      </p>
      <p className="text-xs text-orange-800 mb-5 opacity-80">
        Pro modules are temporarily locked until you reconnect.
      </p>

      <button
        onClick={onReconnect}
        disabled={isConnecting}
        className={`
          rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-all
          ${isConnecting
            ? 'bg-orange-300 cursor-not-allowed'
            : 'bg-orange-600 hover:bg-orange-700 shadow-sm'}
        `}
      >
        {isConnecting ? 'Opening dashboard…' : 'Reconnect now'}
      </button>
    </div>
  );
}

function ConnectedCard({
  status,
  onDisconnect,
  isDisconnecting,
}: {
  status: LicenseStatus;
  onDisconnect: () => void;
  isDisconnecting: boolean;
}) {
  const planLabel = status.plan ? status.plan.toUpperCase() : 'PRO';
  const expires   = status.expires_at
    ? new Date(status.expires_at).toLocaleDateString()
    : null;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-3 h-3 rounded-full bg-green-500 shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-900">License active</p>
            <p className="text-xs text-gray-600 mt-0.5">
              Plan: <span className="font-semibold text-green-800">{planLabel}</span>
              {expires && <> · Renews/expires <span className="font-medium">{expires}</span></>}
            </p>
          </div>
        </div>

        {status.sites && !status.sites.unlimited && status.sites.max !== null && (
          <p className="text-xs text-gray-600 mt-2">
            Sites in use: <strong>{status.sites.used}</strong> of <strong>{status.sites.max}</strong>
          </p>
        )}

        {status.sites?.unlimited && (
          <p className="text-xs text-gray-600 mt-2">
            Unlimited sites on this plan.
          </p>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <p className="text-sm font-medium text-gray-900 mb-1">Disconnect this site</p>
        <p className="text-xs text-gray-500 mb-3">
          Removes the local connection. To free the seat for another site, also revoke this
          connection from your <a
            href="https://licensuite.vercel.app/"
            target="_blank"
            rel="noopener"
            className="text-brand-600 underline"
          >LicenSuite dashboard</a>.
        </p>
        <button
          onClick={onDisconnect}
          disabled={isDisconnecting}
          className="rounded-lg px-4 py-2 text-sm font-medium text-red-600 border border-red-200
                     hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDisconnecting ? 'Disconnecting…' : 'Disconnect'}
        </button>
      </div>
    </div>
  );
}
