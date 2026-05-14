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
		// Spin doesn't need an initial-hide — the element starts visible
		// in its natural position and rotates from there each frame.
		'spin'          => '',
		// Magnetic doesn't need an initial-hide — the element starts in
		// its natural position and translates from there when the cursor
		// approaches.
		'magnetic'      => '',
		// Custom cursor: special-cased in get_editor_css() below — it
		// emits the styles for the floating #am-cursor element + a
		// `body.am-cursor-active { cursor: none }` rule that hides the
		// native cursor while the module is active.
		'cursor'        => '',
		// Clip-reveal: critical inline rule clips the element entirely
		// (inset 100% = nothing visible) until Motion's animate() writes
		// the first inline clip-path frame, sliding from the variant's
		// `from` state to `inset(0)` / `circle(150%)`. Special-cased in
		// get_editor_css() below to also emit the reduced-motion + no-JS
		// fallbacks so the image stays visible if either applies.
		'clip-reveal'   => 'clip-path:inset(100%);will-change:clip-path;',
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

			// Clip-reveal (1.19.0): the element is fully clipped at first
			// paint (`clip-path: inset(100%)`) so the animation can start
			// from any of the seven shape variants without flashing the
			// intermediate state. JS overrides the inline clip-path when
			// Motion's animate() begins. Safety nets via media queries:
			// if the visitor opted into reduced motion, or if scripting
			// is disabled (so JS never runs), force `clip-path: none` so
			// the image stays visible instead of being permanently hidden.
			if ( 'clip-reveal' === $module ) {
				$cr_css = self::MODULE_INITIAL_CSS['clip-reveal'] ?? '';
				if ( $cr_css ) {
					$rules[] = "{$prefix} .am-clip-reveal{{$cr_css}}";
					$rules[] = '@media (prefers-reduced-motion: reduce){.am-clip-reveal{clip-path:none!important;}}';
					$rules[] = '@media (scripting: none){.am-clip-reveal{clip-path:none!important;}}';
				}
				continue;
			}

			// Custom Cursor (1.21.0): emit the static styles for the
			// floating #am-cursor element plus the `cursor: none` rule on
			// the body when the module is active. Text inputs keep their
			// I-beam (cursor: text) for form usability — without that
			// exception, typing in an input feels broken because the
			// cursor "disappears" inside the field.
			if ( 'cursor' === $module ) {
				$rules[] = 'body.am-cursor-active{cursor:none!important;}';
				$rules[] = 'body.am-cursor-active input[type="text"],body.am-cursor-active input[type="email"],body.am-cursor-active input[type="password"],body.am-cursor-active input[type="search"],body.am-cursor-active input[type="url"],body.am-cursor-active input[type="tel"],body.am-cursor-active input[type="number"],body.am-cursor-active textarea{cursor:text!important;}';
				$rules[] = '#am-cursor{position:fixed;top:0;left:0;width:12px;height:12px;background:#000;border-radius:50%;pointer-events:none;z-index:999999999;transform:translate(-50%,-50%);transition:width 0.3s cubic-bezier(0.25,1,0.5,1),height 0.3s cubic-bezier(0.25,1,0.5,1),background-color 0.3s,backdrop-filter 0.3s;display:flex;align-items:center;justify-content:center;color:#fff;font-family:sans-serif;font-weight:500;font-size:0;overflow:hidden;will-change:transform,width,height,top,left;}';
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
