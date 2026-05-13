<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Animicro_Compatibility {

	private const BUILDER_EDITOR_CLASSES = [
		'elementor'  => 'elementor-editor-active',
		'bricks'     => 'bricks-is-builder',
		'breakdance' => 'breakdance',
		'oxygen'     => 'oxygen-builder-body',
		'divi'       => 'et_pb_pagebuilder_layout',
		'gutenberg'  => 'block-editor-page',
	];

	private const MODULE_INITIAL_CSS = [
		'fade'       => 'opacity:0;will-change:opacity,transform;',
		'slide-up'   => 'opacity:0;transform:translateY(30px);will-change:opacity,transform;',
		'slide-down'  => 'opacity:0;transform:translateY(-30px);will-change:opacity,transform;',
		'slide-right' => 'opacity:0;transform:translateX(-30px);will-change:opacity,transform;',
		'slide-left'  => 'opacity:0;transform:translateX(30px);will-change:opacity,transform;',
		'skew-up'     => 'opacity:0;transform:translateY(40px) skewY(5deg);will-change:opacity,transform;',
		'scale'       => 'opacity:0;transform:scale(0.95);will-change:opacity,transform;',
		'float'       => '',
		'pulse'       => '',
		'blur'       => 'opacity:0;filter:blur(4px);will-change:opacity,transform,filter;',
		'stagger'    => 'opacity:0;transform:translateY(20px);will-change:opacity,transform;',
		'grid-reveal' => 'opacity:0;transform:translateY(20px);will-change:opacity,transform;',
		'highlight'        => '',
		'text-fill-scroll' => '',
		'parallax'         => '',
		'hover-zoom'       => '',
		'img-parallax'     => '',
		// Magnet doesn't need an initial-hide rule — the element starts
		// at its natural position and only translates from there.
		'magnet'           => '',
		'split-chars' => 'opacity:0;will-change:opacity,transform;',
		'split-words' => 'opacity:0;will-change:opacity,transform;',
		// Scatter mirrors split's two variants. Initial hide rules are
		// identical; the per-span random transform comes from JS at init.
		'scatter-chars' => 'opacity:0;will-change:opacity,transform;',
		'scatter-words' => 'opacity:0;will-change:opacity,transform;',
		// Scramble doesn't need an initial-hide — the text is already
		// rendered by the theme and we mutate textContent in place.
		'scramble'      => '',
		'text-reveal' => 'opacity:0;will-change:opacity,transform;',
		'typewriter'  => 'opacity:0;',
		// page-curtain doesn't use the regular `.am-NAME` descendant selector
		// pipeline — it's special-cased in get_editor_css() below because it
		// targets a globally-injected overlay div by ID.
		'page-curtain' => '',
	];

	/**
	 * Returns the body selector that targets only the real frontend.
	 *
	 * Chains `:not()` against every known builder editor body class +
	 * `wp-admin`, so the inline "hide initially" rules apply only on the
	 * live frontend, never inside an editor preview iframe that happens
	 * to reuse the same DOM.
	 *
	 * Note: this is defence-in-depth — `Animicro_Frontend::is_builder_editor()`
	 * already short-circuits the entire CSS injection when it detects a
	 * builder URL param, so this selector is what protects the case where
	 * URL detection would have missed (e.g. an unusual editor that doesn't
	 * touch the URL but does add a body class).
	 *
	 * Up to v1.12.x this selector was configurable via an "Integrations"
	 * admin tab where the user picked which builders they used. The toggle
	 * had no observable effect for normal users (URL detection covered all
	 * mainstream builders) and was removed in 1.13.0.
	 */
	private static function get_frontend_selector(): string {
		$nots = ':not(.wp-admin)';
		foreach ( self::BUILDER_EDITOR_CLASSES as $class ) {
			$nots .= ':not(.' . $class . ')';
		}
		return 'body' . $nots;
	}

	/**
	 * Generate inline CSS rules for active modules.
	 * Injected in <head> for instant load (no flicker).
	 */
	public static function get_editor_css( array $active_modules ): string {
		if ( empty( $active_modules ) ) {
			return '';
		}

		$prefix = self::get_frontend_selector();
		$rules  = [];

		foreach ( $active_modules as $module ) {
			$module = is_string( $module ) ? strtolower( $module ) : '';
			if ( ! preg_match( '/^[a-z0-9-]+$/', $module ) ) {
				continue;
			}

			if ( 'stagger' === $module ) {
				$stagger_css = self::MODULE_INITIAL_CSS['stagger'] ?? '';
				if ( $stagger_css ) {
					$rules[] = "{$prefix} .am-stagger>*{{$stagger_css}}";
					$rules[] = "{$prefix} .am-stagger.is-ready>*{opacity:1;transform:none;}";
				}
				continue;
			}

			if ( 'grid-reveal' === $module ) {
				$gr_css = self::MODULE_INITIAL_CSS['grid-reveal'] ?? '';
				if ( $gr_css ) {
					$rules[] = "{$prefix} .am-grid-reveal>*{{$gr_css}}";
					$rules[] = "{$prefix} .am-grid-reveal.is-ready>*{opacity:1;transform:none;}";
				}
				continue;
			}

			if ( 'typewriter' === $module ) {
				$tw_css = self::MODULE_INITIAL_CSS['typewriter'] ?? '';
				if ( $tw_css ) {
					$rules[] = "{$prefix} .am-typewriter{{$tw_css}}";
					$rules[] = "{$prefix} .am-typewriter.is-ready{opacity:1;}";
				}
				continue;
			}

			if ( 'text-reveal' === $module ) {
				$tr_css = self::MODULE_INITIAL_CSS['text-reveal'] ?? '';
				if ( $tr_css ) {
					$rules[] = "{$prefix} .am-text-reveal{{$tr_css}}";
					$rules[] = "{$prefix} .am-text-reveal.is-ready{opacity:1;}";
				}
				continue;
			}

			if ( 'split' === $module ) {
				$split_css = self::MODULE_INITIAL_CSS['split-chars'] ?? '';
				if ( $split_css ) {
					$rules[] = "{$prefix} .am-split-chars{{$split_css}}";
					$rules[] = "{$prefix} .am-split-words{{$split_css}}";
					$rules[] = "{$prefix} .am-split-chars.is-ready{opacity:1;}";
					$rules[] = "{$prefix} .am-split-words.is-ready{opacity:1;}";
				}
				continue;
			}

			if ( 'scatter' === $module ) {
				$sc_css = self::MODULE_INITIAL_CSS['scatter-chars'] ?? '';
				if ( $sc_css ) {
					$rules[] = "{$prefix} .am-scatter-chars{{$sc_css}}";
					$rules[] = "{$prefix} .am-scatter-words{{$sc_css}}";
					$rules[] = "{$prefix} .am-scatter-chars.is-ready{opacity:1;}";
					$rules[] = "{$prefix} .am-scatter-words.is-ready{opacity:1;}";
				}
				continue;
			}

			// Page-curtain: the overlay div #am-page-curtain is injected by
			// PHP via wp_body_open hook. The critical CSS here makes it
			// cover the viewport from the first paint. The JS module
			// animates it out and removes it from the DOM.
			//
			// `@media (scripting: none)` safety net: if JS is disabled, the
			// overlay would never animate away. Hide it entirely in that
			// media context so the page stays usable.
			if ( 'page-curtain' === $module ) {
				$rules[] = '#am-page-curtain{'
					. 'position:fixed;inset:0;z-index:999999;'
					. 'background:var(--am-curtain-bg,#000);'
					. 'pointer-events:none;'
					. 'display:flex;align-items:center;justify-content:center;'
					. '}';
				$rules[] = '#am-page-curtain img{max-width:200px;max-height:200px;width:auto;height:auto;}';
				$rules[] = '@media (scripting: none){#am-page-curtain{display:none!important;}}';
				continue;
			}

			$props = self::MODULE_INITIAL_CSS[ $module ] ?? '';

			if ( empty( $props ) ) {
				continue;
			}

			$class   = '.am-' . $module;
			$rules[] = "{$prefix} {$class}{{$props}}";
		}

		if ( empty( $rules ) ) {
			return '';
		}

		return implode( "\n", $rules ) . "\n";
	}

}
