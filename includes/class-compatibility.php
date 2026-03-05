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
		'fade'       => 'opacity:0;',
		'slide-up'   => 'opacity:0;transform:translateY(20px);',
		'slide-down' => 'opacity:0;transform:translateY(-20px);',
		'scale'      => 'opacity:0;transform:scale(0.95);',
		'blur'       => 'opacity:0;filter:blur(4px);',
		'stagger'    => '',
		'parallax'   => '',
		'split'      => 'opacity:0;',
	];

	/**
	 * Builds a universal body:not() selector prefix that excludes
	 * ALL known builder editors and wp-admin at once.
	 */
	private static function get_universal_prefix(): string {
		$nots = ':not(.wp-admin)';
		foreach ( self::BUILDER_EDITOR_CLASSES as $class ) {
			$nots .= ':not(.' . $class . ')';
		}
		return 'body' . $nots;
	}

	/**
	 * Generate dynamic CSS rules for active modules.
	 * Uses the universal :not() chain — no builder selection needed.
	 */
	public static function get_editor_css( array $active_modules ): string {
		if ( empty( $active_modules ) ) {
			return '';
		}

		$prefix = self::get_universal_prefix();
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

		if ( empty( $rules ) ) {
			return '';
		}

		return implode( "\n", $rules ) . "\n";
	}

	public static function get_available_builders(): array {
		return [
			'none'       => __( 'Ninguno / Otro', 'animicro' ),
			'elementor'  => 'Elementor',
			'bricks'     => 'Bricks Builder',
			'breakdance' => 'Breakdance',
			'oxygen'     => 'Oxygen Builder',
			'gutenberg'  => 'Gutenberg',
		];
	}
}
