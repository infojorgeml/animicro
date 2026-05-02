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

For Animicro Pro the licensing layer is ONE file plus three integration points:

```
yourplugin/
├── yourplugin.php                    # main file — registers (de)activation hooks
├── uninstall.php                     # cleans options
└── includes/
    ├── class-license-manager.php     # the whole licensing module
    └── class-admin.php               # REST routes + admin_init callback
```

The license manager file is ~440 lines and self-contained. To port: copy, rename the prefix, swap the `product_slug`, swap the dashboard / Supabase URLs. That's it.

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

## 13. Step-by-step: porting to a new plugin

Assuming you already have the plugin scaffolded:

1. **Create a Supabase product** in the LicenSuite admin. Note the product `slug`.

2. **Copy `includes/class-license-manager.php`** into your plugin's includes folder.

3. **Find/replace** in that file:
   - `Animicro_License_Manager` → `Yourplugin_License_Manager`
   - `animicro_` → `yourplugin_` (option names, transient names, filter names)
   - `'animicro'` (product slug) → `'your-slug'` from step 1

4. **Update the URLs** if you're on a different Supabase project:
   ```php
   private string $validate_url   = 'https://<NEW_REF>.supabase.co/functions/v1/plugin-validate';
   private string $exchange_url   = 'https://<YOUR_DASHBOARD>/api/plugin-connect/exchange';
   private string $dashboard_url  = 'https://<YOUR_DASHBOARD>/plugin-connect';
   ```

5. **Adjust `PRO_MODULES` / `FREE_MODULES`** to your plugin's module list. Or remove them if you don't have the Animicro-style module concept.

6. **Wire into the lifecycle**:
   - `register_deactivation_hook` calls a static `Yourplugin::deactivate()` that sets the revoke-reminder transient. (See §7.1)
   - `uninstall.php` cleans options. (See §7.2)
   - `add_action('admin_init', ['Yourplugin_License_Manager', 'validate_license_periodically'])` in your main class.
   - `add_action('admin_init', [$this, 'maybe_handle_connect_callback'])` in your admin class.
   - `add_action('admin_notices', [$this, 'maybe_notice_revoke_reminder'])` for the deactivation reminder.

7. **Add the REST routes** for the admin UI. (See §9)

8. **Build the React component** with three states (`dev`, `connected`, `disconnected`). Add a fourth (`pending_reconnect`) only if you're migrating from a v2 paste-the-key plugin (see §8). Reference: `admin/src/components/LicensePage.tsx` in this repo.

9. **Use `Yourplugin_License_Manager::is_premium()`** wherever you gate Pro features.

That's it. No build-time anon-key injection, no GitHub Actions secret, no manual config. The whole port should take an afternoon, mostly find/replace and wiring up the React state machine.

---

## 14. References

- **LicenSuite server docs**: `~/Desktop/Licence Manager/docs/WORDPRESS_INTEGRATION.md` — endpoint reference, dashboard flow.
- **Animicro Pro implementation**: `includes/class-license-manager.php` in this repo (the "official" reference implementation for a v3 consumer).
- **Reference React component**: `admin/src/components/LicensePage.tsx` — four-state machine that wires the REST routes to the UI.
- **CHANGELOG**: 1.12.0 introduced LicenSuite v3 support; the migration banner; encrypted-at-rest connection secret.
