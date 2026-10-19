import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import {
  History,
  Trash2,
  ExternalLink,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Wrench,
  RefreshCw,
} from 'lucide-react';

export default function HistoryPage({ onSelectAnalysis }) {
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const fetchHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getHistory(50, 0, search);
      setHistoryList(data);
    } catch (err) {
      console.error('Failed to load history:', err);
      setError(err.message || 'Could not load analysis history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [search]);

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    try {
      await api.deleteAnalysis(deleteTargetId);
      setHistoryList((prev) => prev.filter((item) => item.id !== deleteTargetId));
      setDeleteTargetId(null);
    } catch (err) {
      console.error('Delete error:', err);
      alert(`Could not delete analysis: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '24px 32px',
        overflowY: 'auto',
        gap: '20px',
      }}
    >
      {/* Header and Search */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
            Analysis Run History
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Browse and inspect previous static and AI debug sessions stored in SQLite.
          </p>
        </div>

        {/* Search input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--bg-panel)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '6px 12px',
              width: '260px',
            }}
          >
            <Search size={14} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Filter by code or issue..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '12px',
                outline: 'none',
                width: '100%',
              }}
            />
          </div>

          <button className="btn-secondary" onClick={fetchHistory} title="Refresh list">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '240px',
            gap: '12px',
          }}
        >
          <RefreshCw size={24} color="var(--accent-pink)" className="spin" style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Retrieving history runs...</span>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '32px' }}>
          <p style={{ color: 'var(--status-error)', marginBottom: '12px' }}>{error}</p>
          <button className="btn-secondary" onClick={fetchHistory}>
            Retry
          </button>
        </div>
      ) : historyList.length === 0 ? (
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
          <History size={40} color="var(--accent-pink)" />
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
            No Analysis Records Found
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '400px', lineHeight: '1.5' }}>
            {search
              ? `No analyses matched "${search}". Try clearing your search filter.`
              : 'Analyses you run will be logged here with complete code diffs and verification reports.'}
          </p>
        </div>
      ) : (
        /* History Runs Cards */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {historyList.map((item) => (
            <div
              key={item.id}
              style={{
                backgroundColor: 'var(--bg-panel)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                transition: 'border-color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-strong)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
              }}
            >
              {/* Left Column: ID, Timestamp, Code preview */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: 'var(--accent-pink)',
                    }}
                  >
                    {item.id}
                  </span>

                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <Clock size={11} />
                    {new Date(item.timestamp).toLocaleString()}
                  </span>

                  {item.has_ai && (
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        backgroundColor: 'var(--accent-pink-dim)',
                        color: 'var(--accent-pink)',
                        border: '1px solid var(--accent-pink-border)',
                      }}
                    >
                      AI Assisted
                    </span>
                  )}
                </div>

                {/* Code Preview snippet */}
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    backgroundColor: 'var(--bg-obsidian)',
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '650px',
                  }}
                >
                  {item.code_preview}
                </div>
              </div>

              {/* Middle: Badges */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                {item.syntax_valid ? (
                  <span
                    style={{
                      fontSize: '11px',
                      color: 'var(--status-success)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <CheckCircle2 size={13} /> Syntax OK
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: '11px',
                      color: 'var(--status-error)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <AlertTriangle size={13} /> Syntax Error
                  </span>
                )}

                <span
                  style={{
                    fontSize: '11px',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontWeight: 600,
                    backgroundColor: item.total_findings === 0 ? 'var(--status-success-bg)' : 'var(--status-error-bg)',
                    color: item.total_findings === 0 ? 'var(--status-success)' : 'var(--status-error)',
                    border: `1px solid ${item.total_findings === 0 ? 'var(--status-success-border)' : 'var(--status-error-border)'}`,
                  }}
                >
                  {item.total_findings} Finding(s)
                </span>

                <span
                  style={{
                    fontSize: '11px',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontWeight: 600,
                    backgroundColor:
                      item.verification_status === 'verified'
                        ? 'var(--status-success-bg)'
                        : 'var(--bg-obsidian)',
                    color:
                      item.verification_status === 'verified'
                        ? 'var(--status-success)'
                        : 'var(--text-muted)',
                    border: '1px solid var(--border-subtle)',
                    textTransform: 'capitalize',
                  }}
                >
                  {item.verification_status.replace('_', ' ')}
                </span>
              </div>

              {/* Right: Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <button
                  className="btn-secondary"
                  onClick={() => onSelectAnalysis(item.id)}
                  title="Open this analysis in the interactive workbench"
                  style={{ fontSize: '12px' }}
                >
                  <span>Open in Workbench</span>
                  <ExternalLink size={13} />
                </button>

                <button
                  className="btn-danger"
                  onClick={() => setDeleteTargetId(item.id)}
                  title="Delete from SQLite database"
                  style={{ padding: '7px 10px' }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
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
              maxWidth: '420px',
              width: '90%',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Trash2 size={20} color="var(--status-error)" />
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Delete Analysis Run?
              </h3>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Are you sure you want to delete analysis <strong style={{ color: 'var(--accent-pink)' }}>{deleteTargetId}</strong>?
              This record will be permanently purged from your local SQLite database.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <button
                className="btn-secondary"
                onClick={() => setDeleteTargetId(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
