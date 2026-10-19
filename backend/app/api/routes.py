"""API route endpoints for DevPilot."""
import uuid
import os
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query, status

from app.models.schemas import (
    AnalyzeRequest,
    AnalyzeResponse,
    RepairRequest,
    RepairResult,
    VerifyRequest,
    VerificationResult,
    DashboardMetrics,
    HistoryItem
)
from app.analyzers.ast_analyzer import analyze_python_code
from app.services.ai_service import generate_explanations
from app.services.repair_service import generate_repair
from app.services.verification_service import verify_proposed_repair
from app.database import db

router = APIRouter(prefix="/api", tags=["DevPilot Core API"])


@router.get("/health", summary="Health and status check")
async def health_check():
    """Returns application health and configured AI provider status (without exposing secrets)."""
    gemini_key = os.environ.get("GEMINI_API_KEY", "").strip()
    openai_key = os.environ.get("OPENAI_API_KEY", "").strip()
    
    ai_status = "None (Offline Rule-Based Mode)"
    if gemini_key:
        ai_status = "Google Gemini (Active)"
    elif openai_key:
        ai_status = "OpenAI (Active)"

    return {
        "status": "healthy",
        "service": "DevPilot AI Debugging Engine",
        "version": "1.0.0",
        "ai_provider_configured": bool(gemini_key or openai_key),
        "ai_provider_mode": ai_status,
        "database": "SQLite (Connected)"
    }


@router.post("/analyze", response_model=AnalyzeResponse, summary="Analyze Python code")
async def analyze_code_endpoint(req: AnalyzeRequest):
    """
    Submits Python code for full analysis:
    1. Static AST parsing & heuristic bug detection
    2. AI-powered or rule-based explanations
    3. Automated repair generation & syntax validation
    4. Safe regression verification
    5. Persistent storage in SQLite
    """
    if not req.code or not req.code.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Cannot analyze empty code. Please provide Python source code."
        )

    analysis_id = f"analysis-{uuid.uuid4().hex[:12]}"
    now_iso = datetime.now(timezone.utc).isoformat()

    # Step 1: Run static & AST analysis
    analysis_result = analyze_python_code(req.code)
    findings = analysis_result["findings"]
    summary_data = analysis_result["summary"]

    # Step 2: Generate explanations (AI or rule-based)
    explanations = []
    if req.request_ai and findings:
        explanations = await generate_explanations(req.code, findings)

    # Step 3: Generate proposed repair if issues were found
    repair_result = None
    verification_result = None
    if summary_data.get("has_repair", False):
        raw_repair = await generate_repair(req.code, findings)
        repair_result = RepairResult(**raw_repair)

        # Step 4: Verify proposed repair
        if repair_result.proposed_code:
            raw_verification = verify_proposed_repair(req.code, repair_result.proposed_code)
            verification_result = VerificationResult(**raw_verification)
            summary_data["verification_status"] = verification_result.status
        else:
            summary_data["verification_status"] = "unverified"
    else:
        summary_data["verification_status"] = "verified" if summary_data.get("syntax_valid") else "unverified"

    # Step 5: Save to SQLite database
    db.save_analysis(
        analysis_id=analysis_id,
        code=req.code,
        findings=findings,
        summary=summary_data,
        ai_explanations=explanations,
        suggested_repair=repair_result.model_dump() if repair_result else None,
        verification=verification_result.model_dump() if verification_result else None
    )

    return AnalyzeResponse(
        id=analysis_id,
        timestamp=now_iso,
        code=req.code,
        findings=findings,
        summary=summary_data,
        ai_explanations=explanations,
        suggested_repair=repair_result,
        verification=verification_result
    )


@router.post("/repair", response_model=RepairResult, summary="Generate code repair")
async def repair_code_endpoint(req: RepairRequest):
    """Generates a proposed fix and diff for provided Python code."""
    if not req.code or not req.code.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Cannot repair empty code."
        )

    analysis_result = analyze_python_code(req.code)
    findings = analysis_result["findings"]

    if req.finding_ids:
        findings = [f for f in findings if f["id"] in req.finding_ids]

    repair_data = await generate_repair(req.code, findings)
    return RepairResult(**repair_data)


@router.post("/verify", response_model=VerificationResult, summary="Verify proposed code repair")
async def verify_code_endpoint(req: VerifyRequest):
    """
    Safely verifies a proposed repair against the original code without running arbitrary code.
    Runs AST compiler validation and regression checks.
    """
    if not req.original_code or not req.proposed_code:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Both original_code and proposed_code are required for verification."
        )

    verification_data = verify_proposed_repair(req.original_code, req.proposed_code)
    return VerificationResult(**verification_data)


@router.get("/history", response_model=List[HistoryItem], summary="Get analysis history")
async def get_history_endpoint(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    search: Optional[str] = Query(None)
):
    """Retrieves paginated analysis history from SQLite."""
    items = db.list_analyses(limit=limit, offset=offset, search=search)
    return [HistoryItem(**i) for i in items]


@router.get("/history/{analysis_id}", response_model=AnalyzeResponse, summary="Get analysis by ID")
async def get_analysis_by_id_endpoint(analysis_id: str):
    """Retrieves full details of a past analysis run."""
    record = db.get_analysis(analysis_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Analysis '{analysis_id}' not found."
        )
    return AnalyzeResponse(**record)


@router.delete("/history/{analysis_id}", summary="Delete an analysis")
async def delete_analysis_endpoint(analysis_id: str):
    """Deletes an analysis record from SQLite."""
    deleted = db.delete_analysis(analysis_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Analysis '{analysis_id}' not found."
        )
    return {"success": True, "message": f"Analysis '{analysis_id}' deleted successfully."}


@router.get("/dashboard", response_model=DashboardMetrics, summary="Get dashboard metrics")
async def get_dashboard_metrics_endpoint():
    """Retrieves real aggregated analysis and bug metrics from SQLite."""
    metrics_data = db.get_dashboard_metrics()
    return DashboardMetrics(**metrics_data)
