export interface ModuleInfo {
  id: string;
  name: string;
  description: string;
  cssClass: string;
  isPro: boolean;
}

export const MODULE_INFO: ModuleInfo[] = [
  { id: 'fade',       name: 'Fade',       description: 'Aparición suave con opacidad',              cssClass: '.am-fade',     isPro: false },
  { id: 'slide-up',   name: 'Slide Up',   description: 'Desliza hacia arriba al aparecer',          cssClass: '.am-slide-up', isPro: false },
  { id: 'slide-down', name: 'Slide Down', description: 'Desliza hacia abajo al aparecer',           cssClass: '.am-slide-down', isPro: false },
  { id: 'scale',      name: 'Scale',      description: 'Escala desde pequeño al tamaño real',       cssClass: '.am-scale',    isPro: false },
  { id: 'blur',       name: 'Blur',       description: 'Desenfoque que se aclara al aparecer',      cssClass: '.am-blur',     isPro: true },
  { id: 'stagger',    name: 'Stagger',    description: 'Anima hijos del contenedor en secuencia',   cssClass: '.am-stagger',  isPro: true },
  { id: 'parallax',   name: 'Parallax',   description: 'Movimiento parallax vinculado al scroll',   cssClass: '.am-parallax', isPro: true },
  { id: 'split',      name: 'Split Text', description: 'Divide y anima texto por letras/palabras',  cssClass: '.am-split',    isPro: true },
];

export interface DataAttribute {
  attribute: string;
  type: string;
  defaultValue: string;
  usedBy: string;
}

export const DATA_ATTRIBUTES: DataAttribute[] = [
  { attribute: 'data-duration',  type: 'float (s)',     defaultValue: '0.6',       usedBy: 'Todos' },
  { attribute: 'data-delay',     type: 'float (s)',     defaultValue: '0',         usedBy: 'Todos' },
  { attribute: 'data-easing',    type: 'string',        defaultValue: 'ease-out',  usedBy: 'Todos' },
  { attribute: 'data-margin',    type: 'string',        defaultValue: '-50px 0px', usedBy: 'Todos' },
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
  { value: 'ease-out',                       label: 'Ease Out',        description: 'Rápido al inicio, frena al final — Recomendado' },
  { value: 'ease-in-out',                    label: 'Ease In Out',     description: 'Arranque y freno suaves' },
  { value: 'linear',                         label: 'Linear',          description: 'Constante, ideal para parallax' },
  { value: 'cubic-bezier(0.25, 0.4, 0.25, 1)', label: 'Premium (Apple-like)', description: 'Curva suave tipo Apple' },
];

export interface MarginOption {
  value: string;
  label: string;
  description: string;
}

export const MARGIN_OPTIONS: MarginOption[] = [
  { value: '0px 0px',   label: 'Pronto', description: 'Se anima al tocar el borde de la pantalla' },
  { value: '-50px 0px', label: 'Normal', description: 'Espera a entrar un poco en pantalla' },
  { value: '-10% 0px',  label: 'Tarde',  description: 'Espera a estar bien dentro de la pantalla' },
];
