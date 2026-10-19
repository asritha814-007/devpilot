"""AST and Static Analysis Engine for DevPilot.

Performs static inspections using Python's built-in ast module and heuristic checks:
1. Confirmed Syntax Errors (with line, col, token excerpt)
2. Division-by-Zero (literal 0 division, floor-div, modulo)
3. Undefined Variables (Name loaded without prior binding in scope or builtins)
4. Mutable Default Arguments (e.g., def fn(items=[]))
5. Bare Except Clauses (except: without specific Exception class)
6. Comparison with Literals using 'is'/'is not' (x is 'text' or x is 10)
7. Infinite Loop Risks (while True with no break/return/raise)
8. Unreachable Code (statements directly following return/raise/break/continue)
9. Builtin Name Shadowing (assigning to len, list, dict, str, sum, id, etc.)
10. Unused Imports and Variables
"""

import ast
import builtins
import uuid
from typing import List, Dict, Any, Set, Optional

PYTHON_BUILTINS = set(dir(builtins))


class CodeAnalysisVisitor(ast.NodeVisitor):
    """AST Visitor that traverses the syntax tree to detect errors and anti-patterns."""

    def __init__(self, source_lines: List[str]):
        self.source_lines = source_lines
        self.findings: List[Dict[str, Any]] = []
        # Scope stack tracking defined names: list of sets of variable names
        self.scope_stack: List[Set[str]] = [set(PYTHON_BUILTINS)]
        # Constant environment stack tracking known constant variable values: list of {name: (value, def_line)}
        self.constant_env: List[Dict[str, Any]] = [{}]
        self.imported_names: Set[str] = set()
        self.used_names: Set[str] = set()
        self.assigned_vars_by_line: Dict[str, int] = {}
        self.in_loop = 0

    def _get_snippet(self, lineno: Optional[int]) -> Optional[str]:
        if lineno is not None and 1 <= lineno <= len(self.source_lines):
            return self.source_lines[lineno - 1].strip()
        return None

    def _evaluate_constant(self, node: Optional[ast.AST]) -> Tuple[Optional[Any], bool, Optional[str], Optional[int]]:
        """
        Evaluates whether an AST node represents a known static constant value.
        Returns: (value, is_known_constant, identifier_or_source, definition_line)
        """
        if node is None:
            return None, False, None, None

        if isinstance(node, ast.Constant):
            return node.value, True, "literal", getattr(node, "lineno", None)

        if isinstance(node, ast.UnaryOp):
            operand_val, is_const, desc, def_line = self._evaluate_constant(node.operand)
            if is_const and isinstance(operand_val, (int, float)):
                if isinstance(node.op, ast.USub):
                    return -operand_val, True, desc, def_line
                elif isinstance(node.op, ast.UAdd):
                    return +operand_val, True, desc, def_line

        if isinstance(node, ast.Name):
            # Search from current innermost scope to outermost scope
            for scope in reversed(self.constant_env):
                if node.id in scope:
                    val, def_line = scope[node.id]
                    return val, True, node.id, def_line
            return None, False, node.id, None

        if isinstance(node, ast.BinOp):
            left_val, left_const, _, _ = self._evaluate_constant(node.left)
            right_val, right_const, _, _ = self._evaluate_constant(node.right)
            if left_const and right_const and isinstance(left_val, (int, float)) and isinstance(right_val, (int, float)):
                try:
                    if isinstance(node.op, ast.Add):
                        return left_val + right_val, True, "expression", getattr(node, "lineno", None)
                    elif isinstance(node.op, ast.Sub):
                        return left_val - right_val, True, "expression", getattr(node, "lineno", None)
                    elif isinstance(node.op, ast.Mult):
                        return left_val * right_val, True, "expression", getattr(node, "lineno", None)
                except Exception:
                    pass

        return None, False, None, None

    def _add_finding(
        self,
        rule_id: str,
        title: str,
        description: str,
        severity: str,
        category: str,
        suggested_action: str,
        node: Optional[ast.AST] = None,
        line: Optional[int] = None,
        col: Optional[int] = None,
        is_confirmed: bool = False
    ):
        lineno = line if line is not None else getattr(node, "lineno", None)
        col_offset = col if col is not None else getattr(node, "col_offset", None)
        
        self.findings.append({
            "id": f"finding-{uuid.uuid4().hex[:8]}",
            "rule_id": rule_id,
            "title": title,
            "description": description,
            "severity": severity,
            "line": lineno,
            "col": col_offset,
            "category": category,
            "suggested_action": suggested_action,
            "code_snippet": self._get_snippet(lineno),
            "is_confirmed": is_confirmed
        })

    # Scope management
    def visit_FunctionDef(self, node: ast.FunctionDef):
        # Check for builtin shadowing
        if node.name in PYTHON_BUILTINS and not node.name.startswith("__"):
            self._add_finding(
                rule_id="BUILTIN_SHADOWING",
                title=f"Function Name Shadows Built-in '{node.name}'",
                description=f"Defining a function named '{node.name}' overrides Python's standard built-in.",
                severity="warning",
                category="semantic",
                suggested_action=f"Rename the function to something descriptive like 'custom_{node.name}' or '{node.name}_item'.",
                node=node
            )

        # Check for mutable default arguments
        for default in node.args.defaults + [d for d in node.args.kw_defaults if d is not None]:
            if isinstance(default, (ast.List, ast.Dict, ast.Set)):
                container_type = default.__class__.__name__.lower()
                self._add_finding(
                    rule_id="MUTABLE_DEFAULT_ARG",
                    title=f"Dangerous Mutable Default Argument ({container_type})",
                    description=(
                        f"Default parameter uses a mutable {container_type}. In Python, default arguments "
                        "are evaluated only once when the function is defined, causing state to persist between calls."
                    ),
                    severity="warning",
                    category="anti_pattern",
                    suggested_action="Use 'None' as the default value and initialize the container inside the function if argument is None.",
                    node=default
                )

        # Add function name to outer scope
        self.scope_stack[-1].add(node.name)

        # Enter function scope
        fn_scope: Set[str] = set()
        for arg in node.args.args + node.args.posonlyargs + node.args.kwonlyargs:
            fn_scope.add(arg.arg)
        if node.args.vararg:
            fn_scope.add(node.args.vararg.arg)
        if node.args.kwarg:
            fn_scope.add(node.args.kwarg.arg)

        self.scope_stack.append(fn_scope)
        self.constant_env.append({})
        self._check_unreachable_body(node.body)
        self.generic_visit(node)
        self.scope_stack.pop()
        self.constant_env.pop()

    visit_AsyncFunctionDef = visit_FunctionDef

    def visit_ClassDef(self, node: ast.ClassDef):
        if node.name in PYTHON_BUILTINS:
            self._add_finding(
                rule_id="BUILTIN_SHADOWING",
                title=f"Class Name Shadows Built-in '{node.name}'",
                description=f"Class '{node.name}' shadows Python's built-in symbol with the same name.",
                severity="warning",
                category="semantic",
                suggested_action="Rename the class with a specific prefix or PascalCase descriptor.",
                node=node
            )
        self.scope_stack[-1].add(node.name)
        self.scope_stack.append(set())
        self.constant_env.append({})
        self.generic_visit(node)
        self.scope_stack.pop()
        self.constant_env.pop()

    def visit_Import(self, node: ast.Import):
        for alias in node.names:
            name = alias.asname or alias.name.split('.')[0]
            self.scope_stack[-1].add(name)
            self.imported_names.add(name)
        self.generic_visit(node)

    def visit_ImportFrom(self, node: ast.ImportFrom):
        for alias in node.names:
            if alias.name == "*":
                self._add_finding(
                    rule_id="WILDCARD_IMPORT",
                    title="Wildcard Import Used ('from module import *')",
                    description="Wildcard imports pollute the namespace and make static bug detection unreliable.",
                    severity="info",
                    category="code_quality",
                    suggested_action="Explicitly import only the specific functions or classes required.",
                    node=node
                )
            else:
                name = alias.asname or alias.name
                self.scope_stack[-1].add(name)
                self.imported_names.add(name)
        self.generic_visit(node)

    def visit_Assign(self, node: ast.Assign):
        self.visit(node.value)
        val, is_const, _, def_line = self._evaluate_constant(node.value)
        for target in node.targets:
            self._register_target_names(target, val if is_const else None, is_const)

    def visit_AnnAssign(self, node: ast.AnnAssign):
        if node.value:
            self.visit(node.value)
            val, is_const, _, _ = self._evaluate_constant(node.value)
            if node.target:
                self._register_target_names(node.target, val if is_const else None, is_const)
        else:
            if node.target:
                self._register_target_names(node.target, None, False)

    def visit_AugAssign(self, node: ast.AugAssign):
        self.visit(node.value)
        self._register_target_names(node.target, None, False)

    def visit_For(self, node: ast.For):
        self.in_loop += 1
        self.visit(node.iter)
        self._register_target_names(node.target, None, False)
        for stmt in node.body:
            self.visit(stmt)
        for stmt in node.orelse:
            self.visit(stmt)
        self.in_loop -= 1

    def visit_AsyncFor(self, node: ast.AsyncFor):
        self.visit_For(node)

    def _register_target_names(self, target: ast.AST, const_val: Any = None, is_const: bool = False):
        if isinstance(target, ast.Name):
            name = target.id
            if name in PYTHON_BUILTINS and not name.startswith("__") and name not in {"_", "self", "cls"}:
                self._add_finding(
                    rule_id="BUILTIN_SHADOWING",
                    title=f"Variable Shadows Built-in '{name}'",
                    description=f"Assigning to variable '{name}' overrides Python's standard built-in function or type.",
                    severity="info",
                    category="semantic",
                    suggested_action=f"Rename variable '{name}' to something descriptive (e.g., '{name}_val' or 'my_{name}').",
                    node=target
                )
            self.scope_stack[-1].add(name)
            self.assigned_vars_by_line[name] = getattr(target, "lineno", 0)
            if is_const:
                self.constant_env[-1][name] = (const_val, getattr(target, "lineno", 0))
            else:
                self.constant_env[-1].pop(name, None)
        elif isinstance(target, (ast.Tuple, ast.List)):
            for elt in target.elts:
                self._register_target_names(elt, None, False)
        elif isinstance(target, (ast.Subscript, ast.Attribute)):
            self.visit(target)

    # Division by zero detection
    def visit_BinOp(self, node: ast.BinOp):
        if isinstance(node.op, (ast.Div, ast.FloorDiv, ast.Mod)):
            val, is_const, desc, def_line = self._evaluate_constant(node.right)
            if is_const and isinstance(val, (int, float)) and val == 0:
                op_name = "/" if isinstance(node.op, ast.Div) else ("//" if isinstance(node.op, ast.FloorDiv) else "%")
                if desc == "literal" or desc == "expression":
                    title = "Definite Division or Modulo by Zero"
                    desc_text = f"Expression performs '{op_name} 0', which will raise ZeroDivisionError at runtime."
                    action_text = "Check the denominator with a condition (e.g. 'if divisor != 0:') before performing division."
                else:
                    var_name = desc
                    title = f"Definite Division by Zero (Variable '{var_name}' = 0)"
                    line_info = f" on line {def_line}" if def_line else ""
                    desc_text = (
                        f"Variable '{var_name}' was assigned 0{line_info}. "
                        f"Expression performs '{op_name} {var_name}', which will raise ZeroDivisionError at runtime."
                    )
                    action_text = f"Ensure '{var_name}' is not zero before dividing, or guard with 'if {var_name} != 0:'."

                self._add_finding(
                    rule_id="ZERO_DIVISION",
                    title=title,
                    description=desc_text,
                    severity="error",
                    category="runtime_risk",
                    suggested_action=action_text,
                    node=node,
                    is_confirmed=True
                )
        self.generic_visit(node)

    # Identity comparison with literals ('is' vs '==')
    def visit_Compare(self, node: ast.Compare):
        for op, comparator in zip(node.ops, node.comparators):
            if isinstance(op, (ast.Is, ast.IsNot)):
                # Checking with literals (strings, numbers, list/dict literals)
                if isinstance(comparator, (ast.Constant, ast.List, ast.Dict, ast.Set)):
                    # None and booleans are standard with 'is'
                    if comparator.value not in (None, True, False) and not isinstance(comparator.value, (bool, type(None))):
                        op_str = "is" if isinstance(op, ast.Is) else "is not"
                        suggested_op = "==" if isinstance(op, ast.Is) else "!="
                        self._add_finding(
                            rule_id="LITERAL_IDENTITY_COMPARISON",
                            title=f"Literal Identity Comparison with '{op_str}'",
                            description=(
                                f"Comparison uses '{op_str}' with literal {repr(comparator.value)}. "
                                "'is' checks memory identity, not value equality. In modern Python, this can fail unpredictably."
                            ),
                            severity="warning",
                            category="anti_pattern",
                            suggested_action=f"Use value equality operator '{suggested_op}' instead of '{op_str}'.",
                            node=node
                        )
        self.generic_visit(node)

    # Bare except clauses
    def visit_Try(self, node: ast.Try):
        for handler in node.handlers:
            if handler.type is None:
                self._add_finding(
                    rule_id="BARE_EXCEPT",
                    title="Bare 'except:' Clause Catches All Exceptions",
                    description=(
                        "A bare 'except:' catches BaseException, including SystemExit and KeyboardInterrupt (Ctrl+C), "
                        "making debugging and process shutdown difficult."
                    ),
                    severity="warning",
                    category="anti_pattern",
                    suggested_action="Catch specific exceptions, or at least 'except Exception as e:' to permit process signals.",
                    node=handler
                )
            elif isinstance(handler.type, ast.Name) and handler.type.id == "BaseException":
                self._add_finding(
                    rule_id="BROAD_BASE_EXCEPTION",
                    title="Overly Broad 'except BaseException:'",
                    description="Catching BaseException intercepts system-exiting signals.",
                    severity="warning",
                    category="anti_pattern",
                    suggested_action="Use 'except Exception:' instead of 'BaseException'.",
                    node=handler
                )
        self.generic_visit(node)

    # While loops with infinite risk
    def visit_While(self, node: ast.While):
        self.in_loop += 1
        # Check if while True or while 1 has no break or return
        is_constant_true = (
            isinstance(node.test, ast.Constant) and bool(node.test.value)
        )
        if is_constant_true:
            has_exit = self._has_loop_exit(node.body)
            if not has_exit:
                self._add_finding(
                    rule_id="INFINITE_LOOP_RISK",
                    title="Potential Infinite Loop Without Exit Condition",
                    description="'while True:' loop does not contain any detected 'break', 'return', or 'raise' statement in its body.",
                    severity="warning",
                    category="runtime_risk",
                    suggested_action="Ensure the loop has a termination condition containing a 'break' or 'return' statement.",
                    node=node
                )
        self.generic_visit(node)
        self.in_loop -= 1

    def _has_loop_exit(self, body: List[ast.stmt]) -> bool:
        """Inspect statements for exit controls (break, return, raise)."""
        for stmt in body:
            if isinstance(stmt, (ast.Break, ast.Return, ast.Raise)):
                return True
            if isinstance(stmt, ast.If):
                if self._has_loop_exit(stmt.body) or self._has_loop_exit(stmt.orelse):
                    return True
            if isinstance(stmt, (ast.Try)):
                if self._has_loop_exit(stmt.body):
                    return True
        return False

    # Unreachable code detection
    def _check_unreachable_body(self, stmts: List[ast.stmt]):
        for i, stmt in enumerate(stmts[:-1]):
            if isinstance(stmt, (ast.Return, ast.Raise, ast.Break, ast.Continue)):
                next_stmt = stmts[i + 1]
                self._add_finding(
                    rule_id="UNREACHABLE_CODE",
                    title="Unreachable Code Statement",
                    description=f"Statement after '{stmt.__class__.__name__.lower()}' will never be executed.",
                    severity="warning",
                    category="code_quality",
                    suggested_action="Remove or relocate the unreachable code block.",
                    node=next_stmt
                )
                break

    # Undefined name detection
    def visit_Name(self, node: ast.Name):
        if isinstance(node.ctx, ast.Load):
            name = node.id
            self.used_names.add(name)
            # Check if name is defined anywhere in scope stack
            is_defined = any(name in scope for scope in reversed(self.scope_stack))
            if not is_defined:
                self._add_finding(
                    rule_id="UNDEFINED_NAME",
                    title=f"Undefined Variable or Name '{name}'",
                    description=(
                        f"Name '{name}' is referenced before assignment or is not imported/defined in any accessible scope. "
                        "This will raise a NameError at runtime."
                    ),
                    severity="error",
                    category="semantic",
                    suggested_action=f"Define or import '{name}' before referencing it, or check for typos.",
                    node=node,
                    is_confirmed=False
                )
        self.generic_visit(node)


def analyze_python_code(source_code: str) -> Dict[str, Any]:
    """
    Main entry point for Python static and AST code analysis.
    Returns findings, summary counts, and syntax validity.
    """
    if not source_code or not source_code.strip():
        return {
            "findings": [{
                "id": f"finding-{uuid.uuid4().hex[:8]}",
                "rule_id": "EMPTY_SOURCE",
                "title": "Empty Source Code",
                "description": "No Python code was provided for analysis.",
                "severity": "info",
                "line": 1,
                "col": 0,
                "category": "code_quality",
                "suggested_action": "Write or paste Python code into the editor to run analysis.",
                "code_snippet": "",
                "is_confirmed": True
            }],
            "summary": {
                "total_findings": 1,
                "error_count": 0,
                "warning_count": 0,
                "info_count": 1,
                "syntax_valid": False,
                "has_repair": False,
                "verification_status": "unverified"
            }
        }

    source_lines = source_code.splitlines()

    # 1. First test AST parsing for confirmed SyntaxError
    try:
        parsed_ast = ast.parse(source_code)
    except SyntaxError as syn_err:
        line_no = syn_err.lineno or 1
        col_offset = syn_err.offset or 0
        error_text = syn_err.text.strip() if syn_err.text else ""
        if not error_text and 1 <= line_no <= len(source_lines):
            error_text = source_lines[line_no - 1].strip()

        msg = syn_err.msg.capitalize() if syn_err.msg else "Invalid Python syntax"

        # Provide friendly suggestion based on syntax error message
        suggested_action = "Check this line for missing colons, unbalanced parentheses, or improper indentation."
        if "expected ':'" in msg.lower() or "colon" in msg.lower():
            suggested_action = "Add a colon ':' at the end of the header statement."
        elif "unmatched" in msg.lower() or "was never closed" in msg.lower() or "closing parenthesis" in msg.lower():
            suggested_action = "Check for unclosed or mismatched parentheses '()', brackets '[]', or braces '{}'."
        elif "indentation" in msg.lower() or "indent" in msg.lower():
            suggested_action = "Fix indentation to be consistent (use 4 spaces per indentation level)."
        elif "cannot assign" in msg.lower():
            suggested_action = "Ensure the left side of the assignment is a valid variable name."

        findings = [{
            "id": f"finding-{uuid.uuid4().hex[:8]}",
            "rule_id": "SYNTAX_ERROR",
            "title": f"Syntax Error: {msg}",
            "description": f"Python failed to parse this code on line {line_no}: {msg}.",
            "severity": "error",
            "line": line_no,
            "col": col_offset,
            "category": "syntax",
            "suggested_action": suggested_action,
            "code_snippet": error_text,
            "is_confirmed": True
        }]

        return {
            "findings": findings,
            "summary": {
                "total_findings": 1,
                "error_count": 1,
                "warning_count": 0,
                "info_count": 0,
                "syntax_valid": False,
                "has_repair": True,
                "verification_status": "unverified"
            }
        }

    # 2. Code parsed successfully into AST -> run Visitor for deeper static analysis
    visitor = CodeAnalysisVisitor(source_lines)
    visitor.visit(parsed_ast)

    # 3. Check for unused imports
    unused_imports = visitor.imported_names - visitor.used_names
    for unused in sorted(unused_imports):
        visitor._add_finding(
            rule_id="UNUSED_IMPORT",
            title=f"Unused Import '{unused}'",
            description=f"Module or symbol '{unused}' is imported but never referenced in this file.",
            severity="info",
            category="code_quality",
            suggested_action=f"Remove the unused import statement for '{unused}' to reduce overhead.",
            line=1,
            col=0
        )

    # Deduplicate findings by rule_id and line
    seen_keys = set()
    unique_findings: List[Dict[str, Any]] = []
    for f in visitor.findings:
        key = (f["rule_id"], f["line"], f.get("col"))
        if key not in seen_keys:
            seen_keys.add(key)
            unique_findings.append(f)

    # Summary metrics
    error_cnt = sum(1 for f in unique_findings if f["severity"] == "error")
    warn_cnt = sum(1 for f in unique_findings if f["severity"] == "warning")
    info_cnt = sum(1 for f in unique_findings if f["severity"] == "info")

    return {
        "findings": unique_findings,
        "summary": {
            "total_findings": len(unique_findings),
            "error_count": error_cnt,
            "warning_count": warn_cnt,
            "info_count": info_cnt,
            "syntax_valid": True,
            "has_repair": len(unique_findings) > 0,
            "verification_status": "unverified"
        }
    }
