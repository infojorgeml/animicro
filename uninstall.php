<?php
/**
 * Animicro Uninstall
 *
 * Fires when the plugin is DELETED from WP admin (not on deactivation).
 * Frees the activated seat on the LicenSuite server (best-effort) and removes
 * all plugin data from the database.
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

// Best-effort: release this site's seat on the server before wiping the stored
// key. The license-key flow CAN self-deactivate (unlike the old Connect flow),
// so this frees the seat for another site automatically. Any failure is safe
// to ignore — the user can also remove the site from their dashboard. The free
// build ships without this file's dependency, so the readable check guards it.
$animicro_license_manager = __DIR__ . '/includes/licensing/class-license-manager.php';
if ( is_readable( $animicro_license_manager ) ) {
	require_once $animicro_license_manager;
	if ( class_exists( 'Animicro_License_Manager' ) ) {
		Animicro_License_Manager::release_seat_for_uninstall();
	}
}

// License-key storage
delete_option( 'animicro_license_key' );

// Legacy v3 Connect storage (cleaned for installs upgrading from older versions)
delete_option( 'animicro_connection_id' );
delete_option( 'animicro_connection_secret' );
delete_option( 'animicro_pending_reconnect' );

// Shared state
delete_option( 'animicro_settings' );
delete_option( 'animicro_license_data' );
delete_option( 'animicro_premium_active' );
delete_transient( 'animicro_license_check' );
delete_transient( 'animicro_license_last_check' );
delete_transient( 'animicro_connect_error' );
delete_transient( 'animicro_show_revoke_notice' );
