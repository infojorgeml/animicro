<?php
/**
 * Animicro Pro — Self-update bridge to GitHub Releases.
 *
 * Pro builds ship this file. The Free build excludes it (see scripts/build.sh
 * and scripts/build_release_zip.py — both strip `class-updater.php` and the
 * vendored `lib/plugin-update-checker/` directory).
 *
 * How it works:
 *  1. A GitHub Action (.github/workflows/release-pro.yml) builds the Pro ZIP
 *     on every `v*` tag push and attaches `animicro-pro-X.Y.Z.zip` to a
 *     GitHub Release.
 *  2. The Pro plugin uses YahnisElsts/plugin-update-checker (vendored under
 *     includes/lib/plugin-update-checker/) to poll the public GitHub API
 *     once per day. When the released tag is newer than ANIMICRO_VERSION,
 *     PUC injects an entry into the `update_plugins` site transient.
 *  3. WordPress core renders the standard "Update available" notice in
 *     /wp-admin/plugins.php and downloads the asset on click — exactly like
 *     a wordpress.org plugin.
 *
 * Licence checks (LicenSuite v2) and update checks are intentionally
 * decoupled. Anyone can download the public ZIP, but Animicro_License_Manager
 * still gates the Pro modules at runtime — no valid licence, no Pro features.
 *
 * Local dev hosts: PUC ships with no built-in dev bypass, but a daily call
 * to the public GitHub API is harmless. We could add a short-circuit if it
 * ever becomes an issue.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Animicro_Updater {

	/**
	 * Public GitHub repository hosting the release artefacts. The repo is
	 * public on purpose: distribution is open, the licence enforces access
	 * to Pro features at runtime.
	 */
	const REPO_URL = 'https://github.com/infojorgeml/animicro/';

	/**
	 * Branch the updater reads metadata from. Releases are published from
	 * `main`; PUC uses this only for version-discovery fallbacks when no
	 * GitHub Release exists yet.
	 */
	const BRANCH = 'main';

	/**
	 * Regex matching the Pro release asset attached to each GitHub Release.
	 * The same Release also carries `animicro-X.Y.Z.zip` (free, archival)
	 * which we must not pick up — this regex is anchored to `pro` to be
	 * unambiguous.
	 */
	const ASSET_REGEX = '/^animicro-pro-\d+\.\d+\.\d+\.zip$/';

	/**
	 * WP plugin slug used by PUC for the transient key and the
	 * "View details" lightbox. Must be the directory name the plugin lives
	 * in once installed (set in scripts/build.sh: `animicro-pro/`).
	 */
	const PLUGIN_SLUG = 'animicro-pro';

	public static function init( string $plugin_main_file ): void {
		$loader = ANIMICRO_DIR . 'includes/lib/plugin-update-checker/plugin-update-checker.php';
		if ( ! is_readable( $loader ) ) {
			// Library missing — should never happen in a Pro build, but we
			// silently no-op so a misbuilt ZIP never breaks WP admin.
			return;
		}

		require_once $loader;

		// PUC ≥ 5 namespaces its factory under YahnisElsts\PluginUpdateChecker.
		if ( ! class_exists( '\YahnisElsts\PluginUpdateChecker\v5\PucFactory' ) ) {
			return;
		}

		$updater = \YahnisElsts\PluginUpdateChecker\v5\PucFactory::buildUpdateChecker(
			self::REPO_URL,
			$plugin_main_file,
			self::PLUGIN_SLUG
		);

		$updater->setBranch( self::BRANCH );

		// Tell PUC to download the matching Release asset (the built Pro
		// ZIP) instead of the raw GitHub source tarball. Without this the
		// updater would pull the whole monorepo, which is not installable.
		$api = $updater->getVcsApi();
		if ( method_exists( $api, 'enableReleaseAssets' ) ) {
			$api->enableReleaseAssets( self::ASSET_REGEX );
		}
	}
}
