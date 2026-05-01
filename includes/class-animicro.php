<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Animicro {

	const PRO_MODULES = [
		'blur', 'stagger', 'grid-reveal', 'text-fill-scroll',
		'parallax', 'split', 'text-reveal', 'img-parallax',
	];

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
		// When Pro activates, silently deactivate the free version if it is running.
		if ( self::is_pro_plugin() ) {
			$free_basename = 'animicro/animicro.php';
			if ( function_exists( 'is_plugin_active' ) && is_plugin_active( $free_basename ) ) {
				deactivate_plugins( $free_basename, true );
				set_transient( 'animicro_pro_deactivated_free', true, 30 );
			}
		}

		$defaults = self::get_default_settings();
		if ( false === get_option( 'animicro_settings' ) ) {
			add_option( 'animicro_settings', $defaults, '', false );
		} else {
			// Migrate existing installs to autoload=false (no-op if already set).
			global $wpdb;
			$wpdb->update(
				$wpdb->options,
				[ 'autoload' => 'no' ],
				[ 'option_name' => 'animicro_settings' ]
			);
			wp_cache_delete( 'alloptions', 'options' );
		}
	}

	public static function deactivate(): void {
		// LicenSuite v3 has no public self-revoke endpoint yet. The seat
		// stays "occupied" on the server until the user revokes the
		// connection from their dashboard. Set a one-shot transient so the
		// next admin pageload reminds them with a friendly notice.
		if ( self::is_pro_plugin() ) {
			set_transient( 'animicro_show_revoke_notice', '1', MINUTE_IN_SECONDS );
		}
	}

	public static function get_default_settings(): array {
		return [
			'active_modules'    => [],
			'available_modules' => [ 'fade', 'scale', 'slide-up', 'slide-down', 'slide-right', 'slide-left', 'skew-up', 'float', 'pulse', 'hover-zoom', 'blur', 'stagger', 'grid-reveal', 'highlight', 'text-fill-scroll', 'parallax', 'img-parallax', 'split', 'text-reveal', 'typewriter' ],
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
					'duration'      => 0.6,
					'easing'        => 'ease-out',
					'delay'         => 0.0,
					'margin'        => '-50px 0px',
					'typingSpeed'   => 0.06,
					'backSpeed'     => 0.03,
					'backDelay'     => 1.5,
					'loop'          => true,
					'shuffle'       => false,
					'cursorChar'    => '|',
					'cursorPersist' => true,
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
				'highlight' => [
					'duration'           => 0.8,
					'easing'             => 'ease-out',
					'delay'              => 0.0,
					'margin'             => '-50px 0px',
					'highlightColor'     => '#fde68a',
					'highlightDirection' => 'left',
				],
				'text-fill-scroll' => [
					'duration'    => 0.6,
					'easing'      => 'linear',
					'delay'       => 0.0,
					'margin'      => '-50px 0px',
					'colorBase'   => '#cccccc',
					'colorFill'   => '#000000',
					'scrollStart' => 62,
					'scrollEnd'   => 60,
				],
				'parallax' => [
					'duration' => 0.6,
					'easing'   => 'linear',
					'delay'    => 0.0,
					'margin'   => '-50px 0px',
					'speed'    => 0.5,
				],
				'float' => [
					'duration'  => 3.0,
					'easing'    => 'ease-in-out',
					'delay'     => 0.0,
					'margin'    => '-50px 0px',
					'amplitude' => 12,
				],
				'pulse' => [
					'duration' => 1.5,
					'easing'   => 'ease-in-out',
					'delay'    => 0.0,
					'margin'   => '-50px 0px',
					'scaleMax' => 1.05,
				],
				'skew-up' => [
					'duration' => 0.6,
					'easing'   => 'ease-out',
					'delay'    => 0.0,
					'margin'   => '-50px 0px',
					'distance' => 40,
					'skew'     => 5,
				],
				'hover-zoom' => [
					'duration'  => 0.4,
					'easing'    => 'ease-out',
					'delay'     => 0.0,
					'margin'    => '-50px 0px',
					'zoomScale' => 1.08,
				],
				'img-parallax' => [
					'duration' => 0.6,
					'easing'   => 'linear',
					'delay'    => 0.0,
					'margin'   => '-50px 0px',
					'speed'    => 0.2,
				],
			],
			'smooth_scroll' => [
				'enabled'         => false,
				'lerp'            => 0.1,
				'duration'        => 1.2,
				'smoothWheel'     => true,
				'wheelMultiplier' => 1.0,
				'anchors'         => true,
			],
			'advanced' => [
				'reducedMotion' => true,
				'debugMode'     => false,
			],
		];
	}

	public static function is_pro_plugin(): bool {
		return defined( 'ANIMICRO_PRO' ) && ANIMICRO_PRO;
	}

	public static function is_pro_module( string $module_id ): bool {
		return in_array( $module_id, self::PRO_MODULES, true );
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
		if ( self::is_pro_plugin() ) {
			require_once ANIMICRO_DIR . 'includes/class-license-manager.php';
		}
		require_once ANIMICRO_DIR . 'includes/class-compatibility.php';
		require_once ANIMICRO_DIR . 'includes/class-admin.php';
		require_once ANIMICRO_DIR . 'includes/class-frontend.php';
	}

	private function register_hooks(): void {
		if ( self::is_pro_plugin() ) {
			add_action( 'admin_init', [ 'Animicro_License_Manager', 'validate_license_periodically' ] );
		}
		new Animicro_Admin();
		new Animicro_Frontend();
	}
}
