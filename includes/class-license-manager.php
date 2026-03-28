<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Animicro_License_Manager {

	const OPTION_NAME = 'animicro_premium_active';

	const PRO_MODULES  = [ 'blur', 'stagger', 'grid-reveal', 'parallax', 'split', 'slide-right', 'slide-left', 'text-reveal', 'typewriter' ];
	const FREE_MODULES = [ 'fade', 'slide-up', 'slide-down', 'scale' ];

	private string $api_url = 'https://uhnaedqfygrqdptjngqb.supabase.co/functions/v1/license-check';

	private string $supabase_anon_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVobmFlZHFmeWdycWRwdGpuZ3FiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MDE2NjQsImV4cCI6MjA3ODI3NzY2NH0.USJDoMqD-B9rYYb4EHUnpwI99QHqJpty3IJLO8Kh7uM';

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
		return (string) get_option( $this->option_name, '' );
	}

	public function save_license_key( string $license_key ): void {
		$sanitized = sanitize_text_field( $license_key );
		update_option( $this->option_name, $sanitized );

		delete_option( $this->license_data_option );
		delete_transient( 'animicro_license_check' );
		delete_transient( 'animicro_license_last_check' );
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

		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			error_log( '=== Animicro License Validation ===' );
			error_log( 'License Key: ' . $license_key_normalized );
			error_log( 'Domain: ' . $domain );
			error_log( 'Product: ' . $this->product_slug );
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
			if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
				error_log( 'Animicro License Error: ' . $response->get_error_message() );
			}
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
			return [
				'valid'  => false,
				'reason' => $reason,
				'plan'   => $data['plan'] ?? null,
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
		delete_option( $this->license_data_option );
		self::deactivate_premium();

		return [
			'valid'  => false,
			'reason' => $reason,
			'plan'   => $data['plan'] ?? null,
			'error'  => $data['message'] ?? 'License validation failed',
		];
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

	public function get_license_plan(): string {
		$license_data = get_option( $this->license_data_option, [] );
		return isset( $license_data['plan'] ) ? $license_data['plan'] : 'free';
	}

	public function get_license_data(): array {
		return (array) get_option( $this->license_data_option, [] );
	}

	public function get_error_message( string $reason ): string {
		$messages = [
			'ok'                 => __( 'License valid', 'animicro' ),
			'no_license'         => __( 'No license key has been entered', 'animicro' ),
			'not_found'          => __( 'License key not found', 'animicro' ),
			'expired'            => __( 'License has expired', 'animicro' ),
			'disabled'           => __( 'License has been deactivated', 'animicro' ),
			'domain_mismatch'    => __( 'Domain does not match the registered domain', 'animicro' ),
			'product_mismatch'   => __( 'License is not valid for this product', 'animicro' ),
			'missing_params'     => __( 'Missing required parameters', 'animicro' ),
			'connection_error'   => __( 'Could not connect to the license server', 'animicro' ),
			'server_error'       => __( 'License server error', 'animicro' ),
			'invalid_response'   => __( 'Invalid response from the license server', 'animicro' ),
			'function_not_found' => __( 'Validation service unavailable', 'animicro' ),
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
}
