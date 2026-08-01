import React, { useState } from 'react';
import Navbar from './components/Navbar.jsx';
import Sidebar from './components/Sidebar.jsx';
import Dashboard from './components/Dashboard.jsx';
import AnalysisReport from './components/AnalysisReport.jsx';
import BatchReportTable from './components/BatchReportTable.jsx';
import { unwrapAiObjects } from './utils/textHelper.js';

export default function App() {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('ats_active_tab') || 'dashboard';
  });
  const [reportData, setReportData] = useState(() => {
    const saved = localStorage.getItem('ats_report_data');
    if (saved) {
      try { return unwrapAiObjects(JSON.parse(saved)); } catch (e) { return null; }
    }
    return null;
  });

  const [appMode, setAppMode] = useState(() => localStorage.getItem('ats_app_mode') || 'live'); // 'live' | 'demo'
  const [evalMode, setEvalMode] = useState(() => localStorage.getItem('ats_eval_mode') || 'single'); // 'single' | 'batch'
  const [triggerAction, setTriggerAction] = useState(null);

  const handleEvaluationComplete = (result) => {
    const cleanResult = unwrapAiObjects(result);
    setReportData(cleanResult);
    setActiveTab('report');
    localStorage.setItem('ats_report_data', JSON.stringify(cleanResult));
    localStorage.setItem('ats_active_tab', 'report');
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    localStorage.setItem('ats_active_tab', tab);
  };

  const handleSelectMode = (newAppMode, newEvalMode) => {
    setAppMode(newAppMode);
    setEvalMode(newEvalMode);
    localStorage.setItem('ats_app_mode', newAppMode);
    localStorage.setItem('ats_eval_mode', newEvalMode);
    if (activeTab !== 'dashboard') {
      setActiveTab('dashboard');
      localStorage.setItem('ats_active_tab', 'dashboard');
    }
    if (newAppMode === 'demo') {
      setTriggerAction({ type: newEvalMode === 'single' ? 'FILL_SAMPLE_SINGLE' : 'FILL_SAMPLE_BATCH', ts: Date.now() });
    } else {
      setTriggerAction({ type: newEvalMode === 'single' ? 'SWITCH_LIVE_SINGLE' : 'SWITCH_LIVE_BATCH', ts: Date.now() });
    }
  };

  const handleReset = () => {
    setReportData(null);
    setActiveTab('dashboard');
    localStorage.removeItem('ats_report_data');
    localStorage.removeItem('ats_batch_selected_id');
    localStorage.setItem('ats_active_tab', 'dashboard');
  };

  return (
    <div className="app-root-layout">
      <Sidebar 
        appMode={appMode} 
        evalMode={evalMode} 
        onSelectMode={handleSelectMode} 
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Navbar 
          activeTab={activeTab} 
          onTabChange={handleTabChange} 
          hasReport={Boolean(reportData)} 
          isBatch={Boolean(reportData?.isBatch)}
          appMode={appMode}
          evalMode={evalMode}
          reportData={reportData}
          onNewAnalyze={handleReset}
        />

        <main className="main-content-area">
          {activeTab === 'dashboard' && (
            <Dashboard 
              onComplete={handleEvaluationComplete}
              appMode={appMode}
              setAppMode={setAppMode}
              evalMode={evalMode}
              setEvalMode={setEvalMode}
              triggerAction={triggerAction}
            />
          )}

          {activeTab === 'report' && reportData && (
            reportData.isBatch ? (
              <BatchReportTable batchData={reportData} onNewAnalyze={handleReset} />
            ) : (
              <AnalysisReport report={reportData} onNewAnalyze={handleReset} />
            )
          )}

          {activeTab === 'report' && !reportData && (
            <div className="glass-card" style={{ textAlign: 'center', padding: '60px' }}>
              <h2 style={{ marginBottom: '15px' }}>No Active Evaluation Report</h2>
              <p style={{ color: 'var(--text-sub)', marginBottom: '25px' }}>
                Upload a resume and job description on the dashboard to generate your AI-verified analysis.
              </p>
              <button className="btn-primary" onClick={handleReset}>
                Go to Dashboard
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
