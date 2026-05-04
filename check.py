#!/usr/bin/env python3
"""Wrapper for runtime header checks against deployed NeoTalk base URL."""
import argparse
import subprocess
import sys


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--base-url", required=True)
    args = ap.parse_args()
    cmd = [sys.executable, "security-tests/check_headers.py", "--base-url", args.base_url]
    return subprocess.call(cmd)


if __name__ == "__main__":
    raise SystemExit(main())
