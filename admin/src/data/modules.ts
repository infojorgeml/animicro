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
};

export const DEFAULT_STAGGER_CONFIG: ModuleConfig = {
  duration: 0.6,
  easing: 'ease-out',
  delay: 0,
  margin: '-50px 0px',
  staggerDelay: 0.1,
  distance: 20,
};

export type ModuleCategory = 'entry' | 'text' | 'group' | 'scroll';

export interface ModuleInfo {
  id: string;
  name: string;
  description: string;
  cssClass: string;
  isPro: boolean;
  category: ModuleCategory;
  isPlaceholder?: boolean;
}

export const MODULE_CATEGORIES: { id: ModuleCategory; label: string; description: string }[] = [
  { id: 'entry',  label: 'Entry Animations',   description: 'Triggered once when the element enters the viewport' },
  { id: 'text',   label: 'Text',               description: 'Typography-specific animations' },
  { id: 'group',  label: 'Groups & Layouts',   description: 'Animate containers and their children' },
  { id: 'scroll', label: 'Scroll & Continuous', description: 'Scroll-linked animations' },
];

export const MODULE_INFO: ModuleInfo[] = [
  // Entry Animations
  { id: 'fade',        name: 'Fade',        description: 'Smooth appearance with opacity',            cssClass: '.am-fade',        isPro: false, category: 'entry' },
  { id: 'scale',       name: 'Scale',       description: 'Scales from small to full size',            cssClass: '.am-scale',       isPro: false, category: 'entry' },
  { id: 'slide-up',    name: 'Slide Up',    description: 'Slides up when appearing',                  cssClass: '.am-slide-up',    isPro: false, category: 'entry' },
  { id: 'slide-down',  name: 'Slide Down',  description: 'Slides down when appearing',                cssClass: '.am-slide-down',  isPro: false, category: 'entry' },
  { id: 'slide-right', name: 'Slide Right', description: 'Slides in from the left',                   cssClass: '.am-slide-right', isPro: true,  category: 'entry' },
  { id: 'slide-left',  name: 'Slide Left',  description: 'Slides in from the right',                  cssClass: '.am-slide-left',  isPro: true,  category: 'entry' },
  { id: 'blur',        name: 'Blur',        description: 'Blur that clears as it appears',            cssClass: '.am-blur',        isPro: true,  category: 'entry' },

  // Text
  { id: 'split',        name: 'Split Text',   description: 'Splits and animates text by letters/words', cssClass: '.am-split-chars .am-split-words', isPro: true, category: 'text' },
  { id: 'text-reveal',  name: 'Text Reveal',  description: 'Reveals text line by line with a sliding mask', cssClass: '.am-text-reveal',  isPro: true, category: 'text' },
  { id: 'highlight',    name: 'Highlight',    description: 'Animated highlight behind text',             cssClass: '.am-highlight',    isPro: true, category: 'text', isPlaceholder: true },
  { id: 'typewriter',   name: 'Typewriter',   description: 'Types text character by character with a blinking cursor', cssClass: '.am-typewriter', isPro: true, category: 'text' },

  // Groups & Layouts
  { id: 'stagger',      name: 'Stagger',      description: 'Animates container children in sequence',   cssClass: '.am-stagger',      isPro: true, category: 'group' },
  { id: 'grid-reveal',  name: 'Grid Reveal',  description: 'Reveals grid items with staggered entries',  cssClass: '.am-grid-reveal',  isPro: true, category: 'group', isPlaceholder: true },
  { id: 'list-reorder', name: 'List Reorder', description: 'Smooth reordering of list items',            cssClass: '.am-list-reorder', isPro: true, category: 'group', isPlaceholder: true },

  // Scroll & Continuous
  { id: 'parallax',        name: 'Parallax',        description: 'Scroll-linked parallax movement',       cssClass: '.am-parallax',        isPro: true, category: 'scroll' },
  { id: 'scroll-progress', name: 'Scroll Progress', description: 'Scrubbing animation tied to scroll',    cssClass: '.am-scroll-progress', isPro: true, category: 'scroll', isPlaceholder: true },
  { id: 'sticky-reveal',   name: 'Sticky Reveal',   description: 'Reveals content as it sticks on scroll', cssClass: '.am-sticky-reveal',   isPro: true, category: 'scroll', isPlaceholder: true },
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
  { attribute: 'data-am-distance',  type: 'float (px)',    defaultValue: '30',        usedBy: 'slide-up, slide-down, slide-right, slide-left, split, stagger' },
  { attribute: 'data-am-scale',     type: 'float',         defaultValue: '0.95',      usedBy: 'scale' },
  { attribute: 'data-am-blur',      type: 'float (px)',    defaultValue: '4',         usedBy: 'blur' },
  { attribute: 'data-am-stagger',   type: 'float (s)',     defaultValue: '0.05',      usedBy: 'stagger, split, text-reveal' },
  { attribute: 'data-am-speed',     type: 'float',         defaultValue: '0.5',       usedBy: 'parallax' },
  { attribute: 'data-am-typing-speed', type: 'float (s)',  defaultValue: '0.06',      usedBy: 'typewriter' },
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
