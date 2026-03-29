<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Animicro_Admin {

	private string $page_hook        = '';
	private string $license_page_hook = '';

	public function __construct() {
		add_action( 'rest_api_init', [ $this, 'register_rest_routes' ] );
		add_filter( 'plugin_action_links_' . ANIMICRO_BASENAME, [ $this, 'plugin_action_links' ], 10, 2 );

		if ( is_admin() ) {
			add_action( 'admin_menu', [ $this, 'register_menu' ] );
			add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_assets' ] );
		}
	}

	/**
	 * Add Settings and Upgrade links to the plugin row.
	 */
	public function plugin_action_links( array $links, string $plugin_file ): array {
		if ( ANIMICRO_BASENAME !== $plugin_file ) {
			return $links;
		}

		$settings_url = admin_url( 'admin.php?page=animicro' );
		$upgrade_url  = 'https://animicro.com/';

		$settings_link = sprintf(
			'<a href="%s">%s</a>',
			esc_url( $settings_url ),
			esc_html__( 'Settings', 'animicro' )
		);

		$upgrade_link = sprintf(
			'<a href="%s" target="_blank" rel="noopener noreferrer" style="font-weight: 700; color: #16a34a;">%s</a>',
			esc_url( $upgrade_url ),
			esc_html__( 'Upgrade to Pro', 'animicro' )
		);

		return array_merge( [ $settings_link, $upgrade_link ], $links );
	}

	public function register_menu(): void {
		$svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none">'
			. '<path d="M2 17.5H5.38131L7.89689 12.3749H4.55676L2 17.5Z" fill="black"/>'
			. '<path d="M10.1238 1.5L8.26797 4.83326L14.6599 17.5H18L10.1238 1.5Z" fill="black"/>'
			. '</svg>';

		$icon_url = 'data:image/svg+xml;base64,' . base64_encode( $svg );

		$this->page_hook = add_menu_page(
			__( 'Animicro', 'animicro' ),
			__( 'Animicro', 'animicro' ),
			'manage_options',
			'animicro',
			[ $this, 'render_page' ],
			$icon_url,
			80
		);

		$this->license_page_hook = add_submenu_page(
			'animicro',
			__( 'Pro License', 'animicro' ),
			__( 'License', 'animicro' ),
			'manage_options',
			'animicro-license',
			[ $this, 'render_page' ]
		);
	}

	public function render_page(): void {
		echo '<div class="wrap"><div id="animicro-root"></div></div>';
	}

	public function enqueue_assets( string $hook ): void {
		$allowed_hooks = [ $this->page_hook, $this->license_page_hook ];
		if ( ! in_array( $hook, $allowed_hooks, true ) ) {
			return;
		}

		$manifest = $this->read_manifest( 'admin/dist/.vite/manifest.json' );
		if ( ! $manifest ) {
			return;
		}

		$entry_key = 'admin/src/main.tsx';
		if ( ! isset( $manifest[ $entry_key ] ) ) {
			return;
		}

		$entry = $manifest[ $entry_key ];

		if ( ! empty( $entry['css'] ) ) {
			foreach ( $entry['css'] as $index => $css_file ) {
				wp_enqueue_style(
					'animicro-admin-' . $index,
					ANIMICRO_URL . 'admin/dist/' . $css_file,
					[],
					ANIMICRO_VERSION
				);
			}
		}

		wp_enqueue_script(
			'animicro-admin',
			ANIMICRO_URL . 'admin/dist/' . $entry['file'],
			[],
			ANIMICRO_VERSION,
			true
		);

		add_filter( 'script_loader_tag', [ $this, 'add_module_type' ], 10, 3 );

		$current_page = isset( $_GET['page'] ) ? sanitize_key( $_GET['page'] ) : 'animicro'; // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only admin page routing
		$page         = ( 'animicro-license' === $current_page ) ? 'license' : 'modules';

		$license_manager = new Animicro_License_Manager();

		$data = wp_json_encode( [
			'restUrl'    => esc_url_raw( rest_url( 'animicro/v1/' ) ),
			'nonce'      => wp_create_nonce( 'wp_rest' ),
			'settings'   => Animicro::get_settings(),
			'version'    => ANIMICRO_VERSION,
			'builders'   => Animicro_Compatibility::get_available_builders(),
			'isPremium'  => Animicro_License_Manager::is_premium(),
			'licenseKey' => $license_manager->get_license_key(),
			'page'       => $page,
		] );

		wp_add_inline_script( 'animicro-admin', "window.animicroData = {$data};", 'before' );
	}

	public function add_module_type( string $tag, string $handle, string $src ): string {
		if ( 'animicro-admin' !== $handle ) {
			return $tag;
		}
		return str_replace( ' src', ' type="module" src', $tag );
	}

	public function register_rest_routes(): void {
		register_rest_route( 'animicro/v1', '/settings', [
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'get_settings' ],
				'permission_callback' => [ $this, 'check_permission' ],
			],
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'update_settings' ],
				'permission_callback' => [ $this, 'check_permission' ],
			],
		] );

		register_rest_route( 'animicro/v1', '/license/status', [
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'get_license_status' ],
				'permission_callback' => [ $this, 'check_permission' ],
			],
		] );

		register_rest_route( 'animicro/v1', '/license/save', [
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'save_license' ],
				'permission_callback' => [ $this, 'check_permission' ],
				'args'                => [
					'license_key' => [
						'required'          => false,
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_text_field',
					],
				],
			],
		] );
	}

	public function check_permission(): bool {
		return current_user_can( 'manage_options' );
	}

	public function get_settings(): \WP_REST_Response {
		return new \WP_REST_Response( Animicro::get_settings(), 200 );
	}

	public function update_settings( \WP_REST_Request $request ): \WP_REST_Response {
		$raw      = $request->get_json_params();
		$defaults = Animicro::get_default_settings();
		$clean    = [];

		$clean['active_modules'] = isset( $raw['active_modules'] ) && is_array( $raw['active_modules'] )
			? array_map( 'sanitize_text_field', $raw['active_modules'] )
			: $defaults['active_modules'];

		// Filter out pro modules from active_modules if not premium.
		if ( ! Animicro_License_Manager::is_premium() ) {
			$clean['active_modules'] = array_values(
				array_filter(
					$clean['active_modules'],
					function ( $m ) {
						return ! Animicro_License_Manager::is_pro_module( $m );
					}
				)
			);
		}

		$clean['active_builders'] = isset( $raw['active_builders'] ) && is_array( $raw['active_builders'] )
			? array_values( array_map( 'sanitize_text_field', $raw['active_builders'] ) )
			: $defaults['active_builders'] ?? [ 'none' ];

		$raw_module_settings     = isset( $raw['module_settings'] ) && is_array( $raw['module_settings'] )
			? $raw['module_settings']
			: [];
		$default_module_settings = $defaults['module_settings'];
		$clean_module_settings   = [];

		foreach ( $default_module_settings as $module_id => $module_defaults ) {
			$raw_mod = $raw_module_settings[ $module_id ] ?? [];

			$entry = [
				'duration' => isset( $raw_mod['duration'] ) ? (float) $raw_mod['duration'] : $module_defaults['duration'],
				'easing'   => isset( $raw_mod['easing'] )   ? sanitize_text_field( $raw_mod['easing'] ) : $module_defaults['easing'],
				'delay'    => isset( $raw_mod['delay'] )     ? (float) $raw_mod['delay'] : $module_defaults['delay'],
				'margin'   => isset( $raw_mod['margin'] )    ? sanitize_text_field( $raw_mod['margin'] ) : $module_defaults['margin'],
			];

			if ( isset( $module_defaults['distance'] ) ) {
				$entry['distance'] = isset( $raw_mod['distance'] ) ? (float) $raw_mod['distance'] : $module_defaults['distance'];
			}
			if ( isset( $module_defaults['scale'] ) ) {
				$entry['scale'] = isset( $raw_mod['scale'] ) ? (float) $raw_mod['scale'] : $module_defaults['scale'];
			}
			if ( isset( $module_defaults['blur'] ) ) {
				$entry['blur'] = isset( $raw_mod['blur'] ) ? (float) $raw_mod['blur'] : $module_defaults['blur'];
			}
			if ( isset( $module_defaults['staggerDelay'] ) ) {
				$entry['staggerDelay'] = isset( $raw_mod['staggerDelay'] ) ? (float) $raw_mod['staggerDelay'] : $module_defaults['staggerDelay'];
			}
			if ( isset( $module_defaults['typingSpeed'] ) ) {
				$entry['typingSpeed'] = isset( $raw_mod['typingSpeed'] ) ? (float) $raw_mod['typingSpeed'] : $module_defaults['typingSpeed'];
			}
			if ( isset( $module_defaults['speed'] ) ) {
				$entry['speed'] = isset( $raw_mod['speed'] ) ? (float) $raw_mod['speed'] : $module_defaults['speed'];
			}
			if ( isset( $module_defaults['origin'] ) ) {
				$entry['origin'] = isset( $raw_mod['origin'] ) ? sanitize_text_field( $raw_mod['origin'] ) : $module_defaults['origin'];
			}
			if ( isset( $module_defaults['highlightColor'] ) ) {
				$entry['highlightColor'] = isset( $raw_mod['highlightColor'] ) ? sanitize_text_field( $raw_mod['highlightColor'] ) : $module_defaults['highlightColor'];
			}
			if ( isset( $module_defaults['highlightDirection'] ) ) {
				$entry['highlightDirection'] = isset( $raw_mod['highlightDirection'] ) ? sanitize_text_field( $raw_mod['highlightDirection'] ) : $module_defaults['highlightDirection'];
			}
			if ( isset( $module_defaults['colorBase'] ) ) {
				$entry['colorBase'] = isset( $raw_mod['colorBase'] ) ? sanitize_text_field( $raw_mod['colorBase'] ) : $module_defaults['colorBase'];
			}
			if ( isset( $module_defaults['colorFill'] ) ) {
				$entry['colorFill'] = isset( $raw_mod['colorFill'] ) ? sanitize_text_field( $raw_mod['colorFill'] ) : $module_defaults['colorFill'];
			}
			if ( isset( $module_defaults['scrollStart'] ) ) {
				$entry['scrollStart'] = isset( $raw_mod['scrollStart'] ) ? (int) $raw_mod['scrollStart'] : $module_defaults['scrollStart'];
			}
			if ( isset( $module_defaults['scrollEnd'] ) ) {
				$entry['scrollEnd'] = isset( $raw_mod['scrollEnd'] ) ? (int) $raw_mod['scrollEnd'] : $module_defaults['scrollEnd'];
			}

			$clean_module_settings[ $module_id ] = $entry;
		}

		foreach ( $raw_module_settings as $module_id => $raw_mod ) {
			if ( isset( $clean_module_settings[ $module_id ] ) ) {
				continue;
			}
			if ( ! is_array( $raw_mod ) ) {
				continue;
			}
			$clean_module_settings[ sanitize_key( $module_id ) ] = [
				'duration' => isset( $raw_mod['duration'] ) ? (float) $raw_mod['duration'] : 0.6,
				'easing'   => isset( $raw_mod['easing'] )   ? sanitize_text_field( $raw_mod['easing'] ) : 'ease-out',
				'delay'    => isset( $raw_mod['delay'] )     ? (float) $raw_mod['delay'] : 0.0,
				'margin'   => isset( $raw_mod['margin'] )    ? sanitize_text_field( $raw_mod['margin'] ) : '-50px 0px',
			];
		}

		$clean['module_settings'] = $clean_module_settings;

		update_option( 'animicro_settings', $clean );

		return new \WP_REST_Response( $clean, 200 );
	}

	public function get_license_status(): \WP_REST_Response {
		$license_manager = new Animicro_License_Manager();

		return new \WP_REST_Response( [
			'license_key'  => $license_manager->get_license_key(),
			'license_data' => $license_manager->get_license_data(),
			'is_premium'   => Animicro_License_Manager::is_premium(),
			'plan'         => $license_manager->get_license_plan(),
		], 200 );
	}

	public function save_license( \WP_REST_Request $request ): \WP_REST_Response {
		$license_key     = $request->get_param( 'license_key' ) ?? '';
		$license_manager = new Animicro_License_Manager();

		$license_manager->save_license_key( $license_key );

		if ( ! empty( $license_key ) ) {
			$result = $license_manager->validate_license( $license_key, true );

			if ( isset( $result['valid'] ) && $result['valid'] ) {
				Animicro_License_Manager::activate_premium();
			} else {
				Animicro_License_Manager::deactivate_premium();
			}

			return new \WP_REST_Response( [
				'success'    => true,
				'is_premium' => isset( $result['valid'] ) && $result['valid'],
				'data'       => $result,
				'message'    => $license_manager->get_error_message( $result['reason'] ?? 'server_error' ),
			], 200 );
		}

		Animicro_License_Manager::deactivate_premium();

		return new \WP_REST_Response( [
			'success'    => true,
			'is_premium' => false,
			'data'       => [ 'valid' => false, 'reason' => 'no_license', 'plan' => null ],
			'message'    => $license_manager->get_error_message( 'no_license' ),
		], 200 );
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
