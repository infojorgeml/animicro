<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Animicro_Frontend {

	public function __construct() {
		add_action( 'wp_enqueue_scripts', [ $this, 'enqueue_assets' ] );
	}

	public function enqueue_assets(): void {
		$settings = Animicro::get_settings();

		if ( empty( $settings['active_modules'] ) ) {
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

		$front_data = [
			'modules'        => array_map( 'sanitize_text_field', $settings['active_modules'] ),
			'moduleSettings' => $module_settings,
		];

		$advanced = $settings['advanced'] ?? [];
		$front_data['advanced'] = [
			'reducedMotion' => (bool) ( $advanced['reducedMotion'] ?? true ),
			'debugMode'     => (bool) ( $advanced['debugMode'] ?? false ),
		];

		$data = wp_json_encode( $front_data );

		wp_add_inline_script( 'animicro-front', "window.animicroFrontData = {$data};", 'before' );

		if ( ! $this->is_builder_editor() ) {
			$active_builders = $settings['active_builders'] ?? [ 'none' ];
			$css             = Animicro_Compatibility::get_editor_css( $settings['active_modules'], $active_builders );

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
			return null;
		}

		$contents = file_get_contents( $file );
		$decoded  = json_decode( $contents, true );

		return is_array( $decoded ) ? $decoded : null;
	}
}
