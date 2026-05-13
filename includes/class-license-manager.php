<?php
/**
 * Animicro Pro — LicenSuite v4.0 Connect-flow license manager.
 *
 * Architecture:
 *   1. User clicks "Connect" in /wp-admin → window.open(dashboard, _blank).
 *   2. Dashboard auths the user and redirects back to
 *      ?page=animicro-license&action=connect-callback&token=…&state=…
 *   3. Animicro_Admin::maybe_handle_connect_callback() catches the redirect,
 *      verifies the WP nonce in `state`, and calls handle_callback($token).
 *   4. handle_callback POSTs to /api/plugin-connect/exchange and persists
 *      the returned { connection_id, connection_secret } pair (secret is
 *      AES-256-CBC encrypted at rest using AUTH_KEY-derived salt).
 *   5. From there, validate_connection() polls /functions/v1/plugin-validate
 *      with `Authorization: Bearer <SUPABASE_ANON_KEY>` (Supabase JWT layer)
 *      and `{ connection_id, connection_secret }` in the body (function-level
 *      auth) once per day.
 *
 * Local development: localhost / *.local / *.test / private IPs short-circuit
 * the entire flow and return a synthetic premium payload, no network call.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Animicro_License_Manager {

	const OPTION_NAME = 'animicro_premium_active';

	const PRO_MODULES  = [ 'blur', 'stagger', 'grid-reveal', 'text-fill-scroll', 'parallax', 'split', 'text-reveal', 'img-parallax' ];
	const FREE_MODULES = [ 'fade', 'slide-up', 'slide-down', 'slide-left', 'slide-right', 'skew-up', 'scale', 'float', 'pulse', 'highlight', 'typewriter', 'hover-zoom', 'page-curtain' ];

	private string $product_slug = 'animicro';

	// LicenSuite v3 endpoints.
	private string $validate_url  = 'https://uhnaedqfygrqdptjngqb.supabase.co/functions/v1/plugin-validate';
	private string $exchange_url  = 'https://licensuite.vercel.app/api/plugin-connect/exchange';
	private string $dashboard_url = 'https://licensuite.vercel.app/plugin-connect';

	/**
	 * Supabase project anon key used to satisfy the Edge Function JWT
	 * verification layer on every call to /plugin-validate. This is the
	 * SAME public key the LicenSuite frontend embeds in its own HTML —
	 * it is not a secret, has no privileges beyond invoking the public
	 * Edge Functions, and rotating it requires re-publishing every
	 * consumer (so we hardcode it instead of dragging build-time
	 * injection through the pipeline).
	 *
	 * The actual per-site authentication is the `connection_secret`,
	 * which travels in the request body so the function can match it
	 * against `connection_id` server-side.
	 *
	 * Override via the `ANIMICRO_SUPABASE_ANON_KEY` constant or the
	 * `animicro_supabase_anon_key` filter for forks / custom backends.
	 */
	private string $supabase_anon_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVobmFlZHFmeWdycWRwdGpuZ3FiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MDE2NjQsImV4cCI6MjA3ODI3NzY2NH0.USJDoMqD-B9rYYb4EHUnpwI99QHqJpty3IJLO8Kh7uM';

	public function __construct() {
		if ( defined( 'ANIMICRO_SUPABASE_ANON_KEY' ) && is_string( ANIMICRO_SUPABASE_ANON_KEY ) && '' !== ANIMICRO_SUPABASE_ANON_KEY ) {
			$this->supabase_anon_key = ANIMICRO_SUPABASE_ANON_KEY;
		} else {
			$this->supabase_anon_key = (string) apply_filters( 'animicro_supabase_anon_key', $this->supabase_anon_key );
		}
	}

	// Storage keys.
	private string $connection_id_option     = 'animicro_connection_id';
	private string $connection_secret_option = 'animicro_connection_secret';   // AES-256-CBC at rest
	private string $license_data_option      = 'animicro_license_data';        // last good payload

	// ------------------------------------------------------------------
	// Connection storage
	// ------------------------------------------------------------------

	public function get_connection_id(): string {
		return (string) get_option( $this->connection_id_option, '' );
	}

	public function get_connection_secret(): string {
		$stored = (string) get_option( $this->connection_secret_option, '' );
		return '' === $stored ? '' : $this->decrypt( $stored );
	}

	public function has_connection(): bool {
		return '' !== $this->get_connection_id() && '' !== $this->get_connection_secret();
	}

	private function persist_connection( string $connection_id, string $connection_secret ): void {
		update_option( $this->connection_id_option,     $connection_id );
		update_option( $this->connection_secret_option, $this->encrypt( $connection_secret ) );

		// Defensive: wipe leftover keys from any pre-1.12.5 dev install
		// that ever ran the legacy v2 paste-the-key flow. Production never
		// shipped that path, but it's cheap insurance against test sites.
		delete_option( 'animicro_license_key' );
		delete_option( 'animicro_pending_reconnect' );

		// Drop the validation caches so the next read goes against the
		// live server and rebuilds them cleanly with the new credentials.
		delete_transient( 'animicro_license_check' );
		delete_transient( 'animicro_license_last_check' );
	}

	public function clear_connection(): void {
		delete_option( $this->connection_id_option );
		delete_option( $this->connection_secret_option );
		delete_option( $this->license_data_option );
		delete_transient( 'animicro_license_check' );
		delete_transient( 'animicro_license_last_check' );
		self::deactivate_premium();
	}

	// ------------------------------------------------------------------
	// AES-256-CBC at rest (encryption helpers shared with v2)
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
	// Connect: build the dashboard URL the React UI opens in a new tab
	// ------------------------------------------------------------------

	public function get_connect_url(): string {
		$state  = wp_create_nonce( 'animicro_connect' );
		$return = admin_url( 'admin.php?page=animicro-license&action=connect-callback' );

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

	// ------------------------------------------------------------------
	// Connect: handle the dashboard callback (token → connection)
	// ------------------------------------------------------------------

	/**
	 * Exchange the one-time `token` for a long-lived connection pair.
	 *
	 * Verifies the WP nonce in `state` (CSRF) before any network call.
	 * On success, persists the connection and clears legacy/migration state.
	 * On failure, sets a 60-second transient with the reason so the React UI
	 * can surface the error after the redirect.
	 *
	 * @param string $token One-time token from the dashboard redirect.
	 * @param string $state Nonce we sent in get_connect_url(); the dashboard
	 *                     reflects it back unchanged.
	 * @return array{success:bool, reason:string, error?:string}
	 */
	public function handle_callback( string $token, string $state ): array {
		if ( ! wp_verify_nonce( $state, 'animicro_connect' ) ) {
			$this->record_connect_error( 'invalid_state' );
			return [ 'success' => false, 'reason' => 'invalid_state' ];
		}
		if ( '' === $token ) {
			$this->record_connect_error( 'missing_token' );
			return [ 'success' => false, 'reason' => 'missing_token' ];
		}

		$response = wp_remote_post(
			$this->exchange_url,
			[
				'timeout'    => 10,
				'sslverify'  => true,
				'headers'    => [
					'Content-Type' => 'application/json',
					'Accept'       => 'application/json',
				],
				'user-agent' => 'WordPress/' . get_bloginfo( 'version' ) . '; ' . home_url(),
				'body'       => wp_json_encode(
					[
						'token'     => $token,
						'site_uuid' => home_url() . '|' . get_option( 'admin_email' ),
					]
				),
			]
		);

		if ( is_wp_error( $response ) ) {
			$this->record_connect_error( 'connect_network_error', $response->get_error_message() );
			return [
				'success' => false,
				'reason'  => 'connect_network_error',
				'error'   => $response->get_error_message(),
			];
		}

		$status = wp_remote_retrieve_response_code( $response );
		$data   = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( 200 !== $status || ! is_array( $data ) || empty( $data['connection_id'] ) || empty( $data['connection_secret'] ) ) {
			$reason = is_array( $data ) && ! empty( $data['error'] ) ? sanitize_key( $data['error'] ) : 'exchange_failed';
			$this->record_connect_error( $reason );
			return [ 'success' => false, 'reason' => $reason ];
		}

		$this->persist_connection( (string) $data['connection_id'], (string) $data['connection_secret'] );

		// Persist optional metadata returned by /exchange so the admin can
		// show plan / expires_at / sites without waiting for the next
		// validate_connection() call.
		if ( isset( $data['license'] ) && is_array( $data['license'] ) ) {
			update_option(
				$this->license_data_option,
				$this->normalize_payload(
					wp_parse_args( $data['license'], [ 'valid' => true, 'reason' => 'ok' ] )
				)
			);
		}

		// Force a fresh validation immediately so is_premium() is accurate
		// from the very next pageload.
		$this->validate_connection( true );

		return [ 'success' => true, 'reason' => 'ok' ];
	}

	/**
	 * Normalize the heterogeneous shapes the LicenSuite server may return
	 * for `plan`, `expires_at`, and `sites` into a single canonical shape.
	 *
	 * **Plan**: from LicenSuite v4 the server returns `plan` as a rich
	 * object `{ slug, name, max_sites, sort_order }` instead of the v3
	 * plain string `"pro"`. Both shapes are accepted; the output is always
	 * a `{ slug, name, max_sites }` object (or `null`):
	 *
	 *   - "pro"                                       → { slug: "pro", name: "Pro", max_sites: null }
	 *   - { slug: "pro", name: "Pro", max_sites: 10 } → { slug: "pro", name: "Pro", max_sites: 10 }
	 *
	 * Keeping the rich object means the React UI can display the operator
	 * configured `name` directly (e.g. "Agency", "Enterprise 50 sites")
	 * instead of forcing a slug-uppercase fallback.
	 *
	 * @param array<string, mixed> $payload Raw payload from /exchange or /plugin-validate.
	 * @return array<string, mixed> Same payload with normalized shapes.
	 */
	private function normalize_payload( array $payload ): array {
		if ( array_key_exists( 'plan', $payload ) ) {
			$payload['plan'] = $this->normalize_plan( $payload['plan'] );
		}

		// Normalize expires_at to an ISO string or null.
		if ( isset( $payload['expires_at'] ) && ! is_string( $payload['expires_at'] ) ) {
			$payload['expires_at'] = null;
		}

		// Normalize sites to { used:int, max:int|null, unlimited:bool } or null.
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

	/**
	 * Coerce any plan shape to the canonical `{ slug, name, max_sites }`
	 * object — or null if the input is unusable.
	 */
	private function normalize_plan( $plan ): ?array {
		if ( is_string( $plan ) && '' !== $plan ) {
			// Legacy v3 string. Synthesize a basic display name from the slug.
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

	/**
	 * Pull the slug from a normalized plan structure. Backwards-compatible
	 * with stored data from older versions where `plan` may still be a
	 * string. Use this anywhere that compares against well-known slugs
	 * (`'pro'`, `'basic'`, etc.).
	 */
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
	 * Decide whether a given plan slug counts as a premium tier.
	 *
	 * The default list mirrors the LicenSuite product catalogue
	 * (`pro`, `basic`, `agency`, `enterprise`). Operators with custom
	 * slugs can extend the list via the `animicro_premium_plan_slugs`
	 * filter:
	 *
	 *     add_filter( 'animicro_premium_plan_slugs', function ( $slugs ) {
	 *         $slugs[] = 'studio';
	 *         return $slugs;
	 *     } );
	 *
	 * Returns false for `null`, empty strings, or any slug not in the
	 * resolved list.
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

	private function record_connect_error( string $reason, string $detail = '' ): void {
		set_transient(
			'animicro_connect_error',
			[ 'reason' => $reason, 'detail' => $detail ],
			MINUTE_IN_SECONDS
		);
	}

	public function consume_connect_error(): array {
		$error = get_transient( 'animicro_connect_error' );
		if ( false === $error ) {
			return [];
		}
		delete_transient( 'animicro_connect_error' );
		return is_array( $error ) ? $error : [];
	}

	// ------------------------------------------------------------------
	// Validate: poll /plugin-validate with the connection_secret as Bearer
	// ------------------------------------------------------------------

	public function validate_connection( bool $force = false ): array {
		// Dev domain bypass — same logic as v2.
		if ( $this->is_development_domain() ) {
			$dev = [
				'valid'      => true,
				'reason'     => 'ok',
				'plan'       => [ 'slug' => 'pro', 'name' => 'Pro (Dev)', 'max_sites' => null ],
				'expires_at' => null,
				'sites'      => [ 'used' => 0, 'max' => null, 'unlimited' => true ],
				'dev'        => true,
			];
			update_option( $this->license_data_option, $dev );
			set_transient( 'animicro_license_check', $dev, DAY_IN_SECONDS );
			self::activate_premium();
			return $dev;
		}

		if ( ! $this->has_connection() ) {
			self::deactivate_premium();
			return [ 'valid' => false, 'reason' => 'no_connection', 'plan' => null ];
		}

		if ( ! $force ) {
			$cached = get_transient( 'animicro_license_check' );
			if ( false !== $cached ) {
				return $cached;
			}
		}

		// Supabase Edge Functions verify the Authorization Bearer as a JWT
		// (the project anon key) BEFORE the function code runs. Sending the
		// per-site connection_secret here was rejected with HTTP 401
		// `UNAUTHORIZED_INVALID_JWT_FORMAT` (which is exactly why the
		// LicenSuite "Last check" column stayed at "Never" in 1.12.0–1.12.3
		// — the function was never reached). The connection_secret travels
		// in the body so the function can match it against connection_id
		// server-side after Supabase clears the JWT layer.
		$response = wp_remote_post(
			$this->validate_url,
			[
				'timeout'    => 10,
				'sslverify'  => true,
				'headers'    => [
					'Content-Type'  => 'application/json',
					'Accept'        => 'application/json',
					'Authorization' => 'Bearer ' . $this->supabase_anon_key,
				],
				'user-agent' => 'WordPress/' . get_bloginfo( 'version' ) . '; ' . home_url(),
				'body'       => wp_json_encode(
					[
						'connection_id'     => $this->get_connection_id(),
						'connection_secret' => $this->get_connection_secret(),
					]
				),
			]
		);

		if ( is_wp_error( $response ) ) {
			// Fail-soft: keep the last known good state during outages so a
			// blip in the network doesn't kick the user out of Pro.
			$last = $this->get_license_data();
			if ( ! empty( $last ) ) {
				return $last;
			}
			return [
				'valid'  => false,
				'reason' => 'connection_error',
				'plan'   => null,
				'error'  => $response->get_error_message(),
			];
		}

		$status = wp_remote_retrieve_response_code( $response );
		$data   = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( 429 === $status ) {
			// Don't churn the cache on rate-limits — the existing transient
			// (if any) is still our best answer.
			$last = $this->get_license_data();
			return ! empty( $last ) ? $last : [
				'valid'  => false,
				'reason' => 'rate_limited',
				'plan'   => null,
			];
		}

		if ( ! is_array( $data ) ) {
			return [
				'valid'  => false,
				'reason' => 'invalid_response',
				'plan'   => null,
			];
		}

		$reason = $data['reason'] ?? 'server_error';

		// Connection revoked or destroyed → drop credentials so the user
		// sees the disconnected state and can reconnect cleanly.
		if ( in_array( $reason, [ 'revoked_or_not_found', 'invalid_credentials', 'invalid_connection_id' ], true ) ) {
			$this->clear_connection();
			return [
				'valid'  => false,
				'reason' => $reason,
				'plan'   => null,
			];
		}

		$normalized = $this->normalize_payload( $data );

		// HTTP 200 + valid:true ⇒ premium. Don't gate on `reason === 'ok'`:
		// LicenSuite v4 may not always echo the reason on success, and
		// gating on it caused 1.12.2 installs to skip activate_premium()
		// even when the licence was perfectly fine.
		if ( 200 === $status && ! empty( $normalized['valid'] ) ) {
			update_option( $this->license_data_option, $normalized );
			set_transient( 'animicro_license_check', $normalized, DAY_IN_SECONDS );

			if ( self::is_premium_slug( self::plan_slug( $normalized['plan'] ?? null ) ) ) {
				self::activate_premium();
			} else {
				self::deactivate_premium();
			}
			return $normalized;
		}

		// Known soft failures (expired / disabled): keep payload for the UI,
		// lock premium, don't drop credentials (so the user can renew).
		if ( in_array( $reason, [ 'expired', 'disabled' ], true ) ) {
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

		// Anything else: deactivate but don't wipe the connection — could be
		// a transient server error.
		self::deactivate_premium();
		return [
			'valid'  => false,
			'reason' => $reason,
			'plan'   => $normalized['plan'] ?? null,
			'error'  => $data['message'] ?? 'License validation failed',
		];
	}

	// ------------------------------------------------------------------
	// Domain helpers (unchanged from v2)
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

	/**
	 * True when the site is running on a reserved dev host. Mirrors the
	 * server's reserved-domain rule so we can bypass the network call
	 * entirely on localhost / .local / .test / private IPs.
	 *
	 * Filter `animicro_is_development_domain` allows overriding (e.g. force
	 * a real check on a public staging that happens to look like dev).
	 */
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

		return (bool) apply_filters( 'animicro_is_development_domain', $is_dev, $domain );
	}

	public function is_dev_mode(): bool {
		return $this->is_development_domain();
	}

	// ------------------------------------------------------------------
	// Accessors used by the REST layer / React UI
	// ------------------------------------------------------------------

	/**
	 * Backwards-compatible accessor: always returns the plan SLUG as a
	 * string (e.g. "pro", "basic", "free"), regardless of whether the
	 * stored payload uses the legacy v3 string shape or the v4 object
	 * shape. For the rich object (with name + max_sites), read
	 * `get_license_data()['plan']` directly.
	 */
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
			'ok'                     => __( 'Connected', 'animicro' ),
			'no_connection'          => __( 'Not connected. Click "Connect" to link your license.', 'animicro' ),
			'revoked_or_not_found'   => __( 'This connection was revoked from your dashboard. Please reconnect.', 'animicro' ),
			'invalid_credentials'    => __( 'The connection is no longer valid. Please reconnect.', 'animicro' ),
			'invalid_connection_id'  => __( 'This site is no longer recognised by the license server. Please reconnect.', 'animicro' ),
			'expired'                => __( 'Your license has expired. Renew it from your dashboard.', 'animicro' ),
			'disabled'               => __( 'Your license has been disabled by an administrator.', 'animicro' ),
			'rate_limited'           => __( 'Too many license checks from this server. Please try again later.', 'animicro' ),
			'connect_network_error'  => __( 'Could not reach the license server during connect. Try again.', 'animicro' ),
			'exchange_failed'        => __( 'Failed to complete the connection. Please try again.', 'animicro' ),
			'invalid_state'          => __( 'Security check failed during connect. Please try again from the License page.', 'animicro' ),
			'missing_token'          => __( 'The connect callback was missing the token. Please try again.', 'animicro' ),
			'connection_error'       => __( 'Could not connect to the license server.', 'animicro' ),
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

		( new self() )->validate_connection( true );
		set_transient( 'animicro_license_last_check', time(), DAY_IN_SECONDS );
	}

	public function clear_cache(): void {
		delete_transient( 'animicro_license_check' );
		delete_transient( 'animicro_license_last_check' );
	}

	// ------------------------------------------------------------------
	// Static gating helpers (unchanged contract — the rest of the plugin
	// keeps calling these the same way).
	// ------------------------------------------------------------------

	/**
	 * Canonical "is the visitor on a paid plan right now?" check.
	 *
	 * Always derives the answer from current state (connection presence +
	 * cached validation transient) instead of reading the stored
	 * `animicro_premium_active` flag first. The previous implementation
	 * short-circuited on the flag, which meant any path that briefly set it
	 * to `false` (e.g. a v2→v3 migration with corrupt cached data, or a
	 * disconnect followed by a reconnect on the same pageload) could leave
	 * the plugin permanently locked even after the underlying connection
	 * was healthy again.
	 *
	 * The hot-path cost stays low: `validate_connection()` reads from the
	 * `animicro_license_check` transient (24 h TTL), so the typical call
	 * is just a couple of `get_option()` reads — no network. The stored
	 * flag is still kept in sync via `activate_premium()` / `deactivate_premium()`
	 * so external code that introspects the option directly still gets
	 * the right answer eventually.
	 */
	public static function is_premium(): bool {
		$instance = new self();

		// No credentials and not on a dev domain — locked.
		if ( ! $instance->is_dev_mode() && ! $instance->has_connection() ) {
			self::deactivate_premium();
			return false;
		}

		// Cached validation result (or a fresh round-trip on cache miss).
		$state = $instance->validate_connection();

		if ( empty( $state['valid'] ) ) {
			self::deactivate_premium();
			return false;
		}

		if ( ! self::is_premium_slug( self::plan_slug( $state['plan'] ?? null ) ) ) {
			self::deactivate_premium();
			return false;
		}

		// Keep the flag in sync for any external code that reads it.
		self::activate_premium();
		return true;
	}

	public static function is_pro_module( string $module_id ): bool {
		return in_array( $module_id, self::PRO_MODULES, true );
	}

	public static function activate_premium(): bool {
		return (bool) update_option( self::OPTION_NAME, true );
	}

	public static function deactivate_premium(): bool {
		return (bool) update_option( self::OPTION_NAME, false );
	}

	// ------------------------------------------------------------------
	// Lifecycle hooks
	// ------------------------------------------------------------------

	public static function register_hooks(): void {
		add_action( 'update_option_siteurl', [ __CLASS__, 'on_domain_change' ] );
		add_action( 'update_option_home',    [ __CLASS__, 'on_domain_change' ] );
	}

	public static function on_domain_change(): void {
		// Domain change ≈ migrating sites; the connection_id stays valid on
		// the server but our cached state is stale, so refresh on next read.
		delete_transient( 'animicro_license_check' );
		delete_transient( 'animicro_license_last_check' );
	}
}

Animicro_License_Manager::register_hooks();
