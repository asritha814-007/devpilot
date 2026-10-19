"""Pydantic models and schemas for DevPilot."""
from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field


class Finding(BaseModel):
    """Represents a single static or AST analysis finding."""
    id: str = Field(..., description="Unique finding ID")
    rule_id: str = Field(..., description="Rule identifier, e.g. SYNTAX_ERROR, ZERO_DIVISION")
    title: str = Field(..., description="Human-readable title of the issue")
    description: str = Field(..., description="Clear explanation of why this occurs")
    severity: Literal["error", "warning", "info"] = Field(..., description="Severity level")
    line: Optional[int] = Field(None, description="1-indexed line number if available")
    col: Optional[int] = Field(None, description="0-indexed column offset if available")
    end_line: Optional[int] = Field(None, description="Ending line number if applicable")
    category: str = Field(..., description="Category: syntax, runtime_risk, semantic, code_quality, anti_pattern")
    suggested_action: str = Field(..., description="Immediate suggested next step")
    code_snippet: Optional[str] = Field(None, description="Relevant source line or fragment")
    is_confirmed: bool = Field(True, description="True if confirmed (e.g. AST syntax error), False if heuristic")


class DiffChunk(BaseModel):
    """Represents a unified difference block between original and proposed code."""
    type: Literal["equal", "delete", "insert", "modify"]
    old_start: int
    new_start: int
    old_lines: List[str]
    new_lines: List[str]


class RepairResult(BaseModel):
    """Details of a proposed code fix."""
    proposed_code: str
    explanation: str
    is_syntax_valid: bool
    diff_summary: str
    diff_chunks: List[DiffChunk] = []


class StaticCheckResult(BaseModel):
    """Outcome of an individual static check in the test suite."""
    name: str
    category: str
    passed: bool
    details: str
    execution_time_ms: float = 0.0


class VerificationResult(BaseModel):
    """Comprehensive verification outcome for a proposed repair."""
    status: Literal["verified", "partially_verified", "unverified", "failed"]
    syntax_valid: bool
    original_issue_count: int
    remaining_issue_count: int
    resolved_issue_count: int
    new_issues_introduced: int
    details: str
    checks_run: List[StaticCheckResult] = []


class AIExplanation(BaseModel):
    """AI-powered structured explanation."""
    issue_id: Optional[str] = None
    summary: str
    why_it_happened: str
    how_to_fix: str
    beginner_tip: str
    provider: str = "DevPilot Engine"
    is_ai_generated: bool = False


class AnalyzeRequest(BaseModel):
    """Request payload to analyze Python source code."""
    code: str = Field(..., min_length=1, description="Python source code to analyze")
    filename: Optional[str] = Field("script.py", description="Virtual file name")
    request_ai: bool = Field(True, description="Whether to generate AI explanation/repair")


class RepairRequest(BaseModel):
    """Request payload to repair specific or all findings in code."""
    code: str = Field(..., min_length=1)
    finding_ids: Optional[List[str]] = None


class VerifyRequest(BaseModel):
    """Request payload to verify a proposed fix against the original code."""
    original_code: str = Field(..., min_length=1)
    proposed_code: str = Field(..., min_length=1)


class AnalysisSummary(BaseModel):
    total_findings: int
    error_count: int
    warning_count: int
    info_count: int
    syntax_valid: bool
    has_repair: bool
    verification_status: str


class AnalyzeResponse(BaseModel):
    """Full analysis response returned by DevPilot."""
    id: str
    timestamp: str
    code: str
    findings: List[Finding]
    summary: AnalysisSummary
    ai_explanations: List[AIExplanation] = []
    suggested_repair: Optional[RepairResult] = None
    verification: Optional[VerificationResult] = None


class HistoryItem(BaseModel):
    """Summary item for the analysis history list."""
    id: str
    timestamp: str
    code_preview: str
    total_findings: int
    error_count: int
    warning_count: int
    info_count: int
    syntax_valid: bool
    verification_status: str
    has_repair: bool
    has_ai: bool


class DashboardMetrics(BaseModel):
    """Real aggregated metrics from SQLite."""
    total_analyses: int
    total_issues_found: int
    total_errors: int
    total_warnings: int
    total_info: int
    syntax_error_rate: float
    verified_rate: float
    categories: Dict[str, int]
    recent_analyses: List[HistoryItem]
