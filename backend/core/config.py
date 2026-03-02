import os
from pathlib import Path

# Resolve the project-root data directory.
# - In Docker: the volume mount maps ./data → /app/data, so "data" works.
# - Locally: backend runs from backend/, so we resolve ../data relative to this file.
# - Override with DATA_DIR env var for custom setups.
_default = Path(__file__).resolve().parent.parent.parent / "data"
DATA_DIR = Path(os.environ.get("DATA_DIR", str(_default)))
