# Guía de Integración con WordPress

Este documento explica cómo conectar un plugin de WordPress al sistema de licencias.

> **A partir de v3.0.0** la forma recomendada (y default) es el flujo **Connect** (account binding), igual que Elementor Pro o WP Rocket. El usuario nunca pega la `license_key` en el plugin: hace click en *Connect*, se autentica en su dashboard y vincula la licencia al sitio. El plugin solo recibe `connection_id + secret`. Puede revocarse desde el dashboard al instante.
>
> El método antiguo (pegar `license_key`) sigue documentado al final como **legacy** para integraciones programáticas (CI, scripts, automation). Los plugins WP nuevos no deben exponerlo a usuarios finales.

---

## Visión rápida (v3.0 — Connect)

```
┌────────────┐                                  ┌──────────────────┐
│ WP Plugin  │  1. Click "Connect"              │ Licence Manager  │
│            │  → window.open(/plugin-connect…) │                  │
│            ├─────────────────────────────────►│                  │
│            │                                  │  2. Login user   │
│            │                                  │  3. Lista        │
│            │                                  │     licencias    │
│            │  4. Redirect ?token=…&state=…    │  4. Genera token │
│            │◄─────────────────────────────────┤                  │
│            │                                  │                  │
│            │  5. POST /exchange { token }     │                  │
│            ├─────────────────────────────────►│                  │
│            │  6. { connection_id, secret }    │                  │
│            │◄─────────────────────────────────┤                  │
│            │                                  │                  │
│            │  ─── después: validate cada 12h ─                   │
│            │  POST /functions/v1/plugin-validate                  │
│            │  Authorization: Bearer ANON_KEY                      │
│            │  body: { connection_id, connection_secret }          │
│            ├─────────────────────────────────►│                  │
│            │  { valid, plan, expires_at, sites }                 │
│            │◄─────────────────────────────────┤                  │
│            │                                  │                  │
│            │  ─── al desinstalar: revoke ─                        │
│            │  POST /api/plugin-connect/[id]/revoke                │
│            ├─────────────────────────────────►│                  │
└────────────┘                                  └──────────────────┘
```

---

## Información requerida

### URLs

| Endpoint                                                                | Tipo |
|-------------------------------------------------------------------------|------|
| `https://licensuite.vercel.app/plugin-connect`                        | Página del dashboard que el plugin abre en una nueva pestaña |
| `https://licensuite.vercel.app/api/plugin-connect/exchange`           | Canjear token por `connection_id + secret` |
| `https://[REF].supabase.co/functions/v1/plugin-validate`                | Validar la conexión (cada N horas) |
| `https://licensuite.vercel.app/api/plugin-connect/[id]/revoke`        | Revocar la conexión (al desinstalar) |

`[REF]` es el subdominio de tu proyecto Supabase (en este proyecto: `uhnaedqfygrqdptjngqb`). `licensuite.vercel.app` es la URL del Licence Manager Next.js.

### Anon key (Authorization)

Las llamadas a `plugin-validate` (Edge Function de Supabase) **siempre** llevan `Authorization: Bearer <SUPABASE_ANON_KEY>`. Es la clave **pública** (la misma que el frontend) y es necesaria para pasar la JWT verification del runtime de Supabase Edge Functions — el gateway rechaza cualquier otra cosa antes de que tu request llegue al código.

> **Atención** — El `connection_secret` (que devuelve `/exchange`) **no** va en el header `Authorization`. Va en el **body** de la petición:
> ```json
> { "connection_id": "...", "connection_secret": "..." }
> ```
> Si lo pones en el header `Authorization`, Supabase lo trata como un JWT inválido y devuelve `401 UNAUTHORIZED_INVALID_JWT_FORMAT` antes de tocar la lógica del endpoint.

### Product slug

Debe coincidir **exactamente** con el `slug` del producto en el panel admin (ej. `pulse-chat-ai`).

---

## Paso 1 — Botón "Connect" en el plugin

```php
function mi_plugin_connect_url() {
    return add_query_arg(
        [
            'product'  => 'mi-plugin',
            'return'   => admin_url('admin.php?page=mi-plugin-license&action=connect-callback'),
            'site_url' => home_url(),
            'state'    => wp_create_nonce('mi_plugin_connect'),
        ],
        'https://licensuite.vercel.app/plugin-connect'
    );
}

// En la página de admin del plugin:
echo '<a class="button button-primary" target="_blank" href="' .
    esc_url(mi_plugin_connect_url()) . '">Connect to your account</a>';
```

`return` debe estar en el mismo dominio que `site_url` (lo verificamos server-side para evitar phishing).

`state` es un nonce CSRF que el dashboard nos retornará en la redirección. El plugin lo verifica antes de canjear el token.

---

## Paso 2 — Handler del callback

Cuando el usuario completa la conexión en el dashboard, vuelve al plugin con `?token=...&state=...`. El plugin canjea el token por el `connection_id + secret`:

```php
add_action('admin_init', 'mi_plugin_handle_connect_callback');

function mi_plugin_handle_connect_callback() {
    if (($_GET['page'] ?? '') !== 'mi-plugin-license') return;
    if (($_GET['action'] ?? '') !== 'connect-callback') return;
    if (!current_user_can('manage_options')) return;

    $token = sanitize_text_field($_GET['token'] ?? '');
    $state = sanitize_text_field($_GET['state'] ?? '');

    if (!wp_verify_nonce($state, 'mi_plugin_connect') || !$token) {
        add_settings_error('mi_plugin', 'connect_failed', 'Invalid Connect callback.');
        return;
    }

    $resp = wp_remote_post(
        'https://licensuite.vercel.app/api/plugin-connect/exchange',
        [
            'timeout'   => 10,
            'sslverify' => true,
            'headers'   => [ 'Content-Type' => 'application/json' ],
            'body'      => wp_json_encode([
                'token'     => $token,
                'site_uuid' => get_option('siteurl') . '|' . get_option('admin_email'),
            ]),
        ]
    );

    if (is_wp_error($resp)) {
        add_settings_error('mi_plugin', 'connect_failed', 'Network error during Connect.');
        return;
    }

    $data = json_decode(wp_remote_retrieve_body($resp), true);
    if (empty($data['connection_id']) || empty($data['connection_secret'])) {
        add_settings_error('mi_plugin', 'connect_failed', $data['error'] ?? 'Connect failed.');
        return;
    }

    update_option('mi_plugin_connection_id',     $data['connection_id']);
    update_option('mi_plugin_connection_secret', $data['connection_secret']);
    update_option('mi_plugin_license_plan',      $data['license']['plan']);
    update_option('mi_plugin_license_expires',   $data['license']['expires_at']);

    wp_safe_redirect(remove_query_arg(['token', 'state', 'action']));
    exit;
}
```

Tras el `exchange`, el plugin guarda en `wp_options`:
- `mi_plugin_connection_id` (UUID, persistente)
- `mi_plugin_connection_secret` (64 chars hex — **trátalo como una password local**)

---

## Paso 3 — Validar periódicamente

```php
function mi_plugin_validate() {
    $cached = get_transient('mi_plugin_validation');
    if ($cached !== false) return $cached;

    $resp = wp_remote_post(
        'https://[REF].supabase.co/functions/v1/plugin-validate',
        [
            'timeout'   => 10,
            'sslverify' => true,
            'headers'   => [
                'Content-Type'  => 'application/json',
                // ANON_KEY (pública, igual que en el frontend del LicenSuite). Es lo
                // que requiere el gateway de Supabase para pasar la JWT verification.
                'Authorization' => 'Bearer ' . MI_PLUGIN_SUPABASE_ANON_KEY,
            ],
            'body' => wp_json_encode([
                'connection_id'     => get_option('mi_plugin_connection_id'),
                'connection_secret' => get_option('mi_plugin_connection_secret'),
            ]),
        ]
    );

    if (is_wp_error($resp)) {
        // Fail-soft: usar último estado conocido durante caídas de red
        return get_option('mi_plugin_last_validation', ['valid' => false, 'reason' => 'network_error']);
    }

    $data = json_decode(wp_remote_retrieve_body($resp), true) ?: [];

    // Si fue revocada o no encontrada, limpiar y forzar reconexión
    if (!empty($data['reason']) && in_array($data['reason'], ['revoked_or_not_found', 'invalid_credentials'], true)) {
        delete_option('mi_plugin_connection_id');
        delete_option('mi_plugin_connection_secret');
    }

    update_option('mi_plugin_last_validation', $data);
    set_transient('mi_plugin_validation', $data, 12 * HOUR_IN_SECONDS);
    return $data;
}

// En las features Pro:
$state = mi_plugin_validate();
$planSlug = $state['plan']['slug'] ?? null;
if (!empty($state['valid']) && in_array($planSlug, ['pro', 'basic', 'agency'], true)) {
    // Activar features Pro (ajusta los slugs a los que tengas configurados)
}

// Mostrar el nombre del plan en la UI del plugin sin hardcodear traducciones:
$planName = $state['plan']['name'] ?? '—';
```

**Importante:** cachea con un transient (`12 * HOUR_IN_SECONDS` recomendado). El rate limit es 60 req/min/IP, suficiente para uso normal pero NO para validar en cada request.

### Respuesta válida

```json
{
  "valid": true,
  "reason": "ok",
  "plan": {
    "slug": "agency",
    "name": "Agency",
    "max_sites": 10,
    "sort_order": 20
  },
  "product_slug": "mi-plugin",
  "expires_at": "2026-12-31T23:59:59Z",
  "sites": { "used": 3, "max": 10, "unlimited": false }
}
```

> **A partir de v4.0.0**, el campo `plan` es un **objeto**, no un string. Si tu plugin parseaba `data['plan']` como string (`"pro"`, `"basic"`…), debes cambiarlo a `data['plan']['slug']`. El cambio es **breaking**.

Mostrar `sites.used / sites.max` en el panel del plugin es buena UX:

```php
$state = get_option('mi_plugin_last_validation', []);
if (!empty($state['valid']) && isset($state['sites'])) {
    $sites = $state['sites'];
    if (!empty($sites['unlimited'])) {
        echo "Sitios usados: {$sites['used']} (sin límite)";
    } else {
        echo "Sitios usados: {$sites['used']} / {$sites['max']}";
    }
}
```

### Códigos de respuesta

| `reason`                 | Acción del plugin |
|--------------------------|-------------------|
| `ok`                     | Activar features Pro. |
| `revoked_or_not_found`   | Limpiar `connection_id` + `secret`, mostrar botón Connect otra vez. |
| `expired`                | Mostrar "Licencia caducada" y enlace a renovar. |
| `disabled`               | Mostrar "Licencia desactivada por el administrador". |
| `invalid_credentials`    | Igual que `revoked_or_not_found`: limpiar + reconectar. |
| `rate_limited`           | Reintentar tras 60 s. Aumentar el TTL del transient. |

---

## Paso 4 — Liberar el seat al desinstalar

> **Importante** — El endpoint `POST /api/plugin-connect/[id]/revoke` del LicenSuite requiere **sesión de usuario** (cookie de Supabase Auth), no acepta Bearer Token. El plugin **no** puede invocarlo desde `register_deactivation_hook`.
>
> Para liberar el seat al desinstalar tienes dos caminos:
>
> **A) Recomendado, vía dashboard del usuario.** Cuando el plugin se desactiva, lo único que hace es limpiar las options locales:
>
> ```php
> register_deactivation_hook(__FILE__, function () {
>     delete_option('mi_plugin_connection_id');
>     delete_option('mi_plugin_connection_secret');
>     delete_transient('mi_plugin_validation');
>     delete_option('mi_plugin_last_validation');
> });
> ```
>
> El usuario sigue viendo el sitio en su lista de "Connected sites" en LicenSuite y puede revocarlo manualmente con un click. Es lo que hacen Elementor, Bricks, WP Rocket, etc.
>
> **B) Auto-revoke vía endpoint público (no implementado todavía).** Si quieres que el plugin libere el seat solo, hay que añadir un endpoint público que acepte `Bearer ANON_KEY` + body `{ connection_id, connection_secret }`. Avisa si lo necesitas y lo añadimos en una iteración.

> Nota: el endpoint de revoke acepta credenciales del propietario o del admin. La forma "el plugin revoca su propia conexión" requiere autenticación con la sesión del usuario en el dashboard, **no** con el secret del plugin. Por simplicidad recomendamos: al desactivar el plugin, mostrar un aviso al usuario "Para liberar el seat, ve al dashboard y revoca esta conexión", o documentar que `revoked_at` se gestiona desde el dashboard.

Una alternativa: usar un endpoint público específico de "self-revoke" que sí acepta el secret de la connection. Si lo añadimos en una iteración futura, este `register_deactivation_hook` lo llamará.

---

## Buenas prácticas

- **Cachea con transient (12 h)** la respuesta de `plugin-validate`. El rate limit es generoso pero no infinito.
- **Nunca expongas el secret** en HTML ni JS del frontend del plugin. Vive solo en `wp_options` (BD/PHP server-side).
- **Maneja `revoked_or_not_found`** limpiando las options y pidiendo al usuario reconectar. No bloquees el plugin entero — déjalo funcionar en modo "free" mientras tanto.
- **No uses `home_url()`** ciegamente en multisite: usa `network_home_url()` o el dominio del subsite según corresponda.
- **Permitir reconnect**: si el secret se pierde (BD restaurada de backup, etc.), el botón Connect debe seguir funcionando. El user podrá vincular otra vez la misma licencia al mismo dominio (es idempotente: reusa la connection existente y rota el secret).

---

## Multi-sitio

Una licencia define `max_sites` por plan en el dashboard del admin (`free=1`, `basic=5`, `pro=unlimited` por defecto). Cada conexión activa cuenta como un seat. Cuando un usuario intenta conectar un sitio adicional:

- Si hay seats libres → la conexión se crea normalmente.
- Si no → el dashboard muestra un error con la lista de sitios actualmente activos. El usuario puede revocar uno antes de continuar.

El plugin no tiene que hacer nada especial: si `plugin-validate` devuelve `valid: false, reason: 'revoked_or_not_found'`, sabe que su seat fue liberado.

---

## Cambiar de licencia

Si el usuario quiere mover el sitio a otra licencia:
1. Click *Connect* otra vez en el plugin.
2. En el dashboard elige otra licencia (cualquiera de su cuenta para ese product).
3. Se rota el secret y la connection apunta a la nueva licencia.

---

## 2FA en la cuenta

Si el usuario activa 2FA en `/settings`, **el flujo de Connect requiere TOTP** (porque el dashboard requiere login completo). Esto sube todavía más la barrera para sharing comercial: hay que dar el móvil, no solo email+password.

Esto es transparente para el plugin — el plugin nunca ve nada relacionado con 2FA. Solo el flujo de login del dashboard cambia.

---

## Deploy

```bash
supabase functions deploy plugin-validate

# (las migraciones de v2 + v3 ya deberían estar aplicadas con `supabase db push`)
```

El frontend (Next.js) se redeployea por su propio pipeline (ej. Vercel push to main).

---

## Referencias

- [`supabase/functions/plugin-validate/README.md`](../supabase/functions/plugin-validate/README.md) — referencia del endpoint público.
- [`supabase/functions/license-check/README.md`](../supabase/functions/license-check/README.md) — endpoint legacy para uso programático.
- [`docs/API_AUTHENTICATION.md`](API_AUTHENTICATION.md) — autenticación admin (creación de licencias desde Stripe webhooks, scripts, etc.).
- [Tabla `plugin_connections`](../supabase/migrations/015_plugin_connections.sql) y [tabla `connection_tokens`](../supabase/migrations/016_connection_tokens.sql).

---

## Apéndice: método legacy (license_key directa)

> **Solo recomendado para uso programático** (CI, scripts de provisioning, integraciones server-to-server). No exponerlo a usuarios finales en plugins WP nuevos.

Si todavía tienes plugins en producción que usan la `license_key` pegada por el usuario, el endpoint `license-check` sigue funcionando:

```
GET https://[REF].supabase.co/functions/v1/license-check?license=XXXX-...&domain=...&product=...
Authorization: Bearer <ANON_KEY>
```

La respuesta es la misma que en v2.0 (incluye `sites: { used, max, unlimited }`). Cuando publiques una nueva versión del plugin, sustituye este flujo por el de Connect documentado arriba.
