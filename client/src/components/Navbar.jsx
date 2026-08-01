import React from 'react';

export default function Navbar({ activeTab, onTabChange, hasReport, isBatch }) {
  return (
    <header className="navbar">
      <div className="logo-container" onClick={() => onTabChange('dashboard')} style={{ cursor: 'pointer' }}>
        <div className="logo-icon">⚡</div>
        <span className="logo-text">AntiGrav <span className="gradient-text">ATS</span></span>
      </div>

      <nav className="nav-links">
        <button
          className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => onTabChange('dashboard')}
          style={{ background: activeTab === 'dashboard' ? 'var(--accent-gradient)' : 'transparent', border: 'none' }}
        >
          🚀 AI Generator & Verifier
        </button>

        {hasReport && (
          <button
            className={`tab-btn ${activeTab === 'report' ? 'active' : ''}`}
            onClick={() => onTabChange('report')}
            style={{ background: activeTab === 'report' ? 'var(--accent-gradient)' : 'transparent', border: 'none' }}
          >
            {isBatch ? '👥 Batch Comparison Table' : '📊 Verified Evaluation Report'}
          </button>
        )}
      </nav>
    </header>
  );
}
