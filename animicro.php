<?php
/**
 * Plugin Name:       Animicro
 * Description:       Utility-first animations for WordPress. Simple CSS classes, extreme performance.
 * Version:           2.0.0
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Contributors:      jorgemml
 * Author:            Animicro
 * Author URI:        https://animicro.com
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       animicro
 * Domain Path:       /languages
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Another copy is already loaded — the legacy "Animicro Pro" plugin (animicro-pro/)
// that 2.0 replaces. It loads first (alphabetical order), and loading a second copy
// would redeclare the classes and fatal, so bail out. Activating this plugin
// deactivates the legacy one; both share the `animicro_settings` option, so every
// module and setting carries over.
if ( defined( 'ANIMICRO_VERSION' ) ) {
	register_activation_hook( __FILE__, function () {
		deactivate_plugins( 'animicro-pro/animicro.php', true );
		// Leftovers from the old licensing system.
		foreach ( [ 'animicro_license_key', 'animicro_license_data', 'animicro_premium_active' ] as $option ) {
			delete_option( $option );
		}
		delete_transient( 'animicro_license_check' );
		delete_transient( 'animicro_license_last_check' );
	} );
	add_action( 'admin_notices', function () {
		if ( ! current_user_can( 'activate_plugins' ) ) {
			return;
		}
		printf(
			'<div class="notice notice-warning"><p>%s</p></div>',
			esc_html__( 'Animicro Pro is no longer needed: Animicro is now 100% free with every module included. Deactivate and delete Animicro Pro — your modules and settings are kept.', 'animicro' )
		);
	} );
	return;
}

define( 'ANIMICRO_VERSION', '2.0.0' );
define( 'ANIMICRO_DIR', plugin_dir_path( __FILE__ ) );
define( 'ANIMICRO_URL', plugin_dir_url( __FILE__ ) );
define( 'ANIMICRO_BASENAME', plugin_basename( __FILE__ ) );

/**
 * PHP version check.
 */
if ( version_compare( PHP_VERSION, '7.4', '<' ) ) {
	add_action( 'admin_notices', function () {
		printf(
			'<div class="notice notice-error"><p>%s</p></div>',
			esc_html__( 'Animicro requires PHP 7.4 or higher.', 'animicro' )
		);
	} );
	return;
}

require_once ANIMICRO_DIR . 'includes/class-animicro.php';

register_activation_hook( __FILE__, [ 'Animicro', 'activate' ] );
register_deactivation_hook( __FILE__, [ 'Animicro', 'deactivate' ] );

add_action( 'plugins_loaded', [ 'Animicro', 'init' ] );
