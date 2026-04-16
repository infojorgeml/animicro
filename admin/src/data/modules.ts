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

export const DEFAULT_SCALE_CONFIG: ModuleConfig = {
  duration: 0.6,
  easing: 'ease-out',
  delay: 0,
  margin: '-50px 0px',
  scale: 0.95,
};

export const DEFAULT_HIGHLIGHT_CONFIG: ModuleConfig = {
  duration: 0.8,
  easing: 'ease-out',
  delay: 0,
  margin: '-50px 0px',
  highlightColor: '#fde68a',
  highlightDirection: 'left',
};

export const DEFAULT_TYPEWRITER_CONFIG: ModuleConfig = {
  duration: 0.6,
  easing: 'ease-out',
  delay: 0,
  margin: '-50px 0px',
  typingSpeed: 0.06,
};

export type ModuleCategory = 'entry' | 'text';

export interface ModuleInfo {
  id: string;
  name: string;
  description: string;
  cssClass: string;
  category: ModuleCategory;
}

export const MODULE_CATEGORIES: { id: ModuleCategory; label: string; description: string }[] = [
  { id: 'entry',  label: 'Entry Animations',   description: 'Triggered once when the element enters the viewport' },
  { id: 'text',   label: 'Text',               description: 'Typography-specific animations' },
];

export const MODULE_INFO: ModuleInfo[] = [
  { id: 'fade',       name: 'Fade',       description: 'Smooth appearance with opacity',                            cssClass: '.am-fade',       category: 'entry' },
  { id: 'scale',      name: 'Scale',      description: 'Scales from small to full size',                            cssClass: '.am-scale',      category: 'entry' },
  { id: 'slide-up',   name: 'Slide Up',   description: 'Slides up when appearing',                                  cssClass: '.am-slide-up',   category: 'entry' },
  { id: 'slide-down', name: 'Slide Down', description: 'Slides down when appearing',                                cssClass: '.am-slide-down', category: 'entry' },
  { id: 'highlight',  name: 'Highlight',  description: 'Animated marker highlight behind text',                     cssClass: '.am-highlight',  category: 'text' },
  { id: 'typewriter', name: 'Typewriter', description: 'Types text character by character with a blinking cursor',  cssClass: '.am-typewriter', category: 'text' },
];

export interface DataAttribute {
  attribute: string;
  type: string;
  defaultValue: string;
  usedBy: string;
}

export const DATA_ATTRIBUTES: DataAttribute[] = [
  { attribute: 'data-am-duration',            type: 'float (s)',        defaultValue: '0.6',       usedBy: 'All' },
  { attribute: 'data-am-delay',               type: 'float (s)',        defaultValue: '0',         usedBy: 'All' },
  { attribute: 'data-am-easing',              type: 'string',           defaultValue: 'ease-out',  usedBy: 'All' },
  { attribute: 'data-am-margin',              type: 'string',           defaultValue: '-50px 0px', usedBy: 'All' },
  { attribute: 'data-am-distance',            type: 'float (px)',       defaultValue: '30',        usedBy: 'slide-up, slide-down' },
  { attribute: 'data-am-scale',               type: 'float',            defaultValue: '0.95',      usedBy: 'scale' },
  { attribute: 'data-am-typing-speed',        type: 'float (s)',        defaultValue: '0.06',      usedBy: 'typewriter' },
  { attribute: 'data-am-highlight-color',     type: 'string (hex)',     defaultValue: '#fde68a',   usedBy: 'highlight' },
  { attribute: 'data-am-highlight-direction', type: 'string',           defaultValue: 'left',      usedBy: 'highlight' },
];

export interface EasingOption {
  value: string;
  label: string;
  description?: string;
}

export const EASING_OPTIONS: EasingOption[] = [
  { value: 'ease-out',                       label: 'Ease Out',        description: 'Fast at start, slows at end — Recommended' },
  { value: 'ease-in-out',                    label: 'Ease In Out',     description: 'Smooth start and stop' },
  { value: 'linear',                         label: 'Linear',          description: 'Constant speed' },
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
