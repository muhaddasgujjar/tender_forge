"""
TenderForge PK — FastAPI server for frontend integration.
Run from repo:  cd backend && uvicorn main:app --reload --port 8000

Flow: POST /api/upload (tender + company PDFs) → POST /api/generate → GET /api/stream → GET /api/download
Legacy: POST /api/ingest (save+ingest one-shot), POST /api/run
"""

from __future__ import annotations

import asyncio
import json
import threading
import uuid
from collections.abc import Mapping
from pathlib import Path
from typing import Any

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel

from core.graph import app as tender_workflow
from core.graph import gatekeeper_node
from core.ingest import ingest_company_profile_path, ingest_pdf_path

BACKEND_DIR = Path(__file__).resolve().parent
DATA_DIR = BACKEND_DIR / "data"
TENDER_DATA = DATA_DIR / "tender.pdf"
COMPANY_PROFILE_DATA = DATA_DIR / "company_profile.pdf"
UPLOAD_DIR = BACKEND_DIR / "uploads"
OUTPUT_DIR = BACKEND_DIR / "output"

DATA_DIR.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

RUN_LOCK = threading.Lock()
RUNS: dict[str, dict[str, Any]] = {}


def _ensure_run_slot(run_id: str) -> dict[str, Any]:
    with RUN_LOCK:
        if run_id not in RUNS:
            RUNS[run_id] = {
                "ingested": False,
                "pdf_path": None,
                "events": [],
                "done": False,
                "error": None,
                "proposal_path": None,
                "revision_count": None,
                "audit_status": None,
                "audit_feedback": None,
                "running": False,
                "validation_rejected": False,
                "rejection_reason": None,
            }
        return RUNS[run_id]


def _normalize_node_output(node_output: Any) -> dict[str, Any]:
    if node_output is None:
        return {}
    if isinstance(node_output, dict):
        return node_output
    if isinstance(node_output, Mapping):
        return dict(node_output)
    return {}


def _coerce_stream_chunk(chunk: Any) -> dict[str, Any]:
    if chunk is None:
        return {}
    if isinstance(chunk, dict):
        return chunk
    if isinstance(chunk, Mapping):
        return dict(chunk)
    return {}


def _build_sse_event(node_name: str, node_output: Any) -> dict[str, Any]:
    out = _normalize_node_output(node_output)
    if node_name == "gatekeeper_node":
        msg = "Gatekeeper: Verifying document authenticity…"
    elif node_name == "extractor_node":
        msg = "Extractor Agent: Reading requirements…"
    elif node_name == "generator_node":
        msg = "Generator Agent: Drafting compliance matrix…"
    elif node_name == "auditor_node":
        st = out.get("audit_status") or ""
        msg = (
            f"Auditor Agent: Validating against PPRA law… ({st})"
            if st
            else "Auditor Agent: Validating against PPRA law…"
        )
    elif node_name == "export_node":
        msg = "Export: Writing Technical Proposal (.docx)…"
    else:
        msg = str(node_name)

    evt: dict[str, Any] = {
        "step": node_name,
        "message": msg,
    }
    if "revision_count" in out and out["revision_count"] is not None:
        evt["revision_count"] = out["revision_count"]
    if "audit_status" in out and out["audit_status"]:
        evt["audit_status"] = out["audit_status"]
    if "is_valid_context" in out and out["is_valid_context"] is not None:
        evt["is_valid_context"] = out["is_valid_context"]
    if out.get("rejection_reason"):
        evt["rejection_reason"] = out["rejection_reason"]
    return evt


def _run_engine_thread(run_id: str) -> None:
    proposal_path = OUTPUT_DIR / f"{run_id}_Final_Proposal.docx"
    initial = {
        "tender_context": "",
        "requirements_json": {},
        "company_context": "",
        "is_valid_context": True,
        "rejection_reason": "",
        "draft_proposal": "",
        "audit_feedback": "",
        "audit_status": "",
        "revision_count": 0,
        "output_docx_path": str(proposal_path),
    }
    try:
        for raw_step in tender_workflow.stream(initial):
            step = _coerce_stream_chunk(raw_step)
            for node_name, node_output in step.items():
                evt = _build_sse_event(node_name, node_output)
                out = _normalize_node_output(node_output)
                with RUN_LOCK:
                    r = RUNS[run_id]
                    r["events"].append(evt)
                    if "revision_count" in out and out["revision_count"] is not None:
                        r["revision_count"] = out["revision_count"]
                    if out.get("audit_status"):
                        r["audit_status"] = out["audit_status"]
                    if out.get("audit_feedback"):
                        r["audit_feedback"] = out["audit_feedback"]

        with RUN_LOCK:
            RUNS[run_id]["proposal_path"] = str(proposal_path)
            RUNS[run_id]["done"] = True
            RUNS[run_id]["running"] = False
    except Exception as exc:
        with RUN_LOCK:
            RUNS[run_id]["error"] = str(exc)
            RUNS[run_id]["done"] = True
            RUNS[run_id]["running"] = False


def _reset_run_for_engine(run_id: str) -> None:
    with RUN_LOCK:
        RUNS[run_id]["events"] = []
        RUNS[run_id]["done"] = False
        RUNS[run_id]["error"] = None
        RUNS[run_id]["proposal_path"] = None
        RUNS[run_id]["running"] = True


def _start_engine_thread(run_id: str) -> None:
    thread = threading.Thread(target=_run_engine_thread, args=(run_id,), daemon=True)
    thread.start()


class RunBody(BaseModel):
    run_id: str
    filename: str | None = None


app = FastAPI(title="TenderForge PK API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


def _require_pdf_name(name: str | None) -> None:
    if not name or not name.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Expected a PDF file.")


@app.post("/api/upload")
async def api_upload(
    tender_file: UploadFile = File(..., description="Government tender PDF"),
    profile_file: UploadFile = File(
        ..., description="Company profile & technical stack PDF"
    ),
) -> dict[str, Any]:
    """
    Save tender to data/tender.pdf and company profile to data/company_profile.pdf;
    client then calls POST /api/generate.
    """
    _require_pdf_name(tender_file.filename)
    _require_pdf_name(profile_file.filename)

    tender_bytes = await tender_file.read()
    profile_bytes = await profile_file.read()
    if not tender_bytes or not profile_bytes:
        raise HTTPException(status_code=400, detail="Both PDF files must be non-empty.")

    TENDER_DATA.write_bytes(tender_bytes)
    COMPANY_PROFILE_DATA.write_bytes(profile_bytes)

    run_id = str(uuid.uuid4())
    _ensure_run_slot(run_id)
    with RUN_LOCK:
        RUNS[run_id]["pdf_path"] = str(TENDER_DATA)
        RUNS[run_id]["ingested"] = False

    return {
        "run_id": run_id,
        "tender_filename": tender_file.filename,
        "profile_filename": profile_file.filename,
    }


@app.post("/api/generate")
def api_generate(body: RunBody) -> dict[str, Any]:
    """Vectorize tender + company profile, then start LangGraph engine."""
    run_id = body.run_id
    _ensure_run_slot(run_id)
    if not TENDER_DATA.is_file() or not COMPANY_PROFILE_DATA.is_file():
        raise HTTPException(
            status_code=400,
            detail="Missing tender or company profile. Call POST /api/upload with both files.",
        )

    try:
        ingest_pdf_path(TENDER_DATA)
        ingest_company_profile_path(COMPANY_PROFILE_DATA)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    with RUN_LOCK:
        RUNS[run_id]["ingested"] = True

    with RUN_LOCK:
        if RUNS[run_id].get("running"):
            raise HTTPException(status_code=409, detail="Run already in progress.")

    gk = _normalize_node_output(gatekeeper_node({}))
    if gk.get("is_valid_context") is not True:
        reason = str(
            gk.get("rejection_reason") or "Document validation failed."
        ).strip() or "Document validation failed."
        with RUN_LOCK:
            RUNS[run_id]["validation_rejected"] = True
            RUNS[run_id]["rejection_reason"] = reason
            RUNS[run_id]["done"] = True
            RUNS[run_id]["running"] = False
        return {"status": "rejected", "reason": reason}

    _reset_run_for_engine(run_id)
    _start_engine_thread(run_id)
    return {"run_id": run_id, "status": "started"}


@app.post("/api/ingest")
async def ingest_legacy(file: UploadFile = File(...)) -> dict[str, Any]:
    """Legacy one-shot: save + ingest into Chroma (no separate generate)."""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Expected a PDF file.")

    run_id = str(uuid.uuid4())
    dest = UPLOAD_DIR / f"{run_id}.pdf"
    content = await file.read()
    dest.write_bytes(content)

    try:
        ingest_pdf_path(dest)
    except Exception as exc:
        dest.unlink(missing_ok=True)
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    _ensure_run_slot(run_id)
    with RUN_LOCK:
        RUNS[run_id]["pdf_path"] = str(dest)
        RUNS[run_id]["ingested"] = True

    return {"run_id": run_id, "filename": file.filename}


@app.post("/api/run")
def start_run(body: RunBody) -> dict[str, Any]:
    """Start engine after legacy /api/ingest (already vectorized)."""
    run_id = body.run_id
    r = _ensure_run_slot(run_id)
    if not r.get("ingested"):
        raise HTTPException(
            status_code=400,
            detail="Unknown or un-ingested run_id. Call /api/ingest first.",
        )

    with RUN_LOCK:
        if RUNS[run_id].get("running"):
            raise HTTPException(status_code=409, detail="Run already in progress.")
        RUNS[run_id]["events"] = []
        RUNS[run_id]["done"] = False
        RUNS[run_id]["error"] = None
        RUNS[run_id]["proposal_path"] = None
        RUNS[run_id]["running"] = True

    _start_engine_thread(run_id)
    return {"run_id": run_id, "status": "started"}


@app.get("/api/runs/{run_id}")
def get_run(run_id: str) -> dict[str, Any]:
    with RUN_LOCK:
        r = RUNS.get(run_id)
    if not r:
        raise HTTPException(status_code=404, detail="Run not found.")

    status = "running"
    if r.get("done"):
        if r.get("validation_rejected"):
            status = "rejected"
        else:
            status = "failed" if r.get("error") else "completed"

    return {
        "run_id": run_id,
        "status": status,
        "revision_count": r.get("revision_count"),
        "audit_status": r.get("audit_status"),
        "audit_feedback": r.get("audit_feedback"),
        "error": r.get("error"),
        "rejection_reason": r.get("rejection_reason"),
    }


def _file_response_for_run(run_id: str) -> FileResponse:
    with RUN_LOCK:
        r = RUNS.get(run_id)
    if not r:
        raise HTTPException(status_code=404, detail="Run not found.")
    path = r.get("proposal_path")
    if not path or not Path(path).is_file():
        raise HTTPException(status_code=404, detail="Proposal file not ready.")
    return FileResponse(
        path,
        filename="Final_Proposal.docx",
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    )


@app.get("/api/runs/{run_id}/proposal")
def download_proposal(run_id: str) -> FileResponse:
    return _file_response_for_run(run_id)


@app.get("/api/download")
def api_download(run_id: str) -> FileResponse:
    """Prompt 5 alias for proposal download."""
    return _file_response_for_run(run_id)


async def _sse_generator(run_id: str):
    if run_id not in RUNS:
        raise HTTPException(status_code=404, detail="Run not found.")

    async def gen():
        last_idx = 0
        while True:
            with RUN_LOCK:
                r = RUNS.get(run_id, {})
                events = list(r.get("events", []))
                done = r.get("done", False)
                err = r.get("error")

            while last_idx < len(events):
                line = json.dumps(events[last_idx], ensure_ascii=False)
                yield f"data: {line}\n\n"
                last_idx += 1

            if done:
                if err:
                    yield f"data: {json.dumps({'step': 'error', 'message': err})}\n\n"
                yield f"data: {json.dumps({'step': 'done'})}\n\n"
                break

            await asyncio.sleep(0.08)

    return StreamingResponse(
        gen(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.get("/api/runs/{run_id}/stream")
async def stream_run(run_id: str):
    return await _sse_generator(run_id)


@app.get("/api/stream")
async def api_stream(run_id: str):
    """Prompt 5 SSE alias: GET /api/stream?run_id=…"""
    return await _sse_generator(run_id)
