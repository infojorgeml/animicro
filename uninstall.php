<?php
/**
 * Animicro Uninstall
 *
 * Fires when the plugin is deleted from WP admin.
 * Removes all plugin data from the database.
 *
 * LicenSuite v3 note: there is no public self-revoke endpoint that accepts a
 * connection_secret yet, so we cannot release the seat on the server from
 * here. Users have to revoke their connection manually from the dashboard.
 * The local cleanup below is unconditional.
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

// v3 connection storage
delete_option( 'animicro_connection_id' );
delete_option( 'animicro_connection_secret' );
delete_option( 'animicro_pending_reconnect' );

// v2 leftovers (in case the user is uninstalling without ever reconnecting)
delete_option( 'animicro_license_key' );

// Shared state
delete_option( 'animicro_settings' );
delete_option( 'animicro_license_data' );
delete_option( 'animicro_premium_active' );
delete_transient( 'animicro_license_check' );
delete_transient( 'animicro_license_last_check' );
delete_transient( 'animicro_connect_error' );
delete_transient( 'animicro_show_revoke_notice' );
