<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Animicro_License_Manager {

	const OPTION_NAME = 'animicro_premium_active';

	const PRO_MODULES  = [ 'blur', 'stagger', 'grid-reveal', 'text-fill-scroll', 'parallax', 'split', 'text-reveal', 'img-parallax' ];
	const FREE_MODULES = [ 'fade', 'slide-up', 'slide-down', 'slide-left', 'slide-right', 'skew-up', 'scale', 'float', 'pulse', 'highlight', 'typewriter', 'hover-zoom' ];

	private string $api_url = 'https://uhnaedqfygrqdptjngqb.supabase.co/functions/v1/license-check';

	private string $deactivate_url = 'https://uhnaedqfygrqdptjngqb.supabase.co/functions/v1/license-deactivate';

	private string $supabase_anon_key = '__ANIMICRO_SUPABASE_ANON_KEY__';

	private string $product_slug = 'animicro';

	private string $option_name = 'animicro_license_key';

	private string $license_data_option = 'animicro_license_data';

	public function __construct() {
		if ( defined( 'ANIMICRO_SUPABASE_ANON_KEY' ) ) {
			$this->supabase_anon_key = ANIMICRO_SUPABASE_ANON_KEY;
		} else {
			$this->supabase_anon_key = apply_filters( 'animicro_supabase_anon_key', $this->supabase_anon_key );
		}
	}

	public function get_license_key(): string {
		$stored = (string) get_option( $this->option_name, '' );
		if ( '' === $stored ) {
			return '';
		}

		$decrypted = $this->decrypt( $stored );
		if ( '' !== $decrypted ) {
			return $decrypted;
		}

		// Legacy plaintext value — migrate to encrypted at rest.
		update_option( $this->option_name, $this->encrypt( $stored ) );
		return $stored;
	}

	public function save_license_key( string $license_key ): void {
		$sanitized = sanitize_text_field( $license_key );

		// If the user is replacing an existing key, release the seat held by
		// the previous one before storing the new value (best-effort).
		$previous = $this->get_license_key();
		if ( '' !== $previous && strtoupper( trim( $previous ) ) !== strtoupper( trim( $sanitized ) ) ) {
			$this->deactivate_license( $previous, true );
		}

		update_option( $this->option_name, $this->encrypt( $sanitized ) );

		delete_option( $this->license_data_option );
		delete_transient( 'animicro_license_check' );
		delete_transient( 'animicro_license_last_check' );
	}

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

	public function validate_license( ?string $license_key = null, bool $force = false ): array {
		if ( ! $license_key ) {
			$license_key = $this->get_license_key();
		}

		if ( empty( $license_key ) ) {
			return [
				'valid'  => false,
				'reason' => 'no_license',
				'plan'   => null,
			];
		}

		// LicenSuite v2 rejects reserved/private dev hosts (localhost,
		// *.local, *.test, *.localhost, 127.x, 10.x, 192.168.x, etc.) with
		// reason `reserved_domain` — they must not consume a real seat.
		// To keep local development unblocked we bypass the server check
		// entirely on those hosts and treat the licence as a `pro` dev seat.
		// No network call, no seat consumed, full Pro feature unlock locally.
		if ( $this->is_development_domain() ) {
			$dev = [
				'valid'      => true,
				'reason'     => 'ok',
				'plan'       => 'pro',
				'expires_at' => null,
				'sites'      => [ 'used' => 0, 'max' => null, 'unlimited' => true ],
				'dev'        => true,
			];
			update_option( $this->license_data_option, $dev );
			set_transient( 'animicro_license_check', $dev, DAY_IN_SECONDS );
			self::activate_premium();
			return $dev;
		}

		if ( ! $force ) {
			$cached = get_transient( 'animicro_license_check' );
			if ( false !== $cached ) {
				return $cached;
			}
		}

		$domain                 = $this->get_current_domain();
		$license_key_normalized = strtoupper( trim( $license_key ) );

		$url = add_query_arg(
			[
				'license' => $license_key_normalized,
				'domain'  => $domain,
				'product' => $this->product_slug,
			],
			$this->api_url
		);

		$headers = [
			'Content-Type' => 'application/json',
			'Accept'       => 'application/json',
		];

		if ( ! empty( $this->supabase_anon_key ) ) {
			$headers['Authorization'] = 'Bearer ' . $this->supabase_anon_key;
		}

		$response = wp_remote_get(
			$url,
			[
				'timeout'    => 10,
				'sslverify'  => true,
				'headers'    => $headers,
				'user-agent' => 'WordPress/' . get_bloginfo( 'version' ) . '; ' . home_url(),
				'blocking'   => true,
			]
		);

		if ( is_wp_error( $response ) ) {
			return [
				'valid'  => false,
				'reason' => 'connection_error',
				'plan'   => null,
				'error'  => $response->get_error_message(),
			];
		}

		$status_code = wp_remote_retrieve_response_code( $response );
		$body        = wp_remote_retrieve_body( $response );
		$data        = json_decode( $body, true );

		// Rate limit (LicenSuite v2): HTTP 429 with Retry-After header.
		if ( 429 === $status_code ) {
			return [
				'valid'  => false,
				'reason' => 'rate_limited',
				'plan'   => null,
				'error'  => 'Too many requests. Please retry shortly.',
			];
		}

		if ( ! $data || ! is_array( $data ) ) {
			return [
				'valid'  => false,
				'reason' => 'invalid_response',
				'plan'   => null,
				'error'  => 'Invalid response from server',
			];
		}

		if ( 404 === $status_code && isset( $data['code'] ) && 'NOT_FOUND' === $data['code'] ) {
			return [
				'valid'  => false,
				'reason' => 'function_not_found',
				'plan'   => null,
				'error'  => 'License validation service not available',
			];
		}

		if ( 200 !== $status_code ) {
			$reason = $data['reason'] ?? 'server_error';

			// In LicenSuite v2 a denied check (limit_reached, expired,
			// disabled, product_mismatch, etc.) returns valid:false but the
			// payload itself is informative — persist it so the admin UI can
			// show sites.active_domains, expires_at, etc.
			if ( in_array( $reason, [ 'limit_reached', 'expired', 'disabled', 'product_mismatch', 'not_found' ], true ) ) {
				update_option( $this->license_data_option, $data );
			}

			self::deactivate_premium();

			return [
				'valid'  => false,
				'reason' => $reason,
				'plan'   => $data['plan'] ?? null,
				'sites'  => $data['sites'] ?? null,
				'error'  => $data['message'] ?? 'Server error',
			];
		}

		if ( isset( $data['valid'] ) && true === $data['valid'] && isset( $data['reason'] ) && 'ok' === $data['reason'] ) {
			update_option( $this->license_data_option, $data );
			set_transient( 'animicro_license_check', $data, DAY_IN_SECONDS );

			$plan            = $data['plan'] ?? null;
			$is_premium_plan = in_array( $plan, [ 'pro', 'basic' ], true );

			if ( $is_premium_plan ) {
				self::activate_premium();
			} else {
				self::deactivate_premium();
			}

			return $data;
		}

		$reason = $data['reason'] ?? 'server_error';

		// LicenSuite v2: when the license exists but the seat/state is
		// rejected (limit_reached, expired, disabled, product_mismatch),
		// the payload carries useful metadata (sites.active_domains,
		// expires_at, plan…). Persist it so the admin can render a helpful
		// message instead of a generic "invalid".
		if ( in_array( $reason, [ 'limit_reached', 'expired', 'disabled', 'product_mismatch' ], true ) ) {
			update_option( $this->license_data_option, $data );
		} else {
			delete_option( $this->license_data_option );
		}

		self::deactivate_premium();

		return [
			'valid'      => false,
			'reason'     => $reason,
			'plan'       => $data['plan'] ?? null,
			'sites'      => $data['sites'] ?? null,
			'expires_at' => $data['expires_at'] ?? null,
			'error'      => $data['message'] ?? 'License validation failed',
		];
	}

	/**
	 * Release the seat held by this domain on the licence server.
	 *
	 * Called when:
	 *  - the user replaces the saved licence key (best-effort, blocking).
	 *  - the plugin is deactivated / uninstalled (fire-and-forget).
	 *
	 * Idempotent on the server side: if the seat is already released the
	 * endpoint just returns `{ deactivated: false, reason: 'not_active' }`.
	 *
	 * @param string|null $license_key Optional. Defaults to the stored key.
	 * @param bool        $blocking    Wait for the response. Default false.
	 */
	public function deactivate_license( ?string $license_key = null, bool $blocking = false ): array {
		if ( null === $license_key ) {
			$license_key = $this->get_license_key();
		}

		if ( empty( $license_key ) ) {
			return [ 'deactivated' => false, 'reason' => 'no_license' ];
		}

		// Dev hosts never consumed a seat (we bypassed the server in
		// validate_license), so there is nothing to release. Just clear
		// the local cache and report success.
		if ( $this->is_development_domain() ) {
			delete_transient( 'animicro_license_check' );
			delete_transient( 'animicro_license_last_check' );
			return [ 'deactivated' => true, 'reason' => 'dev_skip' ];
		}

		$url = add_query_arg(
			[
				'license' => strtoupper( trim( $license_key ) ),
				'domain'  => $this->get_current_domain(),
				'product' => $this->product_slug,
			],
			$this->deactivate_url
		);

		$headers = [
			'Content-Type' => 'application/json',
			'Accept'       => 'application/json',
		];

		if ( ! empty( $this->supabase_anon_key ) ) {
			$headers['Authorization'] = 'Bearer ' . $this->supabase_anon_key;
		}

		$response = wp_remote_get(
			$url,
			[
				'timeout'    => $blocking ? 10 : 5,
				'sslverify'  => true,
				'headers'    => $headers,
				'user-agent' => 'WordPress/' . get_bloginfo( 'version' ) . '; ' . home_url(),
				'blocking'   => $blocking,
			]
		);

		// Always clear the local cache regardless of whether the server
		// confirmed — the next validate_license() call will refresh state.
		delete_transient( 'animicro_license_check' );
		delete_transient( 'animicro_license_last_check' );

		if ( ! $blocking || is_wp_error( $response ) ) {
			return [ 'deactivated' => false, 'reason' => 'pending' ];
		}

		$data = json_decode( wp_remote_retrieve_body( $response ), true );
		if ( ! is_array( $data ) ) {
			return [ 'deactivated' => false, 'reason' => 'invalid_response' ];
		}

		return $data;
	}

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
	 * True when the site is running on a reserved dev host that LicenSuite v2
	 * rejects with `reserved_domain`. We mirror the server's rules so we can
	 * bypass the network call up-front instead of hitting the wall.
	 *
	 * Match list: `localhost`, anything ending in `.local` / `.test` /
	 * `.localhost` / `.invalid` / `.example`, raw IPv4 in private ranges
	 * (10.x, 127.x, 192.168.x, 172.16–31.x), and IPv6 loopback `::1`.
	 *
	 * Filter `animicro_is_development_domain` lets advanced users override
	 * the detection (e.g. to force a real check on a public staging domain
	 * that happens to look like dev, or to force dev mode on a custom TLD).
	 */
	private function is_development_domain(): bool {
		$domain = $this->get_current_domain();

		$is_dev = false;

		if ( '' === $domain || 'localhost' === $domain || '::1' === $domain ) {
			$is_dev = true;
		} elseif ( preg_match( '/\.(local|test|localhost|invalid|example)$/i', $domain ) ) {
			$is_dev = true;
		} elseif ( filter_var( $domain, FILTER_VALIDATE_IP ) ) {
			// Private / loopback IPv4 ranges — keep dev mode on. A public
			// IPv4 site (rare) still gets a normal check.
			if (
				preg_match( '/^127\./', $domain ) ||
				preg_match( '/^10\./', $domain ) ||
				preg_match( '/^192\.168\./', $domain ) ||
				preg_match( '/^172\.(1[6-9]|2[0-9]|3[0-1])\./', $domain )
			) {
				$is_dev = true;
			}
		}

		/**
		 * Filter whether the current domain should be treated as a dev host
		 * (skipping the LicenSuite server check and unlocking Pro locally).
		 *
		 * @param bool   $is_dev Result of the built-in detection.
		 * @param string $domain Normalized current domain.
		 */
		return (bool) apply_filters( 'animicro_is_development_domain', $is_dev, $domain );
	}

	public function get_license_plan(): string {
		$license_data = get_option( $this->license_data_option, [] );
		return isset( $license_data['plan'] ) ? $license_data['plan'] : 'free';
	}

	public function get_license_data(): array {
		return (array) get_option( $this->license_data_option, [] );
	}

	public function get_error_message( string $reason ): string {
		$messages = [
			'ok'                     => __( 'License valid', 'animicro' ),
			'no_license'             => __( 'No license key has been entered', 'animicro' ),
			'not_found'              => __( 'License key not found', 'animicro' ),
			'expired'                => __( 'License has expired', 'animicro' ),
			'disabled'               => __( 'License has been deactivated', 'animicro' ),
			'domain_mismatch'        => __( 'Domain does not match the registered domain', 'animicro' ),
			'product_mismatch'       => __( 'License is not valid for this product', 'animicro' ),
			'limit_reached'          => __( 'You have reached the maximum number of sites allowed by your plan. Deactivate the plugin on another site or upgrade your plan.', 'animicro' ),
			'rate_limited'           => __( 'Too many license checks from this server. Please try again in a minute.', 'animicro' ),
			'reserved_domain'        => __( 'This domain (localhost / .local / .test) cannot be used to activate a license. Use a public domain.', 'animicro' ),
			'invalid_license_format' => __( 'The license key format is not valid.', 'animicro' ),
			'invalid_product_format' => __( 'The product identifier is not valid.', 'animicro' ),
			'invalid_domain'         => __( 'The current site domain is not valid.', 'animicro' ),
			'missing_params'         => __( 'Missing required parameters', 'animicro' ),
			'connection_error'       => __( 'Could not connect to the license server', 'animicro' ),
			'server_error'           => __( 'License server error', 'animicro' ),
			'invalid_response'       => __( 'Invalid response from the license server', 'animicro' ),
			'function_not_found'     => __( 'Validation service unavailable', 'animicro' ),
		];

		return $messages[ $reason ] ?? __( 'Unknown error', 'animicro' );
	}

	public static function validate_license_periodically(): void {
		$last_check = get_transient( 'animicro_license_last_check' );

		if ( false === $last_check ) {
			$instance = new self();
			$instance->validate_license( null, true );
			set_transient( 'animicro_license_last_check', time(), DAY_IN_SECONDS );
		}
	}

	public function clear_cache(): void {
		delete_transient( 'animicro_license_check' );
		delete_transient( 'animicro_license_last_check' );
	}

	public static function is_premium(): bool {
		$pro_enabled = get_option( self::OPTION_NAME, false );

		if ( ! $pro_enabled ) {
			return false;
		}

		$instance     = new self();
		$license_data = $instance->validate_license();

		if ( ! isset( $license_data['valid'] ) || ! $license_data['valid'] ) {
			self::deactivate_premium();
			return false;
		}

		$plan            = $license_data['plan'] ?? null;
		$is_premium_plan = in_array( $plan, [ 'pro', 'basic' ], true );

		if ( ! $is_premium_plan ) {
			self::deactivate_premium();
			return false;
		}

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

	public static function register_hooks(): void {
		add_action( 'update_option_siteurl', [ __CLASS__, 'on_domain_change' ] );
		add_action( 'update_option_home', [ __CLASS__, 'on_domain_change' ] );
	}

	public static function on_domain_change(): void {
		delete_transient( 'animicro_license_check' );
		delete_transient( 'animicro_license_last_check' );
	}
}

Animicro_License_Manager::register_hooks();
