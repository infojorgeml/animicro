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
