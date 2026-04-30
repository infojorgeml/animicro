# Licensing system — plugin-side reference

This document describes how Animicro Pro consumes the **LicenSuite v2.0.0** licensing backend (Supabase Edge Functions). It's written as a reusable reference: the same pattern can be ported to any WordPress plugin by renaming prefixes (`animicro_` → `yourplugin_`, `Animicro_` → `Yourplugin_`, slug `animicro` → your slug) and copying ~3 files.

The server-side documentation (endpoints, response shapes, rate limits) lives in the LicenSuite repo at `~/Desktop/Licence Manager/docs/WORDPRESS_INTEGRATION.md`. This doc covers everything that happens **inside the plugin**.

---

## 1. Architecture

```
┌─────────────────────┐         ┌──────────────────────────┐
│  WordPress site     │         │  LicenSuite (Supabase)   │
│                     │         │                          │
│  yourplugin/        │         │  Edge Functions:         │
│  ├─ class-license-  │ HTTPS   │  - /license-check        │
│  │   manager.php  ──┼─────────┼─→ - /license-deactivate  │
│  └─ wp_options:     │         │                          │
│     ├─ yourplugin_  │         │  Postgres tables:        │
│     │  license_key  │         │  - licenses              │
│     │  (AES-256)    │         │  - license_sites         │
│     ├─ ..._data     │         │  - products              │
│     └─ ..._premium_ │         │                          │
│        active       │         │                          │
└─────────────────────┘         └──────────────────────────┘
```

Three responsibilities split across the system:

| Component | Job | Where |
|-----------|-----|-------|
| **LicenSuite server** | Owns the source of truth: which licenses exist, who owns them, which seats are taken, what plan each licence belongs to. | Supabase project. Same backend can serve N plugins by passing different `product` slugs. |
| **`class-license-manager.php`** | Calls the server, caches the result, derives "is this user premium right now?", encrypts the key at rest, handles seat lifecycle (claim on save, release on deactivation/uninstall, dev bypass on localhost). | Inside the plugin. **One file, ~440 lines**. |
| **The rest of the plugin** | Calls `Yourplugin_License_Manager::is_premium()` wherever it needs to gate Pro features. | Wherever Pro features live. |

Distribution and licensing are intentionally decoupled: the public ZIP is downloadable by anyone (see `docs/animicro.md` → Release pipeline), but the licence still gates Pro features at runtime. Stealing the ZIP gets the user a locked plugin.

---

## 2. Server endpoints (summary)

Full spec is in the LicenSuite repo. The plugin only needs to know:

### `GET /functions/v1/license-check?license=...&domain=...&product=...`

Authenticated with `Authorization: Bearer <SUPABASE_ANON_KEY>` (public anon key — not secret).

Success (HTTP 200):
```json
{
  "valid": true,
  "reason": "ok",
  "plan": "pro",
  "expires_at": "2027-12-31T23:59:59Z",
  "registered_domain": "example.com",
  "sites": { "used": 3, "max": 5, "unlimited": false }
}
```

Failure reasons (HTTP 200 with `valid: false`, or HTTP 4xx):
- `not_found`, `expired`, `disabled`, `product_mismatch` — licence exists but rejected.
- `limit_reached` — multi-site cap hit. Includes `sites.active_domains` array.
- `reserved_domain` — `localhost` / `*.local` / `*.test` etc. (handled in plugin, see §6).
- `invalid_license_format`, `invalid_product_format`, `invalid_domain`, `missing_params` — bad input.
- `rate_limited` — HTTP 429 with `Retry-After`. 30 req/min/IP.

### `GET /functions/v1/license-deactivate?license=...&domain=...&product=...`

Same auth. Releases the seat held by `domain` so the user can move the licence to a different site.

```json
{ "deactivated": true, "reason": "ok", "remaining_sites": 4 }
```

Idempotent: calling it on a domain that's already not active returns `{ deactivated: false, reason: "not_active" }`. The plugin should **never** treat that as an error.

---

## 3. Plugin-side files

For Animicro Pro the licensing layer is ONE file plus two integration points:

```
yourplugin/
├── yourplugin.php                    # main file — registers (de)activation hooks
├── uninstall.php                     # release seat before wiping options
└── includes/
    └── class-license-manager.php     # the whole licensing module
```

The license manager file is ~440 lines and self-contained. To port: copy, rename the prefix, swap the `product_slug`, swap the Supabase project URL (or read it from a constant). That's it.

### File map (what each section of the class does)

```php
class Yourplugin_License_Manager {

    // === Constants ===
    const OPTION_NAME       = 'yourplugin_premium_active';   // bool option
    const PRO_MODULES       = [ ... ];                       // for is_pro_module()
    const FREE_MODULES      = [ ... ];

    // === Instance state ===
    private string $api_url            = 'https://<PROJECT_REF>.supabase.co/functions/v1/license-check';
    private string $deactivate_url     = 'https://<PROJECT_REF>.supabase.co/functions/v1/license-deactivate';
    private string $supabase_anon_key  = '__YOURPLUGIN_SUPABASE_ANON_KEY__';  // injected at build time
    private string $product_slug       = 'yourplugin';
    private string $option_name        = 'yourplugin_license_key';
    private string $license_data_option= 'yourplugin_license_data';

    // === Key persistence ===
    public  function get_license_key()                       // decrypts on read
    public  function save_license_key( string $key )         // encrypts on write
                                                             // also releases previous seat
    private function encryption_key()                        // SHA-256 of AUTH_KEY+SECURE_AUTH_KEY
    private function encrypt(), decrypt()                    // AES-256-CBC

    // === Validation ===
    public  function validate_license( $key = null, $force = false )
    public  function deactivate_license( $key = null, $blocking = false )

    // === Domain helpers ===
    private function normalize_domain(),  get_current_domain()
    private function is_development_domain()                 // localhost / .local / .test bypass

    // === Convenience accessors ===
    public  function get_license_plan()                      // 'pro' | 'basic' | 'free'
    public  function get_license_data()                      // full last response

    // === User-facing error mapping ===
    public  function get_error_message( string $reason ): string

    // === Static helpers (used by the rest of the plugin) ===
    public static function is_premium(): bool                // ← the main check
    public static function is_pro_module( string $id ): bool
    public static function activate_premium(), deactivate_premium()

    // === Lifecycle hooks ===
    public static function validate_license_periodically()   // wired on admin_init
    public static function register_hooks()                  // wired on file load
    public static function on_domain_change()                // siteurl / home filter
}
```

---

## 4. Encryption at rest

The licence key is stored AES-256-CBC encrypted in `wp_options`, keyed by a derivative of WordPress's `AUTH_KEY` + `SECURE_AUTH_KEY` constants:

```php
private function encryption_key(): string {
    $secret  = defined( 'AUTH_KEY' ) ? AUTH_KEY : '';
    $secret .= defined( 'SECURE_AUTH_KEY' ) ? SECURE_AUTH_KEY : '';
    return hash( 'sha256', '' !== $secret ? $secret : 'yourplugin-fallback', true );
}

private function encrypt( string $plain ): string {
    if ( '' === $plain ) return '';
    $iv     = random_bytes( 16 );
    $cipher = openssl_encrypt( $plain, 'AES-256-CBC', $this->encryption_key(), OPENSSL_RAW_DATA, $iv );
    if ( false === $cipher ) return '';
    return base64_encode( $iv . $cipher );
}
```

Why bother:

- Defends against database dumps leaking out of context (e.g. dev backups committed to git).
- The salts are unique per install, so dumps from one site don't decrypt on another.
- Doesn't protect against attackers who already have read access to `wp-config.php` — there is no defence at that level, since the same attacker could just patch the plugin to print the decrypted key.

Migration from plaintext is automatic in `get_license_key()`:

```php
public function get_license_key(): string {
    $stored = (string) get_option( $this->option_name, '' );
    if ( '' === $stored ) return '';

    $decrypted = $this->decrypt( $stored );
    if ( '' !== $decrypted ) return $decrypted;

    // Legacy plaintext value — migrate to encrypted at rest.
    update_option( $this->option_name, $this->encrypt( $stored ) );
    return $stored;
}
```

So when porting to an existing plugin that previously stored keys in plaintext, the upgrade is transparent for users.

---

## 5. The validation flow (`validate_license`)

```
validate_license( $key = null, $force = false )
│
├─ if no key in args, read from option (decrypted)
├─ if still empty → return { valid: false, reason: "no_license" }
│
├─ if is_development_domain() → return synthetic { valid: true, plan: "pro", dev: true }
│       (no network call, no seat consumed — see §6)
│
├─ if !$force and transient cache hit → return cached
│
├─ build URL, set Authorization header, wp_remote_get()
│
├─ if WP_Error → return { valid: false, reason: "connection_error" }
├─ if HTTP 429 → return { valid: false, reason: "rate_limited" }
├─ if response not JSON → return { valid: false, reason: "invalid_response" }
├─ if HTTP 404 + code=NOT_FOUND → return { valid: false, reason: "function_not_found" }
├─ if HTTP non-200 → handle reason, persist sites/expires for limit_reached etc., deactivate_premium()
│
├─ if data.valid === true and data.reason === "ok":
│       persist data in license_data option
│       set transient cache (DAY_IN_SECONDS)
│       activate_premium() or deactivate_premium() based on plan
│       return data
│
└─ else (data.valid === false):
        if reason in [limit_reached, expired, disabled, product_mismatch]:
            persist data (so admin can render explanation)
        else:
            wipe license_data
        deactivate_premium()
        return { valid: false, reason, plan, sites, expires_at, error }
```

Two key principles:

1. **Cache aggressively.** `set_transient($key, $data, DAY_IN_SECONDS)` keeps the per-page-load cost at zero. The 30 req/min rate limit is generous, but checking once per page-load on every visitor would burn it instantly on a moderate-traffic site.

2. **Fail closed, but informatively.** If the licence is invalid for any reason, `deactivate_premium()` is called immediately so Pro features stop working. But the response payload is preserved so the admin can render a useful "your seat is taken on these domains" message instead of a generic "invalid".

---

## 6. Local development bypass

LicenSuite v2 rejects any `domain` that looks like a development host: `localhost`, `*.local`, `*.test`, IPv6 loopback `::1`, IPv4 in private ranges, etc. Without a bypass, every developer working on the plugin locally would see Pro features locked, which is awful DX.

The plugin mirrors LicenSuite's reserved-domain rule and short-circuits the validation **before any network call**:

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
            preg_match( '/^127\./', $domain ) ||
            preg_match( '/^10\./', $domain ) ||
            preg_match( '/^192\.168\./', $domain ) ||
            preg_match( '/^172\.(1[6-9]|2[0-9]|3[0-1])\./', $domain )
        ) {
            $is_dev = true;
        }
    }

    return (bool) apply_filters( 'yourplugin_is_development_domain', $is_dev, $domain );
}
```

When `validate_license()` detects a dev domain it returns a synthetic premium payload:

```php
if ( $this->is_development_domain() ) {
    $dev = [
        'valid'      => true,
        'reason'     => 'ok',
        'plan'       => 'pro',
        'expires_at' => null,
        'sites'      => [ 'used' => 0, 'max' => null, 'unlimited' => true ],
        'dev'        => true,                  // marker for the admin UI
    ];
    update_option( $this->license_data_option, $dev );
    set_transient( 'yourplugin_license_check', $dev, DAY_IN_SECONDS );
    self::activate_premium();
    return $dev;
}
```

`deactivate_license()` does the same: dev hosts never consumed a seat, so deactivation is a no-op that just clears the local cache.

The filter `yourplugin_is_development_domain` lets advanced users override the detection (e.g. force a real check on a public staging domain that happens to match `*.test`, or treat a custom dev TLD as dev).

---

## 7. Lifecycle hooks

The licence has to be released from the server when the plugin leaves a site, so the user gets the seat back without contacting support. Three integration points:

### 7.1 Plugin deactivation

In the main plugin file:

```php
register_deactivation_hook( __FILE__, [ 'Yourplugin', 'deactivate' ] );
```

In the orchestrator class:

```php
public static function deactivate(): void {
    if ( ! class_exists( 'Yourplugin_License_Manager' ) ) {
        $file = YOURPLUGIN_DIR . 'includes/class-license-manager.php';
        if ( is_readable( $file ) ) {
            require_once $file;
        }
    }
    if ( class_exists( 'Yourplugin_License_Manager' ) ) {
        $manager = new Yourplugin_License_Manager();
        $manager->deactivate_license( null, false );  // fire-and-forget
    }
}
```

`$blocking = false` is critical: if the network is slow or down, we never want to hang the WP admin while the user is just disabling a plugin.

### 7.2 Plugin uninstall

`uninstall.php` runs in a fresh WP context with the main plugin file NOT loaded, so `YOURPLUGIN_PRO` (or whatever pro flag) is not defined. Detect "is this Pro?" by the **presence of the licence-manager file**:

```php
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) exit;

$license_manager_file = __DIR__ . '/includes/class-license-manager.php';
if ( is_readable( $license_manager_file ) ) {
    require_once $license_manager_file;
    if ( class_exists( 'Yourplugin_License_Manager' ) ) {
        $manager = new Yourplugin_License_Manager();
        $manager->deactivate_license( null, false );
    }
}

// Then wipe options as usual:
delete_option( 'yourplugin_settings' );
delete_option( 'yourplugin_license_key' );
delete_option( 'yourplugin_license_data' );
delete_option( 'yourplugin_premium_active' );
delete_transient( 'yourplugin_license_check' );
delete_transient( 'yourplugin_license_last_check' );
```

If the build pipeline ships free and pro variants from a single source, the free build strips this file (see §10), so the seat-release call doesn't run on free uninstalls (free has no seat to release anyway).

### 7.3 Replacing the licence key

When the user pastes a new key in the admin, the previous key's seat must be released too:

```php
public function save_license_key( string $license_key ): void {
    $sanitized = sanitize_text_field( $license_key );

    // If the user is replacing an existing key, release the seat held by
    // the previous one before storing the new value (best-effort, blocking).
    $previous = $this->get_license_key();
    if ( '' !== $previous && strtoupper( trim( $previous ) ) !== strtoupper( trim( $sanitized ) ) ) {
        $this->deactivate_license( $previous, true );
    }

    update_option( $this->option_name, $this->encrypt( $sanitized ) );
    delete_option( $this->license_data_option );
    delete_transient( 'yourplugin_license_check' );
    delete_transient( 'yourplugin_license_last_check' );
}
```

The `$blocking = true` here is intentional: we want to be sure the old seat is released before claiming a new one with the next `validate_license()` call.

### 7.4 Domain change

If the user changes the site URL (typically during a migration), the cached `domain` is stale. Hook the option filters:

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

The next check picks up the new domain. The user may end up with a `limit_reached` if their plan is full, which is the correct behaviour — they need to release the old domain manually.

### 7.5 Periodic re-validation

A revoked or expired licence has to lock the plugin even if the user never visits the licence page. Run a daily check on `admin_init`:

```php
public static function validate_license_periodically(): void {
    if ( false === get_transient( 'yourplugin_license_last_check' ) ) {
        ( new self() )->validate_license( null, true );  // force, bypass cache
        set_transient( 'yourplugin_license_last_check', time(), DAY_IN_SECONDS );
    }
}

// In the orchestrator:
add_action( 'admin_init', [ 'Yourplugin_License_Manager', 'validate_license_periodically' ] );
```

This is the ONLY place that bypasses the cache. Every other read uses the daily-cached transient.

---

## 8. REST API for the admin UI

The React/JS admin needs two endpoints: one to read the current state, one to save a key.

```php
register_rest_route( 'yourplugin/v1', '/license/status', [
    'methods'             => 'GET',
    'callback'            => [ $this, 'get_license_status' ],
    'permission_callback' => fn() => current_user_can( 'manage_options' ),
] );

register_rest_route( 'yourplugin/v1', '/license/save', [
    'methods'             => 'POST',
    'callback'            => [ $this, 'save_license' ],
    'permission_callback' => fn() => current_user_can( 'manage_options' ),
    'args' => [
        'license_key' => [
            'required'          => true,
            'type'              => 'string',
            'sanitize_callback' => 'sanitize_text_field',
        ],
    ],
] );
```

Implementations:

```php
public function get_license_status(): \WP_REST_Response {
    $manager = new Yourplugin_License_Manager();
    return new \WP_REST_Response( [
        'license_key'  => $manager->get_license_key(),
        'license_data' => $manager->get_license_data(),
        'is_premium'   => Yourplugin_License_Manager::is_premium(),
        'plan'         => $manager->get_license_plan(),
    ] );
}

public function save_license( \WP_REST_Request $request ): \WP_REST_Response {
    $key     = $request->get_param( 'license_key' ) ?? '';
    $manager = new Yourplugin_License_Manager();
    $manager->save_license_key( $key );

    if ( '' !== $key ) {
        $result = $manager->validate_license( $key, true );  // force fresh check
        if ( ! empty( $result['valid'] ) ) {
            Yourplugin_License_Manager::activate_premium();
        } else {
            Yourplugin_License_Manager::deactivate_premium();
        }
        return new \WP_REST_Response( [
            'is_premium' => ! empty( $result['valid'] ),
            'data'       => $result,
            'message'    => $manager->get_error_message( $result['reason'] ?? 'server_error' ),
        ] );
    }

    Yourplugin_License_Manager::deactivate_premium();
    return new \WP_REST_Response( [
        'is_premium' => false,
        'data'       => [ 'valid' => false, 'reason' => 'no_license', 'plan' => null ],
        'message'    => $manager->get_error_message( 'no_license' ),
    ] );
}
```

CSRF nonce comes from `wpApiSettings.nonce` injected via `wp_localize_script()` on the admin page. The frontend just adds `X-WP-Nonce` to its fetch calls — standard WP REST flow.

---

## 9. Premium gating

`is_premium()` is the canonical "is this user paying?" check. It's intentionally **not just a flag read** — it forces a re-validation when the cached state suggests premium but the data is stale:

```php
public static function is_premium(): bool {
    $pro_enabled = get_option( self::OPTION_NAME, false );
    if ( ! $pro_enabled ) {
        return false;
    }

    // Even if the option says yes, double-check against (cached) server state.
    // validate_license() reads from transient on the hot path, so this is cheap.
    $manager      = new self();
    $license_data = $manager->validate_license();

    if ( empty( $license_data['valid'] ) ) {
        self::deactivate_premium();
        return false;
    }

    $plan = $license_data['plan'] ?? null;
    if ( ! in_array( $plan, [ 'pro', 'basic' ], true ) ) {
        self::deactivate_premium();
        return false;
    }

    return true;
}
```

Use everywhere a Pro feature is gated:

```php
// PHP
if ( Yourplugin_License_Manager::is_premium() ) {
    // load Pro modules
}

// REST endpoint
if ( ! Yourplugin_License_Manager::is_premium() ) {
    return new \WP_Error( 'rest_forbidden', 'Premium required.', [ 'status' => 403 ] );
}

// React admin (via the /license/status endpoint payload)
{state.is_premium && <ProSettingsPanel />}
```

The `is_pro_module()` static helper checks against the const `PRO_MODULES`:

```php
public static function is_pro_module( string $module_id ): bool {
    return in_array( $module_id, self::PRO_MODULES, true );
}
```

So the same module list lives in PHP and TypeScript (the latter via `wp_localize_script`), and both sides agree on what's free vs pro without a network round-trip.

---

## 10. Build-time anon key injection

The Supabase anon key is **public** (frontend uses the same key in every page-load), but we still don't want it sitting in the public source repo — it makes rotation easier when needed.

The plugin source carries a placeholder:

```php
private string $supabase_anon_key = '__YOURPLUGIN_SUPABASE_ANON_KEY__';
```

The build script swaps it with the real key from a local `.env.build` (or environment variable in CI):

```bash
# scripts/build.sh excerpt
if [[ -z "${YOURPLUGIN_SUPABASE_ANON_KEY:-}" && -f "$ROOT/.env.build" ]]; then
    set -a; . "$ROOT/.env.build"; set +a
fi
if [[ -z "${YOURPLUGIN_SUPABASE_ANON_KEY:-}" ]]; then
    echo "ERROR: YOURPLUGIN_SUPABASE_ANON_KEY is not set" >&2
    exit 1
fi
sed -i.bak "s|__YOURPLUGIN_SUPABASE_ANON_KEY__|${YOURPLUGIN_SUPABASE_ANON_KEY}|" \
    "$BUILD/yourplugin-pro/includes/class-license-manager.php"
rm -f "$BUILD/yourplugin-pro/includes/class-license-manager.php.bak"
```

In GitHub Actions, the same value comes from a repo secret:

```yaml
env:
  YOURPLUGIN_SUPABASE_ANON_KEY: ${{ secrets.YOURPLUGIN_SUPABASE_ANON_KEY }}
```

The constructor also accepts a runtime override for tests / local debugging:

```php
public function __construct() {
    if ( defined( 'YOURPLUGIN_SUPABASE_ANON_KEY' ) ) {
        $this->supabase_anon_key = YOURPLUGIN_SUPABASE_ANON_KEY;
    } else {
        $this->supabase_anon_key = apply_filters( 'yourplugin_supabase_anon_key', $this->supabase_anon_key );
    }
}
```

---

## 11. Free vs Pro builds

If the plugin ships free + pro variants from a single source (recommended), strip the licence layer from the free build. In `scripts/build.sh`:

```bash
# Free build — exclude licence manager
rm -f "$BUILD/yourplugin/includes/class-license-manager.php"

# Pro build — include + inject anon key
cp "$ROOT/includes/class-license-manager.php" "$BUILD/yourplugin-pro/includes/"
sed -i.bak "s|__YOURPLUGIN_SUPABASE_ANON_KEY__|${YOURPLUGIN_SUPABASE_ANON_KEY}|" \
    "$BUILD/yourplugin-pro/includes/class-license-manager.php"
```

In `class-orchestrator.php`:

```php
private function load_dependencies(): void {
    if ( self::is_pro_plugin() ) {
        require_once YOURPLUGIN_DIR . 'includes/class-license-manager.php';
    }
    // ...other includes
}

private function register_hooks(): void {
    if ( self::is_pro_plugin() ) {
        add_action( 'admin_init', [ 'Yourplugin_License_Manager', 'validate_license_periodically' ] );
    }
}
```

`is_pro_plugin()` is just a constant check: `return defined('YOURPLUGIN_PRO') && YOURPLUGIN_PRO === true`. The constant is defined in the main plugin file and the build script flips it true/false via `sed`.

The Free build runs entirely without the licence file. No network calls, no premium check, no surprises in `wp_options`. WordPress.org's plugin review team (Plugin Check) is happy.

---

## 12. Cache strategy and rate-limit handling

| Layer | TTL | Bypass |
|-------|-----|--------|
| `transient: yourplugin_license_check` | `DAY_IN_SECONDS` (24h) | `validate_license( $key, force: true )` |
| `transient: yourplugin_license_last_check` | `DAY_IN_SECONDS` (24h) | Used as a "did we run the daily forced check?" guard. |
| `option: yourplugin_license_data` | Never expires | Last known good (or known bad) payload, for the admin UI. |
| `option: yourplugin_premium_active` | Never expires | Hot-path bool, written by `activate_premium()` / `deactivate_premium()`. |

Hot path on every page-load: `is_premium()` reads `yourplugin_premium_active` (option, autoloaded) → if true, calls `validate_license()` which reads `yourplugin_license_check` (transient, autoloaded) → returns cached. Total cost: **two `get_option()` reads, no network**.

When the cache expires, the next `is_premium()` call triggers one network round-trip and re-caches for 24h. With the rate limit at 30 req/min/IP, even a busy host with hundreds of plugin installs sharing an IP stays well within budget.

If the server returns HTTP 429, we don't retry inline; we return `{ valid: false, reason: "rate_limited" }` and let the existing transient stand (or fall to closed if it was missing). The `validate_license_periodically` daily job will retry the next day.

---

## 13. Step-by-step: porting to a new plugin

Assuming you already have the plugin scaffolded:

1. **Create a Supabase product** in the LicenSuite admin. Note the product `slug`.

2. **Copy `includes/class-license-manager.php`** into your plugin's includes folder.

3. **Find/replace** in that file:
   - `Animicro_License_Manager` → `Yourplugin_License_Manager`
   - `animicro_` → `yourplugin_` (option names, transient names, filter names)
   - `'animicro'` (product slug) → `'yourplugin-slug'` from step 1
   - `__ANIMICRO_SUPABASE_ANON_KEY__` → `__YOURPLUGIN_SUPABASE_ANON_KEY__`

4. **Update the URLs** if you're on a different Supabase project:
   ```php
   private string $api_url        = 'https://<NEW_PROJECT_REF>.supabase.co/functions/v1/license-check';
   private string $deactivate_url = 'https://<NEW_PROJECT_REF>.supabase.co/functions/v1/license-deactivate';
   ```

5. **Adjust `PRO_MODULES` / `FREE_MODULES`** to your plugin's module list. Or remove them if you don't have the Animicro-style module concept and just gate features individually.

6. **Wire into the lifecycle**:
   - `register_deactivation_hook` calls a static `Yourplugin::deactivate()` that calls `Yourplugin_License_Manager::deactivate_license()`. (See §7.1)
   - `uninstall.php` does the same. (See §7.2)
   - `add_action('admin_init', ['Yourplugin_License_Manager', 'validate_license_periodically'])` in your main class. (See §7.5)

7. **Add the REST routes** for the admin UI. (See §8)

8. **Add the build-time injection** in your `scripts/build.sh`. (See §10)

9. **Set `YOURPLUGIN_SUPABASE_ANON_KEY`** in `.env.build` locally and as a GitHub Actions secret.

10. **Use `Yourplugin_License_Manager::is_premium()`** wherever you gate Pro features.

That's it. Whole port should take an afternoon, most of it spent on find/replace and renaming the variables in your build script.

---

## 14. References

- **LicenSuite server docs**: `~/Desktop/Licence Manager/docs/WORDPRESS_INTEGRATION.md` — endpoint reference, response shapes, deployment.
- **Animicro Pro implementation**: `includes/class-license-manager.php` in this repo (the "official" reference implementation).
- **CHANGELOG entries**: 1.11.1 introduced LicenSuite v2 support and the local-dev bypass; subsequent versions inherit the same shape.
