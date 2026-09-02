<?php
/**
 * LicenSuite SDK for WordPress — license manager (license-key activation).
 *
 * @licensuite-sdk-generated -- DO NOT EDIT. Synced from the Licensuite repo (sdk/wordpress); edit there and run sync.sh.
 *
 * Architecture:
 *   1. After purchase the user receives a license key by email.
 *   2. They paste it in the plugin's License screen.
 *   3. activate_with_key() validates the key against the LicenSuite
 *      `license-check` Edge Function (key + domain + product) and, on success,
 *      stores the key (AES-256-CBC encrypted at rest) and unlocks Pro.
 *   4. validate() re-checks once per day against the same endpoint and caches
 *      the result. The server registers the domain in `license_sites` and
 *      enforces the plan's multi-site seat limit — that limit (not any second
 *      factor) is what caps license sharing.
 *   5. Removing the key calls `license-deactivate` to free the seat.
 *
 * Endpoints are public Supabase Edge Functions. The ANON key in the
 * Authorization header satisfies the gateway JWT layer that runs *before* the
 * function code; the license key + domain + product travel as query params:
 *   - GET /functions/v1/license-check?license=&domain=&product=
 *   - GET /functions/v1/license-deactivate?license=&domain=&product=
 *
 * Local domains (localhost, *.local, private IPs, …) validate like any other
 * domain — the server accepts them and they consume a seat, so the full
 * activation flow is testable on a dev site.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Animicro_License_Manager {

	/** Version of the shared SDK this copy was generated from. */
	const SDK_VERSION = '1.0.0';

	const OPTION_NAME = 'animicro_premium_active';

	/** LicenSuite license keys are 8 groups of 4 upper-alphanumerics. */
	const KEY_PATTERN = '/^[A-Z0-9]{4}(-[A-Z0-9]{4}){7}$/';

	private string $product_slug = 'animicro';

	// LicenSuite Edge Functions (direct license-key flow).
	private string $check_url      = 'https://bsfeayimmqekgkgkmtqv.supabase.co/functions/v1/license-check';
	private string $deactivate_url = 'https://bsfeayimmqekgkgkmtqv.supabase.co/functions/v1/license-deactivate';

	/**
	 * Supabase project anon key used to satisfy the Edge Function JWT
	 * verification layer on every call. This is the SAME public key the
	 * LicenSuite frontend embeds in its own HTML — it is not a secret, has no
	 * privileges beyond invoking the public Edge Functions, and rotating it is
	 * a regular plugin release. The actual per-site authentication is the
	 * license key, which travels in the query string.
	 *
	 * Override via the `ANIMICRO_SUPABASE_ANON_KEY` constant or the
	 * `animicro_supabase_anon_key` filter for forks / custom backends.
	 */
	private string $supabase_anon_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzZmVheWltbXFla2drZ2ttdHF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxODExNzAsImV4cCI6MjEwMDc1NzE3MH0.LSnakI8qGTmBeFYgcPuh5ljob9fQ0q9S8w3f4dRZa70';

	public function __construct() {
		if ( defined( 'ANIMICRO_SUPABASE_ANON_KEY' ) && is_string( ANIMICRO_SUPABASE_ANON_KEY ) && '' !== ANIMICRO_SUPABASE_ANON_KEY ) {
			$this->supabase_anon_key = ANIMICRO_SUPABASE_ANON_KEY;
		} else {
			$this->supabase_anon_key = (string) apply_filters( 'animicro_supabase_anon_key', $this->supabase_anon_key );
		}
	}

	// Storage keys.
	private string $license_key_option  = 'animicro_license_key';   // AES-256-CBC at rest
	private string $license_data_option = 'animicro_license_data';   // last good payload

	// ------------------------------------------------------------------
	// License-key storage
	// ------------------------------------------------------------------

	public function get_license_key(): string {
		$stored = (string) get_option( $this->license_key_option, '' );
		return '' === $stored ? '' : $this->decrypt( $stored );
	}

	public function has_license(): bool {
		return '' !== $this->get_license_key();
	}

	/**
	 * Masked key for display in the admin UI — only the last group is shown,
	 * everything before it is dotted. Never returns the real key.
	 */
	public function get_masked_key(): string {
		$key = $this->get_license_key();
		if ( '' === $key ) {
			return '';
		}
		$groups = explode( '-', $key );
		$last   = array_pop( $groups );
		$masked = array_map( static fn() => '••••', $groups );
		$masked[] = $last;
		return implode( '-', $masked );
	}

	private function persist_license_key( string $key ): void {
		update_option( $this->license_key_option, $this->encrypt( $key ) );

		// Drop any leftover Connect-flow credentials — a site uses a key OR a
		// connection, never both. Cheap insurance for installs upgrading from
		// an old Connect-based build; a no-op everywhere else.
		delete_option( 'animicro_connection_id' );
		delete_option( 'animicro_connection_secret' );
		delete_option( 'animicro_pending_reconnect' );

		// Drop the validation caches so the next read rebuilds them cleanly
		// with the new key.
		delete_transient( 'animicro_license_check' );
		delete_transient( 'animicro_license_last_check' );
	}

	/**
	 * Wipe local license state. Does NOT contact the server to free the seat —
	 * call deactivate_key() for the user-initiated "remove key" action, which
	 * frees the seat first.
	 */
	public function clear_license(): void {
		delete_option( $this->license_key_option );
		delete_option( $this->license_data_option );
		delete_transient( 'animicro_license_check' );
		delete_transient( 'animicro_license_last_check' );
		self::deactivate_premium();
	}

	// ------------------------------------------------------------------
	// AES-256-CBC at rest
	// ------------------------------------------------------------------

	private function encryption_key(): string {
		$secret  = defined( 'AUTH_KEY' ) ? AUTH_KEY : '';
		$secret .= defined( 'SECURE_AUTH_KEY' ) ? SECURE_AUTH_KEY : '';
		return hash( 'sha256', '' !== $secret ? $secret : 'animicro-fallback', true );
	}

	private function encrypt( string $plain ): string {
		if ( '' === $plain ) {
			return '';
		}
		$iv     = random_bytes( 16 );
		$cipher = openssl_encrypt( $plain, 'AES-256-CBC', $this->encryption_key(), OPENSSL_RAW_DATA, $iv );
		if ( false === $cipher ) {
			return '';
		}
		return base64_encode( $iv . $cipher );
	}

	private function decrypt( string $stored ): string {
		if ( '' === $stored ) {
			return '';
		}
		$raw = base64_decode( $stored, true );
		if ( false === $raw || strlen( $raw ) < 17 ) {
			return '';
		}
		$iv     = substr( $raw, 0, 16 );
		$cipher = substr( $raw, 16 );
		$plain  = openssl_decrypt( $cipher, 'AES-256-CBC', $this->encryption_key(), OPENSSL_RAW_DATA, $iv );
		return is_string( $plain ) ? $plain : '';
	}

	// ------------------------------------------------------------------
	// Key normalization / format
	// ------------------------------------------------------------------

	/** Uppercase + trim; the server is case-insensitive but we store canonical. */
	private function normalize_key( string $key ): string {
		return strtoupper( trim( $key ) );
	}

	public static function is_valid_key_format( string $key ): bool {
		return 1 === preg_match( self::KEY_PATTERN, strtoupper( trim( $key ) ) );
	}

	// ------------------------------------------------------------------
	// Activate: validate a pasted key and store it on success
	// ------------------------------------------------------------------

	/**
	 * Validate a license key and, if valid, persist it and unlock Pro.
	 *
	 * @param string $key Raw key as pasted by the user.
	 * @return array{success:bool, reason:string, plan?:mixed, sites?:mixed, expires_at?:mixed}
	 */
	public function activate_with_key( string $key ): array {
		$key = $this->normalize_key( $key );

		if ( ! self::is_valid_key_format( $key ) ) {
			return [ 'success' => false, 'reason' => 'invalid_license_format' ];
		}

		$data = $this->remote_check( $key );

		if ( is_wp_error( $data ) ) {
			return [ 'success' => false, 'reason' => 'connection_error' ];
		}

		$reason = isset( $data['reason'] ) ? (string) $data['reason'] : 'server_error';

		if ( ! empty( $data['valid'] ) ) {
			$normalized = $this->normalize_payload( $data );
			$this->persist_license_key( $key );
			update_option( $this->license_data_option, $normalized );
			set_transient( 'animicro_license_check', $normalized, DAY_IN_SECONDS );

			if ( self::is_premium_slug( self::plan_slug( $normalized['plan'] ?? null ) ) ) {
				self::activate_premium();
			} else {
				self::deactivate_premium();
			}

			return [
				'success'    => true,
				'reason'     => 'ok',
				'plan'       => $normalized['plan'] ?? null,
				'sites'      => $normalized['sites'] ?? null,
				'expires_at' => $normalized['expires_at'] ?? null,
			];
		}

		// Valid key but can't activate (expired / disabled / limit_reached) or
		// outright rejected (not_found / product_mismatch). We do NOT store the
		// key — the user fixes the issue and pastes again. Surface enough for
		// the UI to explain what happened.
		$normalized = $this->normalize_payload( $data );
		return [
			'success' => false,
			'reason'  => $reason,
			'plan'    => $normalized['plan'] ?? null,
			'sites'   => $normalized['sites'] ?? null,
		];
	}

	/**
	 * User-initiated key removal. Frees the seat on the server (best-effort)
	 * then wipes local state.
	 */
	public function deactivate_key(): array {
		$key = $this->get_license_key();
		if ( '' !== $key ) {
			$this->remote_deactivate( $key );
		}
		$this->clear_license();
		return [ 'success' => true ];
	}

	// ------------------------------------------------------------------
	// Remote calls
	// ------------------------------------------------------------------

	/**
	 * GET license-check for a key. Returns the decoded array, or a WP_Error on
	 * transport failure / non-JSON / rate-limit so callers can fail soft.
	 *
	 * @return array<string,mixed>|\WP_Error
	 */
	private function remote_check( string $key ) {
		$args = [
			'license' => rawurlencode( $key ),
			'domain'  => rawurlencode( $this->get_current_domain() ),
			'product' => rawurlencode( $this->product_slug ),
		];

		// Plugin version — powers the version-distribution analytics on the
		// license server. The constant is the host plugin's version define.
		if ( defined( 'ANIMICRO_VERSION' ) && is_string( ANIMICRO_VERSION ) && '' !== ANIMICRO_VERSION ) {
			$args['version'] = rawurlencode( ANIMICRO_VERSION );
		}

		$url = add_query_arg( $args, $this->check_url );

		$response = wp_remote_get(
			$url,
			[
				'timeout'    => 10,
				'sslverify'  => true,
				'headers'    => [
					'Accept'        => 'application/json',
					'Authorization' => 'Bearer ' . $this->supabase_anon_key,
				],
				'user-agent' => 'WordPress/' . get_bloginfo( 'version' ) . '; ' . home_url(),
			]
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$status = wp_remote_retrieve_response_code( $response );
		$data   = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( 429 === $status ) {
			return new \WP_Error( 'rate_limited', 'Rate limited' );
		}
		if ( ! is_array( $data ) ) {
			return new \WP_Error( 'invalid_response', 'Invalid response' );
		}

		return $data;
	}

	/** GET license-deactivate to free the seat for this domain. Best-effort. */
	private function remote_deactivate( string $key ): void {
		$url = add_query_arg(
			[
				'license' => rawurlencode( $key ),
				'domain'  => rawurlencode( $this->get_current_domain() ),
				'product' => rawurlencode( $this->product_slug ),
			],
			$this->deactivate_url
		);

		wp_remote_get(
			$url,
			[
				'timeout'    => 8,
				'sslverify'  => true,
				'headers'    => [
					'Accept'        => 'application/json',
					'Authorization' => 'Bearer ' . $this->supabase_anon_key,
				],
				'user-agent' => 'WordPress/' . get_bloginfo( 'version' ) . '; ' . home_url(),
			]
		);
	}

	// ------------------------------------------------------------------
	// Payload normalization (shared shapes)
	// ------------------------------------------------------------------

	/**
	 * Normalize the heterogeneous shapes the server may return for `plan`,
	 * `expires_at`, and `sites` into a single canonical shape.
	 *
	 * @param array<string, mixed> $payload Raw payload from license-check.
	 * @return array<string, mixed>
	 */
	private function normalize_payload( array $payload ): array {
		if ( array_key_exists( 'plan', $payload ) ) {
			$payload['plan'] = $this->normalize_plan( $payload['plan'] );
		}

		if ( isset( $payload['expires_at'] ) && ! is_string( $payload['expires_at'] ) ) {
			$payload['expires_at'] = null;
		}

		if ( isset( $payload['sites'] ) ) {
			if ( is_array( $payload['sites'] ) ) {
				$payload['sites'] = [
					'used'      => isset( $payload['sites']['used'] ) ? (int) $payload['sites']['used'] : 0,
					'max'       => isset( $payload['sites']['max'] ) && is_numeric( $payload['sites']['max'] ) ? (int) $payload['sites']['max'] : null,
					'unlimited' => ! empty( $payload['sites']['unlimited'] ),
				];
			} else {
				$payload['sites'] = null;
			}
		}

		return $payload;
	}

	/** Coerce any plan shape to `{ slug, name, max_sites }` or null. */
	private function normalize_plan( $plan ): ?array {
		if ( is_string( $plan ) && '' !== $plan ) {
			return [
				'slug'      => $plan,
				'name'      => ucfirst( $plan ),
				'max_sites' => null,
			];
		}

		if ( is_array( $plan ) ) {
			$slug = isset( $plan['slug'] ) && is_string( $plan['slug'] ) ? $plan['slug'] : '';
			$name = isset( $plan['name'] ) && is_string( $plan['name'] ) && '' !== $plan['name']
				? $plan['name']
				: ( '' !== $slug ? ucfirst( $slug ) : '' );

			if ( '' === $slug && '' === $name ) {
				return null;
			}

			return [
				'slug'      => $slug,
				'name'      => $name,
				'max_sites' => isset( $plan['max_sites'] ) && is_numeric( $plan['max_sites'] ) ? (int) $plan['max_sites'] : null,
			];
		}

		return null;
	}

	/** Pull the slug from a normalized plan structure (string or object). */
	public static function plan_slug( $plan ): ?string {
		if ( is_string( $plan ) ) {
			return '' === $plan ? null : $plan;
		}
		if ( is_array( $plan ) && isset( $plan['slug'] ) && is_string( $plan['slug'] ) ) {
			return '' === $plan['slug'] ? null : $plan['slug'];
		}
		return null;
	}

	/**
	 * Decide whether a given plan slug counts as a premium tier. Extend via the
	 * `animicro_premium_plan_slugs` filter for custom slugs.
	 */
	public static function is_premium_slug( ?string $slug ): bool {
		if ( ! is_string( $slug ) || '' === $slug ) {
			return false;
		}
		$premium_slugs = apply_filters(
			'animicro_premium_plan_slugs',
			[ 'pro', 'basic', 'agency', 'enterprise' ]
		);
		return in_array( $slug, (array) $premium_slugs, true );
	}

	// ------------------------------------------------------------------
	// Validate: poll license-check for the stored key (daily, cached)
	// ------------------------------------------------------------------

	public function validate( bool $force = false ): array {
		if ( ! $this->has_license() ) {
			self::deactivate_premium();
			return [ 'valid' => false, 'reason' => 'no_license', 'plan' => null ];
		}

		if ( ! $force ) {
			$cached = get_transient( 'animicro_license_check' );
			if ( false !== $cached ) {
				return $cached;
			}
		}

		$data = $this->remote_check( $this->get_license_key() );

		if ( is_wp_error( $data ) ) {
			// Fail-soft on transport errors / rate-limit: keep last known good
			// so a network blip doesn't kick the user out of Pro.
			$last = $this->get_license_data();
			if ( ! empty( $last ) ) {
				return $last;
			}
			return [
				'valid'  => false,
				'reason' => 'rate_limited' === $data->get_error_code() ? 'rate_limited' : 'connection_error',
				'plan'   => null,
			];
		}

		$reason     = isset( $data['reason'] ) ? (string) $data['reason'] : 'server_error';
		$normalized = $this->normalize_payload( $data );

		// HTTP 200 + valid:true ⇒ premium. Don't gate on reason === 'ok'.
		if ( ! empty( $normalized['valid'] ) ) {
			update_option( $this->license_data_option, $normalized );
			set_transient( 'animicro_license_check', $normalized, DAY_IN_SECONDS );

			if ( self::is_premium_slug( self::plan_slug( $normalized['plan'] ?? null ) ) ) {
				self::activate_premium();
			} else {
				self::deactivate_premium();
			}
			return $normalized;
		}

		// Key no longer exists on the server → drop it so the UI prompts for a
		// new one.
		if ( 'not_found' === $reason ) {
			$this->clear_license();
			return [ 'valid' => false, 'reason' => $reason, 'plan' => null ];
		}

		// Known soft failures: keep the key (so the daily check recovers once
		// the user renews / frees a seat) but lock Pro and keep the payload for
		// the UI.
		if ( in_array( $reason, [ 'expired', 'disabled', 'limit_reached', 'product_mismatch' ], true ) ) {
			update_option( $this->license_data_option, $normalized );
			self::deactivate_premium();
			return [
				'valid'      => false,
				'reason'     => $reason,
				'plan'       => $normalized['plan'] ?? null,
				'sites'      => $normalized['sites'] ?? null,
				'expires_at' => $normalized['expires_at'] ?? null,
			];
		}

		// Anything else: lock Pro, keep the key (could be a transient error).
		self::deactivate_premium();
		return [
			'valid'  => false,
			'reason' => $reason,
			'plan'   => $normalized['plan'] ?? null,
		];
	}

	// ------------------------------------------------------------------
	// Domain helpers
	// ------------------------------------------------------------------

	private function normalize_domain( string $domain_or_url ): string {
		$domain = preg_replace( '#^https?://#', '', $domain_or_url );
		$domain = preg_replace( '#/.*$#', '', $domain );
		$domain = preg_replace( '#^www\.#', '', $domain );
		$domain = strtolower( trim( $domain ) );

		if ( strpos( $domain, ':' ) !== false ) {
			$domain = explode( ':', $domain )[0];
		}

		return $domain;
	}

	private function get_current_domain(): string {
		return $this->normalize_domain( home_url() );
	}

	// ------------------------------------------------------------------
	// Accessors used by admin UIs (License page / REST layers)
	// ------------------------------------------------------------------

	public function get_license_plan(): string {
		$license_data = get_option( $this->license_data_option, [] );
		$slug = self::plan_slug( $license_data['plan'] ?? null );
		return $slug ?? 'free';
	}

	public function get_license_data(): array {
		return (array) get_option( $this->license_data_option, [] );
	}

	public function get_error_message( string $reason ): string {
		$messages = [
			'ok'                     => __( 'License active', 'animicro' ),
			'no_license'             => __( 'No license key yet. Paste your key to activate Pro.', 'animicro' ),
			'not_found'              => __( 'License key not found. Double-check the key from your purchase email.', 'animicro' ),
			'invalid_license_format' => __( "That doesn't look like a valid license key (format: XXXX-XXXX-…).", 'animicro' ),
			'product_mismatch'       => __( 'This license key is for a different product.', 'animicro' ),
			'expired'                => __( 'Your license has expired. Renew it from your dashboard.', 'animicro' ),
			'disabled'               => __( 'Your license has been disabled by an administrator.', 'animicro' ),
			'limit_reached'          => __( 'This license has reached its site limit. Remove a site or upgrade your plan.', 'animicro' ),
			'rate_limited'           => __( 'Too many license checks from this server. Please try again later.', 'animicro' ),
			'connection_error'       => __( 'Could not reach the license server. Try again.', 'animicro' ),
			'invalid_response'       => __( 'Invalid response from the license server.', 'animicro' ),
			'server_error'           => __( 'License server error.', 'animicro' ),
		];

		return $messages[ $reason ] ?? __( 'Unknown error', 'animicro' );
	}

	// ------------------------------------------------------------------
	// Periodic re-validation (admin_init, daily)
	// ------------------------------------------------------------------

	public static function validate_license_periodically(): void {
		if ( false !== get_transient( 'animicro_license_last_check' ) ) {
			return;
		}

		( new self() )->validate( true );
		set_transient( 'animicro_license_last_check', time(), DAY_IN_SECONDS );
	}

	public function clear_cache(): void {
		delete_transient( 'animicro_license_check' );
		delete_transient( 'animicro_license_last_check' );
	}

	// ------------------------------------------------------------------
	// Static gating helpers
	// ------------------------------------------------------------------

	/**
	 * Canonical "is the visitor on a paid plan right now?" check. Always
	 * derives from current state (license presence + cached validation) rather
	 * than the stored flag, so a transient bad state can't permanently lock the
	 * plugin.
	 */
	public static function is_premium(): bool {
		$instance = new self();

		// No key — locked.
		if ( ! $instance->has_license() ) {
			self::deactivate_premium();
			return false;
		}

		$state = $instance->validate();

		if ( empty( $state['valid'] ) ) {
			self::deactivate_premium();
			return false;
		}

		if ( ! self::is_premium_slug( self::plan_slug( $state['plan'] ?? null ) ) ) {
			self::deactivate_premium();
			return false;
		}

		self::activate_premium();
		return true;
	}

	public static function activate_premium(): bool {
		return (bool) update_option( self::OPTION_NAME, true );
	}

	public static function deactivate_premium(): bool {
		return (bool) update_option( self::OPTION_NAME, false );
	}

	/**
	 * Best-effort seat release for uninstall.php, which runs without the plugin
	 * loaded. Reads + decrypts the stored key and pings license-deactivate.
	 */
	public static function release_seat_for_uninstall(): void {
		$instance = new self();
		$key = $instance->get_license_key();
		if ( '' !== $key ) {
			$instance->remote_deactivate( $key );
		}
	}

	// ------------------------------------------------------------------
	// Lifecycle hooks
	// ------------------------------------------------------------------

	public static function register_hooks(): void {
		// Daily re-validation of the stored key (transient-guarded inside).
		add_action( 'admin_init', [ __CLASS__, 'validate_license_periodically' ] );

		add_action( 'update_option_siteurl', [ __CLASS__, 'on_domain_change' ] );
		add_action( 'update_option_home',    [ __CLASS__, 'on_domain_change' ] );
	}

	public static function on_domain_change(): void {
		// Domain change ≈ migrating sites; the key stays valid but our cached
		// state (and the activated domain on the server) is stale, so refresh
		// on next read.
		delete_transient( 'animicro_license_check' );
		delete_transient( 'animicro_license_last_check' );
	}
}

Animicro_License_Manager::register_hooks();
