import React from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Check,
  Zap,
  Lock,
} from 'lucide-react';

export default function VerificationPanel({ verification }) {
  if (!verification) {
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
        <ShieldCheck size={36} color="var(--accent-pink)" style={{ marginBottom: '12px', opacity: 0.7 }} />
        <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
          Verification Not Yet Triggered
        </h4>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '360px', lineHeight: '1.5' }}>
          Analyze code to run static safety suites and test whether proposed fixes eliminate detected issues.
        </p>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'verified':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--status-success-bg)',
              color: 'var(--status-success)',
              border: '1px solid var(--status-success-border)',
              padding: '6px 12px',
              borderRadius: '9999px',
              fontWeight: 700,
              fontSize: '12px',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}
          >
            <ShieldCheck size={16} /> Verified Safe Fix
          </span>
        );
      case 'partially_verified':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--status-warning-bg)',
              color: 'var(--status-warning)',
              border: '1px solid var(--status-warning-border)',
              padding: '6px 12px',
              borderRadius: '9999px',
              fontWeight: 700,
              fontSize: '12px',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}
          >
            <ShieldAlert size={16} /> Partially Verified
          </span>
        );
      case 'failed':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--status-error-bg)',
              color: 'var(--status-error)',
              border: '1px solid var(--status-error-border)',
              padding: '6px 12px',
              borderRadius: '9999px',
              fontWeight: 700,
              fontSize: '12px',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}
          >
            <XCircle size={16} /> Verification Failed
          </span>
        );
      default:
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--bg-panel)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-subtle)',
              padding: '6px 12px',
              borderRadius: '9999px',
              fontWeight: 700,
              fontSize: '12px',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}
          >
            <HelpCircle size={16} /> Unverified
          </span>
        );
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflowY: 'auto',
        padding: '16px',
        gap: '16px',
      }}
    >
      {/* Status Hero Card */}
      <div
        style={{
          backgroundColor: 'var(--bg-obsidian)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Verification Outcome
            </span>
            <div style={{ marginTop: '4px' }}>{getStatusBadge(verification.status)}</div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              color: 'var(--text-secondary)',
              backgroundColor: 'var(--bg-panel)',
              padding: '6px 10px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
            }}
            title="Non-arbitrary execution: Code was evaluated strictly using AST parsing and static rules without subprocess invocation."
          >
            <Lock size={12} color="var(--accent-pink)" />
            <span>Isolated AST Sandbox</span>
          </div>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.5' }}>
          {verification.details}
        </p>

        {/* Delta Metrics Bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
            gap: '8px',
            marginTop: '4px',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-panel)',
              padding: '10px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Original Issues</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--status-error)', marginTop: '2px' }}>
              {verification.original_issue_count}
            </div>
          </div>

          <div
            style={{
              backgroundColor: 'var(--bg-panel)',
              padding: '10px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Resolved</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--status-success)', marginTop: '2px' }}>
              {verification.resolved_issue_count}
            </div>
          </div>

          <div
            style={{
              backgroundColor: 'var(--bg-panel)',
              padding: '10px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Remaining</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--status-warning)', marginTop: '2px' }}>
              {verification.remaining_issue_count}
            </div>
          </div>

          <div
            style={{
              backgroundColor: 'var(--bg-panel)',
              padding: '10px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>New Regressions</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
              {verification.new_issues_introduced}
            </div>
          </div>
        </div>
      </div>

      {/* Static Test Checks Table */}
      <div
        style={{
          backgroundColor: 'var(--bg-obsidian)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'var(--bg-panel)',
            borderBottom: '1px solid var(--border-subtle)',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Zap size={15} color="var(--accent-pink)" />
          <span>Real Static Test Suite Execution Results</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {(verification.checks_run || []).map((check, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderBottom:
                  idx < verification.checks_run.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                gap: '12px',
              }}
            >
              {/* Left: Pass/Fail icon & name */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                {check.passed ? (
                  <CheckCircle2 size={16} color="var(--status-success)" style={{ marginTop: '2px', flexShrink: 0 }} />
                ) : (
                  <XCircle size={16} color="var(--status-error)" style={{ marginTop: '2px', flexShrink: 0 }} />
                )}
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {check.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: '1.4' }}>
                    {check.details}
                  </div>
                </div>
              </div>

              {/* Right: Category and timing */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
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
                  {check.category}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                  }}
                >
                  <Clock size={10} />
                  {check.execution_time_ms} ms
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
