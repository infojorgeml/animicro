<?php
/**
 * LicenSuite SDK for WordPress — admin "License" screen.
 *
 * @licensuite-sdk-generated -- DO NOT EDIT. Synced from the Licensuite repo (sdk/wordpress); edit there and run sync.sh.
 *
 * Self-contained submenu page: paste-key form, activation status (plan,
 * expiry, seats), and key removal. Pairs with Animicro_License_Manager,
 * which must be loaded first. Wire it from the plugin bootstrap:
 *
 *     Animicro_License_Page::register( 'my-menu-slug', 'My Plugin' );
 *
 * Uses admin-post.php form handlers, so it works the same regardless of how
 * the host plugin builds its own settings screens (Settings API, REST, AJAX).
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Animicro_License_Page {

	/** @var array{parent:string, name:string, cap:string, slug:string} */
	private static array $config = [];

	/**
	 * Wire the submenu + form handlers. Call once from the plugin bootstrap,
	 * before `admin_menu` fires (e.g. on `plugins_loaded`).
	 *
	 * @param string $parent_slug Slug of the plugin's top-level admin menu.
	 * @param string $plugin_name Human name, shown in the page title.
	 * @param string $capability  Capability required to manage the license.
	 */
	public static function register( string $parent_slug, string $plugin_name, string $capability = 'manage_options' ): void {
		if ( ! empty( self::$config ) ) {
			return;
		}

		self::$config = [
			'parent' => $parent_slug,
			'name'   => $plugin_name,
			'cap'    => $capability,
			'slug'   => $parent_slug . '-license',
		];

		// Priority 20: the host plugin registers its top-level menu at the
		// default 10, and a submenu needs its parent to exist first.
		add_action( 'admin_menu', [ __CLASS__, 'add_menu' ], 20 );
		add_action( 'admin_post_animicro_license_activate', [ __CLASS__, 'handle_activate' ] );
		add_action( 'admin_post_animicro_license_deactivate', [ __CLASS__, 'handle_deactivate' ] );
	}

	public static function add_menu(): void {
		add_submenu_page(
			self::$config['parent'],
			/* translators: %s: plugin name. */
			sprintf( __( '%s License', 'animicro' ), self::$config['name'] ),
			__( 'License', 'animicro' ),
			self::$config['cap'],
			self::$config['slug'],
			[ __CLASS__, 'render' ]
		);
	}

	private static function page_url( array $args = [] ): string {
		return add_query_arg(
			array_merge( [ 'page' => self::$config['slug'] ], $args ),
			admin_url( 'admin.php' )
		);
	}

	// ------------------------------------------------------------------
	// Form handlers (admin-post.php)
	// ------------------------------------------------------------------

	public static function handle_activate(): void {
		if ( empty( self::$config ) || ! current_user_can( self::$config['cap'] ) ) {
			wp_die( esc_html__( 'You are not allowed to manage this license.', 'animicro' ) );
		}
		check_admin_referer( 'animicro_license_action' );

		$key    = isset( $_POST['license_key'] ) ? sanitize_text_field( wp_unslash( $_POST['license_key'] ) ) : '';
		$result = ( new Animicro_License_Manager() )->activate_with_key( $key );

		$notice = ! empty( $result['success'] ) ? 'activated' : ( $result['reason'] ?? 'server_error' );
		wp_safe_redirect( self::page_url( [ 'lic-notice' => rawurlencode( $notice ) ] ) );
		exit;
	}

	public static function handle_deactivate(): void {
		if ( empty( self::$config ) || ! current_user_can( self::$config['cap'] ) ) {
			wp_die( esc_html__( 'You are not allowed to manage this license.', 'animicro' ) );
		}
		check_admin_referer( 'animicro_license_action' );

		( new Animicro_License_Manager() )->deactivate_key();

		wp_safe_redirect( self::page_url( [ 'lic-notice' => 'removed' ] ) );
		exit;
	}

	// ------------------------------------------------------------------
	// Rendering
	// ------------------------------------------------------------------

	public static function render(): void {
		if ( ! current_user_can( self::$config['cap'] ) ) {
			return;
		}

		$manager = new Animicro_License_Manager();

		// is_premium() runs the (cached) validation and keeps the stored flag
		// in sync. Call it BEFORE reading license_data so plan / sites / reason
		// reflect the just-refreshed payload, not a stale one.
		$is_premium  = Animicro_License_Manager::is_premium();
		$has_license = $manager->has_license();
		$data        = $manager->get_license_data();

		echo '<div class="wrap licensuite-license-wrap">';
		echo '<h1>' . esc_html( sprintf( /* translators: %s: plugin name. */ __( '%s License', 'animicro' ), self::$config['name'] ) ) . '</h1>';

		self::render_notice();
		self::render_styles();

		if ( $has_license ) {
			self::render_status_card( $manager, $data, $is_premium );
		} else {
			self::render_activation_form();
		}

		echo '</div>';
	}

	/** One-shot admin notice driven by the redirect's lic-notice param. */
	private static function render_notice(): void {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- display-only feedback after our own nonce-checked redirect.
		$notice = isset( $_GET['lic-notice'] ) ? sanitize_key( wp_unslash( $_GET['lic-notice'] ) ) : '';
		if ( '' === $notice ) {
			return;
		}

		if ( 'activated' === $notice ) {
			echo '<div class="notice notice-success is-dismissible"><p>' . esc_html__( 'License activated. Enjoy!', 'animicro' ) . '</p></div>';
			return;
		}
		if ( 'removed' === $notice ) {
			echo '<div class="notice notice-info is-dismissible"><p>' . esc_html__( 'License key removed from this site.', 'animicro' ) . '</p></div>';
			return;
		}

		// Anything else is a failure reason from the manager; unknown values
		// map to its generic "Unknown error" message.
		$message = ( new Animicro_License_Manager() )->get_error_message( $notice );
		echo '<div class="notice notice-error is-dismissible"><p>' . esc_html( $message ) . '</p></div>';
	}

	private static function render_status_card( Animicro_License_Manager $manager, array $data, bool $is_premium ): void {
		$plan       = isset( $data['plan'] ) && is_array( $data['plan'] ) ? $data['plan'] : null;
		$plan_name  = $plan['name'] ?? '';
		$expires_at = isset( $data['expires_at'] ) && is_string( $data['expires_at'] ) ? $data['expires_at'] : '';
		$sites      = isset( $data['sites'] ) && is_array( $data['sites'] ) ? $data['sites'] : null;
		$reason     = isset( $data['reason'] ) ? (string) $data['reason'] : '';

		$state_class = $is_premium ? 'is-active' : 'is-blocked';
		$state_label = $is_premium
			? __( 'License active', 'animicro' )
			: __( 'License not active', 'animicro' );

		echo '<div class="licensuite-license-card ' . esc_attr( $state_class ) . '">';
		echo '<p class="licensuite-license-state"><span class="licensuite-license-dot"></span>' . esc_html( $state_label ) . '</p>';

		if ( ! $is_premium && '' !== $reason && 'ok' !== $reason ) {
			echo '<p class="licensuite-license-reason">' . esc_html( $manager->get_error_message( $reason ) ) . '</p>';
		}

		echo '<table class="licensuite-license-facts">';
		echo '<tr><th>' . esc_html__( 'License key', 'animicro' ) . '</th><td><code>' . esc_html( $manager->get_masked_key() ) . '</code></td></tr>';

		if ( '' !== $plan_name ) {
			echo '<tr><th>' . esc_html__( 'Plan', 'animicro' ) . '</th><td>' . esc_html( $plan_name ) . '</td></tr>';
		}

		if ( '' !== $expires_at ) {
			$timestamp = strtotime( $expires_at );
			$formatted = $timestamp ? date_i18n( get_option( 'date_format' ), $timestamp ) : $expires_at;
			echo '<tr><th>' . esc_html__( 'Expires', 'animicro' ) . '</th><td>' . esc_html( $formatted ) . '</td></tr>';
		} elseif ( $is_premium ) {
			echo '<tr><th>' . esc_html__( 'Expires', 'animicro' ) . '</th><td>' . esc_html__( 'Never', 'animicro' ) . '</td></tr>';
		}

		if ( $sites ) {
			$used = (int) ( $sites['used'] ?? 0 );
			echo '<tr><th>' . esc_html__( 'Sites', 'animicro' ) . '</th><td>';
			if ( ! empty( $sites['unlimited'] ) || ! isset( $sites['max'] ) ) {
				/* translators: %d: number of activated sites. */
				echo esc_html( sprintf( __( '%d in use (unlimited)', 'animicro' ), $used ) );
			} else {
				/* translators: 1: sites in use, 2: allowed maximum. */
				echo esc_html( sprintf( __( '%1$d of %2$d in use', 'animicro' ), $used, (int) $sites['max'] ) );
			}
			echo '</td></tr>';
		}

		echo '</table>';

		echo '<form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '" onsubmit="return window.confirm(' . esc_js( wp_json_encode( __( 'Remove the license key from this site? The seat is freed for another site.', 'animicro' ) ) ) . ');">';
		echo '<input type="hidden" name="action" value="animicro_license_deactivate" />';
		wp_nonce_field( 'animicro_license_action' );
		submit_button( __( 'Remove key', 'animicro' ), 'delete', 'submit', false );
		echo '</form>';

		echo '</div>';
	}

	private static function render_activation_form(): void {
		echo '<div class="licensuite-license-card">';
		echo '<p>' . esc_html__( 'Paste the license key from your purchase email to unlock Pro features on this site.', 'animicro' ) . '</p>';

		echo '<form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '">';
		echo '<input type="hidden" name="action" value="animicro_license_activate" />';
		wp_nonce_field( 'animicro_license_action' );

		echo '<input type="text" class="regular-text licensuite-license-input" name="license_key" value="" maxlength="39" autocomplete="off" spellcheck="false" placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX" /> ';
		submit_button( __( 'Activate', 'animicro' ), 'primary', 'submit', false );
		echo '</form>';
		echo '</div>';

		// Auto-format as the user types/pastes: uppercase, groups of 4, dashes.
		echo '<script>document.addEventListener("input",function(e){var el=e.target;if(!el.classList||!el.classList.contains("licensuite-license-input"))return;var v=el.value.toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,32);el.value=(v.match(/.{1,4}/g)||[]).join("-");});</script>';
	}

	private static function render_styles(): void {
		echo '<style>
			.licensuite-license-card{background:#fff;border:1px solid #c3c4c7;border-left-width:4px;border-radius:4px;box-shadow:0 1px 1px rgba(0,0,0,.04);padding:16px 20px;max-width:640px;margin-top:12px}
			.licensuite-license-card.is-active{border-left-color:#00a32a}
			.licensuite-license-card.is-blocked{border-left-color:#dba617}
			.licensuite-license-state{font-weight:600;font-size:14px;margin:0 0 8px}
			.licensuite-license-dot{display:inline-block;width:10px;height:10px;border-radius:50%;background:#c3c4c7;margin-right:8px}
			.is-active .licensuite-license-dot{background:#00a32a}
			.is-blocked .licensuite-license-dot{background:#dba617}
			.licensuite-license-reason{color:#8a6116;margin:0 0 8px}
			.licensuite-license-facts{border-collapse:collapse;margin:8px 0 16px}
			.licensuite-license-facts th{text-align:left;padding:4px 24px 4px 0;color:#646970;font-weight:400}
			.licensuite-license-facts td{padding:4px 0}
			.licensuite-license-input{font-family:Consolas,Monaco,monospace;letter-spacing:.5px;width:380px;max-width:100%}
		</style>';
	}
}
