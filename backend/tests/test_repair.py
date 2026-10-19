"""Tests for DevPilot Repair and Verification Engines."""
import asyncio
import pytest
from app.analyzers.ast_analyzer import analyze_python_code
from app.services.repair_service import generate_repair, compute_diff, is_valid_python
from app.services.verification_service import verify_proposed_repair


def test_repair_missing_colon():
    bad_code = "def calculate_total(a, b)\n    return a + b"
    analysis = analyze_python_code(bad_code)
    repair = asyncio.run(generate_repair(bad_code, analysis["findings"]))
    
    assert repair["is_syntax_valid"] is True
    assert "def calculate_total(a, b):" in repair["proposed_code"]
    assert len(repair["diff_chunks"]) > 0


def test_repair_literal_identity():
    bad_code = "mode = 'fast'\nif mode is 'fast':\n    pass"
    analysis = analyze_python_code(bad_code)
    repair = asyncio.run(generate_repair(bad_code, analysis["findings"]))
    
    assert repair["is_syntax_valid"] is True
    assert "if mode == 'fast':" in repair["proposed_code"]


def test_repair_bare_except():
    bad_code = "try:\n    x = 1\nexcept:\n    pass"
    analysis = analyze_python_code(bad_code)
    repair = asyncio.run(generate_repair(bad_code, analysis["findings"]))
    
    assert repair["is_syntax_valid"] is True
    assert "except Exception as e:" in repair["proposed_code"]


def test_repair_variable_zero_division():
    bad_code = "a = 10\nb = 0\nprint(a / b)"
    analysis = analyze_python_code(bad_code)
    repair = asyncio.run(generate_repair(bad_code, analysis["findings"]))
    
    assert repair["is_syntax_valid"] is True
    assert "b != 0" in repair["proposed_code"] or "b if b != 0 else 1" in repair["proposed_code"]
    ver_result = verify_proposed_repair(bad_code, repair["proposed_code"])
    assert ver_result["syntax_valid"] is True
    assert ver_result["status"] == "verified"


def test_verification_success():
    orig_code = "status = 'ready'\ndef proceed(): pass\nif status is 'ready':\n    proceed()"
    prop_code = "status = 'ready'\ndef proceed(): pass\nif status == 'ready':\n    proceed()"
    
    ver_res = verify_proposed_repair(orig_code, prop_code)
    assert ver_res["syntax_valid"] is True
    assert ver_res["status"] == "verified"
    assert ver_res["resolved_issue_count"] >= 1
    assert any(c["name"] == "AST Syntax Validation" and c["passed"] for c in ver_res["checks_run"])


def test_verification_syntax_failure():
    orig_code = "x = 5"
    bad_prop_code = "def incomplete("
    
    ver_res = verify_proposed_repair(orig_code, bad_prop_code)
    assert ver_res["syntax_valid"] is False
    assert ver_res["status"] == "failed"
