<?php
/**
 * Plugin Name:       Animicro
 * Description:       Utility-first animations for WordPress. Simple CSS classes, extreme performance.
 * Version:           1.12.9
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

define( 'ANIMICRO_VERSION', '1.12.9' );
define( 'ANIMICRO_DIR', plugin_dir_path( __FILE__ ) );
define( 'ANIMICRO_URL', plugin_dir_url( __FILE__ ) );
define( 'ANIMICRO_BASENAME', plugin_basename( __FILE__ ) );

if ( ! defined( 'ANIMICRO_PRO' ) ) {
	define( 'ANIMICRO_PRO', false );
}

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

// Pro builds: wire up the GitHub Releases self-updater so installs receive
// the standard WP "Update available" notice. The free build does not ship
// includes/class-updater.php (stripped by scripts/build.sh) — free updates
// flow through wordpress.org as usual.
if ( ANIMICRO_PRO && is_readable( ANIMICRO_DIR . 'includes/class-updater.php' ) ) {
	require_once ANIMICRO_DIR . 'includes/class-updater.php';
	Animicro_Updater::init( __FILE__ );
}

register_activation_hook( __FILE__, [ 'Animicro', 'activate' ] );
register_deactivation_hook( __FILE__, [ 'Animicro', 'deactivate' ] );

add_action( 'plugins_loaded', [ 'Animicro', 'init' ] );
