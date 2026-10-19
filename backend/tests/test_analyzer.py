"""Tests for DevPilot AST and Static Analyzer."""
import pytest
from app.analyzers.ast_analyzer import analyze_python_code


def test_syntax_error_detection():
    code = "def broken_func(\n    print('missing paren'"
    result = analyze_python_code(code)
    assert not result["summary"]["syntax_valid"]
    assert result["summary"]["error_count"] >= 1
    syntax_findings = [f for f in result["findings"] if f["rule_id"] == "SYNTAX_ERROR"]
    assert len(syntax_findings) >= 1
    assert syntax_findings[0]["is_confirmed"] is True
    assert syntax_findings[0]["severity"] == "error"
    assert syntax_findings[0]["line"] is not None


def test_zero_division_detection():
    code = "x = 10\ny = x / 0\nprint(y)"
    result = analyze_python_code(code)
    assert result["summary"]["syntax_valid"]
    zero_findings = [f for f in result["findings"] if f["rule_id"] == "ZERO_DIVISION"]
    assert len(zero_findings) == 1
    assert zero_findings[0]["severity"] == "error"
    assert zero_findings[0]["line"] == 2
    assert zero_findings[0]["is_confirmed"] is True


def test_literal_ten_divided_by_zero():
    """Regression test: literal 10 / 0 is detected."""
    code = "result = 10 / 0"
    result = analyze_python_code(code)
    zero_findings = [f for f in result["findings"] if f["rule_id"] == "ZERO_DIVISION"]
    assert len(zero_findings) == 1
    assert zero_findings[0]["severity"] == "error"
    assert zero_findings[0]["line"] == 1
    assert zero_findings[0]["is_confirmed"] is True
    assert "Definite Division" in zero_findings[0]["title"]


def test_variable_zero_division_detection():
    """Regression test: a = 10; b = 0; print(a / b) is detected."""
    code = "a = 10\nb = 0\nprint(a / b)"
    result = analyze_python_code(code)
    zero_findings = [f for f in result["findings"] if f["rule_id"] == "ZERO_DIVISION"]
    assert len(zero_findings) == 1
    finding = zero_findings[0]
    assert finding["severity"] == "error"
    assert finding["line"] == 3
    assert finding["is_confirmed"] is True
    assert "Variable 'b' = 0" in finding["title"]
    assert "ZeroDivisionError" in finding["description"]


def test_valid_division_not_flagged():
    """Regression test: 10 / 2 is not flagged for zero division."""
    code = "result = 10 / 2"
    result = analyze_python_code(code)
    zero_findings = [f for f in result["findings"] if f["rule_id"] == "ZERO_DIVISION"]
    assert len(zero_findings) == 0


def test_unknown_variable_divisor_not_flagged():
    """Regression test: an unknown variable divisor is NOT reported as confirmed zero division."""
    code = "def compute(a, b):\n    return a / b"
    result = analyze_python_code(code)
    zero_findings = [f for f in result["findings"] if f["rule_id"] == "ZERO_DIVISION"]
    assert len(zero_findings) == 0


def test_reassigned_variable_divisor_not_flagged():
    """Regression test: variable assigned 0 then reassigned non-zero is not flagged."""
    code = "a = 10\nb = 0\nb = 5\nprint(a / b)"
    result = analyze_python_code(code)
    zero_findings = [f for f in result["findings"] if f["rule_id"] == "ZERO_DIVISION"]
    assert len(zero_findings) == 0


def test_undefined_name_detection():
    code = "def calculate():\n    return non_existent_variable + 5"
    result = analyze_python_code(code)
    undef_findings = [f for f in result["findings"] if f["rule_id"] == "UNDEFINED_NAME"]
    assert len(undef_findings) == 1
    assert undef_findings[0]["severity"] == "error"
    assert "non_existent_variable" in undef_findings[0]["title"]


def test_mutable_default_argument():
    code = "def append_to(item, target_list=[]):\n    target_list.append(item)\n    return target_list"
    result = analyze_python_code(code)
    findings = [f for f in result["findings"] if f["rule_id"] == "MUTABLE_DEFAULT_ARG"]
    assert len(findings) == 1
    assert findings[0]["severity"] == "warning"
    assert "Mutable Default" in findings[0]["title"]


def test_bare_except_clause():
    code = "try:\n    num = int('abc')\nexcept:\n    print('error')"
    result = analyze_python_code(code)
    findings = [f for f in result["findings"] if f["rule_id"] == "BARE_EXCEPT"]
    assert len(findings) == 1
    assert findings[0]["severity"] == "warning"


def test_literal_identity_comparison():
    code = "status = 'active'\nif status is 'active':\n    print('ok')"
    result = analyze_python_code(code)
    findings = [f for f in result["findings"] if f["rule_id"] == "LITERAL_IDENTITY_COMPARISON"]
    assert len(findings) == 1
    assert findings[0]["severity"] == "warning"


def test_infinite_loop_risk():
    code = "while True:\n    print('heartbeat')"
    result = analyze_python_code(code)
    findings = [f for f in result["findings"] if f["rule_id"] == "INFINITE_LOOP_RISK"]
    assert len(findings) == 1
    assert findings[0]["severity"] == "warning"


def test_unreachable_code():
    code = "def get_val():\n    return 42\n    print('never reached')"
    result = analyze_python_code(code)
    findings = [f for f in result["findings"] if f["rule_id"] == "UNREACHABLE_CODE"]
    assert len(findings) == 1
    assert findings[0]["severity"] == "warning"


def test_clean_valid_code():
    code = "def add(a: int, b: int) -> int:\n    return a + b\n\nresult = add(2, 3)"
    result = analyze_python_code(code)
    assert result["summary"]["syntax_valid"] is True
    assert result["summary"]["error_count"] == 0
    assert result["summary"]["warning_count"] == 0


def test_empty_code_handling():
    result = analyze_python_code("")
    assert result["summary"]["total_findings"] == 1
    assert result["findings"][0]["rule_id"] == "EMPTY_SOURCE"
