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
		'scale'       => 'opacity:0;transform:scale(0.95);will-change:opacity,transform;',
		'blur'       => 'opacity:0;filter:blur(4px);will-change:opacity,transform,filter;',
		'stagger'    => 'opacity:0;transform:translateY(20px);will-change:opacity,transform;',
		'grid-reveal' => 'opacity:0;transform:translateY(20px);will-change:opacity,transform;',
		'highlight'        => '',
		'text-fill-scroll' => '',
		'parallax'         => '',
		'split-chars' => 'opacity:0;will-change:opacity,transform;',
		'split-words' => 'opacity:0;will-change:opacity,transform;',
		'text-reveal' => 'opacity:0;will-change:opacity,transform;',
		'typewriter'  => 'opacity:0;',
	];

	/**
	 * Returns the body selector that targets only the real frontend.
	 *
	 * When builders are selected, we chain body:not(.editor-class) for each
	 * so elements stay visible inside those editors but hide on the live page.
	 *
	 * When "none" is selected, we chain :not() for ALL known editors + wp-admin.
	 */
	private static function get_frontend_selector( array $active_builders ): string {
		$active_builders = array_filter( $active_builders, 'is_string' );

		if ( empty( $active_builders ) || in_array( 'none', $active_builders, true ) ) {
			$nots = ':not(.wp-admin)';
			foreach ( self::BUILDER_EDITOR_CLASSES as $class ) {
				$nots .= ':not(.' . $class . ')';
			}
			return 'body' . $nots;
		}

		$nots = '';
		foreach ( $active_builders as $id ) {
			if ( isset( self::BUILDER_EDITOR_CLASSES[ $id ] ) ) {
				$nots .= ':not(.' . self::BUILDER_EDITOR_CLASSES[ $id ] . ')';
			}
		}

		return $nots ? 'body' . $nots : 'body:not(.wp-admin)';
	}

	/**
	 * Generate inline CSS rules for active modules.
	 * Injected in <head> for instant load (no flicker).
	 */
	public static function get_editor_css( array $active_modules, array $active_builders = [] ): string {
		if ( empty( $active_modules ) ) {
			return '';
		}

		$prefix = self::get_frontend_selector( $active_builders );
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

	public static function get_available_builders(): array {
		return [
			'none'       => __( 'None / Other', 'animicro' ),
			'elementor'  => 'Elementor',
			'bricks'     => 'Bricks Builder',
			'breakdance' => 'Breakdance',
			'oxygen'     => 'Oxygen Builder',
			'divi'       => 'Divi',
			'gutenberg'  => 'Gutenberg',
		];
	}
}
