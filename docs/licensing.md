# Licensing system — plugin-side reference (LicenSuite v3 Connect flow)

This document describes how Animicro Pro consumes the **LicenSuite v3.0** licensing backend (Supabase Edge Functions + Next.js dashboard). It's written as a reusable reference: the same pattern can be ported to any WordPress plugin by renaming prefixes (`animicro_` → `yourplugin_`, `Animicro_` → `Yourplugin_`, slug `animicro` → your slug) and copying ~3 files.

The server-side documentation (endpoints, response shapes, dashboard flow) lives in the LicenSuite repo at `~/Desktop/Licence Manager/docs/WORDPRESS_INTEGRATION.md`. This doc covers everything that happens **inside the plugin**.

> **Architectural note**: v3 replaced the v2 "user pastes a license_key" flow with an OAuth-style **Connect** flow modeled after Elementor Pro / WP Rocket. The user authenticates on the LicenSuite dashboard, picks a license, and the dashboard redirects back with a one-time token that the plugin exchanges for a per-site `connection_id + connection_secret`. License keys never touch the WP UI.

---

## 1. Architecture

```
┌──────────────────────┐                          ┌─────────────────────┐
│  WordPress site      │                          │ LicenSuite          │
│                      │  1. window.open(/plugin- │                     │
│  yourplugin/         │     connect?token=…)     │ Next.js dashboard   │
│  └─ class-license-   │ ───────────────────────► │ + Supabase Edge     │
│     manager.php      │                          │   Functions         │
│                      │  2. user logs in,        │                     │
│  wp_options:         │     picks a license      │                     │
│  ├─ ..._connection_  │                          │                     │
│  │    id     (uuid)  │  3. redirect back with   │                     │
│  ├─ ..._connection_  │     ?token=… &state=…    │                     │
│  │    secret (AES)   │ ◄─────────────────────── │                     │
│  ├─ ..._license_     │                          │                     │
│  │    data           │  4. POST /exchange       │                     │
│  └─ ..._premium_     │     { token, site_uuid } │                     │
│     active           │ ───────────────────────► │                     │
│                      │     { connection_id,     │                     │
│                      │       connection_secret} │                     │
│                      │ ◄─────────────────────── │                     │
│                      │                          │                     │
│                      │  5. POST /plugin-validate│                     │
│                      │     Authorization: Bearer│                     │
│                      │       <connection_secret>│                     │
│                      │     body { connection_id}│                     │
│                      │ ───────────────────────► │                     │
│                      │     { valid, plan,       │                     │
│                      │       expires_at, sites }│                     │
│                      │ ◄─────────────────────── │                     │
└──────────────────────┘                          └─────────────────────┘
```

| Component | Job | Where |
|-----------|-----|-------|
| **LicenSuite dashboard** (Next.js on Vercel) | Owns the user-facing Connect UI: shows the user's licenses, generates one-time tokens. | `licensuite.vercel.app` |
| **`/api/plugin-connect/exchange`** (Next.js route) | Trades a one-time `token` for a long-lived `connection_id + connection_secret`. | Same Vercel app |
| **`/functions/v1/plugin-validate`** (Supabase Edge Function) | Validates a connection. The plugin calls this once per day. | `[ref].supabase.co` |
| **`class-license-manager.php`** | Builds the dashboard URL, handles the redirect callback, runs the token exchange, validates daily against the live server, encrypts the secret at rest, dev-host bypass. | Inside the plugin. **One file, ~400 lines.** |
| **The rest of the plugin** | Calls `Yourplugin_License_Manager::is_premium()` wherever it needs to gate Pro features. | Wherever Pro features live. |

Distribution and licensing are intentionally decoupled: the public ZIP is downloadable by anyone (see `docs/animicro.md` → Release pipeline), but the connection still gates Pro features at runtime. Stealing the ZIP gets the user a locked plugin.

---

## 2. Server endpoints (summary)

Full spec is in the LicenSuite repo. The plugin only needs to know:

### `https://licensuite.vercel.app/plugin-connect`

The dashboard page the plugin opens in a new tab. Query string:

| Param | Value |
|-------|-------|
| `product` | Product slug (must match LicenSuite admin) |
| `return` | URL-encoded callback URL (must be on the same domain as `site_url`) |
| `site_url` | URL-encoded `home_url()` of the WP site |
| `state` | A WP nonce; the dashboard reflects it back unchanged for CSRF |

### `POST https://licensuite.vercel.app/api/plugin-connect/exchange`

Body:
```json
{ "token": "<one-time-token>", "site_uuid": "<unique-site-id>" }
```

Success response (HTTP 200):
```json
{
  "connection_id":     "9b8e7a6d-…",   // UUID
  "connection_secret": "0f1e2d3c…",     // 64-char hex; treat as a password
  "license": {
    "plan":       "pro",
    "expires_at": "2027-12-31T23:59:59Z",
    "sites":      { "used": 3, "max": null, "unlimited": true }
  }
}
```

Failures: HTTP 4xx with `{ "error": "<reason>" }`. Reasons: `invalid_token`, `expired_token`, `state_mismatch`, `internal`.

### `POST https://[ref].supabase.co/functions/v1/plugin-validate`

Headers:
```
Authorization: Bearer <connection_secret>
Content-Type: application/json
```

Body:
```json
{ "connection_id": "9b8e7a6d-…" }
```

Success (HTTP 200):
```json
{
  "valid": true,
  "reason": "ok",
  "plan": "pro",
  "expires_at": "2027-12-31T23:59:59Z",
  "sites": { "used": 3, "max": null, "unlimited": true }
}
```

Failure reasons (HTTP 200 with `valid: false`, or HTTP 4xx):
- `revoked_or_not_found` — the connection was destroyed (user revoked, admin deleted). Plugin should drop credentials and prompt reconnect.
- `invalid_credentials` — the secret doesn't match. Same handling.
- `expired` — the underlying license expired. Lock Pro, keep credentials so user can renew.
- `disabled` — admin disabled the license. Lock Pro, keep credentials.
- `rate_limited` — HTTP 429. Plugin should serve cached state.

### Revoke

`POST https://licensuite.vercel.app/api/plugin-connect/[id]/revoke` requires user dashboard session (cookie auth), **not** the connection secret. The plugin therefore cannot self-revoke at deactivation — the canonical workflow is: at deactivation, the plugin cleans its local options; the user revokes the seat from their LicenSuite dashboard with one click when they want to free it for another site. See §7.1 for implementation.

---

## 3. Plugin-side files

> **Honest answer up front**: the licensing layer is **not** a self-contained folder you can drop into another plugin. The bulk of the logic lives in one self-contained PHP class, but the integration points (REST routes, admin_init callback, deactivation hook, React component) are wired across ~6 files in different parts of the plugin. To port to a new plugin you copy the **green** file verbatim and recreate the **yellow** files manually using the recipes in §13.

| Layer | File | Status when porting |
|-------|------|---------------------|
| 🟢 **Core** (drop-in) | `includes/class-license-manager.php` | Copy. Find/replace prefixes. Swap `product_slug` and the three URLs. ~400 lines. No dependencies on the rest of the plugin. |
| 🟡 Admin wiring | `includes/class-admin.php` | Add the 3 REST routes (`/license/status`, `/license/connect-url`, `/license/disconnect`), the `maybe_handle_connect_callback()` admin_init handler, the `maybe_notice_revoke_reminder()` admin_notices handler. (See §9.) |
| 🟡 Orchestrator | `includes/class-yourplugin.php` | `Yourplugin::deactivate()` calls `clear_connection()`. (See §7.1.) |
| 🟡 Lifecycle | `uninstall.php` | `delete_option()` cleanup of all licensing options. (See §7.2.) |
| 🟡 React UI | `admin/src/components/LicensePage.tsx` | Copy structure, retheme. 3 states: `dev` / `connected` / `disconnected`. Rename `window.animicroData` → `window.yourpluginData`. (See `admin/src/components/LicensePage.tsx` in this repo as reference.) |
| 🟡 React types | `admin/src/types.ts` | `LicenseStatus` interface — copy verbatim. |

```
yourplugin/
├── yourplugin.php                          # main file — registers (de)activation hooks
├── uninstall.php                           # 🟡 cleans options
├── includes/
│   ├── class-license-manager.php           # 🟢 the core — copy verbatim, find/replace prefixes
│   ├── class-admin.php                     # 🟡 add REST + callback wiring
│   └── class-yourplugin.php                # 🟡 deactivate() calls clear_connection()
└── admin/src/
    ├── components/LicensePage.tsx          # 🟡 React UI — copy structure
    └── types.ts                            # 🟡 LicenseStatus interface
```

The license manager file is ~400 lines and self-contained. The wiring around it is ~150 lines of WP-specific glue spread across the other files. Total time-to-port for the second plugin: ~30 minutes if you follow §13.

### File map (what each section of the class does)

```php
class Yourplugin_License_Manager {

    // === Constants ===
    const OPTION_NAME       = 'yourplugin_premium_active';   // bool option
    const PRO_MODULES       = [ ... ];
    const FREE_MODULES      = [ ... ];

    // === URLs ===
    private string $validate_url   = 'https://[ref].supabase.co/functions/v1/plugin-validate';
    private string $exchange_url   = 'https://licensuite.vercel.app/api/plugin-connect/exchange';
    private string $dashboard_url  = 'https://licensuite.vercel.app/plugin-connect';

    // === Storage keys (wp_options) ===
    private string $connection_id_option     = 'yourplugin_connection_id';     // UUID, plain
    private string $connection_secret_option = 'yourplugin_connection_secret'; // AES-256-CBC at rest
    private string $license_data_option      = 'yourplugin_license_data';

    // === Connection storage ===
    public  function get_connection_id(): string
    public  function get_connection_secret(): string         // decrypts
    public  function has_connection(): bool
    private function persist_connection( $id, $secret )      // encrypts secret
    public  function clear_connection()                      // wipes everything

    // === Encryption at rest ===
    private function encryption_key()                        // SHA-256 of AUTH_KEY + SECURE_AUTH_KEY
    private function encrypt() / decrypt()                   // AES-256-CBC

    // === Connect flow ===
    public  function get_connect_url(): string               // builds dashboard URL with nonce
    public  function handle_callback( $token, $state )       // verifies state, exchanges token
    private function record_connect_error()
    public  function consume_connect_error()                 // for the React UI

    // === Validation ===
    public  function validate_connection( $force = false )

    // === Domain helpers ===
    private function normalize_domain(), get_current_domain()
    private function is_development_domain()
    public  function is_dev_mode(): bool                     // wraps the above

    // === Convenience accessors (used by REST + React) ===
    public  function get_license_plan()
    public  function get_license_data()
    public  function get_error_message( $reason )

    // === Static helpers (used by the rest of the plugin) ===
    public static function is_premium(): bool                // ← the main check
    public static function is_pro_module( $id ): bool
    public static function activate_premium(), deactivate_premium()

    // === Lifecycle hooks ===
    public static function validate_license_periodically()   // wired on admin_init
    public static function register_hooks()                  // domain-change cache invalidation
    public static function on_domain_change()
}
```

---

## 4. The Connect flow in detail

### 4.1 Build the dashboard URL

```php
public function get_connect_url(): string {
    $state  = wp_create_nonce( 'yourplugin_connect' );
    $return = admin_url( 'admin.php?page=yourplugin-license&action=connect-callback' );

    return add_query_arg(
        [
            'product'  => $this->product_slug,
            'return'   => rawurlencode( $return ),
            'site_url' => rawurlencode( home_url() ),
            'state'    => $state,
        ],
        $this->dashboard_url
    );
}
```

The React UI calls `GET /yourplugin/v1/license/connect-url`, receives the URL, and opens it via `window.open(url, '_blank', 'noopener')`. New tab so the user keeps their WP admin context.

### 4.2 Handle the redirect callback

After the user picks a license on the dashboard, they get redirected to:

```
/wp-admin/admin.php?page=yourplugin-license&action=connect-callback&token=…&state=…
```

This is **not** a REST endpoint — it's a regular WP admin page hit. We catch it in `admin_init`:

```php
add_action( 'admin_init', [ $this, 'maybe_handle_connect_callback' ] );

public function maybe_handle_connect_callback(): void {
    if ( ( $_GET['page'] ?? '' )   !== 'yourplugin-license' ) return;
    if ( ( $_GET['action'] ?? '' ) !== 'connect-callback' )    return;
    if ( ! current_user_can( 'manage_options' ) )              return;

    $token = sanitize_text_field( wp_unslash( $_GET['token'] ?? '' ) );
    $state = sanitize_text_field( wp_unslash( $_GET['state'] ?? '' ) );

    $manager = new Yourplugin_License_Manager();
    $manager->handle_callback( $token, $state );

    wp_safe_redirect( admin_url( 'admin.php?page=yourplugin-license' ) );
    exit;
}
```

`handle_callback()` verifies the WP nonce (CSRF), POSTs to `/api/plugin-connect/exchange` with `{ token, site_uuid }`, and persists the result. On failure it sets a 60-second transient with the error reason; the React UI consumes it on next mount.

### 4.3 The exchange call

```php
public function handle_callback( string $token, string $state ): array {
    if ( ! wp_verify_nonce( $state, 'yourplugin_connect' ) ) {
        $this->record_connect_error( 'invalid_state' );
        return [ 'success' => false, 'reason' => 'invalid_state' ];
    }

    $response = wp_remote_post( $this->exchange_url, [
        'timeout' => 10,
        'headers' => [ 'Content-Type' => 'application/json' ],
        'body'    => wp_json_encode( [
            'token'     => $token,
            'site_uuid' => home_url() . '|' . get_option( 'admin_email' ),
        ] ),
    ] );

    // … error handling …

    $data = json_decode( wp_remote_retrieve_body( $response ), true );
    $this->persist_connection( $data['connection_id'], $data['connection_secret'] );
    $this->validate_connection( true );  // immediate fresh check

    return [ 'success' => true, 'reason' => 'ok' ];
}
```

The `site_uuid` is just an opaque "this site" identifier the dashboard logs alongside the connection — the format `home_url() . '|' . admin_email` is a convention, not a requirement.

### 4.4 Validation

Daily, on `admin_init`, throttled by a transient:

```php
public function validate_connection( bool $force = false ): array {
    if ( $this->is_development_domain() )    return $this->dev_premium_payload();
    if ( ! $this->has_connection() )         return $this->no_connection_payload();

    if ( ! $force ) {
        $cached = get_transient( 'yourplugin_license_check' );
        if ( false !== $cached ) return $cached;
    }

    $response = wp_remote_post( $this->validate_url, [
        'timeout' => 10,
        'headers' => [
            'Content-Type'  => 'application/json',
            // Supabase anon key — public, satisfies the Edge Function JWT
            // verification layer. NOT the connection_secret.
            'Authorization' => 'Bearer ' . $this->supabase_anon_key,
        ],
        'body' => wp_json_encode( [
            'connection_id'     => $this->get_connection_id(),
            'connection_secret' => $this->get_connection_secret(),
        ] ),
    ] );

    // … parse response, cache for DAY_IN_SECONDS, activate/deactivate premium …
}
```

> **Two-layer auth**: the Supabase Edge Function runtime verifies the `Authorization: Bearer <token>` header as a JWT before your function code runs — that's why the **anon key** (the same public key the LicenSuite frontend embeds in its HTML) goes there. The function then reads `connection_id` + `connection_secret` from the request body and validates them against `plugin_connections` in the database with bcrypt. Sending the connection_secret in `Authorization` makes Supabase return `401 UNAUTHORIZED_INVALID_JWT_FORMAT` before your function executes — which manifests as "Last check: Never" on the dashboard while everything else looks fine. Don't fall into the same trap.

#### Sidebar — How this auth flow was discovered the hard way

In Animicro Pro 1.12.0–1.12.3 we put the `connection_secret` in the `Authorization` header (the v3 doc's PHP example showed it that way). Symptoms in production:
- `/exchange` succeeded (it's hosted on Vercel/Next.js, no Supabase JWT layer involved).
- The plugin's local License page rendered "License active, Plan: PRO" from the `/exchange` payload.
- Pro modules stayed locked indefinitely.
- The LicenSuite dashboard "Last check" column stayed at `Never`.

A 5-minute live `curl` probe against the function URL surfaced the truth:

```bash
$ curl -X POST https://[REF].supabase.co/functions/v1/plugin-validate
  → 401 UNAUTHORIZED_NO_AUTH_HEADER

$ curl -X POST -H "Authorization: Bearer fake-secret" ...
  → 401 UNAUTHORIZED_INVALID_JWT_FORMAT       # the smoking gun

$ curl -X POST -H "Authorization: Bearer <ANON_KEY>" ...
  → 200 + { "valid": false, "reason": "invalid_connection_id", ... }
                                                # function executes
```

When porting this pattern to a new plugin, **always probe the endpoint directly with `curl` first**. Don't trust documentation alone — even when the doc author wrote it.

### 4.5 Failure handling

| `reason`                | Plugin action |
|-------------------------|---------------|
| `ok`                    | Activate premium, cache 24 h. |
| `revoked_or_not_found`  | Drop credentials, prompt reconnect. |
| `invalid_credentials`   | Same — credentials are gone. |
| `expired`               | Lock premium, keep credentials so the user can renew. |
| `disabled`              | Same. |
| `rate_limited` (HTTP 429) | Serve cached state; don't churn the cache. |
| Network error (WP_Error) | Fail-soft: serve last known good state. Don't kick users off Pro because of a network blip. |

---

## 5. Encryption at rest

The `connection_secret` is the equivalent of a password — anyone with it can validate as this site. Stored AES-256-CBC encrypted in `wp_options`, keyed by a derivative of WordPress's `AUTH_KEY` + `SECURE_AUTH_KEY` constants:

```php
private function encryption_key(): string {
    $secret  = defined( 'AUTH_KEY' ) ? AUTH_KEY : '';
    $secret .= defined( 'SECURE_AUTH_KEY' ) ? SECURE_AUTH_KEY : '';
    return hash( 'sha256', '' !== $secret ? $secret : 'yourplugin-fallback', true );
}

private function encrypt( string $plain ): string {
    $iv     = random_bytes( 16 );
    $cipher = openssl_encrypt( $plain, 'AES-256-CBC', $this->encryption_key(), OPENSSL_RAW_DATA, $iv );
    return base64_encode( $iv . $cipher );
}
```

Defends against database dumps leaking out of context (e.g. dev backups committed to git). Doesn't protect against attackers with read access to `wp-config.php` — there is no defence at that level.

`connection_id` (UUID) is stored plain. It's not sensitive on its own.

---

## 6. Local development bypass

The Connect flow requires reaching the public dashboard, which doesn't pair well with `localhost` / `*.local` / `*.test`. Mirror the LicenSuite reserved-domain rule in the plugin and short-circuit the entire flow:

```php
private function is_development_domain(): bool {
    $domain = $this->get_current_domain();
    $is_dev = false;

    if ( '' === $domain || 'localhost' === $domain || '::1' === $domain ) {
        $is_dev = true;
    } elseif ( preg_match( '/\.(local|test|localhost|invalid|example)$/i', $domain ) ) {
        $is_dev = true;
    } elseif ( filter_var( $domain, FILTER_VALIDATE_IP ) ) {
        if (
            preg_match( '/^127\./',         $domain ) ||
            preg_match( '/^10\./',          $domain ) ||
            preg_match( '/^192\.168\./',    $domain ) ||
            preg_match( '/^172\.(1[6-9]|2[0-9]|3[0-1])\./', $domain )
        ) {
            $is_dev = true;
        }
    }

    return (bool) apply_filters( 'yourplugin_is_development_domain', $is_dev, $domain );
}
```

When `validate_connection()` detects a dev domain it returns a synthetic premium payload, no network call, no Connect required. Pro features unlock automatically.

To **test the real Connect flow against a staging dashboard from `localhost`**, override the filter:

```php
// wp-config.php
add_filter( 'yourplugin_is_development_domain', '__return_false' );
```

This re-enables the Connect button locally so you can actually click through the OAuth flow during development.

---

## 7. Lifecycle hooks

### 7.1 Plugin deactivation — clean local options, dashboard handles revoke

LicenSuite's `/api/plugin-connect/[id]/revoke` requires a user dashboard session (cookie auth), not Bearer. The plugin therefore cannot auto-release the seat on the server from `register_deactivation_hook`. The doc-recommended pattern (mirrored by Bricks, WP Rocket, Elementor): on deactivation, just clean the local options. The seat stays listed under "Connected sites" in the user's dashboard until they revoke it manually with one click.

```php
// Main plugin file
register_deactivation_hook( __FILE__, [ 'Yourplugin', 'deactivate' ] );

// Orchestrator
public static function deactivate(): void {
    if ( ! self::is_pro_plugin() ) return;

    if ( ! class_exists( 'Yourplugin_License_Manager' ) ) {
        require_once YOURPLUGIN_DIR . 'includes/class-license-manager.php';
    }
    if ( class_exists( 'Yourplugin_License_Manager' ) ) {
        ( new Yourplugin_License_Manager() )->clear_connection();
    }
}
```

`clear_connection()` deletes `connection_id`, `connection_secret`, `license_data`, the validation transients, and flips the premium flag off. On reactivation the user starts cleanly from the disconnected state and runs Connect again — same one-click flow.

> **Why not just leave the connection alone on deactivation?** The user's mental model when they deactivate a plugin is "this site stops using it". If we kept credentials around, a subsequent re-activation would silently re-claim the seat with stale state — surprising at best, broken at worst (server may have rotated the secret in the meantime). Cleaning is honest.

If you specifically want to surface a follow-up notice (e.g. "the seat is still listed under your dashboard — revoke it from there if you don't want this site counted anymore"), do it from the React **Disconnect** button path, not the deactivation hook — the deactivation hook fires inside the request that unloads the plugin, so any transient it sets won't be consumed until the plugin is reactivated, which is the wrong moment.

```php
// In the orchestrator's REST handler for the React Disconnect button:
public function disconnect_license(): \WP_REST_Response {
    ( new Yourplugin_License_Manager() )->clear_connection();
    set_transient( 'yourplugin_show_revoke_notice', '1', MINUTE_IN_SECONDS );
    return new \WP_REST_Response( [ 'success' => true ], 200 );
}

// Admin notice handler (only fires while the plugin is active):
public function maybe_notice_revoke_reminder(): void {
    if ( ! get_transient( 'yourplugin_show_revoke_notice' ) ) return;
    delete_transient( 'yourplugin_show_revoke_notice' );

    echo '<div class="notice notice-info is-dismissible"><p>'
       . __( 'The local connection has been removed. To free up the seat for another site, also revoke this connection from your dashboard.', 'yourplugin' )
       . '</p></div>';
}
```

### 7.2 Plugin uninstall

`uninstall.php` runs in a fresh WP context with the main plugin file NOT loaded. Just clean the options:

```php
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) exit;

delete_option( 'yourplugin_connection_id' );
delete_option( 'yourplugin_connection_secret' );
delete_option( 'yourplugin_license_data' );
delete_option( 'yourplugin_premium_active' );
delete_option( 'yourplugin_settings' );
delete_transient( 'yourplugin_license_check' );
delete_transient( 'yourplugin_license_last_check' );
```

### 7.3 Domain change

```php
public static function register_hooks(): void {
    add_action( 'update_option_siteurl', [ __CLASS__, 'on_domain_change' ] );
    add_action( 'update_option_home',    [ __CLASS__, 'on_domain_change' ] );
}

public static function on_domain_change(): void {
    delete_transient( 'yourplugin_license_check' );
    delete_transient( 'yourplugin_license_last_check' );
}
```

The connection itself stays valid on the server (it's tied to the connection_id, not the domain), but the cached state is stale.

### 7.4 Periodic re-validation

```php
public static function validate_license_periodically(): void {
    if ( false !== get_transient( 'yourplugin_license_last_check' ) ) return;

    ( new self() )->validate_connection( true ); // force, bypass cache
    set_transient( 'yourplugin_license_last_check', time(), DAY_IN_SECONDS );
}

// In your main class:
add_action( 'admin_init', [ 'Yourplugin_License_Manager', 'validate_license_periodically' ] );
```

---

## 8. Migrating from a v2 paste-the-key plugin

If you're upgrading an existing plugin that used to ship the v2 "user pastes a license_key" flow, every install will have a stored `yourplugin_license_key` option that the new server doesn't accept.

The cleanest path is a **one-shot detection on the first admin pageload after upgrade**: if `yourplugin_license_key` exists and `yourplugin_connection_id` doesn't, lock Pro features and render a banner that walks the user through the Connect flow. After Connect succeeds, `persist_connection()` wipes the legacy key option and Pro re-activates automatically.

```php
public function is_pending_reconnect(): bool {
    if ( $this->has_connection() ) return false;
    return '' !== (string) get_option( 'yourplugin_license_key', '' );
}

// In is_premium():
if ( ( new self() )->is_pending_reconnect() ) {
    self::deactivate_premium();
    return false;
}
```

In the REST `/license/status` payload, expose a `pending_reconnect` flag and a `'pending_reconnect'` value for `state`. The React component renders an orange banner with a **Reconnect** button (which is the same handler as the regular Connect button — the dashboard handles the rest).

> **Animicro's history**: Animicro Pro 1.12.0–1.12.4 shipped this migration scaffolding. We dropped it in 1.12.5 once we verified there were no v1.11.x installs in the wild. If your plugin ships fresh on the v3 Connect flow (no v2 history), skip this entire section.

---

## 9. REST API for the admin UI

```php
register_rest_route( 'yourplugin/v1', '/license/status', [
    'methods'             => 'GET',
    'callback'            => [ $this, 'get_license_status' ],
    'permission_callback' => fn() => current_user_can( 'manage_options' ),
] );

register_rest_route( 'yourplugin/v1', '/license/connect-url', [
    'methods'             => 'GET',
    'callback'            => [ $this, 'get_connect_url' ],
    'permission_callback' => fn() => current_user_can( 'manage_options' ),
] );

register_rest_route( 'yourplugin/v1', '/license/disconnect', [
    'methods'             => 'POST',
    'callback'            => [ $this, 'disconnect_license' ],
    'permission_callback' => fn() => current_user_can( 'manage_options' ),
] );
```

`get_license_status()` returns everything the React UI needs to render any of the three states (or four, if you also support the `pending_reconnect` migration banner from §8):

```php
public function get_license_status(): \WP_REST_Response {
    $manager = new Yourplugin_License_Manager();

    $is_dev         = $manager->is_dev_mode();
    $has_connection = $manager->has_connection();
    $license_data   = $manager->get_license_data();

    $state = $is_dev ? 'dev' : ( $has_connection ? 'connected' : 'disconnected' );

    return new \WP_REST_Response( [
        'state'          => $state,
        'is_premium'     => Yourplugin_License_Manager::is_premium(),
        'is_dev'         => $is_dev,
        'has_connection' => $has_connection,
        'connection_id'  => $manager->get_connection_id(),
        'plan'           => $license_data['plan'] ?? null,
        'expires_at'     => $license_data['expires_at'] ?? null,
        'sites'          => $license_data['sites'] ?? null,
        'connect_error'  => $manager->consume_connect_error() ?: null,
    ] );
}
```

The React frontend reads `state` and renders the matching component.

---

## 10. Premium gating

Same shape as v2 — `is_premium()` is the canonical check, `is_pro_module()` checks against the `PRO_MODULES` const:

```php
public static function is_premium(): bool {
    $instance = new self();

    // No credentials and not on a dev domain → locked.
    if ( ! $instance->is_dev_mode() && ! $instance->has_connection() ) {
        self::deactivate_premium();
        return false;
    }

    $state = $instance->validate_connection();   // uses transient cache
    if ( empty( $state['valid'] ) ) {
        self::deactivate_premium();
        return false;
    }

    $slug = self::plan_slug( $state['plan'] ?? null );
    if ( ! self::is_premium_slug( $slug ) ) {
        self::deactivate_premium();
        return false;
    }

    self::activate_premium();   // keep the stored flag in sync
    return true;
}
```

> **Lesson from 1.12.0–1.12.3**: an earlier version of this method *started* with `if ( ! get_option( self::OPTION_NAME ) ) return false;` as a perceived hot-path optimization. That early-bail meant any path that briefly set the flag to `false` (e.g. a network blip, a corrupted transient) left the plugin permanently locked even after the underlying state was healthy again. Always derive `is_premium()` from current state, never from a stored boolean. The `OPTION_NAME` flag should be downstream-only — written by this method, never gated on by it.

Use everywhere a Pro feature is gated:

```php
if ( Yourplugin_License_Manager::is_premium() ) {
    // load Pro modules
}
```

Hot path on every page-load: `is_premium()` reads `yourplugin_premium_active` (option, autoloaded) → if true, calls `validate_connection()` which reads `yourplugin_license_check` (transient, autoloaded) → returns cached. Total cost: **two `get_option()` reads, no network**. The daily refresh runs once per 24 h on `admin_init` only.

---

## 11. Free vs Pro builds

If the plugin ships free + pro variants from a single source, strip the licence layer from the free build. In `scripts/build.sh`:

```bash
# Free build — exclude licence manager
rm -f "$BUILD/yourplugin/includes/class-license-manager.php"

# Pro build — include
cp "$ROOT/includes/class-license-manager.php" "$BUILD/yourplugin-pro/includes/"
# (no anon-key injection in v3)
```

In your orchestrator class:

```php
private function load_dependencies(): void {
    if ( self::is_pro_plugin() ) {
        require_once YOURPLUGIN_DIR . 'includes/class-license-manager.php';
    }
}

private function register_hooks(): void {
    if ( self::is_pro_plugin() ) {
        add_action( 'admin_init', [ 'Yourplugin_License_Manager', 'validate_license_periodically' ] );
    }
}
```

`is_pro_plugin()` is just a constant check: `return defined('YOURPLUGIN_PRO') && YOURPLUGIN_PRO === true`. The constant is defined in the main plugin file and the build script flips it true/false via `sed`.

---

## 12. Cache strategy and rate-limit handling

| Layer | TTL | Bypass |
|-------|-----|--------|
| `transient: yourplugin_license_check` | `DAY_IN_SECONDS` (24 h) | `validate_connection( force: true )` |
| `transient: yourplugin_license_last_check` | `DAY_IN_SECONDS` (24 h) | "Did we run the daily forced check?" guard. |
| `option: yourplugin_license_data` | Never expires | Last known good (or known bad) payload, for the admin UI. |
| `option: yourplugin_premium_active` | Never expires | Hot-path bool. |
| `transient: yourplugin_connect_error` | 60 s | Set by `handle_callback()` on failure; consumed by `/license/status`. |

If the server returns HTTP 429, the plugin serves the cached state and doesn't churn the cache. The 60 req/min/IP limit is generous for normal use, but a busy host with many plugin installs sharing an IP could hit it; serving cached state for that minute is the right behaviour.

If the server is unreachable (network error), the plugin **fails soft** — returns the last known good state instead of locking the user out. This protects against blips in connectivity dropping users out of Pro for a day.

---

## 13. Hard-learned lessons (read before porting)

Eleven painful truths discovered while shipping 1.12.0 → 1.12.5. Skim before you start porting; it'll save you the same multi-day debug cycle.

### 13.1 Probe the endpoint with `curl` BEFORE you trust any documentation

The LicenSuite v3 doc had a contradiction between its §URLs section ("anon key") and its PHP example ("connection_secret"). We picked the wrong path on first reading and shipped 1.12.0–1.12.3 with broken validation. The "Last check: Never" symptom in the dashboard was the only clue, and it took until 1.12.4 to root-cause.

Before writing a single line of plugin code, run:

```bash
# Should fail with UNAUTHORIZED_NO_AUTH_HEADER
curl -X POST -H "Content-Type: application/json" -d '{}' \
  https://[ref].supabase.co/functions/v1/plugin-validate

# Should fail with UNAUTHORIZED_INVALID_JWT_FORMAT  ← if you ever see this in production, you're sending a non-JWT in Authorization
curl -X POST -H "Authorization: Bearer fake-secret" \
  -H "Content-Type: application/json" -d '{"connection_id":"test"}' \
  https://[ref].supabase.co/functions/v1/plugin-validate

# Should return 200 + { valid: false, reason: "invalid_connection_id", ... }
curl -X POST -H "Authorization: Bearer <YOUR_ANON_KEY>" \
  -H "Content-Type: application/json" -d '{"connection_id":"test"}' \
  https://[ref].supabase.co/functions/v1/plugin-validate
```

If the third call doesn't return 200, the endpoint isn't reachable as the doc claims. Talk to whoever maintains LicenSuite before integrating.

### 13.2 Two-layer auth — anon key in header, secret in body

Supabase Edge Functions verify the `Authorization: Bearer <token>` as a JWT *before* your function code runs. The anon key (public, baked into every Supabase frontend) satisfies that gate. The function then reads `connection_id` + `connection_secret` from the request body and validates them against the database.

Sending the connection_secret in `Authorization` returns `401 UNAUTHORIZED_INVALID_JWT_FORMAT` and your function never executes — but every error path in your plugin sees a generic 401 and fails opaquely. Don't go there.

### 13.3 The plan is an object, not a string

LicenSuite v4 returns `plan: { slug, name, max_sites, sort_order }` instead of `plan: "pro"`. Naive `plan.toUpperCase()` crashes the React UI with `TypeError`. Two-layer fix:

- **PHP** normalizes `plan` to a canonical `{ slug, name, max_sites }` object on every persist (`normalize_payload()` in this repo). String inputs get wrapped (`"pro"` → `{ slug: 'pro', name: 'Pro', max_sites: null }`).
- **React** reads `plan.name` for display (operator-configured, "Agency", "Enterprise 50 sites") and falls back defensively to slug → 'Pro' if the name is missing.

### 13.4 Use `plan.name` for display, `plan.slug` for gating

`plan.name` is what the operator wrote in the LicenSuite admin — already formatted ("Agency", "Pro Annual"). Don't uppercase it; just render it. `plan.slug` is the stable identifier — use it whenever you compare against "is this premium?".

### 13.5 Premium gating must be filterable, not hardcoded

Hardcoding `['pro', 'basic']` in `is_premium()` is a footgun. If the operator adds an `agency` or `studio` plan in the dashboard, the plugin silently rejects them. Use a filter:

```php
public static function is_premium_slug( ?string $slug ): bool {
    if ( ! is_string( $slug ) || '' === $slug ) return false;
    $premium = apply_filters(
        'yourplugin_premium_plan_slugs',
        [ 'pro', 'basic', 'agency', 'enterprise' ]
    );
    return in_array( $slug, (array) $premium, true );
}
```

Operators can extend without touching plugin code. Default list is whatever ships in the LicenSuite catalogue today.

### 13.6 Never early-bail in `is_premium()` on a stored boolean

We had this in 1.12.0–1.12.2:

```php
// WRONG — locks the plugin permanently if the option ever flips to false
public static function is_premium(): bool {
    if ( ! get_option( self::OPTION_NAME, false ) ) return false;
    // … rest of the check
}
```

Any path that briefly set the flag to `false` (a corrupted transient, a network blip, a v2→v3 migration with malformed data, anything) trapped the plugin in a "locked" state from which `is_premium()` could never recover — because it bailed out before reaching the live validation that would have unstuck it.

**Always derive `is_premium()` from current state**: connection presence → cached validation transient → premium slug check. Use the stored `OPTION_NAME` as a downstream mirror only (write to it inside the method, never gate on it at the top).

### 13.7 `valid: true` is enough — don't gate on `reason: 'ok'`

Early code required both:

```php
// WRONG — server may not always echo reason on success
if ( 200 === $status && ! empty( $data['valid'] ) && 'ok' === $data['reason'] ) {
    self::activate_premium();
}
```

LicenSuite v4 sometimes omits `reason` on successful validations. Gating on it caused `activate_premium()` to never fire, which fed bug 13.6 above. Loosen to `if ( 200 === $status && ! empty( $data['valid'] ) )` and you're safe.

### 13.8 The deactivation hook fires INSIDE the deactivating request

`register_deactivation_hook` runs once during the request that deactivates the plugin. After it returns, the plugin is unloaded. Any transient or admin notice you set inside it will not fire on a subsequent admin pageload — because your `admin_notices` callback is no longer registered.

If you want a "this site is no longer using the licence, go revoke from the dashboard" notice, set the transient from the **React Disconnect button path** (REST endpoint, plugin still active), not from the deactivation hook.

For the deactivation hook itself, the canonical behaviour is "clean up and shut up" — call `clear_connection()`, then return. The seat stays listed on the LicenSuite dashboard until the user revokes it manually with one click. This matches Bricks / WP Rocket / Elementor.

### 13.9 The Supabase anon key is public — hardcode it

We initially built a placeholder + `sed` swap + GitHub Actions secret pipeline to inject the anon key at build time. That was overengineering. The same key is embedded in plain text on every page of the LicenSuite frontend (and on every other Supabase-backed website on the planet). Hardcode it directly in `class-license-manager.php`. Allow override via constant + filter for forks. Rotation, when needed, is a regular plugin release — not a CI rebuild trigger.

### 13.10 Mirror the server's reserved-domain rule for dev hosts

LicenSuite refuses connections from `localhost`, `*.local`, `*.test`, `*.localhost`, `*.invalid`, `*.example`, IPv6 `::1`, and IPv4 private ranges (`127.x`, `10.x`, `192.168.x`, `172.16-31.x`). Your `is_development_domain()` should mirror that exactly and short-circuit `validate_connection()` before the network call — otherwise every dev pageload makes a doomed HTTP request and gets a `reserved_domain` error.

Expose the override as a filter so a developer can force the real Connect flow against a staging dashboard from `localhost`:

```php
add_filter( 'yourplugin_is_development_domain', '__return_false' );
```

### 13.11 Migration scaffolding only matters if you're upgrading an existing user base

The `pending_reconnect` banner pattern (§8) was useful for Animicro Pro 1.11.x → 1.12.x because there were existing installs with stored `license_key` options that needed to be transitioned. If your new plugin starts directly on the v3 Connect flow, skip §8 entirely — the migration code is dead weight.

We dropped it from Animicro Pro in 1.12.5 once we confirmed no installs were running the legacy flow.

---

## 14. Step-by-step: porting to a new plugin

Assuming you already have the plugin scaffolded. Read §13 first — most steps below are the action items derived from those lessons.

### 14.1 Server-side prep

1. **Create the product in the LicenSuite admin**. Note the product `slug` (e.g. `pulse-chat-ai`). It must match exactly.

2. **Probe the endpoint with `curl`** (see §13.1). Confirm:
   - Anon-key-only request returns 200.
   - The shape of the response (`plan` object, `sites`, `expires_at`).
   - Any reasons your plugin needs to handle that aren't documented.

   Don't skip this. Every shipping bug we hit was something `curl` would have caught in five minutes.

### 14.2 PHP — copy + customize the core

3. **Copy `includes/class-license-manager.php`** verbatim into your plugin's includes folder.

4. **Find/replace** in that file:
   - `Animicro_License_Manager` → `Yourplugin_License_Manager`
   - `animicro_` → `yourplugin_` (option names, transient names, filter names)
   - `'animicro'` (product_slug literal) → `'your-product-slug'` from step 1

5. **Verify the URLs**. If you're on the same Supabase project as Animicro, the URLs are already right (the `[ref]` is the same project — verify against your `.env` to be sure). Otherwise:
   ```php
   private string $validate_url   = 'https://<NEW_REF>.supabase.co/functions/v1/plugin-validate';
   private string $exchange_url   = 'https://<DASHBOARD_HOST>/api/plugin-connect/exchange';
   private string $dashboard_url  = 'https://<DASHBOARD_HOST>/plugin-connect';
   ```

6. **Verify the anon key** in `$supabase_anon_key`. Same key as the LicenSuite frontend → if your plugin talks to the same project as Animicro, the key is identical. If different project, copy the new project's anon key (public, the same one their frontend embeds).

7. **Adapt `PRO_MODULES` / `FREE_MODULES`** to your plugin's actual module list, or remove the constants entirely if your plugin doesn't have an Animicro-style module catalogue. The `is_pro_module()` helper is plugin-specific; only `is_premium_slug()` matters globally.

8. **Verify the premium-slug list**. The default `[ 'pro', 'basic', 'agency', 'enterprise' ]` covers the LicenSuite catalogue today. Adjust the default if your dashboard has different slugs, but always wrap in the `apply_filters( 'yourplugin_premium_plan_slugs', … )` so future operators can extend without code changes.

### 14.3 PHP — wire into WordPress

9. **`register_deactivation_hook`** in your main plugin file calls a static `Yourplugin::deactivate()` that calls `clear_connection()`. (See §7.1.) Don't try to ping the server — there is no public self-revoke endpoint.

10. **`uninstall.php`** runs the same cleanup unconditionally — see §7.2 for the exact `delete_option()` list.

11. **`admin_init`** wires both periodic validation and the OAuth callback handler:
    ```php
    add_action( 'admin_init', [ 'Yourplugin_License_Manager', 'validate_license_periodically' ] );
    add_action( 'admin_init', [ $this, 'maybe_handle_connect_callback' ] );
    ```

12. **`admin_notices`** hooks the disconnect reminder (only fires for the React Disconnect path — see §13.8 for why):
    ```php
    add_action( 'admin_notices', [ $this, 'maybe_notice_revoke_reminder' ] );
    ```

### 14.4 PHP — REST routes

13. **Register the three REST routes** in your admin class — `GET /license/status`, `GET /license/connect-url`, `POST /license/disconnect`. Copy the implementations from §9 / `class-admin.php` in this repo.

### 14.5 React — UI

14. **Copy `admin/src/components/LicensePage.tsx`** as a starting template. Adapt:
    - Rename `window.animicroData` → `window.yourpluginData`.
    - Rebrand colours / copy / icons to match your plugin's design system.
    - Keep the three states (`dev` / `connected` / `disconnected`). Add `pending_reconnect` only if §8 applies to you.

15. **Copy the `LicenseStatus` interface** from `admin/src/types.ts` verbatim. Same shape works for any LicenSuite-backed plugin.

### 14.6 Gating + tests

16. **Use `Yourplugin_License_Manager::is_premium()`** wherever you gate Pro features in PHP. In React, read `is_premium` from `/license/status` or from `window.yourpluginData.isPremium` (set during admin asset enqueue).

17. **Smoke-test the full cycle**:
    - **Fresh install** → Connect → Pro features unlock, LicenSuite "Last check" updates within ~24 h.
    - **Deactivate plugin** → connection cleared from `wp_options`. Reactivate → state is "Disconnected", re-Connect works.
    - **Disconnect button** (React) → connection cleared, info notice appears on next admin pageload reminding to revoke from dashboard.
    - **Localhost** → "Dev mode" card, no network call. `add_filter('yourplugin_is_development_domain','__return_false')` re-enables the real flow for local testing.

That's the full port. Plan ~30 minutes for the second plugin (you already have the pattern memorised), ~2 hours for the first one (most time on the React rebrand and the smoke-tests).

> **What you do NOT need**: build-time anon-key injection, GitHub Actions secrets, custom build scripts, runtime config files. Everything is hardcoded with public values + filters for overrides. If the LicenSuite project ever rotates the anon key, the rotation is a normal plugin release.

---

## 15. References

- **LicenSuite server docs**: `docs/WORDPRESS_INTEGRATION.md` (in this repo, mirrored from upstream) — endpoint reference, dashboard flow, response shapes.
- **Reference PHP implementation**: `includes/class-license-manager.php` — the canonical v4-aligned consumer (~400 lines, self-contained, no dependencies on the rest of Animicro).
- **Reference React component**: `admin/src/components/LicensePage.tsx` — three-state UI (dev/connected/disconnected) wiring the REST routes.
- **CHANGELOG history of the auth saga**:
  - 1.12.0 — initial v3 Connect flow (auth-broken: connection_secret in Authorization header).
  - 1.12.1 — defensive frontend against `plan` shape change in v4.
  - 1.12.2 — keep the rich `{slug, name, max_sites}` plan shape end-to-end.
  - 1.12.3 — `is_premium()` always derives from current state; `animicro_premium_plan_slugs` filter.
  - 1.12.4 — auth fix: anon key in Authorization, secret in body. The bug everyone should learn from.
  - 1.12.5 — clear-on-deactivate; doc-sync with v4 final; migration scaffolding purged.
