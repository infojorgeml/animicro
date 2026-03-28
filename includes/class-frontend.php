<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Animicro_Frontend {

	public function __construct() {
		add_action( 'wp_enqueue_scripts', [ $this, 'enqueue_assets' ] );
		add_action( 'wp_head', [ $this, 'print_dynamic_css' ], 5 );
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
		$is_premium      = Animicro_License_Manager::is_premium();

		$active_modules = array_values(
			array_filter(
				$settings['active_modules'],
				function ( $m ) use ( $is_premium ) {
					return $is_premium || ! Animicro_License_Manager::is_pro_module( $m );
				}
			)
		);

		$data = wp_json_encode( [
			'modules'        => array_map( 'sanitize_text_field', $active_modules ),
			'moduleSettings' => $module_settings,
		] );

		wp_add_inline_script( 'animicro-front', "window.animicroFrontData = {$data};", 'before' );
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

	public function print_dynamic_css(): void {
		// Bricks editor iframe loads with ?bricks=run — skip hiding CSS there.
		if ( isset( $_GET['bricks'] ) && 'run' === $_GET['bricks'] ) {
			return;
		}

		// Breakdance editor loads with ?breakdance=builder — skip hiding CSS there.
		if ( isset( $_GET['breakdance'] ) && 'builder' === $_GET['breakdance'] ) {
			return;
		}

		// Elementor preview iframe loads with ?elementor-preview — skip hiding CSS there.
		if ( isset( $_GET['elementor-preview'] ) ) {
			return;
		}

		// Oxygen builder loads with ?ct_builder=true — skip hiding CSS there.
		if ( isset( $_GET['ct_builder'] ) && 'true' === $_GET['ct_builder'] ) {
			return;
		}

		// Divi builder frontend editor loads with ?et_fb=1 — skip hiding CSS there.
		if ( isset( $_GET['et_fb'] ) && '1' === $_GET['et_fb'] ) {
			return;
		}

		$settings = Animicro::get_settings();

		if ( empty( $settings['active_modules'] ) ) {
			return;
		}

		$active_builders = $settings['active_builders'] ?? [ 'none' ];
		$css             = Animicro_Compatibility::get_editor_css( $settings['active_modules'], $active_builders );

		if ( ! empty( $css ) ) {
			echo "<style id=\"animicro-dynamic-css\">\n" . $css . "</style>\n";
		}
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
