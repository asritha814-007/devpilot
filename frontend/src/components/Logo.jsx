import React from 'react';

/**
 * DevPilot Minimal Custom D-shaped Logo with Code-Bracket Motif.
 * Designed with Obsidian Black, Charcoal, Porcelain, and Blush Pink.
 */
export default function Logo({ size = 32, showText = true, className = '' }) {
  return (
    <div className={`flex items-center gap-3 ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        {/* Background container */}
        <rect width="40" height="40" rx="10" fill="#292529" stroke="#383238" strokeWidth="1.5" />
        
        {/* D-shaped stem & curve in Dusty Blush Pink */}
        <path
          d="M12 11H20C24.4183 11 28 14.5817 28 19C28 23.4183 24.4183 27 20 27H12V11Z"
          stroke="#F2B8C6"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Code bracket motif: Left angle & slash in Soft Porcelain */}
        <path
          d="M16 16L13.5 19L16 22"
          stroke="#F5F1F2"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M19 22.5L21.5 15.5"
          stroke="#F2B8C6"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M23 16L25.5 19L23 22"
          stroke="#F5F1F2"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: '18px',
                letterSpacing: '-0.5px',
                color: 'var(--text-primary)',
              }}
            >
              Dev<span style={{ color: 'var(--accent-pink)' }}>Pilot</span>
            </span>
            <span
              style={{
                fontSize: '9px',
                fontWeight: 700,
                padding: '2px 5px',
                borderRadius: '4px',
                backgroundColor: 'rgba(242, 184, 198, 0.12)',
                color: 'var(--accent-pink)',
                border: '1px solid rgba(242, 184, 198, 0.28)',
                letterSpacing: '0.6px',
                textTransform: 'uppercase',
              }}
            >
              v1.0
            </span>
          </div>
          <span
            style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-sans)',
              letterSpacing: '0.2px',
              marginTop: '2px',
            }}
          >
            AI Python Debugger
          </span>
        </div>
      )}
    </div>
  );
}
