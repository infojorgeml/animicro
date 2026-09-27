# Animicro — Release checklist (2.0.0+)

**Estructura del código:** todo vive en `includes/`, `admin/src/` y `frontend/src/`. Desde la 2.0 hay un único plugin gratuito (sin variante Pro ni licencias).

**Build:** `bash scripts/build.sh` (desde la raíz del plugin).

---

## Pasos de release

1. **Actualizar versión** en:
   - `animicro.php` → `Version:` en el header del plugin + `define( 'ANIMICRO_VERSION', 'X.Y.Z' );`
   - `free/readme.txt` → línea `Stable tag: X.Y.Z`
   - `package.json` → `"version": "X.Y.Z"`

2. **Actualizar changelog**
   - `CHANGELOG.md` (Keep a Changelog)
   - `free/readme.txt` → sección `== Changelog ==` (formato WordPress.org)

3. **Actualizar readme**
   - `README.md` (GitHub / desarrolladores)
   - `free/readme.txt` (directorio WP.org)

4. **Actualizar docs** — `docs/animicro.md`, `docs/release-checklist.md` y archivos de builders en `docs/` si cambia compatibilidad o comportamiento.

5. **Commit y push** a GitHub

6. **Generar el ZIP**
   ```bash
   bash scripts/build.sh
   ```
   Salida: `release/animicro-X.Y.Z.zip` (el mismo paquete que va a WordPress.org).

   **Opcional:** copiar el ZIP al escritorio u otra carpeta:
   ```bash
   cp release/animicro-*.zip ~/Desktop/
   ```

`build/` y `release/` están en `.gitignore`: no se versionan los artefactos.

---

## Información extra

- **`pnpm run build`:** `scripts/build.sh` ejecuta `pnpm run build` automáticamente si faltan `admin/dist/.vite/manifest.json` o `frontend/dist/.vite/manifest.json`. Si ya compilaste, reutiliza los `dist` existentes. El proyecto usa **pnpm exclusivamente** (no usar `npm`/`npx`).

- **ZIP en `release/`:** en `.gitignore`. Distribución: SVN de WordPress.org con `pnpm run release:wp`.

- **`.distignore`:** si empaquetas con otra herramienta, respeta exclusiones (fuentes TS, etc.).

---

## Prompt sugerido para el asistente

```
Release Animicro vX.Y.Z

1. Sube la versión a X.Y.Z en animicro.php, free/readme.txt (Stable tag) y package.json.
2. Añade entrada en CHANGELOG.md y en == Changelog == de free/readme.txt.
3. Actualiza README.md y free/readme.txt si cambian features o compatibilidad.
4. Actualiza docs/ según corresponda.
5. Commit y push.
6. Ejecuta bash scripts/build.sh y confirma release/animicro-X.Y.Z.zip.
```
