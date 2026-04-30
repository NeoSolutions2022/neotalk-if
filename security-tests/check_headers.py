#!/usr/bin/env python3
"""Defensive header checker for NeoTalk routes.

Usage:
  python security-tests/check_headers.py --base-url http://localhost:8080
"""
import argparse
import sys
from urllib import request, error
from typing import Tuple, Dict, Optional


EXPECTED_POLICY = {
    "/": "app",
    "/widget": "widget",
}

EXPECTED = {
    "/": {
        "x-content-type-options": "nosniff",
        "referrer-policy": "strict-origin-when-cross-origin",
        "x-frame-options": "SAMEORIGIN",
    },
    "/widget": {
        "x-content-type-options": "nosniff",
        "referrer-policy": "no-referrer",
    },
}


def fetch_headers(url: str) -> Tuple[Optional[int], Dict[str, str], Optional[str]]:
    req = request.Request(url, method="GET")
    try:
        with request.urlopen(req, timeout=15) as resp:
            headers = {k.lower(): v for k, v in resp.headers.items()}
            return resp.getcode(), headers, None
    except error.HTTPError as e:
        headers = {k.lower(): v for k, v in e.headers.items()}
        return e.code, headers, None
    except error.URLError as e:
        return None, {}, str(e)


def check_route(base_url: str, route: str) -> int:
    url = base_url.rstrip("/") + route
    status, headers, err = fetch_headers(url)
    state = status if status is not None else "unreachable"
    print(f"\n[route] {route} -> {state}")
    failures = 0
    if err:
        print(f"  [error] {err}")
        return 1

    for k, v in EXPECTED[route].items():
        actual = headers.get(k)
        print(f"  {k}: {actual}")
        if actual is None or actual.lower() != v.lower():
            failures += 1

    csp = headers.get("content-security-policy")
    print(f"  content-security-policy: {csp}")
    if not csp:
        failures += 1

    policy = headers.get("x-neotalk-policy")
    print(f"  x-neotalk-policy: {policy}")
    expected_policy = EXPECTED_POLICY[route]
    if policy != expected_policy:
        print(f"  [warn] expected x-neotalk-policy={expected_policy}; got {policy}")
        failures += 1

    if route == "/widget" and "x-frame-options" in headers:
        print("  [warn] /widget should omit X-Frame-Options for controlled third-party embeds")

    return failures


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--base-url", required=True)
    args = ap.parse_args()

    total = 0
    for route in ["/", "/widget"]:
        total += check_route(args.base_url, route)

    if total:
        print(f"\n[FAIL] {total} header assertion(s) failed")
        return 1
    print("\n[OK] Header baseline checks passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
