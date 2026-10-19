"""Verification and testing service for DevPilot.

Runs real, safe, non-arbitrary static verification checks on proposed code repairs:
1. Python AST Syntax Parsing Check
2. Static AST Re-Analysis Regression Check
3. Specific Vulnerability Eliminated Checks (Zero Division, Bare Except, Mutable Default, Identity)
4. Computes exact pass/fail status, delta in findings, and verification badge.
"""

import ast
import time
from typing import Dict, Any, List
from app.analyzers.ast_analyzer import analyze_python_code


def verify_proposed_repair(original_code: str, proposed_code: str) -> Dict[str, Any]:
    """
    Safely verify a proposed code fix without executing arbitrary user code.
    Runs real parser and AST static test suites.
    """
    checks_run: List[Dict[str, Any]] = []

    # Original analysis
    orig_result = analyze_python_code(original_code)
    orig_findings = orig_result["findings"]
    orig_error_count = orig_result["summary"]["error_count"]
    orig_total_count = orig_result["summary"]["total_findings"]

    # 1. AST Syntax Parsing Check
    t0 = time.perf_counter()
    syntax_valid = False
    syntax_details = ""
    try:
        ast.parse(proposed_code)
        syntax_valid = True
        syntax_details = "Python AST compiler successfully compiled proposed code with zero syntax errors."
    except SyntaxError as e:
        syntax_valid = False
        syntax_details = f"SyntaxError on line {e.lineno or 1}: {e.msg}"
    t1 = time.perf_counter()

    checks_run.append({
        "name": "AST Syntax Validation",
        "category": "syntax",
        "passed": syntax_valid,
        "details": syntax_details,
        "execution_time_ms": round((t1 - t0) * 1000, 2)
    })

    if not syntax_valid:
        return {
            "status": "failed",
            "syntax_valid": False,
            "original_issue_count": orig_total_count,
            "remaining_issue_count": 1,
            "resolved_issue_count": 0,
            "new_issues_introduced": 1,
            "details": f"Proposed code fails Python syntax validation: {syntax_details}",
            "checks_run": checks_run
        }

    # 2. Re-Analysis Static Check
    t0 = time.perf_counter()
    prop_result = analyze_python_code(proposed_code)
    prop_findings = prop_result["findings"]
    prop_error_count = prop_result["summary"]["error_count"]
    prop_total_count = prop_result["summary"]["total_findings"]
    t1 = time.perf_counter()

    # Calculate delta
    orig_rule_ids = [f.get("rule_id") for f in orig_findings]
    prop_rule_ids = [f.get("rule_id") for f in prop_findings]

    resolved_count = sum(1 for r in orig_rule_ids if r not in prop_rule_ids)
    new_issues = sum(1 for r in prop_rule_ids if r not in orig_rule_ids)

    checks_run.append({
        "name": "Static Regression Analysis",
        "category": "static_analysis",
        "passed": prop_error_count == 0 and new_issues == 0,
        "details": f"Original issues: {orig_total_count} -> Remaining issues: {prop_total_count}. Resolved: {resolved_count}, New issues: {new_issues}.",
        "execution_time_ms": round((t1 - t0) * 1000, 2)
    })

    # 3. Denominator Zero Division Safeguard Check
    t0 = time.perf_counter()
    has_zero_div = any(f.get("rule_id") == "ZERO_DIVISION" for f in prop_findings)
    t1 = time.perf_counter()
    checks_run.append({
        "name": "Zero Division Elimination",
        "category": "runtime_risk",
        "passed": not has_zero_div,
        "details": "Verified no literal zero denominators exist in arithmetic operations." if not has_zero_div else "Zero division risk still detected.",
        "execution_time_ms": round((t1 - t0) * 1000, 2)
    })

    # 4. Exception Handling Safety Check
    t0 = time.perf_counter()
    has_bare_except = any(f.get("rule_id") in ("BARE_EXCEPT", "BROAD_BASE_EXCEPTION") for f in prop_findings)
    t1 = time.perf_counter()
    checks_run.append({
        "name": "Safe Exception Handler Compliance",
        "category": "anti_pattern",
        "passed": not has_bare_except,
        "details": "Verified no bare or BaseException handlers exist." if not has_bare_except else "Bare exception handler still present.",
        "execution_time_ms": round((t1 - t0) * 1000, 2)
    })

    # 5. Mutable Argument Default Check
    t0 = time.perf_counter()
    has_mutable_default = any(f.get("rule_id") == "MUTABLE_DEFAULT_ARG" for f in prop_findings)
    t1 = time.perf_counter()
    checks_run.append({
        "name": "Immutable Function Signature Check",
        "category": "anti_pattern",
        "passed": not has_mutable_default,
        "details": "Verified all function signatures avoid mutable collection defaults." if not has_mutable_default else "Mutable default arguments detected.",
        "execution_time_ms": round((t1 - t0) * 1000, 2)
    })

    # Determine status
    if (prop_error_count == 0 and prop_total_count == 0) or (resolved_count > 0 and prop_error_count == 0 and new_issues == 0):
        status = "verified"
        details = "All targeted syntax and critical runtime issues have been successfully resolved and verified."
    elif resolved_count > 0 and (prop_total_count < orig_total_count or prop_error_count < orig_error_count):
        status = "partially_verified"
        details = f"{resolved_count} issue(s) resolved, but {prop_total_count} issue(s) still remain."
    elif prop_total_count == 0 and orig_total_count == 0:
        status = "verified"
        details = "Code is clean and syntax-valid."
    else:
        status = "unverified"
        details = "Proposed fix did not reduce the number of static analysis findings."

    return {
        "status": status,
        "syntax_valid": True,
        "original_issue_count": orig_total_count,
        "remaining_issue_count": prop_total_count,
        "resolved_issue_count": resolved_count,
        "new_issues_introduced": new_issues,
        "details": details,
        "checks_run": checks_run
    }
