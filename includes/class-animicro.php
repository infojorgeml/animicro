<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Animicro {

	const PRO_MODULES = [
		'blur', 'stagger', 'grid-reveal', 'text-fill-scroll',
		'parallax', 'split', 'text-reveal', 'img-parallax', 'magnet',
		'scatter', 'scramble', 'spin',
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
		// LicenSuite v4 recommendation (matches Bricks / WP Rocket / Elementor):
		// when the user deactivates the plugin, clean the local connection
		// options. The seat remains listed on the LicenSuite dashboard until
		// the user revokes it there manually — there is no public
		// self-revoke endpoint that accepts the connection_secret yet.
		// On reactivation, the user starts cleanly from the disconnected
		// state and runs Connect again.
		if ( ! self::is_pro_plugin() ) {
			return;
		}

		if ( ! class_exists( 'Animicro_License_Manager' ) ) {
			$file = ANIMICRO_DIR . 'includes/class-license-manager.php';
			if ( is_readable( $file ) ) {
				require_once $file;
			}
		}

		if ( class_exists( 'Animicro_License_Manager' ) ) {
			( new Animicro_License_Manager() )->clear_connection();
		}
	}

	public static function get_default_settings(): array {
		return [
			'active_modules'    => [],
			'available_modules' => [ 'fade', 'scale', 'slide-up', 'slide-down', 'slide-right', 'slide-left', 'skew-up', 'float', 'pulse', 'hover-zoom', 'spin', 'blur', 'stagger', 'grid-reveal', 'highlight', 'text-fill-scroll', 'parallax', 'img-parallax', 'magnet', 'split', 'scatter', 'scramble', 'text-reveal', 'typewriter', 'page-curtain' ],
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
				'scatter' => [
					'duration'     => 0.6,
					'easing'       => 'ease-out',
					'delay'        => 0.0,
					'margin'       => '-50px 0px',
					'staggerDelay' => 0.05,
					'radius'       => 200.0,
					'rotateMax'    => 45.0,
				],
				'scramble' => [
					// duration/easing are inert (this module is discrete-tick,
					// not a Motion animate() call). Kept in defaults so the
					// REST loop in class-admin.php doesn't trip on missing keys.
					'duration'       => 0.6,
					'easing'         => 'ease-out',
					'delay'          => 0.0,
					'margin'         => '-50px 0px',
					'staggerDelay'   => 0.04,
					'scrambleSpeed'  => 0.05,
				],
				'spin' => [
					// duration/easing/delay/margin are inert (continuous,
					// driven by an rAF loop), kept to satisfy the REST loop.
					// Field names are spinSpeed / spinDirection (not speed /
					// direction) so the REST sanitizers don't collide with
					// parallax's `speed` (clamp -5..5) or page-curtain's
					// `direction` (whitelist fade/slide-up/slide-down).
					'duration'      => 0.6,
					'easing'        => 'linear',
					'delay'         => 0.0,
					'margin'        => '-50px 0px',
					'spinSpeed'     => 30.0,
					'spinDirection' => 'right',
					'scrollBoost'   => 5.0,
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
				'magnet' => [
					// duration/easing/delay/margin are inert for this module
					// (no viewport gating, no Motion animate() — driven by a
					// rAF lerp loop). Kept in defaults because the REST loop
					// in class-admin.php expects every entry to carry them.
					'duration'   => 0.6,
					'easing'     => 'ease-out',
					'delay'      => 0.0,
					'margin'     => '-50px 0px',
					'strength'   => 15.0,
					'smoothness' => 0.08,
					'axis'       => 'both',
				],
				'page-curtain' => [
					'duration'  => 0.8,
					'easing'    => 'ease-out',
					'delay'     => 0.0,
					'direction' => 'fade',
					'bgColor'   => '#000000',
					'logoUrl'   => '',
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
		return wp_parse_args( $settings, self::get_default_settings() );
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
