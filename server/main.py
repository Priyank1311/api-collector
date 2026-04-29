from __future__ import annotations

import json
import os
import sqlite3
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Literal

import httpx
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel, Field


HttpMethod = Literal["GET", "POST", "PUT", "PATCH", "DELETE"]


class KeyValueRow(BaseModel):
    key: str = ""
    value: str = ""


class ProxyRequest(BaseModel):
    method: HttpMethod
    url: str
    params: list[KeyValueRow] = Field(default_factory=list)
    headers: list[KeyValueRow] = Field(default_factory=list)
    body: str = ""
    timeoutMs: int = 15000


class ProxySuccess(BaseModel):
    kind: Literal["success"] = "success"
    status: int
    statusText: str = ""
    timeMs: int
    headers: dict[str, str]
    data: Any


class ProxyError(BaseModel):
    kind: Literal["error"] = "error"
    message: str
    status: int | None = None
    timeMs: int | None = None
    data: Any | None = None


ProxyResponse = ProxySuccess | ProxyError


class WorkspaceSnapshot(BaseModel):
    collections: Any = Field(default_factory=list)
    activeCollectionId: str | None = None
    # Draft is intentionally not persisted; frontend uses an in-memory draft.
    draft: Any | None = None
    updatedAt: str | None = None


BASE_DIR = Path(__file__).resolve().parent
TEMPLATES_DIR = BASE_DIR / "templates"
DB_PATH = Path(os.getenv("DB_PATH", str(BASE_DIR / "data.sqlite3")))

templates = Jinja2Templates(directory=str(TEMPLATES_DIR))
security = HTTPBasic()


def _now_iso() -> str:
    return datetime.now(tz=timezone.utc).isoformat()


def _db() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    return con


def _cors_origins() -> list[str]:
    defaults = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    raw = os.getenv("CORS_ORIGINS", "").strip()
    if not raw:
        return defaults
    configured = [origin.strip().rstrip("/") for origin in raw.split(",") if origin.strip()]
    if "*" in configured:
        return ["*"]
    return [*defaults, *configured]


def _init_db() -> None:
    con = _db()
    try:
        con.execute(
            """
            CREATE TABLE IF NOT EXISTS proxy_logs (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              ts TEXT NOT NULL,
              method TEXT NOT NULL,
              url TEXT NOT NULL,
              status INTEGER,
              time_ms INTEGER,
              ok INTEGER NOT NULL,
              error_message TEXT,
              request_headers TEXT,
              request_params TEXT,
              request_body TEXT,
              response_headers TEXT,
              response_body TEXT
            )
            """
        )
        con.execute(
            """
            CREATE TABLE IF NOT EXISTS workspace (
              id INTEGER PRIMARY KEY CHECK (id = 1),
              ts TEXT NOT NULL,
              snapshot_json TEXT NOT NULL
            )
            """
        )
        con.commit()
    finally:
        con.close()


def _require_admin(creds: HTTPBasicCredentials = Depends(security)) -> str:
    user = os.getenv("ADMIN_USER", "admin")
    pw = os.getenv("ADMIN_PASSWORD", "admin")
    if creds.username != user or creds.password != pw:
        raise HTTPException(
            status_code=401,
            detail="Unauthorized",
            headers={"WWW-Authenticate": "Basic"},
        )
    return creds.username


def _rows_to_dict(rows: list[KeyValueRow]) -> dict[str, str]:
    out: dict[str, str] = {}
    for row in rows:
        k = row.key.strip()
        if not k:
            continue
        out[k] = row.value
    return out


def _insert_proxy_log(
    *,
    method: str,
    url: str,
    ok: bool,
    status: int | None,
    time_ms: int | None,
    error_message: str | None,
    request_headers: dict[str, str],
    request_params: dict[str, str],
    request_body: str,
    response_headers: dict[str, str] | None,
    response_body: str | None,
) -> None:
    con = _db()
    try:
        con.execute(
            """
            INSERT INTO proxy_logs (
              ts, method, url, status, time_ms, ok, error_message,
              request_headers, request_params, request_body,
              response_headers, response_body
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                _now_iso(),
                method,
                url,
                status,
                time_ms,
                1 if ok else 0,
                error_message,
                json.dumps(request_headers),
                json.dumps(request_params),
                request_body,
                json.dumps(response_headers) if response_headers is not None else None,
                response_body,
            ),
        )
        con.commit()
    finally:
        con.close()


def _get_latest_workspace() -> WorkspaceSnapshot | None:
    con = _db()
    try:
        row = con.execute("SELECT ts, snapshot_json FROM workspace WHERE id = 1").fetchone()
        if not row:
            return None
        snapshot = json.loads(row["snapshot_json"])
        if isinstance(snapshot, dict):
            snapshot["updatedAt"] = row["ts"]
        return WorkspaceSnapshot(**snapshot)
    finally:
        con.close()


def _save_workspace(snapshot: WorkspaceSnapshot) -> WorkspaceSnapshot:
    con = _db()
    ts = _now_iso()
    payload = snapshot.model_dump()
    payload["updatedAt"] = ts
    try:
        con.execute(
            """
            INSERT INTO workspace (id, ts, snapshot_json)
            VALUES (1, ?, ?)
            ON CONFLICT(id) DO UPDATE SET ts = excluded.ts, snapshot_json = excluded.snapshot_json
            """,
            (ts, json.dumps(payload)),
        )
        con.commit()
    finally:
        con.close()
    return WorkspaceSnapshot(**payload)


app = FastAPI(title="API Collection Runner Backend", version="0.2.0")
cors_origins = _cors_origins()

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials="*" not in cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _startup():
    _init_db()


@app.get("/health")
def health():
    return {"ok": True}


@app.get("/demo/users")
def demo_users():
    return [{"id": 1, "name": "Ada Lovelace"}, {"id": 2, "name": "Alan Turing"}]


@app.post("/proxy", response_model=ProxyResponse)
async def proxy(req: ProxyRequest):
    url = req.url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="url is required")

    started = time.perf_counter()
    req_headers = _rows_to_dict(req.headers)
    req_params = _rows_to_dict(req.params)
    req_body = req.body or ""

    try:
        timeout = httpx.Timeout(max(1.0, req.timeoutMs / 1000.0))
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
            json_body: Any | None = None
            raw_body: bytes | None = None
            if req.method in ("POST", "PUT", "PATCH"):
                body_trimmed = req_body.strip()
                if body_trimmed:
                    try:
                        json_body = json.loads(body_trimmed)
                    except Exception:
                        raw_body = body_trimmed.encode("utf-8")

            res = await client.request(
                method=req.method,
                url=url,
                params=req_params,
                headers=req_headers,
                json=json_body,
                content=raw_body,
            )

        elapsed_ms = int(round((time.perf_counter() - started) * 1000))
        response_headers = {k: v for k, v in res.headers.items()}

        try:
            data: Any = res.json()
            response_body_text = json.dumps(data)[:200_000]
        except Exception:
            data = res.text
            response_body_text = str(data)[:200_000]

        ok = res.status_code < 400
        _insert_proxy_log(
            method=req.method,
            url=url,
            ok=ok,
            status=res.status_code,
            time_ms=elapsed_ms,
            error_message=None if ok else f"Request failed with status {res.status_code}.",
            request_headers=req_headers,
            request_params=req_params,
            request_body=req_body[:200_000],
            response_headers=response_headers,
            response_body=response_body_text,
        )

        if not ok:
            return ProxyError(
                message=f"Request failed with status {res.status_code}.",
                status=res.status_code,
                timeMs=elapsed_ms,
                data=data,
            )

        return ProxySuccess(
            status=res.status_code,
            statusText=res.reason_phrase or "",
            timeMs=elapsed_ms,
            headers=response_headers,
            data=data,
        )
    except httpx.TimeoutException:
        elapsed_ms = int(round((time.perf_counter() - started) * 1000))
        _insert_proxy_log(
            method=req.method,
            url=url,
            ok=False,
            status=None,
            time_ms=elapsed_ms,
            error_message="Request timed out.",
            request_headers=req_headers,
            request_params=req_params,
            request_body=req_body[:200_000],
            response_headers=None,
            response_body=None,
        )
        return ProxyError(message="Request timed out.", timeMs=elapsed_ms)
    except httpx.RequestError as e:
        elapsed_ms = int(round((time.perf_counter() - started) * 1000))
        _insert_proxy_log(
            method=req.method,
            url=url,
            ok=False,
            status=None,
            time_ms=elapsed_ms,
            error_message=f"Network error: {e}",
            request_headers=req_headers,
            request_params=req_params,
            request_body=req_body[:200_000],
            response_headers=None,
            response_body=None,
        )
        return ProxyError(message=f"Network error: {e}", timeMs=elapsed_ms)


# -------- Workspace persistence API (used by the frontend) --------


@app.get("/api/workspace", response_model=WorkspaceSnapshot)
def get_workspace():
    snap = _get_latest_workspace()
    return snap or WorkspaceSnapshot(updatedAt=None)


@app.put("/api/workspace", response_model=WorkspaceSnapshot)
def put_workspace(snapshot: WorkspaceSnapshot):
    return _save_workspace(snapshot)


@app.get("/api/logs")
def get_logs(limit: int = 50):
    limit = max(1, min(limit, 500))
    con = _db()
    try:
        rows = con.execute(
            "SELECT id, ts, method, url, status, time_ms, ok, error_message FROM proxy_logs ORDER BY id DESC LIMIT ?",
            (limit,),
        ).fetchall()
        return {"items": [dict(r) for r in rows]}
    finally:
        con.close()


# -------- Admin dashboard (server-rendered + auth) --------


@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse(url="/admin")


@app.get("/admin", response_class=HTMLResponse, include_in_schema=False)
def admin_home(request: Request, _: str = Depends(_require_admin)):
    snap = _get_latest_workspace()
    con = _db()
    try:
        logs = con.execute(
            "SELECT id, ts, method, url, status, time_ms, ok, error_message FROM proxy_logs ORDER BY id DESC LIMIT 50"
        ).fetchall()
    finally:
        con.close()
    return templates.TemplateResponse(
        request=request,
        name="admin.html",
        context={
            "request": request,
            "workspace": snap.model_dump() if snap else None,
            "logs": [dict(r) for r in logs],
            "updatedAt": snap.updatedAt if snap else None,
        },
    )
