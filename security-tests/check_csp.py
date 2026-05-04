#!/usr/bin/env python3
"""Static CSP sanity checks against nginx.conf (defensive)."""
from pathlib import Path
import re
import sys

text = Path("nginx.conf").read_text(encoding="utf-8")
errors = []

# Inspect only CSP header values to avoid false positives in comments/docs.
csp_values = re.findall(r'Content-Security-Policy\s+"([^"]+)"', text)
if not csp_values:
    errors.append("No CSP header values found in nginx.conf")

for csp in csp_values:
    if "frame-ancestors *" in csp:
        errors.append("Found insecure wildcard frame-ancestors * in CSP header")

if "location /" not in text or "location = /widget" not in text:
    errors.append("Missing expected route blocks for / and /widget")

widget_csp = re.search(r"location = /widget \{[\s\S]*?Content-Security-Policy \"([^\"]+)\"", text)
if not widget_csp:
    errors.append("Missing widget CSP")
else:
    csp = widget_csp.group(1)
    if "frame-ancestors" not in csp:
        errors.append("Widget CSP missing frame-ancestors")

if errors:
    print("[FAIL]")
    for e in errors:
        print(" -", e)
    sys.exit(1)

print("[OK] CSP static checks passed")
