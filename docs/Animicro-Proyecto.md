# Proyecto Animicro: Plugin de Micro-Animaciones para WordPress

## Introducción y Visión General
Animicro es un plugin de WordPress enfocado en micro-animaciones basadas en la librería "Motion One" (motion.dev). Su filosofía es "Utility-First": en lugar de interfaces complejas como líneas de tiempo, los usuarios activan módulos en un panel de administración y aplican clases CSS simples (con prefijo `.am-`, ej. `.am-fade`, `.am-split`, `.am-up`) y atributos de datos (ej. `data-delay="0.2"`) directamente en su Page Builder favorito (Bricks, Elementor, Gutenberg, etc.). 

El plugin prioriza el rendimiento extremo, bajo peso y simplicidad. El prefijo obligatorio para funciones PHP, handles de scripts y variables globales es `animicro_`. No se usa jQuery; todo es Vanilla JS en el frontend.

**Objetivo del Plugin**: Proporcionar animaciones de alto nivel (Awwwards-style) con impacto mínimo en el rendimiento, compatible con builders populares.

## Stack Tecnológico
- **Backend**: PHP Orientado a Objetos (OOP) – Estructura limpia, sin código espagueti.
- **Admin UI**: React + TypeScript + Tailwind CSS, empaquetado con Vite.
- **Frontend (Web)**: Vanilla JS (ES Modules) + CSS puro, empaquetado con Vite. Cero jQuery.
- **Librería Principal**: Motion One (~3.8kb minificado).
- **Empaquetado**: Vite para compilar tanto el admin (React) como el frontend (Vanilla JS), generando un `manifest.json` para encolado dinámico en PHP.

## Filosofía y Flujo de Trabajo del Usuario
1. El usuario activa módulos en el panel de React (ej. Fade, Scroll Stagger, Parallax, Split Text).
2. Configura valores globales (ej. duración por defecto: 0.6s, easing: ease-out).
3. En su builder, añade clases como `.am-fade` a elementos y atributos como `data-delay="0.2"`.
4. Si un módulo está desactivado, su JS/CSS no carga.
5. Prioridad en atributos: Atributos individuales (ej. `data-duration`) sobrescriben globales.

**Ventajas Clave**:
- Rendimiento: Bajo peso, lazy-loading implícito.
- Simplicidad: No requiere aprendizaje de interfaces complejas.
- Compatibilidad: Funciona con cualquier builder sin sobrecarga.

## Sistema de Compatibilidad con Builders
En lugar de detección automática en PHP (que consume recursos y es propensa a fallos por actualizaciones de builders), usamos un selector manual en el panel de React.

- **Panel de Selección**: En una pestaña "Integraciones" o "Compatibilidad", el usuario selecciona su builder principal (opciones: Elementor, Bricks, Breakdance, Oxygen, Gutenberg). Opcional: "Forzar modo diseño" para builders custom.
- **Lógica Técnica**: 
  - Guardar la opción en la BD de WP (ej. `get_option('animicro_active_builder')`).
  - Generar CSS dinámico inyectado en `<head>` del frontend basado en la selección.
  - Ejemplos de clases de builders en `<body>`:
    - Elementor: `.elementor-editor-active`
    - Bricks: `.bricks-is-builder`
    - Breakdance: `.breakdance-builder`
    - Oxygen: `.oxygen-builder-body`
  - CSS Generado (ej. para Elementor y clase `.am-fade`):
    ```css
    /* Solo aplicar opacity: 0 si NO estamos en el editor de Elementor */
    body:not(.elementor-editor-active) .am-fade {
        opacity: 0;
    }
    ```
- **Ventajas**:
  - Rendimiento: No ejecuta checks PHP en cada carga.
  - Robustez: Basado en clases CSS públicas, no en funciones internas de builders.
  - UX Premium: Muestra logos/nombres de builders para sensación de profesionalismo.
  - Flexibilidad: Control total del usuario.

## Plan de Desarrollo (Fases)
### Fase 1: Arquitectura y Andamiaje (Core PHP)
- **Estructura de Carpetas**:
  ```
  animicro/
  ├── admin/                # React + TypeScript para el panel de admin
  │   ├── src/              # Código fuente React
  │   └── dist/             # Build de Vite (generado)
  ├── frontend/             # Vanilla JS + CSS para la web
  │   ├── src/              # Código fuente JS/CSS
  │   └── dist/             # Build de Vite (generado)
  ├── includes/             # PHP OOP: clases, helpers
  ├── vite.config.ts        # Configuración de Vite
  ├── animicro.php          # Archivo principal del plugin
  ├── class-animicro.php    # Clase principal
  └── manifest.json         # Generado por Vite para encolado
  ```
- **Configuración de Vite**: Archivo `vite.config.ts` para compilar admin (React) y frontend (Vanilla JS), generando `manifest.json`.
- **Clase Principal PHP**: En `class-animicro.php`, manejar inicialización, hooks WP.
- **Encolado de Scripts**:
  - Leer `manifest.json` para encolar archivos con hash.
  - Admin: `admin_enqueue_scripts` para React.
  - Frontend: `wp_enqueue_scripts` con `type="module"` y `defer`.
- **Sistema de Compatibilidad**: Implementar selector en React, guardar en BD, generar/injectar CSS dinámico en frontend.
- **Shell de React**: Componente básico "Hola Mundo" renderizado en la página de opciones del plugin.

### Fase 2: Motor Frontend (Vanilla JS + Vite)
- Archivos modulares: `stagger.js`, `split-text.js`, `directional.js`, `parallax.js`.
- Lógica de Atributos: Leer `data-*` individuales; fallback a globales.
- CSS Dinámico: Imprimir en `<head>` solo reglas de módulos activos (ej. `opacity: 0; will-change: transform;`).
- Optimización: Defer, lazy-loading, no ejecutar en modo editor (via CSS generado).

### Fase 3: Panel de Control (React + UI)
- **Dashboard**: Toggles para módulos activos/desactivados.
- **Ajustes Globales**: Campos para duración, desenfoque, easing, etc.
- **Generador de Clases**: Pestaña "Cheat Sheet" con ejemplos de clases y atributos para copiar.
- **Pestaña Integraciones**: Selector de builder para compatibilidad.

### Fase 4: Integración y Fallbacks
- **Accesibilidad (A11y)**: Incluir `aria-hidden`, media queries para `@media (scripting: none)`.
- **Optimización**: Encolado con defer, al final de `<body>`.
- **Fallbacks**: Soporte para builders no listados via opción manual.

### Fase 5: Documentación y Lanzamiento
- **Guía Visual**: Web con ejemplos de clases aplicadas.
- **Snippets para Builders**: Instrucciones específicas para añadir clases/atributos en Bricks, Elementor, Gutenberg, etc.
- **Marketing**: Enfatizar ligereza, compatibilidad y simplicidad "utility-first".

## Tareas Iniciales para la IA
Usa este documento como base para generar código. Comienza con Fase 1:
1. Define estructura de carpetas.
2. Proporciona `vite.config.ts`.
3. Crea archivo principal y clase PHP.
4. Implementa encolado de scripts via `manifest.json`.
5. Integra sistema de compatibilidad manual (selector en React, CSS dinámico en PHP).

Explica código paso a paso, indicando ubicación de archivos. No implementes animaciones aún; enfócate en el andamiaje.