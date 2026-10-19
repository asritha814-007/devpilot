import React, { useEffect, useState } from 'react';
import Logo from './Logo';
import { api } from '../services/api';
import { ShieldCheck, Sparkles, BookOpen, Circle } from 'lucide-react';

export default function Header() {
  const [health, setHealth] = useState({
    status: 'checking',
    ai_provider_mode: 'Checking...',
    ai_provider_configured: false,
  });

  useEffect(() => {
    let isMounted = true;
    const checkHealth = async () => {
      try {
        const data = await api.getHealth();
        if (isMounted) setHealth(data);
      } catch (err) {
        if (isMounted) {
          setHealth({
            status: 'offline',
            ai_provider_mode: 'Backend Unreachable',
            ai_provider_configured: false,
          });
        }
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const isHealthy = health.status === 'healthy';

  return (
    <header
      style={{
        height: '56px',
        backgroundColor: 'var(--bg-obsidian)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        flexShrink: 0,
        zIndex: 20,
      }}
    >
      {/* Left: Brand Logo & Tagline */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <Logo size={32} />
        <div
          style={{
            height: '24px',
            width: '1px',
            backgroundColor: 'var(--border-subtle)',
            display: 'block',
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 500,
              color: 'var(--text-primary)',
              letterSpacing: '-0.2px',
            }}
          >
            Find the bug. Understand the why.
          </span>
          <span
            style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
            }}
          >
            Write better code with explanations you can actually understand.
          </span>
        </div>
      </div>

      {/* Right: Status Badges & Quick Links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Safe Sandbox Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-panel)',
            border: '1px solid var(--border-subtle)',
            fontSize: '12px',
            color: 'var(--text-secondary)',
          }}
          title="Safe static AST evaluation. Arbitrary user code is never executed on the host."
        >
          <ShieldCheck size={14} color="var(--status-success)" />
          <span>Safe AST Sandbox</span>
        </div>

        {/* AI Provider Mode */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-panel)',
            border: '1px solid var(--border-subtle)',
            fontSize: '12px',
            color: health.ai_provider_configured ? 'var(--accent-pink)' : 'var(--text-secondary)',
          }}
        >
          <Sparkles size={14} color={health.ai_provider_configured ? 'var(--accent-pink)' : 'var(--text-muted)'} />
          <span>{health.ai_provider_mode || 'Rule Engine'}</span>
        </div>

        {/* Backend Status Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-panel)',
            border: '1px solid var(--border-subtle)',
            fontSize: '12px',
            color: 'var(--text-secondary)',
          }}
        >
          <Circle
            size={8}
            fill={isHealthy ? 'var(--status-success)' : 'var(--status-error)'}
            color={isHealthy ? 'var(--status-success)' : 'var(--status-error)'}
          />
          <span>{isHealthy ? 'API Connected' : 'Offline'}</span>
        </div>

        {/* Swagger Docs Link */}
        <a
          href="/docs"
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 10px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'transparent',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            fontSize: '12px',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent-pink)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
          title="Open FastAPI Swagger Interactive Documentation"
        >
          <BookOpen size={14} />
          <span>API Docs</span>
        </a>
      </div>
    </header>
  );
}
