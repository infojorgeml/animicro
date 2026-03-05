<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Animicro_Compatibility {

	private const BUILDER_EDITOR_CLASSES = [
		'elementor'  => 'elementor-editor-active',
		'bricks'     => 'bricks-is-builder',
		'breakdance' => 'breakdance-builder',
		'oxygen'     => 'oxygen-builder-body',
		'gutenberg'  => 'block-editor-page',
	];

	private const MODULE_INITIAL_CSS = [
		'fade'       => 'opacity:0;will-change:opacity,transform;',
		'slide-up'   => 'opacity:0;transform:translateY(20px);will-change:opacity,transform;',
		'slide-down' => 'opacity:0;transform:translateY(-20px);will-change:opacity,transform;',
		'scale'      => 'opacity:0;transform:scale(0.95);will-change:opacity,transform;',
		'blur'       => 'opacity:0;filter:blur(4px);will-change:opacity,transform,filter;',
		'stagger'    => '',
		'parallax'   => '',
		'split'      => 'opacity:0;will-change:opacity,transform;',
	];

	/**
	 * Returns the body selector that targets only the real frontend.
	 *
	 * When a builder is selected, we use body:not(.editor-class) so elements
	 * stay visible inside the editor but hide on the live page.
	 *
	 * When "none" is selected, we chain :not() for ALL known editors + wp-admin.
	 */
	private static function get_frontend_selector( string $active_builder ): string {
		if ( 'none' !== $active_builder && isset( self::BUILDER_EDITOR_CLASSES[ $active_builder ] ) ) {
			return 'body:not(.' . self::BUILDER_EDITOR_CLASSES[ $active_builder ] . ')';
		}
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
	public static function get_editor_css( array $active_modules, string $active_builder = 'none' ): string {
		if ( empty( $active_modules ) ) {
			return '';
		}

		$prefix = self::get_frontend_selector( sanitize_text_field( $active_builder ) );
		$rules  = [];

		foreach ( $active_modules as $module ) {
			$module = sanitize_text_field( $module );
			$props  = self::MODULE_INITIAL_CSS[ $module ] ?? '';

			if ( empty( $props ) ) {
				continue;
			}

			$class   = '.am-' . $module;
			$rules[] = "{$prefix} {$class}{{$props}}";
		}

		if ( in_array( 'split', $active_modules, true ) ) {
			$rules[] = "{$prefix} .am-split.is-ready{opacity:1;}";
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
			'gutenberg'  => 'Gutenberg',
		];
	}
}
