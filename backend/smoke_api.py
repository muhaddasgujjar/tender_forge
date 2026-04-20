#!/usr/bin/env python3
"""
Smoke test TenderForge PK HTTP API.

Prerequisites:
  - API running: cd backend && uvicorn main:app --host 127.0.0.1 --port 8000
  - Optional: backend/.env with GROQ_API_KEY + backend/data/tender.pdf for full pipeline

Usage:
  python smoke_api.py              # health + upload + generate + poll (slow, calls Groq)
  python smoke_api.py --quick      # health only

Environment:
  TF_API_BASE   default http://127.0.0.1:8000
"""

from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path

try:
    import requests
except ImportError:
    print("Install requests: pip install requests", file=sys.stderr)
    sys.exit(2)

BACKEND_DIR = Path(__file__).resolve().parent


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--quick", action="store_true", help="GET /api/health only")
    args = parser.parse_args()

    base = __import__("os").environ.get("TF_API_BASE", "http://127.0.0.1:8000").rstrip("/")

    r = requests.get(f"{base}/api/health", timeout=15)
    r.raise_for_status()
    body = r.json()
    print("health:", body)
    assert body.get("status") == "ok"

    if args.quick:
        print("smoke_api: QUICK OK")
        return 0

    pdf = BACKEND_DIR / "data" / "tender.pdf"
    company = BACKEND_DIR / "data" / "company_profile.pdf"
    if not pdf.is_file():
        print("smoke_api: no data/tender.pdf — skipping ingest/run")
        print("smoke_api: QUICK OK (health only)")
        return 0

    profile_path = company if company.is_file() else pdf
    with pdf.open("rb") as t_fh, profile_path.open("rb") as p_fh:
        upload = requests.post(
            f"{base}/api/upload",
            files={
                "tender_file": ("tender.pdf", t_fh, "application/pdf"),
                "profile_file": (
                    "company_profile.pdf",
                    p_fh,
                    "application/pdf",
                ),
            },
            timeout=600,
        )
    print("upload:", upload.status_code, upload.text[:500])
    upload.raise_for_status()
    run_id = upload.json().get("run_id")
    assert run_id, "missing run_id"

    gen = requests.post(
        f"{base}/api/generate", json={"run_id": run_id, "filename": "tender.pdf"}, timeout=120
    )
    print("generate:", gen.status_code, gen.text[:300])
    gen.raise_for_status()

    deadline = time.time() + 600
    while time.time() < deadline:
        st = requests.get(f"{base}/api/runs/{run_id}", timeout=60)
        st.raise_for_status()
        data = st.json()
        status = data.get("status")
        print("poll:", status, "revision_count=", data.get("revision_count"), "audit=", data.get("audit_status"))
        if status == "completed":
            dl = requests.get(f"{base}/api/download", params={"run_id": run_id}, timeout=60)
            print("proposal download:", dl.status_code, "bytes", len(dl.content))
            print("smoke_api: FULL OK")
            return 0
        if status == "failed":
            print("run failed:", data.get("error"))
            return 1
        time.sleep(2)

    print("smoke_api: timeout waiting for completion")
    return 1


if __name__ == "__main__":
    sys.exit(main())
