<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Animicro_Frontend {

	public function __construct() {
		add_action( 'wp_enqueue_scripts', [ $this, 'enqueue_assets' ] );

		// Page Transitions (1.14.0): only wire if we're on the real
		// frontend (not in a builder editor). Both filters check the
		// active_modules list to noop early when neither module is on.
		if ( ! $this->is_builder_editor() ) {
			add_filter( 'body_class',   [ $this, 'add_page_fade_body_class' ] );
			add_action( 'wp_body_open', [ $this, 'output_page_curtain' ] );
		}
	}

	private function is_module_active( string $module_id ): bool {
		$settings = Animicro::get_settings();
		$active   = $settings['active_modules'] ?? [];
		return is_array( $active ) && in_array( $module_id, $active, true );
	}

	/**
	 * Add the `am-page-fade-init` body class when page-fade is active.
	 * The critical CSS injected by class-compatibility.php sets that body
	 * to opacity:0; the page-fade JS module animates it to 1 and removes
	 * the class.
	 */
	public function add_page_fade_body_class( array $classes ): array {
		if ( $this->is_module_active( 'page-fade' ) ) {
			$classes[] = 'am-page-fade-init';
		}
		return $classes;
	}

	/**
	 * Inject the page-curtain overlay div immediately after <body> opens.
	 * Requires the active theme to call wp_body_open() (mandatory since
	 * WordPress 5.2). On themes that don't, the curtain simply never
	 * appears and the plugin degrades cleanly with no error.
	 */
	public function output_page_curtain(): void {
		if ( ! $this->is_module_active( 'page-curtain' ) ) {
			return;
		}

		$settings = Animicro::get_settings();
		$cfg      = $settings['module_settings']['page-curtain'] ?? [];

		$direction_raw = isset( $cfg['direction'] ) ? (string) $cfg['direction'] : 'fade';
		$direction     = in_array( $direction_raw, [ 'fade', 'slide-up', 'slide-down' ], true )
			? $direction_raw
			: 'fade';

		$bg_raw = isset( $cfg['bgColor'] ) ? (string) $cfg['bgColor'] : '#000000';
		$bg     = sanitize_hex_color( $bg_raw );
		if ( ! $bg ) {
			$bg = '#000000';
		}

		$logo = isset( $cfg['logoUrl'] ) ? esc_url( (string) $cfg['logoUrl'] ) : '';

		printf(
			'<div id="am-page-curtain" data-am-direction="%s" style="--am-curtain-bg:%s">%s</div>',
			esc_attr( $direction ),
			esc_attr( $bg ),
			$logo
				? sprintf( '<img src="%s" alt="" aria-hidden="true">', esc_url( $logo ) )
				: ''
		);
	}

	private function is_premium(): bool {
		return Animicro::is_pro_plugin()
			&& class_exists( 'Animicro_License_Manager' )
			&& Animicro_License_Manager::is_premium();
	}

	public function enqueue_assets(): void {
		$settings = Animicro::get_settings();

		$smooth_enabled = ! empty( $settings['smooth_scroll']['enabled'] ) && $this->is_premium();

		if ( empty( $settings['active_modules'] ) && ! $smooth_enabled ) {
			return;
		}

		$manifest = $this->read_manifest( 'frontend/dist/.vite/manifest.json' );
		if ( ! $manifest ) {
			return;
		}

		$entry_key = 'frontend/src/main.js';
		if ( ! isset( $manifest[ $entry_key ] ) ) {
			return;
		}

		$entry = $manifest[ $entry_key ];

		if ( ! empty( $entry['css'] ) ) {
			foreach ( $entry['css'] as $index => $css_file ) {
				wp_enqueue_style(
					'animicro-front-' . $index,
					ANIMICRO_URL . 'frontend/dist/' . $css_file,
					[],
					ANIMICRO_VERSION
				);
			}
		}

		wp_enqueue_script(
			'animicro-front',
			ANIMICRO_URL . 'frontend/dist/' . $entry['file'],
			[],
			ANIMICRO_VERSION,
			true
		);

		add_filter( 'script_loader_tag', [ $this, 'add_module_type' ], 10, 3 );

		$module_settings = $settings['module_settings'] ?? [];
		$is_premium      = $this->is_premium();

		$active_modules = array_values(
			array_filter(
				$settings['active_modules'] ?? [],
				function ( $m ) use ( $is_premium ) {
					return $is_premium || ! Animicro::is_pro_module( $m );
				}
			)
		);

		$front_data = [
			'modules'        => array_map( 'sanitize_text_field', $active_modules ),
			'moduleSettings' => $module_settings,
		];

		$smooth_scroll = $settings['smooth_scroll'] ?? [];
		if ( ! empty( $smooth_scroll['enabled'] ) && $is_premium ) {
			$front_data['smoothScroll'] = [
				'lerp'            => (float) ( $smooth_scroll['lerp'] ?? 0.1 ),
				'duration'        => (float) ( $smooth_scroll['duration'] ?? 1.2 ),
				'smoothWheel'     => (bool) ( $smooth_scroll['smoothWheel'] ?? true ),
				'wheelMultiplier' => (float) ( $smooth_scroll['wheelMultiplier'] ?? 1.0 ),
				'anchors'         => (bool) ( $smooth_scroll['anchors'] ?? true ),
			];
		}

		$advanced = $settings['advanced'] ?? [];
		$front_data['advanced'] = [
			'reducedMotion' => (bool) ( $advanced['reducedMotion'] ?? true ),
			'debugMode'     => (bool) ( $advanced['debugMode'] ?? false ),
		];

		$data = wp_json_encode( $front_data );

		wp_add_inline_script( 'animicro-front', "window.animicroFrontData = {$data};", 'before' );

		if ( ! empty( $active_modules ) && ! $this->is_builder_editor() ) {
			$css = Animicro_Compatibility::get_editor_css( $active_modules );

			if ( ! empty( $css ) ) {
				wp_register_style( 'animicro-dynamic', false, [], ANIMICRO_VERSION );
				wp_enqueue_style( 'animicro-dynamic' );
				wp_add_inline_style( 'animicro-dynamic', $css );
			}
		}
	}

	public function add_module_type( string $tag, string $handle, string $src ): string {
		if ( 'animicro-front' !== $handle ) {
			return $tag;
		}
		if ( strpos( $tag, 'type="module"' ) !== false ) {
			return $tag;
		}
		return str_replace( '<script ', '<script type="module" ', $tag );
	}

	/**
	 * Detect whether the current request is a page-builder editor preview.
	 */
	private function is_builder_editor(): bool {
		// phpcs:disable WordPress.Security.NonceVerification.Recommended -- read-only builder detection via URL params, not form processing.
		if ( isset( $_GET['bricks'] ) && 'run' === sanitize_text_field( wp_unslash( $_GET['bricks'] ) ) ) {
			return true;
		}
		if ( isset( $_GET['breakdance'] ) && 'builder' === sanitize_text_field( wp_unslash( $_GET['breakdance'] ) ) ) {
			return true;
		}
		if ( isset( $_GET['elementor-preview'] ) ) {
			return true;
		}
		if ( isset( $_GET['ct_builder'] ) && 'true' === sanitize_text_field( wp_unslash( $_GET['ct_builder'] ) ) ) {
			return true;
		}
		if ( isset( $_GET['et_fb'] ) && '1' === sanitize_text_field( wp_unslash( $_GET['et_fb'] ) ) ) {
			return true;
		}
		// phpcs:enable WordPress.Security.NonceVerification.Recommended
		return false;
	}

	private function read_manifest( string $relative_path ): ?array {
		$file = ANIMICRO_DIR . $relative_path;
		if ( ! file_exists( $file ) ) {
			if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
				error_log( sprintf( 'Animicro: manifest not found at %s', $file ) );
			}
			return null;
		}

		$contents = file_get_contents( $file );
		if ( false === $contents ) {
			if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
				error_log( sprintf( 'Animicro: failed to read manifest %s', $file ) );
			}
			return null;
		}

		$decoded = json_decode( $contents, true );
		if ( ! is_array( $decoded ) ) {
			if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
				error_log( sprintf( 'Animicro: malformed manifest JSON at %s', $file ) );
			}
			return null;
		}

		return $decoded;
	}
}
