import json
import os
import sys
from pathlib import Path
from typing import Iterable

ROOT = Path(__file__).parent
DEFAULT_IMAGES_DIR = ROOT / '图片'
DEFAULT_OUTPUT = ROOT / 'images.json'

EXTS = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}


def posix_relpath(path: Path, start: Path) -> str:
    return path.relative_to(start).as_posix()


def iter_image_files(images_dir: Path) -> Iterable[Path]:
    for dirpath, _, filenames in os.walk(images_dir):
        for name in filenames:
            ext = os.path.splitext(name)[1].lower()
            if ext in EXTS:
                yield Path(dirpath) / name


def main() -> None:
    # 允许传参：python scan_images.py [图片目录] [输出文件]
    images_dir = DEFAULT_IMAGES_DIR
    output = DEFAULT_OUTPUT

    if len(sys.argv) >= 2 and sys.argv[1].strip():
        images_dir = Path(sys.argv[1]).expanduser()
        if not images_dir.is_absolute():
            images_dir = (ROOT / images_dir).resolve()
    if len(sys.argv) >= 3 and sys.argv[2].strip():
        output = Path(sys.argv[2]).expanduser()
        if not output.is_absolute():
            output = (ROOT / output).resolve()

    if not images_dir.exists():
        raise SystemExit(f'目录不存在: {images_dir}')

    urls = [posix_relpath(p, ROOT) for p in iter_image_files(images_dir)]
    urls.sort()

    data = {
        'generated_from': posix_relpath(images_dir, ROOT) if images_dir.is_relative_to(ROOT) else str(images_dir),
        'count': len(urls),
        'images': urls,
    }

    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'Wrote {output} with {len(urls)} items (from {images_dir})')


if __name__ == '__main__':
    main()
