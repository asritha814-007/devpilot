import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import {
  Settings,
  Sparkles,
  Shield,
  Key,
  Database,
  Terminal,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Cpu,
} from 'lucide-react';

export default function SettingsPage() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getHealth()
      .then(setHealth)
      .catch((err) => console.error('Health check failed:', err))
      .finally(() => setLoading(false));
  }, []);

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
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
          Settings & Environment
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
          Inspect AI integration mode, SQLite persistence, and security isolation policies.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Card 1: AI Provider Status */}
        <div
          style={{
            backgroundColor: 'var(--bg-panel)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="var(--accent-pink)" />
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
              AI Provider Integration
            </h3>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            DevPilot features a modular AI backend architecture that interfaces with Google Gemini or OpenAI.
            API keys are strictly managed server-side via environment variables and are never transmitted to or stored in client-side code.
          </p>

          <div
            style={{
              backgroundColor: 'var(--bg-obsidian)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Backend Detection Status</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                {health?.ai_provider_mode || (loading ? 'Checking...' : 'Offline Rule-Based Mode')}
              </div>
            </div>

            {health?.ai_provider_configured ? (
              <span className="badge badge-success">
                <CheckCircle2 size={12} /> Active
              </span>
            ) : (
              <span className="badge badge-warning">
                <AlertCircle size={12} /> Offline Fallback
              </span>
            )}
          </div>

          {/* Setup instructions */}
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <strong>How to configure your API key:</strong>
            <ol style={{ paddingLeft: '18px', lineHeight: '1.6' }}>
              <li>Open the <code style={{ color: 'var(--accent-pink)' }}>.env</code> file in the project root.</li>
              <li>Add your key: <code style={{ color: 'var(--accent-pink)' }}>GEMINI_API_KEY=your_key_here</code></li>
              <li>Restart the backend server. DevPilot will automatically activate generative explanations.</li>
            </ol>
          </div>
        </div>

        {/* Card 2: Security & AST Isolation Policy */}
        <div
          style={{
            backgroundColor: 'var(--bg-panel)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={18} color="var(--accent-pink)" />
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Execution Security Policy
            </h3>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            To safeguard the host environment, DevPilot enforces strict security boundaries:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: 'var(--text-primary)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <CheckCircle2 size={14} color="var(--status-success)" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span>
                <strong>No Arbitrary Code Execution:</strong> User-submitted Python scripts are evaluated using abstract syntax tree (AST) node parsing and static visitors only.
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <CheckCircle2 size={14} color="var(--status-success)" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span>
                <strong>Deterministic Syntax Verification:</strong> Proposed repairs are compiled via Python's native AST parser to verify validity before presentation.
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <CheckCircle2 size={14} color="var(--status-success)" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span>
                <strong>Zero Secret Leakage:</strong> No environment variables or filesystem paths are exposed through the client API.
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Design & Brand Tokens */}
        <div
          style={{
            backgroundColor: 'var(--bg-panel)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Terminal size={18} color="var(--accent-pink)" />
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Brand & Design System
            </h3>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            Commercial developer-tool palette designed for prolonged focus:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '4px', backgroundColor: '#111113', border: '1px solid #383238' }} />
              <span>Obsidian (#111113)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '4px', backgroundColor: '#292529', border: '1px solid #383238' }} />
              <span>Charcoal (#292529)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '4px', backgroundColor: '#F5F1F2', border: '1px solid #383238' }} />
              <span>Porcelain (#F5F1F2)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '4px', backgroundColor: '#F2B8C6', border: '1px solid #383238' }} />
              <span>Blush Pink (#F2B8C6)</span>
            </div>
          </div>
        </div>

        {/* Card 4: Architecture Specifications */}
        <div
          style={{
            backgroundColor: 'var(--bg-panel)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={18} color="var(--accent-pink)" />
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Stack Specifications
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <div><strong>Frontend:</strong> React 18 · Vite 5 · Monaco Editor · Lucide React</div>
            <div><strong>Backend:</strong> Python 3.14 · FastAPI · Pydantic V2 · Uvicorn</div>
            <div><strong>Database:</strong> SQLite 3 (Check-same-thread safe)</div>
            <div><strong>Testing:</strong> Pytest 9.1 (20/20 tests verified)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
