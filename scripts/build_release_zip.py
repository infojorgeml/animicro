#!/usr/bin/env python3
"""Build animicro-{version}.zip (free, WP.org) from the plugin root.

For the full free + pro build, use scripts/build.sh instead.
This script generates only the free ZIP and excludes all pro-only files.
"""
import os
import re
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def version_from_php() -> str:
    text = (ROOT / "animicro.php").read_text(encoding="utf-8")
    m = re.search(r"define\s*\(\s*'ANIMICRO_VERSION'\s*,\s*'([^']+)'", text)
    return m.group(1) if m else "0.0.0"


def should_skip(rel: Path) -> bool:
    """rel is relative to ROOT; never skip ROOT itself."""
    if rel == Path("."):
        return False
    parts = rel.parts
    rs = rel.as_posix()

    if parts[0] == ".git":
        return True
    if parts[0] == "node_modules":
        return True
    if parts[0] in (".agent", ".agents", ".cursor", "docs", "scripts", "release", "build", "free"):
        return True
    if parts[:2] == ("admin", "src"):
        return True
    if parts[:2] == ("frontend", "src"):
        return True

    name = rel.name

    if name == "class-license-manager.php":
        return True

    # Allow .vite/ (Vite manifest folder inside dist) but skip all other dot-files/dirs.
    if name.startswith(".") and name != ".vite":
        return True
    if name in {
        ".gitignore", ".distignore", ".DS_Store", "package.json", "package-lock.json",
        "vite.config.ts", "tailwind.config.js", "postcss.config.js", "skills-lock.json",
        "CHANGELOG.md",
    }:
        return True
    if name.endswith(".log"):
        return True
    if name.endswith(".md") and name != "README.md":
        return True
    if name == "tsconfig.json" or (name.startswith("tsconfig.") and name.endswith(".json")):
        return True
    return False


def main() -> None:
    if not (ROOT / "frontend/dist/.vite/manifest.json").exists() or not (ROOT / "admin/dist/.vite/manifest.json").exists():
        print("Warning: run `npm run build` first so admin/dist and frontend/dist exist.", file=sys.stderr)

    ver = version_from_php()
    out_dir = ROOT / "release"
    out_dir.mkdir(exist_ok=True)
    out_zip = out_dir / f"animicro-{ver}.zip"

    files: list[tuple[Path, str]] = []
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dp = Path(dirpath)
        rel_dir = dp.relative_to(ROOT)
        if should_skip(rel_dir):
            dirnames[:] = []
            continue
        dirnames[:] = [d for d in dirnames if not should_skip(rel_dir / d)]
        for fn in filenames:
            p = dp / fn
            rel = p.relative_to(ROOT)
            if should_skip(rel):
                continue
            arc = Path("animicro") / rel
            files.append((p, str(arc).replace("\\", "/")))

    # Include free/readme.txt as readme.txt in the ZIP root.
    readme_src = ROOT / "free" / "readme.txt"
    if readme_src.exists():
        files.append((readme_src, "animicro/readme.txt"))

    with zipfile.ZipFile(out_zip, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
        for path, arcname in sorted(files, key=lambda x: x[1]):
            zf.write(path, arcname)

    print(f"Created: {out_zip} ({out_zip.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
