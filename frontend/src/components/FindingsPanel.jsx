import React, { useState } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Terminal,
  Filter,
} from 'lucide-react';

export default function FindingsPanel({ findings = [], summary = {}, onSelectLine }) {
  const [filterSeverity, setFilterSeverity] = useState('all');

  const filtered = findings.filter((f) => {
    if (filterSeverity === 'all') return true;
    return f.severity === filterSeverity;
  });

  const getSeverityBadge = (severity) => {
    if (severity === 'error') {
      return (
        <span className="badge badge-error">
          <AlertCircle size={11} /> Error
        </span>
      );
    }
    if (severity === 'warning') {
      return (
        <span className="badge badge-warning">
          <AlertTriangle size={11} /> Warning
        </span>
      );
    }
    return (
      <span className="badge badge-info">
        <Info size={11} /> Info
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Top Filter and Stats Bar */}
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
        {/* Severity Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => setFilterSeverity('all')}
            style={{
              padding: '4px 10px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '11px',
              fontWeight: 600,
              backgroundColor: filterSeverity === 'all' ? 'var(--bg-obsidian)' : 'transparent',
              color: filterSeverity === 'all' ? 'var(--text-primary)' : 'var(--text-muted)',
              border: filterSeverity === 'all' ? '1px solid var(--border-strong)' : '1px solid transparent',
              cursor: 'pointer',
            }}
          >
            All ({findings.length})
          </button>

          <button
            onClick={() => setFilterSeverity('error')}
            style={{
              padding: '4px 10px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '11px',
              fontWeight: 600,
              backgroundColor: filterSeverity === 'error' ? 'var(--status-error-bg)' : 'transparent',
              color: filterSeverity === 'error' ? 'var(--status-error)' : 'var(--text-muted)',
              border: filterSeverity === 'error' ? '1px solid var(--status-error-border)' : '1px solid transparent',
              cursor: 'pointer',
            }}
          >
            Errors ({summary.error_count || 0})
          </button>

          <button
            onClick={() => setFilterSeverity('warning')}
            style={{
              padding: '4px 10px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '11px',
              fontWeight: 600,
              backgroundColor: filterSeverity === 'warning' ? 'var(--status-warning-bg)' : 'transparent',
              color: filterSeverity === 'warning' ? 'var(--status-warning)' : 'var(--text-muted)',
              border: filterSeverity === 'warning' ? '1px solid var(--status-warning-border)' : '1px solid transparent',
              cursor: 'pointer',
            }}
          >
            Warnings ({summary.warning_count || 0})
          </button>

          <button
            onClick={() => setFilterSeverity('info')}
            style={{
              padding: '4px 10px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '11px',
              fontWeight: 600,
              backgroundColor: filterSeverity === 'info' ? 'var(--status-info-bg)' : 'transparent',
              color: filterSeverity === 'info' ? 'var(--status-info)' : 'var(--text-muted)',
              border: filterSeverity === 'info' ? '1px solid var(--status-info-border)' : '1px solid transparent',
              cursor: 'pointer',
            }}
          >
            Info ({summary.info_count || 0})
          </button>
        </div>

        {/* Syntax Status */}
        <div>
          {summary.syntax_valid ? (
            <span
              style={{
                fontSize: '11px',
                color: 'var(--status-success)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: 500,
              }}
            >
              <CheckCircle2 size={13} /> Syntax Valid
            </span>
          ) : (
            <span
              style={{
                fontSize: '11px',
                color: 'var(--status-error)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: 500,
              }}
            >
              <AlertCircle size={13} /> Syntax Invalid
            </span>
          )}
        </div>
      </div>

      {/* Findings List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filtered.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '48px 24px',
              textAlign: 'center',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <CheckCircle2 size={40} color="var(--status-success)" style={{ marginBottom: '12px' }} />
            <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              No Issues Detected
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '360px', lineHeight: '1.5' }}>
              The AST parser and static analysis checks found zero errors, warnings, or bad patterns in this code snippet.
            </p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              style={{
                backgroundColor: 'var(--bg-obsidian)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                transition: 'border-color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-strong)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
              }}
            >
              {/* Header: Badges & Line Info */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {getSeverityBadge(item.severity)}
                  
                  {item.is_confirmed ? (
                    <span
                      style={{
                        fontSize: '10px',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        backgroundColor: 'var(--bg-panel)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      Confirmed AST
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: '10px',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        backgroundColor: 'var(--bg-panel)',
                        color: 'var(--text-muted)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      Heuristic Static
                    </span>
                  )}

                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                      color: 'var(--text-muted)',
                    }}
                  >
                    #{item.rule_id}
                  </span>
                </div>

                {item.line !== null && item.line !== undefined && (
                  <button
                    onClick={() => onSelectLine && onSelectLine(item.line)}
                    style={{
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--accent-pink)',
                      backgroundColor: 'var(--accent-pink-dim)',
                      border: '1px solid var(--accent-pink-border)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    Line {item.line}
                    {item.col !== null && item.col !== undefined && `:${item.col}`}
                  </button>
                )}
              </div>

              {/* Title & Description */}
              <div>
                <h5 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {item.title}
                </h5>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  {item.description}
                </p>
              </div>

              {/* Code Snippet Preview */}
              {item.code_snippet && (
                <div
                  style={{
                    backgroundColor: 'var(--bg-code)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 12px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    color: 'var(--text-primary)',
                    overflowX: 'auto',
                  }}
                >
                  <span style={{ color: 'var(--text-muted)', marginRight: '8px' }}>
                    {item.line}:
                  </span>
                  <span>{item.code_snippet}</span>
                </div>
              )}

              {/* Suggested Action */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  backgroundColor: 'var(--bg-panel)',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  color: 'var(--text-primary)',
                }}
              >
                <ArrowRight size={14} color="var(--accent-pink)" style={{ marginTop: '2px', flexShrink: 0 }} />
                <span>
                  <strong style={{ color: 'var(--accent-pink)' }}>Suggested Fix: </strong>
                  {item.suggested_action}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
