import type { ModuleConfig } from '../types';

export const DEFAULT_FADE_CONFIG: ModuleConfig = {
  duration: 0.6,
  easing: 'ease-out',
  delay: 0,
  margin: '-50px 0px',
};

export const DEFAULT_SLIDE_UP_CONFIG: ModuleConfig = {
  duration: 0.6,
  easing: 'ease-out',
  delay: 0,
  margin: '-50px 0px',
  distance: 30,
};

export const DEFAULT_SLIDE_DOWN_CONFIG: ModuleConfig = {
  duration: 0.6,
  easing: 'ease-out',
  delay: 0,
  margin: '-50px 0px',
  distance: 30,
};

export const DEFAULT_SLIDE_RIGHT_CONFIG: ModuleConfig = {
  duration: 0.6,
  easing: 'ease-out',
  delay: 0,
  margin: '-50px 0px',
  distance: 30,
};

export const DEFAULT_SLIDE_LEFT_CONFIG: ModuleConfig = {
  duration: 0.6,
  easing: 'ease-out',
  delay: 0,
  margin: '-50px 0px',
  distance: 30,
};

export const DEFAULT_SCALE_CONFIG: ModuleConfig = {
  duration: 0.6,
  easing: 'ease-out',
  delay: 0,
  margin: '-50px 0px',
  scale: 0.95,
};

export const DEFAULT_BLUR_CONFIG: ModuleConfig = {
  duration: 0.6,
  easing: 'ease-out',
  delay: 0,
  margin: '-50px 0px',
  blur: 4,
};

export const DEFAULT_SPLIT_CONFIG: ModuleConfig = {
  duration: 0.6,
  easing: 'ease-out',
  delay: 0,
  margin: '-50px 0px',
  staggerDelay: 0.05,
  distance: 15,
};

export const DEFAULT_TEXT_REVEAL_CONFIG: ModuleConfig = {
  duration: 0.6,
  easing: 'ease-out',
  delay: 0,
  margin: '-50px 0px',
  staggerDelay: 0.12,
};

export const DEFAULT_TYPEWRITER_CONFIG: ModuleConfig = {
  duration: 0.6,
  easing: 'ease-out',
  delay: 0,
  margin: '-50px 0px',
  typingSpeed: 0.06,
  backSpeed: 0.03,
  backDelay: 1.5,
  loop: true,
  shuffle: false,
  cursorChar: '|',
  cursorPersist: true,
};

export const DEFAULT_STAGGER_CONFIG: ModuleConfig = {
  duration: 0.6,
  easing: 'ease-out',
  delay: 0,
  margin: '-50px 0px',
  staggerDelay: 0.1,
  distance: 20,
};

export const DEFAULT_GRID_REVEAL_CONFIG: ModuleConfig = {
  duration: 0.6,
  easing: 'ease-out',
  delay: 0,
  margin: '-50px 0px',
  staggerDelay: 0.08,
  distance: 20,
  origin: 'center',
};

export const DEFAULT_HIGHLIGHT_CONFIG: ModuleConfig = {
  duration: 0.8,
  easing: 'ease-out',
  delay: 0,
  margin: '-50px 0px',
  highlightColor: '#fde68a',
  highlightDirection: 'left',
};

export const DEFAULT_TEXT_FILL_SCROLL_CONFIG: ModuleConfig = {
  duration: 0.6,
  easing: 'linear',
  delay: 0,
  margin: '-50px 0px',
  colorBase: '#cccccc',
  colorFill: '#000000',
  scrollStart: 62,
  scrollEnd: 60,
};

export const DEFAULT_PARALLAX_CONFIG: ModuleConfig = {
  duration: 0.6,
  easing: 'linear',
  delay: 0,
  margin: '-50px 0px',
  speed: 0.5,
};

export const DEFAULT_FLOAT_CONFIG: ModuleConfig = {
  duration: 3,
  easing: 'ease-in-out',
  delay: 0,
  margin: '-50px 0px',
  amplitude: 12,
};

export const DEFAULT_PULSE_CONFIG: ModuleConfig = {
  duration: 1.5,
  easing: 'ease-in-out',
  delay: 0,
  margin: '-50px 0px',
  scaleMax: 1.05,
};

export const DEFAULT_SKEW_UP_CONFIG: ModuleConfig = {
  duration: 0.6,
  easing: 'ease-out',
  delay: 0,
  margin: '-50px 0px',
  distance: 40,
  skew: 5,
};

export type ModuleCategory = 'entry' | 'text' | 'group' | 'scroll' | 'continuous';

export interface ModuleInfo {
  id: string;
  name: string;
  description: string;
  cssClass: string;
  isPro: boolean;
  category: ModuleCategory;
}

export const MODULE_CATEGORIES: { id: ModuleCategory; label: string; description: string }[] = [
  { id: 'entry',      label: 'Entry Animations',     description: 'Triggered once when the element enters the viewport' },
  { id: 'continuous', label: 'Continuous (Infinite)', description: 'Infinite looping animations that play constantly, no scroll trigger' },
  { id: 'text',       label: 'Text',                 description: 'Typography-specific animations' },
  { id: 'group',      label: 'Groups & Layouts',     description: 'Animate containers and their children' },
  { id: 'scroll',     label: 'Scroll & Continuous',   description: 'Scroll-linked animations' },
];

export const MODULE_INFO: ModuleInfo[] = [
  // Entry Animations
  { id: 'fade',        name: 'Fade',        description: 'Smooth appearance with opacity',            cssClass: '.am-fade',        isPro: false, category: 'entry' },
  { id: 'scale',       name: 'Scale',       description: 'Scales from small to full size',            cssClass: '.am-scale',       isPro: false, category: 'entry' },
  { id: 'slide-up',    name: 'Slide Up',    description: 'Slides up when appearing',                  cssClass: '.am-slide-up',    isPro: false, category: 'entry' },
  { id: 'slide-down',  name: 'Slide Down',  description: 'Slides down when appearing',                cssClass: '.am-slide-down',  isPro: false, category: 'entry' },
  { id: 'slide-right', name: 'Slide Right', description: 'Slides in toward the right (from the left edge)',  cssClass: '.am-slide-right', isPro: false, category: 'entry' },
  { id: 'slide-left',  name: 'Slide Left',  description: 'Slides in toward the left (from the right edge)',  cssClass: '.am-slide-left',  isPro: false, category: 'entry' },
  { id: 'skew-up',     name: 'Skew Up',     description: 'Slides up with a slight skew that straightens as it stops', cssClass: '.am-skew-up', isPro: false, category: 'entry' },
  { id: 'blur',        name: 'Blur',        description: 'Blur that clears as it appears',            cssClass: '.am-blur',        isPro: true,  category: 'entry' },

  // Continuous (Infinite)
  { id: 'float',       name: 'Float',       description: 'Infinite soft up/down floating motion',     cssClass: '.am-float',       isPro: false, category: 'continuous' },
  { id: 'pulse',       name: 'Pulse',       description: 'Infinite gentle scale pulse — breathing-like', cssClass: '.am-pulse',    isPro: false, category: 'continuous' },

  // Text
  { id: 'split',        name: 'Split Text',   description: 'Splits and animates text by letters/words', cssClass: '.am-split-chars .am-split-words', isPro: true, category: 'text' },
  { id: 'text-reveal',  name: 'Text Reveal',  description: 'Reveals text line by line with a sliding mask', cssClass: '.am-text-reveal',  isPro: true, category: 'text' },
  { id: 'highlight',    name: 'Highlight',    description: 'Animated marker highlight behind text',                    cssClass: '.am-highlight',  isPro: false, category: 'text' },
  { id: 'typewriter',   name: 'Typewriter',   description: 'Types text character by character with a blinking cursor', cssClass: '.am-typewriter', isPro: false, category: 'text' },

  // Groups & Layouts
  { id: 'stagger',      name: 'Stagger',      description: 'Animates container children in sequence',   cssClass: '.am-stagger',      isPro: true, category: 'group' },
  { id: 'grid-reveal',  name: 'Grid Reveal',  description: 'Spatial animation that reveals grid items from a focal point', cssClass: '.am-grid-reveal', isPro: true, category: 'group' },

  // Scroll & Continuous
  { id: 'text-fill-scroll', name: 'Text Fill on Scroll', description: 'Fills text word by word as user scrolls', cssClass: '.am-text-fill-scroll', isPro: true, category: 'scroll' },
  { id: 'parallax',         name: 'Parallax',            description: 'Scroll-linked parallax movement',         cssClass: '.am-parallax',         isPro: true, category: 'scroll' },
];

export interface DataAttribute {
  attribute: string;
  type: string;
  defaultValue: string;
  usedBy: string;
}

export const DATA_ATTRIBUTES: DataAttribute[] = [
  { attribute: 'data-am-duration',  type: 'float (s)',     defaultValue: '0.6',       usedBy: 'All' },
  { attribute: 'data-am-delay',     type: 'float (s)',     defaultValue: '0',         usedBy: 'All' },
  { attribute: 'data-am-easing',    type: 'string',        defaultValue: 'ease-out',  usedBy: 'All' },
  { attribute: 'data-am-margin',    type: 'string',        defaultValue: '-50px 0px', usedBy: 'All' },
  { attribute: 'data-am-loop',       type: 'bool',          defaultValue: 'false (true for typewriter)', usedBy: 'fade, scale, slide-*, blur (opt-in); typewriter (on by default, cycle strings)' },
  { attribute: 'data-am-loop-mode',  type: 'string',        defaultValue: 'pingpong',  usedBy: 'fade, scale, slide-*, blur — pingpong | restart' },
  { attribute: 'data-am-loop-delay', type: 'float (s)',     defaultValue: '0',         usedBy: 'fade, scale, slide-*, blur — pause between iterations' },
  { attribute: 'data-am-distance',  type: 'float (px)',    defaultValue: '30',        usedBy: 'slide-up, slide-down, slide-right, slide-left, split, stagger, grid-reveal' },
  { attribute: 'data-am-scale',     type: 'float',         defaultValue: '0.95',      usedBy: 'scale' },
  { attribute: 'data-am-blur',      type: 'float (px)',    defaultValue: '4',         usedBy: 'blur' },
  { attribute: 'data-am-stagger',   type: 'float (s)',     defaultValue: '0.05',      usedBy: 'stagger, split, text-reveal, grid-reveal' },
  { attribute: 'data-am-speed',     type: 'float',         defaultValue: '0.5',       usedBy: 'parallax' },
  { attribute: 'data-am-typing-speed', type: 'float (s)',  defaultValue: '0.06',      usedBy: 'typewriter' },
  { attribute: 'data-am-back-speed',   type: 'float (s)',  defaultValue: '0.03',      usedBy: 'typewriter' },
  { attribute: 'data-am-back-delay',   type: 'float (s)',  defaultValue: '1.5',       usedBy: 'typewriter' },
  { attribute: 'data-am-prefix',       type: 'string',     defaultValue: '(empty)',   usedBy: 'typewriter' },
  { attribute: 'data-am-suffix',       type: 'string',     defaultValue: '(empty)',   usedBy: 'typewriter' },
  { attribute: 'data-am-strings',      type: 'JSON | pipes', defaultValue: '(element text)', usedBy: 'typewriter' },
  { attribute: 'data-am-shuffle',      type: 'bool',       defaultValue: 'false',     usedBy: 'typewriter' },
  { attribute: 'data-am-cursor',         type: 'string',    defaultValue: '|',         usedBy: 'typewriter' },
  { attribute: 'data-am-cursor-persist', type: 'bool',      defaultValue: 'true',      usedBy: 'typewriter' },
  { attribute: 'data-am-origin',       type: 'string',      defaultValue: 'center',    usedBy: 'grid-reveal' },
  { attribute: 'data-am-highlight-color',     type: 'hex / rgba / var(--…)', defaultValue: '#fde68a', usedBy: 'highlight' },
  { attribute: 'data-am-highlight-direction', type: 'string',                defaultValue: 'left',    usedBy: 'highlight' },
  { attribute: 'data-am-color-base',         type: 'hex / rgba / var(--…)', defaultValue: '#cccccc', usedBy: 'text-fill-scroll' },
  { attribute: 'data-am-color-fill',         type: 'hex / rgba / var(--…)', defaultValue: '#000000', usedBy: 'text-fill-scroll' },
  { attribute: 'data-am-scroll-start',       type: 'int (%)',      defaultValue: '62',      usedBy: 'text-fill-scroll' },
  { attribute: 'data-am-scroll-end',         type: 'int (%)',      defaultValue: '60',      usedBy: 'text-fill-scroll' },
  { attribute: 'data-am-amplitude',          type: 'float (px)',   defaultValue: '12',      usedBy: 'float' },
  { attribute: 'data-am-scale-max',          type: 'float',        defaultValue: '1.05',    usedBy: 'pulse' },
  { attribute: 'data-am-skew',               type: 'float (deg)',  defaultValue: '5',       usedBy: 'skew-up' },
];

export interface EasingOption {
  value: string;
  label: string;
  description?: string;
}

export const EASING_OPTIONS: EasingOption[] = [
  { value: 'ease-out',                       label: 'Ease Out',        description: 'Fast at start, slows at end — Recommended' },
  { value: 'ease-in-out',                    label: 'Ease In Out',     description: 'Smooth start and stop' },
  { value: 'linear',                         label: 'Linear',          description: 'Constant, ideal for parallax' },
  { value: 'cubic-bezier(0.25, 0.4, 0.25, 1)', label: 'Premium (Apple-like)', description: 'Smooth Apple-style curve' },
];

export interface MarginOption {
  value: string;
  label: string;
  description: string;
}

export const MARGIN_OPTIONS: MarginOption[] = [
  { value: '0px 0px',   label: 'Early',  description: 'Animates when touching the viewport edge' },
  { value: '-50px 0px', label: 'Normal', description: 'Waits slightly before entering viewport' },
  { value: '-10% 0px',  label: 'Late',   description: 'Waits until well inside the viewport' },
];
