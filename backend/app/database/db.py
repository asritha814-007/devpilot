"""SQLite database manager for DevPilot."""
import os
import json
import sqlite3
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone

DB_FILE = os.environ.get("DATABASE_PATH", "devpilot.db")


def get_connection(db_path: str = None) -> sqlite3.Connection:
    """Get a SQLite database connection with row factory enabled."""
    path = db_path or DB_FILE
    conn = sqlite3.connect(path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db(db_path: str = None) -> None:
    """Initialize SQLite database tables and indices."""
    conn = get_connection(db_path)
    with conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS analyses (
                id TEXT PRIMARY KEY,
                created_at TEXT NOT NULL,
                code TEXT NOT NULL,
                code_preview TEXT NOT NULL,
                summary_json TEXT NOT NULL,
                findings_json TEXT NOT NULL,
                ai_explanations_json TEXT,
                suggested_repair_json TEXT,
                verification_json TEXT,
                has_ai INTEGER DEFAULT 0,
                has_repair INTEGER DEFAULT 0,
                verification_status TEXT DEFAULT 'unverified',
                total_findings INTEGER DEFAULT 0,
                error_count INTEGER DEFAULT 0,
                warning_count INTEGER DEFAULT 0,
                info_count INTEGER DEFAULT 0,
                syntax_valid INTEGER DEFAULT 1
            )
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at DESC)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_analyses_status ON analyses(verification_status)")
    conn.close()


def save_analysis(
    analysis_id: str,
    code: str,
    findings: List[Dict[str, Any]],
    summary: Dict[str, Any],
    ai_explanations: List[Dict[str, Any]],
    suggested_repair: Optional[Dict[str, Any]],
    verification: Optional[Dict[str, Any]],
    db_path: str = None
) -> str:
    """Store an analysis run in the database."""
    conn = get_connection(db_path)
    now_iso = datetime.now(timezone.utc).isoformat()
    
    code_lines = [l for l in code.strip().splitlines() if l.strip()]
    code_preview = (code_lines[0][:120] + "...") if code_lines else "Empty script"

    has_ai = 1 if (ai_explanations and any(a.get("is_ai_generated") for a in ai_explanations)) else 0
    has_repair = 1 if suggested_repair is not None else 0
    ver_status = (verification.get("status") if verification else "unverified") or "unverified"

    with conn:
        conn.execute("""
            INSERT OR REPLACE INTO analyses (
                id, created_at, code, code_preview, summary_json, findings_json,
                ai_explanations_json, suggested_repair_json, verification_json,
                has_ai, has_repair, verification_status,
                total_findings, error_count, warning_count, info_count, syntax_valid
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            analysis_id,
            now_iso,
            code,
            code_preview,
            json.dumps(summary),
            json.dumps(findings),
            json.dumps(ai_explanations or []),
            json.dumps(suggested_repair) if suggested_repair else None,
            json.dumps(verification) if verification else None,
            has_ai,
            has_repair,
            ver_status,
            summary.get("total_findings", len(findings)),
            summary.get("error_count", 0),
            summary.get("warning_count", 0),
            summary.get("info_count", 0),
            1 if summary.get("syntax_valid", True) else 0
        ))
    conn.close()
    return analysis_id


def get_analysis(analysis_id: str, db_path: str = None) -> Optional[Dict[str, Any]]:
    """Retrieve full analysis details by ID."""
    conn = get_connection(db_path)
    cur = conn.cursor()
    cur.execute("SELECT * FROM analyses WHERE id = ?", (analysis_id,))
    row = cur.fetchone()
    conn.close()
    if not row:
        return None

    return {
        "id": row["id"],
        "timestamp": row["created_at"],
        "code": row["code"],
        "summary": json.loads(row["summary_json"]),
        "findings": json.loads(row["findings_json"]),
        "ai_explanations": json.loads(row["ai_explanations_json"] or "[]"),
        "suggested_repair": json.loads(row["suggested_repair_json"]) if row["suggested_repair_json"] else None,
        "verification": json.loads(row["verification_json"]) if row["verification_json"] else None
    }


def list_analyses(limit: int = 50, offset: int = 0, search: Optional[str] = None, db_path: str = None) -> List[Dict[str, Any]]:
    """List recent analyses for history view."""
    conn = get_connection(db_path)
    cur = conn.cursor()
    
    if search and search.strip():
        term = f"%{search.strip()}%"
        cur.execute("""
            SELECT id, created_at, code_preview, total_findings, error_count,
                   warning_count, info_count, syntax_valid, verification_status,
                   has_repair, has_ai
            FROM analyses
            WHERE code LIKE ? OR findings_json LIKE ?
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        """, (term, term, limit, offset))
    else:
        cur.execute("""
            SELECT id, created_at, code_preview, total_findings, error_count,
                   warning_count, info_count, syntax_valid, verification_status,
                   has_repair, has_ai
            FROM analyses
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        """, (limit, offset))
        
    rows = cur.fetchall()
    conn.close()

    return [
        {
            "id": r["id"],
            "timestamp": r["created_at"],
            "code_preview": r["code_preview"],
            "total_findings": r["total_findings"],
            "error_count": r["error_count"],
            "warning_count": r["warning_count"],
            "info_count": r["info_count"],
            "syntax_valid": bool(r["syntax_valid"]),
            "verification_status": r["verification_status"],
            "has_repair": bool(r["has_repair"]),
            "has_ai": bool(r["has_ai"]),
        }
        for r in rows
    ]


def delete_analysis(analysis_id: str, db_path: str = None) -> bool:
    """Delete an analysis run from SQLite."""
    conn = get_connection(db_path)
    with conn:
        cur = conn.cursor()
        cur.execute("DELETE FROM analyses WHERE id = ?", (analysis_id,))
        deleted = cur.rowcount > 0
    conn.close()
    return deleted


def get_dashboard_metrics(db_path: str = None) -> Dict[str, Any]:
    """Calculate and return real metrics from analyses."""
    conn = get_connection(db_path)
    cur = conn.cursor()

    cur.execute("SELECT COUNT(*) FROM analyses")
    total_analyses = cur.fetchone()[0] or 0

    if total_analyses == 0:
        conn.close()
        return {
            "total_analyses": 0,
            "total_issues_found": 0,
            "total_errors": 0,
            "total_warnings": 0,
            "total_info": 0,
            "syntax_error_rate": 0.0,
            "verified_rate": 0.0,
            "categories": {},
            "recent_analyses": []
        }

    cur.execute("""
        SELECT 
            SUM(total_findings) as total_findings,
            SUM(error_count) as total_errors,
            SUM(warning_count) as total_warnings,
            SUM(info_count) as total_info,
            SUM(CASE WHEN syntax_valid = 0 THEN 1 ELSE 0 END) as syntax_errors,
            SUM(CASE WHEN verification_status = 'verified' THEN 1 ELSE 0 END) as verified_count
        FROM analyses
    """)
    stats = cur.fetchone()

    total_findings = stats["total_findings"] or 0
    total_errors = stats["total_errors"] or 0
    total_warnings = stats["total_warnings"] or 0
    total_info = stats["total_info"] or 0
    syntax_errors = stats["syntax_errors"] or 0
    verified_count = stats["verified_count"] or 0

    syntax_rate = round((syntax_errors / total_analyses) * 100, 1) if total_analyses else 0.0
    verified_rate = round((verified_count / total_analyses) * 100, 1) if total_analyses else 0.0

    # Aggregate categories from recent findings_json
    cur.execute("SELECT findings_json FROM analyses ORDER BY created_at DESC LIMIT 50")
    recent_findings_rows = cur.fetchall()
    categories: Dict[str, int] = {}
    for row in recent_findings_rows:
        try:
            items = json.loads(row["findings_json"])
            for item in items:
                cat = item.get("category", "other")
                categories[cat] = categories.get(cat, 0) + 1
        except Exception:
            pass

    conn.close()

    recent = list_analyses(limit=5, offset=0, db_path=db_path)

    return {
        "total_analyses": total_analyses,
        "total_issues_found": total_findings,
        "total_errors": total_errors,
        "total_warnings": total_warnings,
        "total_info": total_info,
        "syntax_error_rate": syntax_rate,
        "verified_rate": verified_rate,
        "categories": categories,
        "recent_analyses": recent
    }
