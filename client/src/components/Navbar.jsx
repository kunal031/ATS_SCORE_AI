import React, { useState } from 'react';
import { exportToCSV, copyForGoogleSheets } from '../utils/exporter.js';

export default function Navbar({ activeTab, onTabChange, hasReport, isBatch, appMode = 'live', evalMode = 'single', reportData, onNewAnalyze }) {
  const [copied, setCopied] = useState(false);

  const getModeTitle = () => {
    if (activeTab === 'report') {
      return isBatch ? '👥 Multi-Candidate Rankings Report' : '📊 Verified Candidate Evaluation Report';
    }
    if (appMode === 'demo') {
      return evalMode === 'single' ? '⚡ Demo: Single Senior Engineer Assessment' : '👥 Demo: Batch Multi-Candidate Comparison';
    }
    return evalMode === 'single' ? '👤 Live: Single Candidate Evaluation' : '👥 Live: Batch Multi-Resume Ranking';
  };

  const handleCopySheets = async () => {
    if (!reportData) return;
    const success = await copyForGoogleSheets(reportData);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <header className="navbar-container">
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '6px 14px', borderRadius: '10px' }}>
          <span style={{ 
            width: '8px', 
            height: '8px', 
            borderRadius: '50%', 
            background: activeTab === 'report' ? '#3b82f6' : (appMode === 'demo' ? '#f59e0b' : '#10b981'),
            display: 'inline-block'
          }}></span>
          <span style={{ 
            fontSize: '14px', 
            fontWeight: '700', 
            color: '#0f172a'
          }}>
            {getModeTitle()}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {activeTab === 'report' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => exportToCSV(reportData)}
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#0f172a',
                padding: '8px 18px',
                borderRadius: '20px',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                transition: 'all 0.2s'
              }}
            >
              <span>📥</span> Download CSV
            </button>
            <button
              type="button"
              onClick={handleCopySheets}
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#0f172a',
                padding: '8px 18px',
                borderRadius: '20px',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                transition: 'all 0.2s'
              }}
            >
              <span>{copied ? '✅' : '📋'}</span> {copied ? 'Copied!' : 'Copy for Google Sheets'}
            </button>
            <button
              type="button"
              onClick={onNewAnalyze}
              style={{
                background: '#c81e28',
                border: 'none',
                color: '#ffffff',
                padding: '8px 20px',
                borderRadius: '20px',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(200, 30, 40, 0.3)',
                transition: 'all 0.2s'
              }}
            >
              <span>🔄</span> Evaluate Another
            </button>
          </div>
        ) : (
          hasReport && (
            <button
              type="button"
              className="tab-btn active"
              onClick={() => onTabChange('report')}
              style={{ padding: '9px 20px', fontSize: '14px', borderRadius: '10px', background: '#c81e28', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '700', boxShadow: '0 4px 14px rgba(200, 30, 40, 0.3)' }}
            >
              {isBatch ? '👥 View Batch Table ➔' : '📊 View Verified Report ➔'}
            </button>
          )
        )}
      </div>
    </header>
  );
}

