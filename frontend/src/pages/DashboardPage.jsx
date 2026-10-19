import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  ArrowUpRight,
  Code2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export default function DashboardPage({ onOpenInEditor }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMetrics = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getDashboardMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load metrics:', err);
      setError(err.message || 'Could not fetch dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          gap: '12px',
        }}
      >
        <RefreshCw size={24} color="var(--accent-pink)" className="spin" style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Loading real analysis metrics from SQLite...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <p style={{ color: 'var(--status-error)', marginBottom: '12px' }}>{error}</p>
        <button className="btn-secondary" onClick={fetchMetrics}>
          Retry
        </button>
      </div>
    );
  }

  const hasData = metrics && metrics.total_analyses > 0;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '24px 32px',
        overflowY: 'auto',
        gap: '24px',
      }}
    >
      {/* Top Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
            System Analytics & Reliability
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Aggregated telemetry from real Python code evaluations in your SQLite repository.
          </p>
        </div>

        <button className="btn-secondary" onClick={fetchMetrics}>
          <RefreshCw size={13} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {!hasData ? (
        /* Empty State with Quick Launch */
        <div
          style={{
            backgroundColor: 'var(--bg-panel)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '48px 32px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <Code2 size={40} color="var(--accent-pink)" />
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
            No Analysis Records in SQLite Yet
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '440px', lineHeight: '1.5' }}>
            Start analyzing Python code snippets in the Code Analyzer to generate real defect rates, AST syntax metrics, and verification benchmarks.
          </p>
          <button
            className="btn-primary"
            style={{ marginTop: '8px' }}
            onClick={() => onOpenInEditor && onOpenInEditor()}
          >
            Launch Code Analyzer
          </button>
        </div>
      ) : (
        <>
          {/* Metrics Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
            }}
          >
            {/* Card 1: Total Analyses */}
            <div
              style={{
                backgroundColor: 'var(--bg-panel)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '18px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
                  Total Evaluated Runs
                </span>
                <Activity size={16} color="var(--accent-pink)" />
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {metrics.total_analyses}
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Stored persistently in SQLite
              </span>
            </div>

            {/* Card 2: Total Issues Found */}
            <div
              style={{
                backgroundColor: 'var(--bg-panel)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '18px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
                  Defects Detected
                </span>
                <AlertOctagon size={16} color="var(--status-error)" />
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--status-error)' }}>
                {metrics.total_issues_found}
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {metrics.total_errors} errors · {metrics.total_warnings} warnings
              </span>
            </div>

            {/* Card 3: Syntax Error Rate */}
            <div
              style={{
                backgroundColor: 'var(--bg-panel)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '18px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
                  Syntax Error Rate
                </span>
                <AlertTriangle size={16} color="var(--status-warning)" />
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {metrics.syntax_error_rate}%
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Unparsable Python compiler syntax
              </span>
            </div>

            {/* Card 4: Verification Success Rate */}
            <div
              style={{
                backgroundColor: 'var(--bg-panel)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '18px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
                  Verified Repair Rate
                </span>
                <CheckCircle2 size={16} color="var(--status-success)" />
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--status-success)' }}>
                {metrics.verified_rate}%
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Fixes with 0 regressions in static checks
              </span>
            </div>
          </div>

          {/* Issue Categories & Distribution */}
          <div
            style={{
              backgroundColor: 'var(--bg-panel)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={16} color="var(--accent-pink)" />
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Detected Issue Categories
              </h3>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {Object.entries(metrics.categories || {}).length === 0 ? (
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No category data yet.</span>
              ) : (
                Object.entries(metrics.categories).map(([cat, count]) => (
                  <div
                    key={cat}
                    style={{
                      backgroundColor: 'var(--bg-obsidian)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '10px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                      {cat.replace('_', ' ')}
                    </span>
                    <span
                      style={{
                        backgroundColor: 'var(--bg-panel)',
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: 'var(--accent-pink)',
                        border: '1px solid var(--accent-pink-border)',
                      }}
                    >
                      {count}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Runs Table */}
          <div
            style={{
              backgroundColor: 'var(--bg-panel)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} color="var(--accent-pink)" />
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Recent Analysis Activity
                </h3>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {(metrics.recent_analyses || []).map((item, idx) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 20px',
                    borderBottom:
                      idx < metrics.recent_analyses.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    gap: '16px',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent-pink)' }}>
                        {item.id}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {new Date(item.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item.code_preview}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: item.total_findings === 0 ? 'var(--status-success-bg)' : 'var(--status-error-bg)',
                        color: item.total_findings === 0 ? 'var(--status-success)' : 'var(--status-error)',
                      }}
                    >
                      {item.total_findings} Issue(s)
                    </span>

                    <button
                      className="btn-ghost"
                      onClick={() => onOpenInEditor && onOpenInEditor(item.id)}
                      title="Load this snippet into workbench"
                      style={{ fontSize: '12px' }}
                    >
                      <span>Open</span>
                      <ArrowUpRight size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
