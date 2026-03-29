<?php
/**
 * Plugin Name:       Animicro
 * Description:       Utility-first micro-animations for WordPress. Simple CSS classes, extreme performance.
 * Version:           1.0.1
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

define( 'ANIMICRO_VERSION', '1.0.1' );
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
