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

delete_option( 'animicro_settings' );
delete_option( 'animicro_license_key' );
delete_option( 'animicro_license_data' );
delete_option( 'animicro_premium_active' );
delete_transient( 'animicro_license_check' );
delete_transient( 'animicro_license_last_check' );
