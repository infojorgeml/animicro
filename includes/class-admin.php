<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Animicro_Admin {

	private string $page_hook         = '';
	private string $license_page_hook = '';

	/** Whether admin JS/CSS were enqueued (manifest + entry found). */
	private bool $admin_assets_enqueued = false;

	public function __construct() {
		add_action( 'rest_api_init', [ $this, 'register_rest_routes' ] );
		add_filter( 'plugin_action_links_' . ANIMICRO_BASENAME, [ $this, 'plugin_action_links' ], 10, 2 );

		if ( is_admin() ) {
			add_action( 'admin_menu', [ $this, 'register_menu' ] );
			add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_assets' ] );
			add_action( 'admin_notices', [ $this, 'notice_free_deactivated' ] );
			add_action( 'admin_notices', [ $this, 'maybe_notice_revoke_reminder' ] );
			// Run before any plugin renders its admin notice. Priority 1 so
			// we strip the action queue before WP starts firing it.
			add_action( 'in_admin_header', [ $this, 'suppress_admin_notices' ], 1 );

			// LicenSuite v3 Connect: handle the dashboard redirect callback.
			if ( Animicro::is_pro_plugin() ) {
				add_action( 'admin_init', [ $this, 'maybe_handle_connect_callback' ] );
			}
		}
	}

	/**
	 * Catch the LicenSuite dashboard redirect after the user completes the
	 * Connect flow. URL shape:
	 *   /wp-admin/admin.php?page=animicro-license&action=connect-callback
	 *   &token=<one-time>&state=<wp-nonce>
	 *
	 * Verifies the WP nonce in `state`, runs the token-for-secret exchange,
	 * then redirects to the clean license page so the React UI re-fetches
	 * `/license/status` and renders the new connected state.
	 */
	public function maybe_handle_connect_callback(): void {
		// phpcs:disable WordPress.Security.NonceVerification.Recommended -- the `state` query arg IS the nonce; we verify it inside handle_callback().
		if ( ( $_GET['page'] ?? '' ) !== 'animicro-license' ) {
			return;
		}
		if ( ( $_GET['action'] ?? '' ) !== 'connect-callback' ) {
			return;
		}
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		if ( ! class_exists( 'Animicro_License_Manager' ) ) {
			return;
		}

		$token = sanitize_text_field( wp_unslash( $_GET['token'] ?? '' ) );
		$state = sanitize_text_field( wp_unslash( $_GET['state'] ?? '' ) );
		// phpcs:enable WordPress.Security.NonceVerification.Recommended

		$manager = new Animicro_License_Manager();
		$manager->handle_callback( $token, $state );

		wp_safe_redirect( admin_url( 'admin.php?page=animicro-license' ) );
		exit;
	}

	/**
	 * After the user clicks "Disconnect" in the React UI, remind them that
	 * the seat is still held by this site on LicenSuite until they revoke
	 * the connection from the dashboard. One-shot via a 60 s transient.
	 */
	public function maybe_notice_revoke_reminder(): void {
		if ( ! Animicro::is_pro_plugin() ) {
			return;
		}
		if ( ! get_transient( 'animicro_show_revoke_notice' ) ) {
			return;
		}
		delete_transient( 'animicro_show_revoke_notice' );

		echo '<div class="notice notice-info is-dismissible"><p>'
			. wp_kses(
				sprintf(
					/* translators: %s: dashboard URL. */
					__( '<strong>Animicro Pro:</strong> the local connection has been removed. To free up the seat for another site, also revoke this connection from your <a href="%s" target="_blank" rel="noopener">LicenSuite dashboard</a>.', 'animicro' ),
					esc_url( 'https://licensuite.vercel.app/' )
				),
				[ 'strong' => [], 'a' => [ 'href' => [], 'target' => [], 'rel' => [] ] ]
			)
			. '</p></div>';
	}

	/**
	 * Suppress all third-party admin notices on Animicro screens.
	 *
	 * WordPress fires `admin_notices` (and friends) on every backend page,
	 * which means SEO plugins, security tools, etc. inject their banners
	 * into our React admin chrome and break the layout. Plugins like ASE
	 * intercept some of these but not all (Slim SEO, for instance, uses a
	 * custom rendering path that ASE misses).
	 *
	 * Standard practice in serious WP plugins (Bricks, Elementor, ACF Pro,
	 * Yoast Premium, etc.): on their own admin pages, remove every action
	 * from the notice hooks before they render. Visitors still see those
	 * notices everywhere else in `/wp-admin/`, just not on our screens.
	 *
	 * Hook: `in_admin_header` — fires after `current_screen` is set but
	 * before WP starts rendering the page header / notice queue.
	 */
	public function suppress_admin_notices(): void {
		$screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
		if ( ! $screen ) {
			return;
		}

		$animicro_screens = array_filter( [ $this->page_hook, $this->license_page_hook ] );
		if ( ! in_array( $screen->id, $animicro_screens, true ) ) {
			return;
		}

		// Cover every action hook WP fires for admin notices.
		remove_all_actions( 'admin_notices' );
		remove_all_actions( 'all_admin_notices' );
		remove_all_actions( 'user_admin_notices' );
		remove_all_actions( 'network_admin_notices' );
	}

	/**
	 * Show a one-time success notice when Pro auto-deactivated the free version.
	 */
	public function notice_free_deactivated(): void {
		if ( ! Animicro::is_pro_plugin() ) {
			return;
		}
		if ( ! get_transient( 'animicro_pro_deactivated_free' ) ) {
			return;
		}
		delete_transient( 'animicro_pro_deactivated_free' );
		echo '<div class="notice notice-success is-dismissible"><p>'
			. esc_html__( 'Animicro (free) has been deactivated automatically. Animicro Pro is now active.', 'animicro' )
			. '</p></div>';
	}

	/**
	 * Add Settings and Upgrade links to the plugin row.
	 */
	public function plugin_action_links( array $links, string $plugin_file ): array {
		if ( ANIMICRO_BASENAME !== $plugin_file ) {
			return $links;
		}

		$settings_url = admin_url( 'admin.php?page=animicro' );

		$settings_link = sprintf(
			'<a href="%s">%s</a>',
			esc_url( $settings_url ),
			esc_html__( 'Settings', 'animicro' )
		);

		$merged = array_merge( [ $settings_link ], $links );

		if ( ! Animicro::is_pro_plugin() ) {
			$upgrade_url = apply_filters( 'animicro_upgrade_url', 'https://animicro.com/' );

			$merged[] = sprintf(
				'<a href="%s" target="_blank" rel="noopener noreferrer" style="font-weight: 700; color: #8DDF0A;">%s</a>',
				esc_url( $upgrade_url ),
				esc_html__( 'Upgrade', 'animicro' )
			);
		}

		return $merged;
	}

	private const MENU_ICON_BASE64 = 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMjggMTI4IiBmaWxsPSJub25lIj48cGF0aCBkPSJNOTUuMzkyOSA2NEwxMDUuMjEgNzUuNzg1N0MxMDYuMjQxIDc2Ljk4NTEgMTA3LjAxMyA3OC4zNzUzIDEwNy40NzkgNzkuODcyOUMxMDcuOTQ1IDgxLjM3MDQgMTA4LjA5NSA4Mi45NDQzIDEwNy45MjEgODQuNUMxMDcuODA2IDg2LjA2NjEgMTA3LjM1OSA4Ny41OTE5IDEwNi42MDkgODguOTgxMkMxMDUuODU5IDkwLjM3MDQgMTA0LjgyMSA5MS41OTI5IDEwMy41NjIgOTIuNTcxNEwxMDAuNTU4IDk1LjAzNTdMOTAuNTU3NSA4Mi45Mjg2Qzg4LjczNTggODAuNjUwOSA4Ni4wOSA3OS4xMzgxIDgzLjE2MTggNzguNjk5OUM4MC4yMzM1IDc4LjI2MTcgNzcuMjQ0MiA3OC45MzEyIDc0LjgwNTcgODAuNTcxNEwyNC4xODAyIDExNEwyMS45ODIzIDExMC43MTRDMjAuMjQ4MyAxMDguMDgyIDE5LjYyNyAxMDQuODk3IDIwLjI0ODQgMTAxLjgyOEMyMC44Njk5IDk4Ljc1ODQgMjIuNjg1OSA5Ni4wNDI3IDI1LjMxNTggOTQuMjVMNzEuMjg5IDY0TDI1LjMxNTggMzMuNzVDMjIuNjc4NCAzMS45NjMxIDIwLjg1NjQgMjkuMjQ2OSAyMC4yMzQ0IDI2LjE3NUMxOS42MTI1IDIzLjEwMyAyMC4yMzkyIDE5LjkxNTcgMjEuOTgyMyAxNy4yODU3TDI0LjE4MDIgMTRMNzQuOTUyMiA0Ny40Mjg2Qzc3LjM5MDcgNDkuMDY4OCA4MC4zODAxIDQ5LjczODMgODMuMzA4MyA0OS4zMDAxQzg2LjIzNjYgNDguODYxOSA4OC44ODIzIDQ3LjM0OTEgOTAuNzA0IDQ1LjA3MTRMMTAwLjU5NSAzMy4wMzU3TDEwMy41OTkgMzUuNUMxMDQuODQyIDM2LjQ3MzggMTA1Ljg2OCAzNy42ODY0IDEwNi42MTIgMzkuMDYyNUMxMDcuMzU1IDQwLjQzODYgMTA3LjgwMSA0MS45NDkgMTA3LjkyMSA0My41QzEwOC4xMDUgNDUuMDUwOCAxMDcuOTY2IDQ2LjYyMTkgMTA3LjUxMyA0OC4xMTkyQzEwNy4wNiA0OS42MTY1IDEwNi4zMDIgNTEuMDA5MyAxMDUuMjg0IDUyLjIxNDNMOTUuMzkyOSA2NFoiIGZpbGw9ImJsYWNrIi8+PC9zdmc+';

	public function register_menu(): void {
		$icon_url = 'data:image/svg+xml;base64,' . self::MENU_ICON_BASE64;

		$this->page_hook = add_menu_page(
			__( 'Animicro', 'animicro' ),
			__( 'Animicro', 'animicro' ),
			'manage_options',
			'animicro',
			[ $this, 'render_page' ],
			$icon_url,
			80
		);

		if ( Animicro::is_pro_plugin() ) {
			$this->license_page_hook = add_submenu_page(
				'animicro',
				__( 'Pro License', 'animicro' ),
				__( 'License', 'animicro' ),
				'manage_options',
				'animicro-license',
				[ $this, 'render_page' ]
			);
		}
	}

	public function render_page(): void {
		echo '<div class="wrap">';
		if ( ! $this->admin_assets_enqueued ) {
			echo '<div class="notice notice-error"><p>';
			esc_html_e(
				'Animicro could not load the admin interface: built assets are missing. Before creating a ZIP, run npm install and npm run build so admin/dist exists. If you installed from a ZIP, reinstall a build that includes admin/dist/.vite/manifest.json.',
				'animicro'
			);
			echo '</p></div>';
		}
		echo '<div id="animicro-root"></div></div>';
	}

	public function enqueue_assets( string $hook ): void {
		$allowed_hooks = array_filter( [ $this->page_hook, $this->license_page_hook ] );
		if ( ! in_array( $hook, $allowed_hooks, true ) ) {
			return;
		}

		$this->admin_assets_enqueued = false;

		$manifest = $this->read_manifest( 'admin/dist/.vite/manifest.json' );
		if ( ! $manifest ) {
			return;
		}

		$entry = $this->resolve_vite_entry( $manifest, 'admin/src/main.tsx' );
		if ( ! $entry ) {
			return;
		}

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

		// Page Curtain (1.14.1+): the React admin needs `wp.media()` to power
		// the Logo URL media-library picker. wp_enqueue_media() loads the
		// thickbox/backbone bundle that exposes window.wp.media. Only needed
		// on the main settings page, not the License screen.
		if ( 'animicro' === $current_page && function_exists( 'wp_enqueue_media' ) ) {
			wp_enqueue_media();
		}

		$is_pro_plugin = Animicro::is_pro_plugin();
		$is_premium    = false;

		if ( $is_pro_plugin && class_exists( 'Animicro_License_Manager' ) ) {
			$is_premium = Animicro_License_Manager::is_premium();
		}

		$data = wp_json_encode( [
			'restUrl'    => esc_url_raw( rest_url( 'animicro/v1/' ) ),
			'nonce'      => wp_create_nonce( 'wp_rest' ),
			'settings'   => Animicro::get_settings(),
			'version'    => ANIMICRO_VERSION,
			'isPremium'  => $is_premium,
			'page'       => $page,
			'proPlugin'  => $is_pro_plugin,
			'upgradeUrl' => $is_pro_plugin
				? admin_url( 'admin.php?page=animicro-license' )
				: apply_filters( 'animicro_upgrade_url', 'https://animicro.com/' ),
		] );

		wp_add_inline_script( 'animicro-admin', "window.animicroData = {$data};", 'before' );

		$this->admin_assets_enqueued = true;
	}

	/**
	 * Pick Vite manifest entry (stable key or first isEntry).
	 *
	 * @param array<string, mixed> $manifest Decoded manifest.
	 * @return array<string, mixed>|null
	 */
	private function resolve_vite_entry( array $manifest, string $preferred_key ): ?array {
		if ( isset( $manifest[ $preferred_key ] ) && is_array( $manifest[ $preferred_key ] ) ) {
			return $manifest[ $preferred_key ];
		}
		foreach ( $manifest as $item ) {
			if ( is_array( $item ) && ! empty( $item['isEntry'] ) && ! empty( $item['file'] ) ) {
				return $item;
			}
		}
		return null;
	}

	public function add_module_type( string $tag, string $handle, string $src ): string {
		if ( 'animicro-admin' !== $handle ) {
			return $tag;
		}
		if ( strpos( $tag, 'type="module"' ) !== false ) {
			return $tag;
		}
		return str_replace( '<script ', '<script type="module" ', $tag );
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

		if ( Animicro::is_pro_plugin() ) {
			register_rest_route( 'animicro/v1', '/license/status', [
				[
					'methods'             => 'GET',
					'callback'            => [ $this, 'get_license_status' ],
					'permission_callback' => [ $this, 'check_permission' ],
				],
			] );

			register_rest_route( 'animicro/v1', '/license/connect-url', [
				[
					'methods'             => 'GET',
					'callback'            => [ $this, 'get_connect_url' ],
					'permission_callback' => [ $this, 'check_permission' ],
				],
			] );

			register_rest_route( 'animicro/v1', '/license/disconnect', [
				[
					'methods'             => 'POST',
					'callback'            => [ $this, 'disconnect_license' ],
					'permission_callback' => [ $this, 'check_permission' ],
				],
			] );
		}
	}

	public function check_permission( ?\WP_REST_Request $request = null ): bool {
		if ( $request instanceof \WP_REST_Request && 'GET' !== $request->get_method() ) {
			$nonce = $request->get_header( 'x_wp_nonce' );
			if ( ! $nonce || ! wp_verify_nonce( $nonce, 'wp_rest' ) ) {
				return false;
			}
		}
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

		$is_premium = Animicro::is_pro_plugin()
			&& class_exists( 'Animicro_License_Manager' )
			&& Animicro_License_Manager::is_premium();

		if ( ! $is_premium ) {
			$clean['active_modules'] = array_values(
				array_filter(
					$clean['active_modules'],
					function ( $m ) {
						return ! Animicro::is_pro_module( $m );
					}
				)
			);
		}

		$raw_module_settings     = isset( $raw['module_settings'] ) && is_array( $raw['module_settings'] )
			? $raw['module_settings']
			: [];
		$default_module_settings = $defaults['module_settings'];
		$clean_module_settings   = [];

		foreach ( $default_module_settings as $module_id => $module_defaults ) {
			$raw_mod = $raw_module_settings[ $module_id ] ?? [];

			$entry = [
				'duration' => $this->clamp_float( $raw_mod['duration'] ?? null, 0, 10, (float) $module_defaults['duration'] ),
				'easing'   => $this->sanitize_easing( $raw_mod['easing'] ?? null, (string) $module_defaults['easing'] ),
				'delay'    => $this->clamp_float( $raw_mod['delay'] ?? null, 0, 10, (float) $module_defaults['delay'] ),
			];

			// Only sanitize margin if the module actually uses it. Page-level
			// transitions (page-fade, page-curtain) don't carry a margin in
			// their defaults — including one for them was triggering an
			// "Undefined index: margin" notice on save.
			if ( isset( $module_defaults['margin'] ) ) {
				$entry['margin'] = $this->sanitize_margin( $raw_mod['margin'] ?? null, (string) $module_defaults['margin'] );
			}

			if ( isset( $module_defaults['distance'] ) ) {
				$entry['distance'] = $this->clamp_float( $raw_mod['distance'] ?? null, -500, 500, (float) $module_defaults['distance'] );
			}
			if ( isset( $module_defaults['scale'] ) ) {
				$entry['scale'] = $this->clamp_float( $raw_mod['scale'] ?? null, 0, 3, (float) $module_defaults['scale'] );
			}
			if ( isset( $module_defaults['blur'] ) ) {
				$entry['blur'] = $this->clamp_float( $raw_mod['blur'] ?? null, 0, 50, (float) $module_defaults['blur'] );
			}
			if ( isset( $module_defaults['staggerDelay'] ) ) {
				$entry['staggerDelay'] = $this->clamp_float( $raw_mod['staggerDelay'] ?? null, 0, 5, (float) $module_defaults['staggerDelay'] );
			}
			if ( isset( $module_defaults['typingSpeed'] ) ) {
				$entry['typingSpeed'] = $this->clamp_float( $raw_mod['typingSpeed'] ?? null, 0.005, 2, (float) $module_defaults['typingSpeed'] );
			}
			if ( isset( $module_defaults['backSpeed'] ) ) {
				$entry['backSpeed'] = $this->clamp_float( $raw_mod['backSpeed'] ?? null, 0.005, 2, (float) $module_defaults['backSpeed'] );
			}
			if ( isset( $module_defaults['backDelay'] ) ) {
				$entry['backDelay'] = $this->clamp_float( $raw_mod['backDelay'] ?? null, 0, 10, (float) $module_defaults['backDelay'] );
			}
			if ( array_key_exists( 'loop', $module_defaults ) ) {
				$entry['loop'] = isset( $raw_mod['loop'] ) ? (bool) $raw_mod['loop'] : (bool) $module_defaults['loop'];
			}
			if ( array_key_exists( 'shuffle', $module_defaults ) ) {
				$entry['shuffle'] = isset( $raw_mod['shuffle'] ) ? (bool) $raw_mod['shuffle'] : (bool) $module_defaults['shuffle'];
			}
			if ( isset( $module_defaults['cursorChar'] ) ) {
				$raw_cursor = isset( $raw_mod['cursorChar'] ) ? sanitize_text_field( (string) $raw_mod['cursorChar'] ) : '';
				if ( '' === $raw_cursor ) {
					$raw_cursor = (string) $module_defaults['cursorChar'];
				}
				// Limit to 3 characters; fall back to default on empty/all-whitespace post-trim.
				$raw_cursor = function_exists( 'mb_substr' ) ? mb_substr( $raw_cursor, 0, 3 ) : substr( $raw_cursor, 0, 3 );
				$entry['cursorChar'] = '' === $raw_cursor ? (string) $module_defaults['cursorChar'] : $raw_cursor;
			}
			if ( array_key_exists( 'cursorPersist', $module_defaults ) ) {
				$entry['cursorPersist'] = isset( $raw_mod['cursorPersist'] ) ? (bool) $raw_mod['cursorPersist'] : (bool) $module_defaults['cursorPersist'];
			}
			if ( isset( $module_defaults['speed'] ) ) {
				$entry['speed'] = $this->clamp_float( $raw_mod['speed'] ?? null, -5, 5, (float) $module_defaults['speed'] );
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
				$entry['scrollStart'] = (int) $this->clamp_float( $raw_mod['scrollStart'] ?? null, 0, 100, (float) $module_defaults['scrollStart'] );
			}
			if ( isset( $module_defaults['scrollEnd'] ) ) {
				$entry['scrollEnd'] = (int) $this->clamp_float( $raw_mod['scrollEnd'] ?? null, 0, 100, (float) $module_defaults['scrollEnd'] );
			}
			if ( isset( $module_defaults['amplitude'] ) ) {
				$entry['amplitude'] = $this->clamp_float( $raw_mod['amplitude'] ?? null, 1, 100, (float) $module_defaults['amplitude'] );
			}
			if ( isset( $module_defaults['scaleMax'] ) ) {
				$entry['scaleMax'] = $this->clamp_float( $raw_mod['scaleMax'] ?? null, 1, 2, (float) $module_defaults['scaleMax'] );
			}
			if ( isset( $module_defaults['skew'] ) ) {
				$entry['skew'] = $this->clamp_float( $raw_mod['skew'] ?? null, -45, 45, (float) $module_defaults['skew'] );
			}
			if ( isset( $module_defaults['zoomScale'] ) ) {
				$entry['zoomScale'] = $this->clamp_float( $raw_mod['zoomScale'] ?? null, 1.01, 2, (float) $module_defaults['zoomScale'] );
			}

			// Page Transitions (1.14.0): page-curtain has three module-specific
			// fields that the generic loop above doesn't know about. Without
			// these branches the user's settings for direction / bgColor /
			// logoUrl were silently dropped on every save and the curtain
			// always rendered with the defaults.
			if ( isset( $module_defaults['direction'] ) ) {
				$allowed_directions = [ 'fade', 'slide-up', 'slide-down' ];
				$raw_direction      = isset( $raw_mod['direction'] ) ? (string) $raw_mod['direction'] : (string) $module_defaults['direction'];
				$entry['direction'] = in_array( $raw_direction, $allowed_directions, true )
					? $raw_direction
					: (string) $module_defaults['direction'];
			}
			if ( array_key_exists( 'bgColor', $module_defaults ) ) {
				$raw_bg          = isset( $raw_mod['bgColor'] ) ? (string) $raw_mod['bgColor'] : (string) $module_defaults['bgColor'];
				$sanitized_bg    = sanitize_hex_color( $raw_bg );
				$entry['bgColor'] = $sanitized_bg ?: (string) $module_defaults['bgColor'];
			}
			if ( array_key_exists( 'logoUrl', $module_defaults ) ) {
				$raw_logo         = isset( $raw_mod['logoUrl'] ) ? (string) $raw_mod['logoUrl'] : '';
				$entry['logoUrl'] = '' === $raw_logo ? '' : esc_url_raw( $raw_logo );
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
				'duration' => $this->clamp_float( $raw_mod['duration'] ?? null, 0, 10, 0.6 ),
				'easing'   => $this->sanitize_easing( $raw_mod['easing'] ?? null, 'ease-out' ),
				'delay'    => $this->clamp_float( $raw_mod['delay'] ?? null, 0, 10, 0.0 ),
				'margin'   => $this->sanitize_margin( $raw_mod['margin'] ?? null, '-50px 0px' ),
			];
		}

		$clean['module_settings'] = $clean_module_settings;

		$default_smooth = $defaults['smooth_scroll'] ?? [];
		$raw_smooth     = isset( $raw['smooth_scroll'] ) && is_array( $raw['smooth_scroll'] ) ? $raw['smooth_scroll'] : [];

		$clean['smooth_scroll'] = [
			'enabled'         => isset( $raw_smooth['enabled'] )         ? (bool) $raw_smooth['enabled']   : ( $default_smooth['enabled'] ?? false ),
			'lerp'            => $this->clamp_float( $raw_smooth['lerp'] ?? null, 0, 1, (float) ( $default_smooth['lerp'] ?? 0.1 ) ),
			'duration'        => $this->clamp_float( $raw_smooth['duration'] ?? null, 0, 10, (float) ( $default_smooth['duration'] ?? 1.2 ) ),
			'smoothWheel'     => isset( $raw_smooth['smoothWheel'] )     ? (bool) $raw_smooth['smoothWheel'] : ( $default_smooth['smoothWheel'] ?? true ),
			'wheelMultiplier' => $this->clamp_float( $raw_smooth['wheelMultiplier'] ?? null, 0, 10, (float) ( $default_smooth['wheelMultiplier'] ?? 1.0 ) ),
			'anchors'         => isset( $raw_smooth['anchors'] )         ? (bool) $raw_smooth['anchors']     : ( $default_smooth['anchors'] ?? true ),
		];

		$default_advanced = $defaults['advanced'] ?? [];
		$raw_advanced     = isset( $raw['advanced'] ) && is_array( $raw['advanced'] ) ? $raw['advanced'] : [];

		$clean['advanced'] = [
			'reducedMotion' => isset( $raw_advanced['reducedMotion'] ) ? (bool) $raw_advanced['reducedMotion'] : ( $default_advanced['reducedMotion'] ?? true ),
			'debugMode'     => isset( $raw_advanced['debugMode'] )     ? (bool) $raw_advanced['debugMode']     : ( $default_advanced['debugMode'] ?? false ),
		];

		update_option( 'animicro_settings', $clean );

		return new \WP_REST_Response( $clean, 200 );
	}

	public function get_license_status(): \WP_REST_Response {
		$manager = new Animicro_License_Manager();

		$is_dev         = $manager->is_dev_mode();
		$has_connection = $manager->has_connection();
		$license_data   = $manager->get_license_data();
		$connect_error  = $manager->consume_connect_error();

		$state = $is_dev ? 'dev' : ( $has_connection ? 'connected' : 'disconnected' );

		return new \WP_REST_Response( [
			'state'          => $state,
			'is_premium'     => Animicro_License_Manager::is_premium(),
			'is_dev'         => $is_dev,
			'has_connection' => $has_connection,
			'connection_id'  => $manager->get_connection_id(),
			'plan'           => $license_data['plan'] ?? null,
			'expires_at'     => $license_data['expires_at'] ?? null,
			'sites'          => $license_data['sites'] ?? null,
			'connect_error'  => empty( $connect_error ) ? null : [
				'reason'  => $connect_error['reason'] ?? 'unknown',
				'message' => $manager->get_error_message( $connect_error['reason'] ?? 'server_error' ),
			],
		], 200 );
	}

	public function get_connect_url(): \WP_REST_Response {
		$manager = new Animicro_License_Manager();
		return new \WP_REST_Response( [ 'url' => $manager->get_connect_url() ], 200 );
	}

	public function disconnect_license(): \WP_REST_Response {
		$manager = new Animicro_License_Manager();
		$manager->clear_connection();

		// Hint the user that the seat is still occupied on the server until
		// they revoke from the dashboard.
		set_transient( 'animicro_show_revoke_notice', '1', MINUTE_IN_SECONDS );

		return new \WP_REST_Response( [ 'success' => true ], 200 );
	}

	private function sanitize_margin( $value, string $fallback ): string {
		if ( ! is_string( $value ) ) {
			return $fallback;
		}
		$trimmed = trim( $value );
		// 1–4 space-separated values, each "[-]?\d+(.\d+)?(px|em|rem|%|vh|vw)?" or plain "0".
		if ( preg_match( '/^(-?\d+(\.\d+)?(px|em|rem|%|vh|vw)?\s*){1,4}$/', $trimmed ) ) {
			return $trimmed;
		}
		return $fallback;
	}

	private function clamp_float( $value, float $min, float $max, float $fallback ): float {
		if ( ! is_numeric( $value ) ) {
			return $fallback;
		}
		return max( $min, min( $max, (float) $value ) );
	}

	private function sanitize_easing( $value, string $fallback ): string {
		$allowed = [ 'linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out' ];
		return is_string( $value ) && in_array( $value, $allowed, true ) ? $value : $fallback;
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
