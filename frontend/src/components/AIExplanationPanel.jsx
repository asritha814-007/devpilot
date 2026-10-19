import React from 'react';
import {
  Sparkles,
  HelpCircle,
  Lightbulb,
  CheckCircle,
  BookOpen,
  Info,
} from 'lucide-react';

export default function AIExplanationPanel({ explanations = [], findings = [] }) {
  if (!explanations || explanations.length === 0) {
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
        <Sparkles size={36} color="var(--accent-pink)" style={{ marginBottom: '12px', opacity: 0.7 }} />
        <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
          No Explanations to Display
        </h4>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '360px', lineHeight: '1.5' }}>
          Submit Python code with issues in the editor to receive AI root-cause analysis and beginner-friendly breakdowns.
        </p>
      </div>
    );
  }

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
      {/* Top AI / Engine Badge Banner */}
      <div
        style={{
          padding: '10px 14px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--bg-obsidian)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={16} color="var(--accent-pink)" />
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Deep Diagnostic Explanations
          </span>
        </div>
        <span
          style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            backgroundColor: 'var(--bg-panel)',
            padding: '2px 8px',
            borderRadius: '4px',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {explanations[0]?.provider || 'DevPilot Engine'}
        </span>
      </div>

      {/* Explanation Cards */}
      {explanations.map((exp, idx) => {
        const matchingFinding = findings.find((f) => f.id === exp.issue_id) || findings[idx];

        return (
          <div
            key={exp.issue_id || idx}
            style={{
              backgroundColor: 'var(--bg-obsidian)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {/* Header with Title and AI generated badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: '4px',
                    backgroundColor: exp.is_ai_generated ? 'var(--accent-pink-dim)' : 'var(--bg-panel)',
                    color: exp.is_ai_generated ? 'var(--accent-pink)' : 'var(--text-secondary)',
                    border: exp.is_ai_generated
                      ? '1px solid var(--accent-pink-border)'
                      : '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Sparkles size={10} />
                  {exp.is_ai_generated ? 'AI Analysis' : 'Static Rule Knowledge'}
                </span>

                <h5 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {matchingFinding?.title || `Issue #${idx + 1}`}
                </h5>
              </div>

              {matchingFinding?.line && (
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  Line {matchingFinding.line}
                </span>
              )}
            </div>

            {/* Section 1: What It Means */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span
                style={{
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  letterSpacing: '0.6px',
                  color: 'var(--accent-pink)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <Info size={12} />
                What It Means
              </span>
              <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                {exp.summary}
              </p>
            </div>

            {/* Section 2: Why It Happened */}
            <div
              style={{
                backgroundColor: 'var(--bg-panel)',
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  letterSpacing: '0.6px',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <HelpCircle size={12} color="var(--text-muted)" />
                Why This Occurs in Python
              </span>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                {exp.why_it_happened}
              </p>
            </div>

            {/* Section 3: How to Fix */}
            <div
              style={{
                backgroundColor: 'var(--bg-panel)',
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  letterSpacing: '0.6px',
                  color: 'var(--status-success)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <CheckCircle size={12} />
                How to Fix It
              </span>
              <p style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                {exp.how_to_fix}
              </p>
            </div>

            {/* Section 4: Beginner Takeaway Tip */}
            {exp.beginner_tip && (
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(242, 184, 198, 0.08)',
                  border: '1px dashed var(--accent-pink-border)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                }}
              >
                <Lightbulb size={14} color="var(--accent-pink)" style={{ marginTop: '2px', flexShrink: 0 }} />
                <span style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                  <strong style={{ color: 'var(--accent-pink)' }}>Beginner Tip: </strong>
                  {exp.beginner_tip}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
