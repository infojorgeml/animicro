<?php
/**
 * Animicro Uninstall
 *
 * Fires when the plugin is DELETED from WP admin (not on deactivation).
 * Removes all plugin data from the database.
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

delete_option( 'animicro_settings' );

// Leftovers from the licensing system used by Animicro Pro (≤ 1.x), for sites
// that switched from Pro to the free 2.0.
$animicro_legacy_options = [
	'animicro_license_key',
	'animicro_license_data',
	'animicro_premium_active',
	'animicro_connection_id',
	'animicro_connection_secret',
	'animicro_pending_reconnect',
];
foreach ( $animicro_legacy_options as $animicro_option ) {
	delete_option( $animicro_option );
}

$animicro_legacy_transients = [
	'animicro_license_check',
	'animicro_license_last_check',
	'animicro_connect_error',
	'animicro_show_revoke_notice',
	'animicro_pro_deactivated_free',
];
foreach ( $animicro_legacy_transients as $animicro_transient ) {
	delete_transient( $animicro_transient );
}
