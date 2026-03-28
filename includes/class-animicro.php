<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Animicro {

	private static ?Animicro $instance = null;

	private function __construct() {
		$this->load_dependencies();
		$this->register_hooks();
	}

	public static function init(): void {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
	}

	public static function activate(): void {
		$defaults = self::get_default_settings();
		if ( false === get_option( 'animicro_settings' ) ) {
			update_option( 'animicro_settings', $defaults );
		}
	}

	public static function deactivate(): void {
		// Cleanup transients if needed in the future.
	}

	public static function get_default_settings(): array {
		return [
			'active_modules'    => [],
			'available_modules' => [ 'fade', 'scale', 'slide-up', 'slide-down', 'slide-right', 'slide-left', 'blur', 'stagger', 'grid-reveal', 'parallax', 'split', 'text-reveal', 'typewriter' ],
			'active_builders'   => [ 'none' ],
		'module_settings'   => [
			'fade' => [
				'duration' => 0.6,
				'easing'   => 'ease-out',
				'delay'    => 0.0,
				'margin'   => '-50px 0px',
			],
			'scale' => [
				'duration' => 0.6,
				'easing'   => 'ease-out',
				'delay'    => 0.0,
				'margin'   => '-50px 0px',
				'scale'    => 0.95,
			],
			'slide-up' => [
				'duration' => 0.6,
				'easing'   => 'ease-out',
				'delay'    => 0.0,
				'margin'   => '-50px 0px',
				'distance' => 30,
			],
			'slide-down' => [
				'duration' => 0.6,
				'easing'   => 'ease-out',
				'delay'    => 0.0,
				'margin'   => '-50px 0px',
				'distance' => 30,
			],
			'slide-right' => [
				'duration' => 0.6,
				'easing'   => 'ease-out',
				'delay'    => 0.0,
				'margin'   => '-50px 0px',
				'distance' => 30,
			],
			'slide-left' => [
				'duration' => 0.6,
				'easing'   => 'ease-out',
				'delay'    => 0.0,
				'margin'   => '-50px 0px',
				'distance' => 30,
			],
			'blur' => [
				'duration' => 0.6,
				'easing'   => 'ease-out',
				'delay'    => 0.0,
				'margin'   => '-50px 0px',
				'blur'     => 4,
			],
			'split' => [
				'duration'     => 0.6,
				'easing'       => 'ease-out',
				'delay'        => 0.0,
				'margin'       => '-50px 0px',
				'staggerDelay' => 0.05,
				'distance'     => 15,
			],
			'text-reveal' => [
				'duration'     => 0.6,
				'easing'       => 'ease-out',
				'delay'        => 0.0,
				'margin'       => '-50px 0px',
				'staggerDelay' => 0.12,
			],
			'typewriter' => [
				'duration'    => 0.6,
				'easing'      => 'ease-out',
				'delay'       => 0.0,
				'margin'      => '-50px 0px',
				'typingSpeed' => 0.06,
			],
			'stagger' => [
				'duration'     => 0.6,
				'easing'       => 'ease-out',
				'delay'        => 0.0,
				'margin'       => '-50px 0px',
				'staggerDelay' => 0.1,
				'distance'     => 20,
			],
			'grid-reveal' => [
				'duration'     => 0.6,
				'easing'       => 'ease-out',
				'delay'        => 0.0,
				'margin'       => '-50px 0px',
				'staggerDelay' => 0.08,
				'distance'     => 20,
				'origin'       => 'center',
			],
			'parallax' => [
				'duration' => 0.6,
				'easing'   => 'linear',
				'delay'    => 0.0,
				'margin'   => '-50px 0px',
				'speed'    => 0.5,
			],
		],
		];
	}

	public static function get_settings(): array {
		$settings = get_option( 'animicro_settings', [] );
		$merged   = wp_parse_args( $settings, self::get_default_settings() );

		// Migrate legacy active_builder (string) to active_builders (array).
		if ( isset( $settings['active_builder'] ) && ! isset( $settings['active_builders'] ) ) {
			$merged['active_builders'] = [ $settings['active_builder'] ];
		}

		return $merged;
	}

	private function load_dependencies(): void {
		require_once ANIMICRO_DIR . 'includes/class-license-manager.php';
		require_once ANIMICRO_DIR . 'includes/class-compatibility.php';
		require_once ANIMICRO_DIR . 'includes/class-admin.php';
		require_once ANIMICRO_DIR . 'includes/class-frontend.php';
	}

	private function register_hooks(): void {
		add_action( 'admin_init', [ 'Animicro_License_Manager', 'validate_license_periodically' ] );
		new Animicro_Admin();
		new Animicro_Frontend();
	}
}
