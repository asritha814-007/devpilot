import React from 'react';
import {
  LayoutDashboard,
  Code2,
  History,
  Settings,
  Database,
  Cpu,
  Zap,
} from 'lucide-react';

export default function Sidebar({ activeTab, onSelectTab }) {
  const navItems = [
    { id: 'analyzer', label: 'Code Analyzer', icon: Code2, badge: 'Core' },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'history', label: 'Analysis History', icon: History },
    { id: 'settings', label: 'Settings & AI', icon: Settings },
  ];

  return (
    <aside
      style={{
        width: '240px',
        backgroundColor: 'var(--bg-panel)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        flexShrink: 0,
        height: '100%',
        userSelect: 'none',
      }}
    >
      {/* Top Nav links */}
      <div style={{ padding: '16px 12px' }}>
        <div
          style={{
            fontSize: '11px',
            textTransform: 'uppercase',
            fontWeight: 700,
            letterSpacing: '0.8px',
            color: 'var(--text-muted)',
            padding: '0 12px 10px',
          }}
        >
          Workspace
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isActive ? 'var(--bg-obsidian)' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  border: isActive ? '1px solid var(--accent-pink-border)' : '1px solid transparent',
                  position: 'relative',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'var(--bg-panel-hover)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                {/* Active Indicator: Pink Vertical Pill */}
                {isActive && (
                  <div
                    style={{
                      position: 'absolute',
                      left: '0px',
                      top: '6px',
                      bottom: '6px',
                      width: '3px',
                      borderRadius: '0 3px 3px 0',
                      backgroundColor: 'var(--accent-pink)',
                      boxShadow: '0 0 8px var(--accent-pink)',
                    }}
                  />
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon
                    size={17}
                    color={isActive ? 'var(--accent-pink)' : 'var(--text-muted)'}
                  />
                  <span style={{ fontWeight: isActive ? 600 : 500, fontSize: '13px' }}>
                    {item.label}
                  </span>
                </div>

                {item.badge && (
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      padding: '1px 6px',
                      borderRadius: '4px',
                      backgroundColor: isActive ? 'var(--accent-pink-dim)' : 'var(--bg-surface)',
                      color: isActive ? 'var(--accent-pink)' : 'var(--text-muted)',
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom system status card */}
      <div
        style={{
          margin: '12px',
          padding: '14px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--bg-obsidian)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Zap size={14} color="var(--accent-pink)" />
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Static + AI Hybrid
          </span>
        </div>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
          AST rules parse code offline. Real AI explains root causes and generates verified repairs.
        </p>
        <div
          style={{
            marginTop: '10px',
            paddingTop: '8px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: 'var(--text-secondary)',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Database size={11} color="var(--text-muted)" /> SQLite
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Cpu size={11} color="var(--text-muted)" /> Python 3.14
          </span>
        </div>
      </div>
    </aside>
  );
}
