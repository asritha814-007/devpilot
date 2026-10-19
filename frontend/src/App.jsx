import React, { useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import AnalyzerPage from './pages/AnalyzerPage';
import DashboardPage from './pages/DashboardPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import { SAMPLE_SNIPPETS } from './components/Editor';
import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('analyzer');
  const [code, setCode] = useState(SAMPLE_SNIPPETS.syntax_error.code);

  const handleOpenFromHistory = async (analysisId) => {
    try {
      const data = await api.getAnalysisById(analysisId);
      if (data && data.code) {
        setCode(data.code);
        setActiveTab('analyzer');
      }
    } catch (err) {
      console.error('Failed to load past analysis:', err);
      alert('Could not load analysis details.');
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100vw',
        height: '100vh',
        backgroundColor: 'var(--bg-obsidian)',
        overflow: 'hidden',
      }}
    >
      {/* Top Header */}
      <Header />

      {/* Main Body: Sidebar + Active Page */}
      <div
        style={{
          display: 'flex',
          flex: 1,
          height: 'calc(100vh - 56px)',
          overflow: 'hidden',
        }}
      >
        <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />

        <main
          style={{
            flex: 1,
            height: '100%',
            overflow: 'hidden',
            backgroundColor: 'var(--bg-obsidian)',
          }}
        >
          {activeTab === 'analyzer' && (
            <AnalyzerPage currentCode={code} onCodeChange={setCode} />
          )}

          {activeTab === 'dashboard' && (
            <DashboardPage
              onOpenInEditor={(id) => {
                if (id) {
                  handleOpenFromHistory(id);
                } else {
                  setActiveTab('analyzer');
                }
              }}
            />
          )}

          {activeTab === 'history' && (
            <HistoryPage onSelectAnalysis={handleOpenFromHistory} />
          )}

          {activeTab === 'settings' && <SettingsPage />}
        </main>
      </div>
    </div>
  );
}
