import React, { useState } from 'react';
import { exportToCSV, copyForGoogleSheets } from '../utils/exporter.js';

export default function Navbar({ evaluationResults = [], isEvaluating = false, onReset }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyForGoogleSheets(evaluationResults, () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3500);
    });
  };

  const hasResults = evaluationResults.length > 0;
  // "Evaluate Another" should appear after all results are visible (hasResults && not evaluating)
  const allResultsFinished = hasResults && !isEvaluating;

  return (
    <header style={{
      height: '76px',
      minHeight: '76px',
      background: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      padding: '0 32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04)'
    }}>
      {/* BRANDING & LOGO */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }} onClick={onReset}>
        <div style={{
          width: '44px',
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(17, 88, 154, 0.08)',
          border: '1px solid rgba(17, 88, 154, 0.2)',
          borderRadius: '12px',
          color: '#11589a',
          boxShadow: '0 2px 8px rgba(17, 88, 154, 0.1)'
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10a10 10 0 0 1-10-10 10 10 0 0 1 10-10z"/>
            <path d="M12 8v4l3 3"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </div>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', margin: 0, color: '#0f172a', letterSpacing: '-0.5px', lineHeight: '1.2' }}>
            JD vs Resume Check
          </h1>
        </div>
      </div>

      {/* TOP RIGHT ACTION BAR (CSV Download, Copy Sheet, & Evaluate Another) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {hasResults && (
          <>
            <button
              type="button"
              onClick={() => exportToCSV(evaluationResults, "Candidate_Evaluation_Report.csv")}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                background: '#f8fafc',
                color: '#334155',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              title="Download results table as CSV file with user_id, resume_link, resume_score"
            >
              📥 Download as CSV
            </button>

            <button
              type="button"
              onClick={handleCopy}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                borderRadius: '12px',
                border: copied ? '1px solid #86efac' : '1px solid #cbd5e1',
                background: copied ? '#f0fdf4' : '#f8fafc',
                color: copied ? '#15803d' : '#334155',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              title="Copy table rows as tab-separated values to paste directly into Google Sheets or Excel"
            >
              {copied ? "✅ Copied to Clipboard!" : "📋 Copy for Google Sheets"}
            </button>
          </>
        )}

        {allResultsFinished && (
          <button
            type="button"
            onClick={onReset}
            className="btn-primary"
            style={{
              padding: '10px 22px',
              fontSize: '14px',
              fontWeight: '800',
              borderRadius: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(17, 88, 154, 0.25)'
            }}
            title="Reset website forms and begin a brand new evaluation session"
          >
            🔄 Evaluate Another
          </button>
        )}

        {!hasResults && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '20px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', letterSpacing: '0.3px' }}>
              System Ready for Analysis
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
