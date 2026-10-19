import React, { useState } from 'react';
import {
  Wrench,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  GitCompare,
  ArrowRight,
  ShieldCheck,
  Eye,
} from 'lucide-react';

export default function RepairPanel({
  repair,
  originalCode,
  onApplyFix,
}) {
  const [copied, setCopied] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [viewMode, setViewMode] = useState('diff'); // 'diff' | 'side-by-side' | 'raw'

  if (!repair || !repair.proposed_code) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 24px',
          textAlign: 'center',
          height: '100%',
        }}
      >
        <Wrench size={36} color="var(--accent-pink)" style={{ marginBottom: '12px', opacity: 0.7 }} />
        <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
          No Repair Suggestions Required
        </h4>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '360px', lineHeight: '1.5' }}>
          When the static analyzer detects bugs or syntax errors, DevPilot generates proposed fixes and side-by-side visual diffs here.
        </p>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(repair.proposed_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmApply = () => {
    onApplyFix(repair.proposed_code);
    setShowConfirmModal(false);
  };

  const origLines = (originalCode || '').split('\n');
  const propLines = (repair.proposed_code || '').split('\n');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-panel)',
          flexShrink: 0,
          gap: '8px',
          flexWrap: 'wrap',
        }}
      >
        {/* Left: Syntax status & view modes */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {repair.is_syntax_valid ? (
            <span className="badge badge-success" title="ast.parse validated without syntax errors">
              <ShieldCheck size={12} /> Syntax Validated
            </span>
          ) : (
            <span className="badge badge-error" title="Proposed code failed syntax compilation">
              <AlertTriangle size={12} /> Syntax Error
            </span>
          )}

          {/* View Toggle */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--bg-obsidian)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              padding: '2px',
            }}
          >
            <button
              onClick={() => setViewMode('diff')}
              style={{
                padding: '3px 8px',
                borderRadius: '3px',
                fontSize: '11px',
                fontWeight: 600,
                backgroundColor: viewMode === 'diff' ? 'var(--bg-panel)' : 'transparent',
                color: viewMode === 'diff' ? 'var(--text-primary)' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              Unified Diff
            </button>
            <button
              onClick={() => setViewMode('side-by-side')}
              style={{
                padding: '3px 8px',
                borderRadius: '3px',
                fontSize: '11px',
                fontWeight: 600,
                backgroundColor: viewMode === 'side-by-side' ? 'var(--bg-panel)' : 'transparent',
                color: viewMode === 'side-by-side' ? 'var(--text-primary)' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              Side-by-Side
            </button>
            <button
              onClick={() => setViewMode('raw')}
              style={{
                padding: '3px 8px',
                borderRadius: '3px',
                fontSize: '11px',
                fontWeight: 600,
                backgroundColor: viewMode === 'raw' ? 'var(--bg-panel)' : 'transparent',
                color: viewMode === 'raw' ? 'var(--text-primary)' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              Fixed Code
            </button>
          </div>
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className="btn-secondary"
            onClick={handleCopy}
            title="Copy fixed Python code to clipboard"
          >
            {copied ? <Check size={14} color="var(--status-success)" /> : <Copy size={14} />}
            <span>{copied ? 'Copied!' : 'Copy Fixed Code'}</span>
          </button>

          <button
            className="btn-primary"
            onClick={() => setShowConfirmModal(true)}
            title="Apply fix to editor"
          >
            <Wrench size={14} />
            <span>Apply Fix to Editor</span>
          </button>
        </div>
      </div>

      {/* Explanation of changes */}
      <div
        style={{
          padding: '10px 16px',
          backgroundColor: 'var(--bg-obsidian)',
          borderBottom: '1px solid var(--border-subtle)',
          fontSize: '12px',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexShrink: 0,
        }}
      >
        <strong style={{ color: 'var(--accent-pink)', whiteSpace: 'nowrap' }}>Changes Applied:</strong>
        <span>{repair.explanation}</span>
      </div>

      {/* Diff / Code Viewer Canvas */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', backgroundColor: 'var(--bg-code)' }}>
        {/* Mode 1: Unified Structured Diff */}
        {viewMode === 'diff' && (
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              lineHeight: '1.6',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {(repair.diff_chunks || []).map((chunk, idx) => (
              <div key={idx} style={{ marginBottom: '4px' }}>
                {chunk.type === 'equal' && (
                  <div style={{ opacity: 0.7 }}>
                    {chunk.old_lines.map((l, i) => (
                      <div
                        key={i}
                        style={{ display: 'flex', padding: '1px 8px', color: 'var(--text-muted)' }}
                      >
                        <span style={{ width: '40px', userSelect: 'none', textAlign: 'right', paddingRight: '12px' }}>
                          {chunk.old_start + i}
                        </span>
                        <span style={{ width: '20px', userSelect: 'none', color: 'var(--text-muted)' }}> </span>
                        <span>{l}</span>
                      </div>
                    ))}
                  </div>
                )}

                {chunk.type === 'delete' && (
                  <div style={{ backgroundColor: 'var(--diff-del-bg)', borderRadius: '2px' }}>
                    {chunk.old_lines.map((l, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          padding: '2px 8px',
                          color: 'var(--diff-del-text)',
                          borderLeft: '3px solid var(--status-error)',
                        }}
                      >
                        <span style={{ width: '40px', userSelect: 'none', textAlign: 'right', paddingRight: '12px' }}>
                          {chunk.old_start + i}
                        </span>
                        <span style={{ width: '20px', userSelect: 'none', color: 'var(--status-error)', fontWeight: 'bold' }}>
                          -
                        </span>
                        <span>{l}</span>
                      </div>
                    ))}
                  </div>
                )}

                {chunk.type === 'insert' && (
                  <div style={{ backgroundColor: 'var(--diff-add-bg)', borderRadius: '2px' }}>
                    {chunk.new_lines.map((l, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          padding: '2px 8px',
                          color: 'var(--diff-add-text)',
                          borderLeft: '3px solid var(--status-success)',
                        }}
                      >
                        <span style={{ width: '40px', userSelect: 'none', textAlign: 'right', paddingRight: '12px' }}>
                          {chunk.new_start + i}
                        </span>
                        <span style={{ width: '20px', userSelect: 'none', color: 'var(--status-success)', fontWeight: 'bold' }}>
                          +
                        </span>
                        <span>{l}</span>
                      </div>
                    ))}
                  </div>
                )}

                {chunk.type === 'modify' && (
                  <div style={{ borderRadius: '2px', overflow: 'hidden' }}>
                    {chunk.old_lines.map((l, i) => (
                      <div
                        key={`old-${i}`}
                        style={{
                          display: 'flex',
                          padding: '2px 8px',
                          backgroundColor: 'var(--diff-del-bg)',
                          color: 'var(--diff-del-text)',
                          borderLeft: '3px solid var(--status-error)',
                        }}
                      >
                        <span style={{ width: '40px', userSelect: 'none', textAlign: 'right', paddingRight: '12px' }}>
                          {chunk.old_start + i}
                        </span>
                        <span style={{ width: '20px', userSelect: 'none', color: 'var(--status-error)' }}>-</span>
                        <span>{l}</span>
                      </div>
                    ))}
                    {chunk.new_lines.map((l, i) => (
                      <div
                        key={`new-${i}`}
                        style={{
                          display: 'flex',
                          padding: '2px 8px',
                          backgroundColor: 'var(--diff-add-bg)',
                          color: 'var(--diff-add-text)',
                          borderLeft: '3px solid var(--status-success)',
                        }}
                      >
                        <span style={{ width: '40px', userSelect: 'none', textAlign: 'right', paddingRight: '12px' }}>
                          {chunk.new_start + i}
                        </span>
                        <span style={{ width: '20px', userSelect: 'none', color: 'var(--status-success)' }}>+</span>
                        <span>{l}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Mode 2: Side-by-Side View */}
        {viewMode === 'side-by-side' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
            }}
          >
            {/* Original Column */}
            <div
              style={{
                backgroundColor: 'var(--bg-obsidian)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '6px 12px',
                  backgroundColor: 'var(--bg-panel)',
                  borderBottom: '1px solid var(--border-subtle)',
                  fontWeight: 600,
                  fontSize: '11px',
                  color: 'var(--status-error)',
                }}
              >
                Original Source
              </div>
              <pre style={{ padding: '12px', margin: 0, overflowX: 'auto', color: 'var(--text-secondary)' }}>
                {originalCode}
              </pre>
            </div>

            {/* Proposed Column */}
            <div
              style={{
                backgroundColor: 'var(--bg-obsidian)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '6px 12px',
                  backgroundColor: 'var(--bg-panel)',
                  borderBottom: '1px solid var(--border-subtle)',
                  fontWeight: 600,
                  fontSize: '11px',
                  color: 'var(--status-success)',
                }}
              >
                Proposed Fix
              </div>
              <pre style={{ padding: '12px', margin: 0, overflowX: 'auto', color: 'var(--text-primary)' }}>
                {repair.proposed_code}
              </pre>
            </div>
          </div>
        )}

        {/* Mode 3: Raw Fixed Code */}
        {viewMode === 'raw' && (
          <div
            style={{
              backgroundColor: 'var(--bg-obsidian)',
              padding: '16px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <pre style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-primary)' }}>
              {repair.proposed_code}
            </pre>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-panel)',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              maxWidth: '440px',
              width: '90%',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.6)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Wrench size={22} color="var(--accent-pink)" />
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Apply Fix to Editor?
              </h3>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              This will replace the contents of your active Python editor with the proposed corrected code.
              You can still reset to sample snippets or edit manually at any time.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <button className="btn-secondary" onClick={() => setShowConfirmModal(false)}>
                Cancel (Keep Original)
              </button>
              <button className="btn-primary" onClick={handleConfirmApply}>
                Confirm & Apply Fix
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
