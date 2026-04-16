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
			'available_modules' => [ 'fade', 'scale', 'slide-up', 'slide-down', 'highlight', 'typewriter' ],
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
			'highlight' => [
				'duration'           => 0.8,
				'easing'             => 'ease-out',
				'delay'              => 0.0,
				'margin'             => '-50px 0px',
				'highlightColor'     => '#fde68a',
				'highlightDirection' => 'left',
			],
			'typewriter' => [
				'duration'    => 0.6,
				'easing'      => 'ease-out',
				'delay'       => 0.0,
				'margin'      => '-50px 0px',
				'typingSpeed' => 0.06,
			],
		],
			'advanced' => [
				'reducedMotion' => true,
				'debugMode'     => false,
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
		require_once ANIMICRO_DIR . 'includes/class-compatibility.php';
		require_once ANIMICRO_DIR . 'includes/class-admin.php';
		require_once ANIMICRO_DIR . 'includes/class-frontend.php';
	}

	private function register_hooks(): void {
		new Animicro_Admin();
		new Animicro_Frontend();
	}
}
