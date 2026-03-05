export interface ModuleInfo {
  id: string;
  name: string;
  description: string;
  cssClass: string;
  isPro: boolean;
}

export const MODULE_INFO: ModuleInfo[] = [
  { id: 'fade',       name: 'Fade',       description: 'Smooth appearance with opacity',              cssClass: '.am-fade',     isPro: false },
  { id: 'slide-up',   name: 'Slide Up',   description: 'Slides up when appearing',                   cssClass: '.am-slide-up', isPro: false },
  { id: 'slide-down', name: 'Slide Down', description: 'Slides down when appearing',                  cssClass: '.am-slide-down', isPro: false },
  { id: 'scale',      name: 'Scale',      description: 'Scales from small to full size',               cssClass: '.am-scale',    isPro: false },
  { id: 'blur',       name: 'Blur',       description: 'Blur that clears as it appears',               cssClass: '.am-blur',     isPro: true },
  { id: 'stagger',    name: 'Stagger',    description: 'Animates container children in sequence',      cssClass: '.am-stagger',  isPro: true },
  { id: 'parallax',   name: 'Parallax',   description: 'Scroll-linked parallax movement',               cssClass: '.am-parallax', isPro: true },
  { id: 'split',      name: 'Split Text', description: 'Splits and animates text by letters/words',    cssClass: '.am-split',    isPro: true },
];

export interface DataAttribute {
  attribute: string;
  type: string;
  defaultValue: string;
  usedBy: string;
}

export const DATA_ATTRIBUTES: DataAttribute[] = [
  { attribute: 'data-duration',  type: 'float (s)',     defaultValue: '0.6',       usedBy: 'All' },
  { attribute: 'data-delay',     type: 'float (s)',     defaultValue: '0',         usedBy: 'All' },
  { attribute: 'data-easing',    type: 'string',        defaultValue: 'ease-out',  usedBy: 'All' },
  { attribute: 'data-margin',    type: 'string',        defaultValue: '-50px 0px', usedBy: 'All' },
  { attribute: 'data-distance',  type: 'float (px)',    defaultValue: '30',        usedBy: 'slide-up, slide-down' },
  { attribute: 'data-scale',     type: 'float',         defaultValue: '0.95',      usedBy: 'scale' },
  { attribute: 'data-blur',      type: 'float (px)',    defaultValue: '4',         usedBy: 'blur' },
  { attribute: 'data-stagger',   type: 'float (s)',     defaultValue: '0.1',       usedBy: 'stagger, split' },
  { attribute: 'data-speed',     type: 'float',         defaultValue: '0.5',       usedBy: 'parallax' },
  { attribute: 'data-split',     type: 'chars | words', defaultValue: 'chars',     usedBy: 'split' },
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
