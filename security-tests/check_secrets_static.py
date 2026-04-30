#!/usr/bin/env python3
"""Simple static scanner for likely hardcoded secrets (defensive heuristic)."""
from pathlib import Path
import re
import sys

PATTERNS = [
    re.compile(r"AKIA[0-9A-Z]{16}"),
    re.compile(r"-----BEGIN (RSA|EC|DSA|OPENSSH) PRIVATE KEY-----"),
    re.compile(r"(?i)(api[_-]?key|secret|token|password)\s*[:=]\s*['\"][^'\"]{12,}['\"]"),
]

SKIP_DIRS = {"node_modules", ".git", "dist"}
findings = []
for p in Path(".").rglob("*"):
    if not p.is_file():
        continue
    if any(part in SKIP_DIRS for part in p.parts):
        continue
    if p.suffix.lower() in {".png", ".jpg", ".jpeg", ".gif", ".ico", ".lockb", ".pdf"}:
        continue
    try:
        txt = p.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        continue
    for pat in PATTERNS:
        for m in pat.finditer(txt):
            findings.append((str(p), m.group(0)[:80]))

if findings:
    print("[WARN] Potential secret-like strings found:")
    for f, s in findings[:50]:
        print(f" - {f}: {s}")
    sys.exit(1)

print("[OK] No obvious hardcoded secret patterns found")
