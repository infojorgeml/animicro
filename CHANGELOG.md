# Changelog

Todos los cambios notables de Animicro se documentan en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [0.1.1] - 2026-02-26

### Añadido

- **Motor de animaciones** basado en Motion One con 8 módulos:
  - **Free**: Fade, Slide Up, Slide Down, Scale
  - **Pro**: Blur, Stagger, Parallax, Split Text
- **Panel de administración** React con pestañas: Módulos, Cheat Sheet, Integraciones
- **Ajustes por módulo**: configuración individual (duración, easing, delay, margen) para Fade
- **Sistema de licencias Pro** integrado con Supabase:
  - Submenú "Licencia" para activar/desactivar licencia
  - Validación periódica cada 24 horas
  - Módulos Pro bloqueados sin licencia activa
- **CSS universal** para compatibilidad con builders (Elementor, Bricks, Oxygen, Breakdance)
- **Fallback de accesibilidad** (`@media (scripting: none)`) para usuarios sin JavaScript
- **Code splitting** en frontend: solo se carga el JS de los módulos activos
- **Atributos data-***: `data-duration`, `data-delay`, `data-easing`, `data-margin` por elemento

### Técnico

- PHP 7.4+, WordPress 6.0+
- Vite 6 para build de admin (React + TypeScript + Tailwind) y frontend (Vanilla JS)
- REST API: `animicro/v1/settings`, `animicro/v1/license/status`, `animicro/v1/license/save`

[0.1.1]: https://github.com/infojorgeml/animicro/releases/tag/v0.1.1
