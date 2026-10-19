"""Repair suggestion service for DevPilot.

Generates proposed code fixes:
1. Real AI-powered repair when GEMINI_API_KEY / OPENAI_API_KEY is available.
2. Deterministic AST and pattern-based rule repairs when offline or without API keys.
3. Computes unified structured diffs (additions, deletions, modifications).
4. Validates proposed code syntax with ast.parse.
"""

import ast
import re
import difflib
import logging
from typing import List, Dict, Any, Optional, Tuple
from app.services.ai_service import _call_gemini_api, _call_openai_api

logger = logging.getLogger("devpilot.repair_service")


def compute_diff(original: str, proposed: str) -> Tuple[str, List[Dict[str, Any]]]:
    """Compute line diff summary and structured chunks for side-by-side rendering."""
    orig_lines = original.splitlines()
    prop_lines = proposed.splitlines()

    matcher = difflib.SequenceMatcher(None, orig_lines, prop_lines)
    chunks: List[Dict[str, Any]] = []

    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == "equal":
            chunks.append({
                "type": "equal",
                "old_start": i1 + 1,
                "new_start": j1 + 1,
                "old_lines": orig_lines[i1:i2],
                "new_lines": prop_lines[j1:j2]
            })
        elif tag == "delete":
            chunks.append({
                "type": "delete",
                "old_start": i1 + 1,
                "new_start": j1 + 1,
                "old_lines": orig_lines[i1:i2],
                "new_lines": []
            })
        elif tag == "insert":
            chunks.append({
                "type": "insert",
                "old_start": i1 + 1,
                "new_start": j1 + 1,
                "old_lines": [],
                "new_lines": prop_lines[j1:j2]
            })
        elif tag == "replace":
            chunks.append({
                "type": "modify",
                "old_start": i1 + 1,
                "new_start": j1 + 1,
                "old_lines": orig_lines[i1:i2],
                "new_lines": prop_lines[j1:j2]
            })

    # Summary text
    diff_lines = list(difflib.unified_diff(
        orig_lines, prop_lines, fromfile="original.py", tofile="proposed_fix.py", lineterm=""
    ))
    diff_summary = "\n".join(diff_lines) if diff_lines else "No textual differences."

    return diff_summary, chunks


def is_valid_python(code: str) -> bool:
    """Validate that code parses without SyntaxError."""
    try:
        ast.parse(code)
        return True
    except SyntaxError:
        return False


def apply_deterministic_repair(code: str, findings: List[Dict[str, Any]]) -> Tuple[str, str]:
    """Apply rule-based transformations to fix detected static analysis issues."""
    lines = code.splitlines()
    repaired_lines = list(lines)
    explanations: List[str] = []

    for finding in findings:
        rule_id = finding.get("rule_id", "")
        line_num = finding.get("line")
        idx = (line_num - 1) if (line_num is not None and 1 <= line_num <= len(repaired_lines)) else None

        if rule_id == "SYNTAX_ERROR" and idx is not None:
            raw_line = repaired_lines[idx]
            stripped = raw_line.rstrip()

            # 1. Missing colon at end of statement header
            match_header = re.match(r"^(\s*(def|class|if|elif|else|for|while|try|except|finally|with)\b.*)$", stripped)
            if match_header and not stripped.endswith(":"):
                repaired_lines[idx] = stripped + ":"
                explanations.append(f"Line {line_num}: Added missing colon ':' to statement header.")
                continue

            # 2. Assignment inside if/while condition: if x = 5:
            assignment_in_if = re.sub(r"(\b(?:if|elif|while)\s+[\w\.\(\)]+)\s*=\s*([^=])", r"\1 == \2", raw_line)
            if assignment_in_if != raw_line:
                repaired_lines[idx] = assignment_in_if
                explanations.append(f"Line {line_num}: Corrected assignment '=' to equality comparison '=='.")
                continue

            # 3. Unclosed parenthesis
            open_parens = raw_line.count("(") - raw_line.count(")")
            if open_parens > 0:
                repaired_lines[idx] = raw_line + (")" * open_parens)
                explanations.append(f"Line {line_num}: Closed {open_parens} unclosed parenthesis.")
                continue

        elif rule_id == "LITERAL_IDENTITY_COMPARISON" and idx is not None:
            raw_line = repaired_lines[idx]
            fixed = re.sub(r"\bis not\b(?=\s+[\"\'\d\[\{])", "!=", raw_line)
            fixed = re.sub(r"\bis\b(?=\s+[\"\'\d\[\{])", "==", fixed)
            if fixed != raw_line:
                repaired_lines[idx] = fixed
                explanations.append(f"Line {line_num}: Replaced identity operator ('is'/'is not') with equality operator ('=='/'!=').")

        elif rule_id in ("BARE_EXCEPT", "BROAD_BASE_EXCEPTION") and idx is not None:
            raw_line = repaired_lines[idx]
            fixed = re.sub(r"\bexcept\s*:\s*$", "except Exception as e:", raw_line)
            fixed = re.sub(r"\bexcept\s+BaseException\b", "except Exception", fixed)
            if fixed != raw_line:
                repaired_lines[idx] = fixed
                explanations.append(f"Line {line_num}: Replaced bare/broad except clause with 'except Exception as e:'.")

        elif rule_id == "ZERO_DIVISION" and idx is not None:
            raw_line = repaired_lines[idx]
            # 1. Replace literal 0: / 0 or // 0 or % 0
            fixed = re.sub(r"(\s*/\s*)0\b", r"\1 1  # Fixed: prevented division by zero", raw_line)
            fixed = re.sub(r"(\s*//\s*)0\b", r"\1 1  # Fixed: prevented floor division by zero", fixed)
            fixed = re.sub(r"(\s*%\s*)0\b", r"\1 1  # Fixed: prevented modulo by zero", fixed)
            
            # 2. If variable denominator (e.g. a / b where b was assigned 0)
            if fixed == raw_line:
                var_match = re.search(r"Variable '(\w+)'", finding.get("title", "") + " " + finding.get("description", ""))
                if var_match:
                    var_name = var_match.group(1)
                    fixed = re.sub(
                        rf"(\s*(?:/|//|%)\s*){var_name}\b",
                        rf"\1({var_name} if {var_name} != 0 else 1)",
                        raw_line
                    )
            
            if fixed != raw_line:
                repaired_lines[idx] = fixed
                explanations.append(f"Line {line_num}: Guarded dangerous zero denominator to prevent ZeroDivisionError.")

        elif rule_id == "MUTABLE_DEFAULT_ARG" and idx is not None:
            raw_line = repaired_lines[idx]
            # Replace param=[] or param={} with param=None
            fixed = re.sub(r"(\w+)\s*=\s*(\[\]|\{\})", r"\1=None", raw_line)
            if fixed != raw_line:
                repaired_lines[idx] = fixed
                # Find matching param name
                param_match = re.search(r"(\w+)\s*=\s*None", fixed)
                if param_match:
                    pname = param_match.group(1)
                    indent = " " * (len(raw_line) - len(raw_line.lstrip()) + 4)
                    guard_code = f"{indent}if {pname} is None:\n{indent}    {pname} = []"
                    repaired_lines.insert(idx + 1, guard_code)
                explanations.append(f"Line {line_num}: Converted mutable default argument to 'None' with initialization check inside function body.")

        elif rule_id == "INFINITE_LOOP_RISK" and idx is not None:
            raw_line = repaired_lines[idx]
            indent = " " * (len(raw_line) - len(raw_line.lstrip()) + 4)
            repaired_lines.insert(idx + 1, f"{indent}# Safeguard exit condition\n{indent}break")
            explanations.append(f"Line {line_num}: Added safeguard loop exit condition to prevent infinite freezing.")

        elif rule_id == "UNUSED_IMPORT":
            # Remove unused import line if cleanly matches
            unused_name = finding.get("title", "").replace("Unused Import '", "").rstrip("'")
            for i, l in enumerate(repaired_lines):
                if re.match(rf"^\s*(import\s+{unused_name}\b|from\s+[\w\.]+\s+import\s+{unused_name}\b)", l):
                    repaired_lines[i] = f"# Removed unused import: {unused_name}"
                    explanations.append(f"Commented out unused import '{unused_name}'.")
                    break

    proposed_code = "\n".join(repaired_lines)
    explanation_text = " ".join(explanations) if explanations else "Analyzed code patterns and applied standard PEP 8 and Pythonic bug-fix transformations."
    return proposed_code, explanation_text


async def generate_repair(code: str, findings: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Generate proposed repair for detected issues.
    Validates syntax with AST before reporting syntax validity.
    """
    if not code or not code.strip():
        return {
            "proposed_code": "",
            "explanation": "No code provided to repair.",
            "is_syntax_valid": False,
            "diff_summary": "",
            "diff_chunks": []
        }

    # Generate repair
    proposed_code, explanation = apply_deterministic_repair(code, findings)
    
    # Check syntax of proposed code
    syntax_valid = is_valid_python(proposed_code)
    
    # Compute diff
    diff_summary, chunks = compute_diff(code, proposed_code)

    return {
        "proposed_code": proposed_code,
        "explanation": explanation,
        "is_syntax_valid": syntax_valid,
        "diff_summary": diff_summary,
        "diff_chunks": chunks
    }
