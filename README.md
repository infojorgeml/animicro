# Animicro

Micro-animaciones utility-first para WordPress basadas en [Motion One](https://motion.dev/). Clases CSS simples, rendimiento extremo.

## Descripción

Animicro permite añadir animaciones de alto nivel (estilo Awwwards) con impacto mínimo en el rendimiento. Activa módulos en el panel, aplica clases como `.am-fade` o `.am-slide-up` en tu Page Builder y listo.

**Filosofía**: Utility-first. Sin interfaces complejas, sin líneas de tiempo. Solo clases y atributos `data-*`.

## Requisitos

- WordPress 6.0+
- PHP 7.4+

## Instalación

1. Descarga o clona el plugin en `wp-content/plugins/Animicro/`
2. Ejecuta `npm install` y `npm run build` en la raíz del plugin
3. Activa el plugin desde el escritorio de WordPress
4. Ve a **Animicro** en el menú lateral para configurar módulos

## Módulos disponibles

| Módulo | Clase | Descripción | Plan |
|--------|-------|-------------|------|
| Fade | `.am-fade` | Aparición suave con opacidad | Free |
| Slide Up | `.am-slide-up` | Desliza hacia arriba al aparecer | Free |
| Slide Down | `.am-slide-down` | Desliza hacia abajo al aparecer | Free |
| Scale | `.am-scale` | Escala desde pequeño al tamaño real | Free |
| Blur | `.am-blur` | Desenfoque que se aclara al aparecer | Pro |
| Stagger | `.am-stagger` | Anima hijos del contenedor en secuencia | Pro |
| Parallax | `.am-parallax` | Movimiento parallax vinculado al scroll | Pro |
| Split Text | `.am-split` | Divide y anima texto por letras/palabras | Pro |

## Uso básico

```html
<!-- Fade simple -->
<div class="am-fade">Contenido que aparece suavemente</div>

<!-- Con atributos personalizados -->
<div class="am-fade" data-duration="1" data-delay="0.3" data-easing="ease-in-out">
  Contenido con duración y delay personalizados
</div>
```

## Atributos data-*

| Atributo | Tipo | Default | Descripción |
|----------|------|---------|-------------|
| `data-duration` | float (s) | 0.6 | Duración de la animación |
| `data-delay` | float (s) | 0 | Retraso antes de iniciar |
| `data-easing` | string | ease-out | Curva de aceleración |
| `data-margin` | string | -50px 0px | Margen de activación (inView) |

## Compatibilidad

Funciona con Elementor, Bricks, Breakdance, Oxygen y Gutenberg. El CSS se adapta automáticamente para no ocultar elementos dentro de los editores.

## Licencia Pro

Los módulos Blur, Stagger, Parallax y Split Text requieren una licencia Pro. Actívala en **Animicro → Licencia**.

## Desarrollo

```bash
npm install
npm run build          # Compila admin + frontend
npm run dev:admin      # Watch mode admin
npm run dev:frontend   # Watch mode frontend
```

## Licencia

GPL-2.0-or-later
