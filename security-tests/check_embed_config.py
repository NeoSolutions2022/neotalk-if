#!/usr/bin/env python3
"""Static checks for embed loader hardening controls."""
from pathlib import Path
import sys

text = Path("embeds/widget-loader.js").read_text(encoding="utf-8")
required = [
    "invalid_widget_url",
    "invalid_widget_origin",
    "event.origin !== ALLOWED_ORIGIN",
    "event.source !== iframe.contentWindow",
    "event.data.type !== 'NEOTALK_WIDGET_READY'",
    "sandbox', 'allow-scripts allow-same-origin'",
]

missing = [r for r in required if r not in text]
if missing:
    print("[FAIL] Missing expected defensive controls:")
    for m in missing:
        print(" -", m)
    sys.exit(1)

print("[OK] Embed loader defensive controls present")
