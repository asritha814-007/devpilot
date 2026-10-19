import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import {
  Play,
  RotateCcw,
  Trash2,
  FileCode,
  Sparkles,
  AlertCircle,
  Code,
} from 'lucide-react';

export const SAMPLE_SNIPPETS = {
  syntax_error: {
    label: 'Syntax Error (Missing Colon)',
    code: `# DevPilot Demo: Confirmed Syntax Error
def calculate_discount(price, discount_rate)
    if discount_rate > 1.0:
        return price
    return price * (1 - discount_rate
`,
  },
  zero_division: {
    label: 'Zero Division (Variable & Literal)',
    code: `# DevPilot Demo: Division by Zero
a = 10
b = 0
print(a / b)
`,
  },
  mutable_default: {
    label: 'Mutable Default Argument',
    code: `# DevPilot Demo: Mutable Default Argument Anti-Pattern
def add_user_role(role, user_roles=[]):
    """Dangerous mutable default: user_roles is shared across calls!"""
    user_roles.append(role)
    return user_roles

admin_roles = add_user_role("admin")
guest_roles = add_user_role("guest")
print("Guest roles:", guest_roles)  # Notice 'admin' leaked into guest!
`,
  },
  bare_except: {
    label: 'Bare Except Clause',
    code: `# DevPilot Demo: Bare Except Handler
def parse_configuration(file_path):
    try:
        data = int("not_a_number")
        return data
    except:
        # Catches KeyboardInterrupt (Ctrl+C) and hides critical bugs!
        print("An error occurred during parsing")
        return None
`,
  },
  literal_identity: {
    label: 'Literal Identity (is vs ==)',
    code: `# DevPilot Demo: Literal Identity Comparison
def check_environment(env_name):
    # 'is' checks object memory identity, not string equality
    if env_name is "production":
        print("Running in Production Mode")
    else:
        print("Running in Development Mode")

check_environment("production")
`,
  },
  undefined_variable: {
    label: 'Undefined NameError',
    code: `# DevPilot Demo: Undefined Variable Reference
def process_order(order_id):
    tax_rate = 0.08
    # 'subtotal_amount' is referenced without being declared or assigned
    final_price = subtotal_amount * (1 + tax_rate)
    return final_price

print(process_order(101))
`,
  },
  clean_code: {
    label: 'Clean Code (0 Errors)',
    code: `# DevPilot Demo: Clean, PEP-8 Compliant Code
def calculate_circle_area(radius: float) -> float:
    """Computes the area of a circle with a valid positive radius."""
    if radius < 0:
        raise ValueError("Radius must be non-negative")
    pi_val = 3.141592653589793
    return pi_val * (radius ** 2)

area = calculate_circle_area(5.0)
print(f"Calculated Area: {area:.2f}")
`,
  },
};

export default function CodeEditor({
  code,
  onChange,
  onAnalyze,
  isLoading,
  errorMsg,
}) {
  const [selectedSnippet, setSelectedSnippet] = useState('syntax_error');
  const [monacoLoaded, setMonacoLoaded] = useState(false);

  const handleSnippetSelect = (e) => {
    const key = e.target.value;
    setSelectedSnippet(key);
    if (SAMPLE_SNIPPETS[key]) {
      onChange(SAMPLE_SNIPPETS[key].code);
    }
  };

  const handleClear = () => {
    onChange('');
  };

  const handleResetSample = () => {
    if (SAMPLE_SNIPPETS[selectedSnippet]) {
      onChange(SAMPLE_SNIPPETS[selectedSnippet].code);
    }
  };

  const lineCount = (code || '').split('\n').length;
  const charCount = (code || '').length;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--bg-panel)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        overflow: 'hidden',
      }}
    >
      {/* Editor Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-obsidian)',
          flexShrink: 0,
        }}
      >
        {/* Left: File indicator and Sample selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            <FileCode size={16} color="var(--accent-pink)" />
            <span>main.py</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sample:</span>
            <select
              value={selectedSnippet}
              onChange={handleSnippetSelect}
              style={{
                backgroundColor: 'var(--bg-panel)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '4px 8px',
                fontSize: '12px',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {Object.entries(SAMPLE_SNIPPETS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className="btn-ghost"
            onClick={handleResetSample}
            title="Reset code to current sample"
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>

          <button
            className="btn-ghost"
            onClick={handleClear}
            title="Clear editor contents"
          >
            <Trash2 size={14} />
            <span>Clear</span>
          </button>

          <button
            className="btn-primary"
            onClick={onAnalyze}
            disabled={isLoading || !code.trim()}
            title="Analyze Python code with AST & AI"
          >
            <Play size={14} fill="#111113" />
            <span>{isLoading ? 'Analyzing AST...' : 'Analyze Code'}</span>
          </button>
        </div>
      </div>

      {/* Validation Banner if empty/error */}
      {errorMsg && (
        <div
          style={{
            padding: '8px 16px',
            backgroundColor: 'var(--status-error-bg)',
            borderBottom: '1px solid var(--status-error-border)',
            color: 'var(--status-error)',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertCircle size={15} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Editor Main Canvas */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <Editor
          height="100%"
          defaultLanguage="python"
          language="python"
          theme="vs-dark"
          value={code}
          onChange={(val) => onChange(val || '')}
          onMount={() => setMonacoLoaded(true)}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: "'Fira Code', 'JetBrains Mono', Consolas, monospace",
            lineNumbers: 'on',
            lineNumbersMinChars: 3,
            glyphMargin: false,
            folding: true,
            lineDecorationsWidth: 10,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            insertSpaces: true,
            renderWhitespace: 'selection',
            cursorBlinking: 'smooth',
            smoothScrolling: true,
            padding: { top: 12, bottom: 12 },
          }}
        />

        {/* Fallback textarea if Monaco has network delay */}
        {!monacoLoaded && (
          <textarea
            value={code}
            onChange={(e) => onChange(e.target.value)}
            spellCheck="false"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'var(--bg-code)',
              color: 'var(--text-primary)',
              fontFamily: "'Fira Code', monospace",
              fontSize: '13px',
              lineHeight: '1.6',
              padding: '16px',
              border: 'none',
              outline: 'none',
              resize: 'none',
              zIndex: 1,
            }}
          />
        )}
      </div>

      {/* Editor Status Bar Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 16px',
          backgroundColor: 'var(--bg-obsidian)',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '11px',
          color: 'var(--text-muted)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>Python 3.14</span>
          <span>UTF-8</span>
          <span>Spaces: 4</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>Lines: {lineCount}</span>
          <span>Chars: {charCount}</span>
          <span style={{ color: code.trim() ? 'var(--status-success)' : 'var(--text-muted)' }}>
            {code.trim() ? 'Ready for AST analysis' : 'Input required'}
          </span>
        </div>
      </div>
    </div>
  );
}
