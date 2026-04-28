<?php
/**
 * Animicro Uninstall
 *
 * Fires when the plugin is deleted from WP admin.
 * Removes all plugin data from the database.
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

// LicenSuite v2: release the seat held by this domain on the licence server
// before we wipe the local options. The free build does not ship the licence
// manager file, so its mere presence is the "is this Pro?" signal here (the
// main plugin file is not loaded during uninstall, so ANIMICRO_PRO is not
// defined). Best-effort: if the request fails we still proceed with the
// option cleanup so the user can always delete the plugin cleanly.
$license_manager_file = __DIR__ . '/includes/class-license-manager.php';
if ( is_readable( $license_manager_file ) ) {
	require_once $license_manager_file;
	if ( class_exists( 'Animicro_License_Manager' ) ) {
		$license_manager = new Animicro_License_Manager();
		$license_manager->deactivate_license( null, false );
	}
}

delete_option( 'animicro_settings' );
delete_option( 'animicro_license_key' );
delete_option( 'animicro_license_data' );
delete_option( 'animicro_premium_active' );
delete_transient( 'animicro_license_check' );
delete_transient( 'animicro_license_last_check' );
