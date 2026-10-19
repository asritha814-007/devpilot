import React, { useState } from 'react';
import CodeEditor, { SAMPLE_SNIPPETS } from '../components/Editor';
import FindingsPanel from '../components/FindingsPanel';
import AIExplanationPanel from '../components/AIExplanationPanel';
import RepairPanel from '../components/RepairPanel';
import VerificationPanel from '../components/VerificationPanel';
import { api } from '../services/api';
import {
  AlertCircle,
  Sparkles,
  Wrench,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';

export default function AnalyzerPage({ currentCode, onCodeChange }) {
  const [activeRightTab, setActiveRightTab] = useState('findings'); // 'findings' | 'ai' | 'repair' | 'verification'
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleRunAnalysis = async () => {
    if (!currentCode || !currentCode.trim()) {
      setErrorMsg('Please enter or paste Python code before running analysis.');
      return;
    }

    setErrorMsg('');
    setIsLoading(true);

    try {
      const data = await api.analyzeCode(currentCode);
      setAnalysisResult(data);

      // Auto-focus relevant tab
      if (data.findings && data.findings.length > 0) {
        setActiveRightTab('findings');
      } else {
        setActiveRightTab('verification');
      }

      showToast(`Analysis completed: ${data.findings.length} issue(s) detected.`);
    } catch (err) {
      console.error('Analysis error:', err);
      setErrorMsg(err.message || 'Failed to complete code analysis. Check backend connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyFix = (proposedCode) => {
    onCodeChange(proposedCode);
    showToast('Applied proposed fix to editor.');
    // Re-run analysis on the newly applied code
    setTimeout(async () => {
      try {
        const data = await api.analyzeCode(proposedCode);
        setAnalysisResult(data);
        setActiveRightTab('verification');
      } catch (e) {
        console.error('Re-analysis error:', e);
      }
    }, 100);
  };

  const findingsCount = analysisResult?.findings?.length || 0;
  const hasRepair = Boolean(analysisResult?.suggested_repair?.proposed_code);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '16px 20px',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className="animate-fade-in"
          style={{
            position: 'absolute',
            bottom: '24px',
            right: '24px',
            backgroundColor: 'var(--bg-panel)',
            border: '1px solid var(--accent-pink-border)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
            color: 'var(--text-primary)',
            padding: '10px 18px',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 100,
          }}
        >
          <CheckCircle size={15} color="var(--accent-pink)" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Main Split Grid: Left Editor, Right Workbench Results */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(400px, 1.15fr) minmax(420px, 1.25fr)',
          gap: '16px',
          height: '100%',
          minHeight: 0,
        }}
      >
        {/* Left Column: Code Editor */}
        <div style={{ height: '100%', minHeight: 0 }}>
          <CodeEditor
            code={currentCode}
            onChange={onCodeChange}
            onAnalyze={handleRunAnalysis}
            isLoading={isLoading}
            errorMsg={errorMsg}
          />
        </div>

        {/* Right Column: Analysis & Repair Results Panel */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            backgroundColor: 'var(--bg-panel)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            overflow: 'hidden',
            minHeight: 0,
          }}
        >
          {/* Top Result Tabs */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'var(--bg-obsidian)',
              borderBottom: '1px solid var(--border-subtle)',
              padding: '0 8px',
              flexShrink: 0,
            }}
          >
            {/* Tab 1: Findings */}
            <button
              onClick={() => setActiveRightTab('findings')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 14px',
                backgroundColor: 'transparent',
                color: activeRightTab === 'findings' ? 'var(--accent-pink)' : 'var(--text-secondary)',
                borderBottom: activeRightTab === 'findings' ? '2px solid var(--accent-pink)' : '2px solid transparent',
                fontWeight: activeRightTab === 'findings' ? 600 : 500,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              <AlertCircle size={15} />
              <span>Issues Detected</span>
              {findingsCount > 0 && (
                <span
                  style={{
                    backgroundColor: 'var(--status-error-bg)',
                    color: 'var(--status-error)',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '9999px',
                  }}
                >
                  {findingsCount}
                </span>
              )}
            </button>

            {/* Tab 2: AI Explanations */}
            <button
              onClick={() => setActiveRightTab('ai')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 14px',
                backgroundColor: 'transparent',
                color: activeRightTab === 'ai' ? 'var(--accent-pink)' : 'var(--text-secondary)',
                borderBottom: activeRightTab === 'ai' ? '2px solid var(--accent-pink)' : '2px solid transparent',
                fontWeight: activeRightTab === 'ai' ? 600 : 500,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              <Sparkles size={15} />
              <span>AI Explanation</span>
            </button>

            {/* Tab 3: Code Repair */}
            <button
              onClick={() => setActiveRightTab('repair')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 14px',
                backgroundColor: 'transparent',
                color: activeRightTab === 'repair' ? 'var(--accent-pink)' : 'var(--text-secondary)',
                borderBottom: activeRightTab === 'repair' ? '2px solid var(--accent-pink)' : '2px solid transparent',
                fontWeight: activeRightTab === 'repair' ? 600 : 500,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              <Wrench size={15} />
              <span>Repair & Diff</span>
              {hasRepair && (
                <span
                  style={{
                    backgroundColor: 'var(--accent-pink-dim)',
                    color: 'var(--accent-pink)',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '9999px',
                  }}
                >
                  Fix Ready
                </span>
              )}
            </button>

            {/* Tab 4: Verification */}
            <button
              onClick={() => setActiveRightTab('verification')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 14px',
                backgroundColor: 'transparent',
                color: activeRightTab === 'verification' ? 'var(--accent-pink)' : 'var(--text-secondary)',
                borderBottom: activeRightTab === 'verification' ? '2px solid var(--accent-pink)' : '2px solid transparent',
                fontWeight: activeRightTab === 'verification' ? 600 : 500,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              <ShieldCheck size={15} />
              <span>Verification Panel</span>
            </button>
          </div>

          {/* Tab Content Canvas */}
          <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
            {activeRightTab === 'findings' && (
              <FindingsPanel
                findings={analysisResult?.findings || []}
                summary={analysisResult?.summary || {}}
              />
            )}

            {activeRightTab === 'ai' && (
              <AIExplanationPanel
                explanations={analysisResult?.ai_explanations || []}
                findings={analysisResult?.findings || []}
              />
            )}

            {activeRightTab === 'repair' && (
              <RepairPanel
                repair={analysisResult?.suggested_repair}
                originalCode={currentCode}
                onApplyFix={handleApplyFix}
              />
            )}

            {activeRightTab === 'verification' && (
              <VerificationPanel verification={analysisResult?.verification} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
