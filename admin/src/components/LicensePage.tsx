import { useState } from 'react';

const ERROR_MESSAGES: Record<string, string> = {
  ok:                 'Licencia válida',
  no_license:         'No se ha introducido ninguna clave de licencia',
  not_found:          'Clave de licencia no encontrada. Verifica que la clave sea correcta.',
  expired:            'La licencia ha caducado. Por favor, renuévala.',
  disabled:           'La licencia ha sido desactivada. Contacta con soporte.',
  domain_mismatch:    'El dominio no coincide con el dominio registrado para esta licencia.',
  product_mismatch:   'Esta licencia no es válida para Animicro.',
  connection_error:   'No se pudo conectar con el servidor de licencias. Verifica tu conexión.',
  server_error:       'Error en el servidor de licencias. Inténtalo de nuevo más tarde.',
  invalid_response:   'Respuesta inválida del servidor. Inténtalo de nuevo.',
  function_not_found: 'Servicio de validación no disponible temporalmente.',
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
        message: 'Error al conectar con el servidor.',
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
        message: 'Error al conectar con el servidor.',
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
        <h2 className="text-lg font-semibold text-gray-900">Licencia Pro</h2>
        <p className="text-sm text-gray-500 mt-1">
          Activa tu licencia para desbloquear los módulos Pro: Blur, Stagger, Parallax y Split Text.
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
              {currentlyPremium ? 'Licencia activa' : 'Sin licencia activa'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Plan:{' '}
              <span className={`font-semibold ${currentlyPremium ? 'text-green-700' : 'text-gray-500'}`}>
                {currentlyPremium ? plan?.toUpperCase() ?? 'Pro' : 'Free'}
              </span>
              {result?.data?.registered_domain && (
                <> · Dominio: <span className="font-mono">{result.data.registered_domain}</span></>
              )}
              {result?.data?.expires_at && (
                <> · Expira: {new Date(result.data.expires_at).toLocaleDateString('es-ES')}</>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* License key input */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Clave de licencia
        </label>
        <input
          type="text"
          value={licenseKey}
          onChange={e => setLicenseKey(e.target.value.toUpperCase())}
          placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-sm
                     focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          spellCheck={false}
        />

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={isSaving || !licenseKey.trim()}
            className={`
              rounded-lg px-4 py-2 text-sm font-medium text-white transition-all
              ${!isSaving && licenseKey.trim()
                ? 'bg-blue-600 hover:bg-blue-700 shadow-sm'
                : 'bg-gray-300 cursor-not-allowed'}
            `}
          >
            {isSaving ? 'Verificando...' : 'Activar licencia'}
          </button>

          {(currentlyPremium || !!initialKey) && (
            <button
              onClick={handleRemove}
              disabled={isRemoving}
              className="rounded-lg px-4 py-2 text-sm font-medium text-red-600 border border-red-200
                         hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRemoving ? 'Eliminando...' : 'Eliminar licencia'}
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
            {result.is_premium ? '¡Licencia activada correctamente!' : 'Error al activar la licencia'}
          </p>
          <p className="mt-0.5 text-xs opacity-80">
            {ERROR_MESSAGES[result.data?.reason] ?? result.message}
          </p>
          {result.is_premium && (
            <p className="mt-2 text-xs">
              Recarga la página del panel para ver los módulos Pro desbloqueados.
            </p>
          )}
        </div>
      )}

      {/* Info */}
      <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Módulos Pro incluidos</h3>
        <ul className="space-y-1">
          {[
            { name: 'Blur', css: '.am-blur' },
            { name: 'Stagger', css: '.am-stagger' },
            { name: 'Parallax', css: '.am-parallax' },
            { name: 'Split Text', css: '.am-split' },
          ].map(m => (
            <li key={m.css} className="flex items-center gap-2 text-sm text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-amber-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span>{m.name}</span>
              <code className="text-xs text-gray-400">{m.css}</code>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
