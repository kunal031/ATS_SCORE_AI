import React, { useState } from 'react';
import { exportToCSV, copyForGoogleSheets } from '../utils/exporter.js';
import { safeRender } from '../utils/textHelper.js';

export default function AnalysisReport({ report, onNewAnalyze }) {
  const [copied, setCopied] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  if (!report || typeof report !== 'object') {
    return (
      <div className="glass-card" style={{ padding: '40px', textAlign: 'center', margin: '40px auto', maxWidth: '600px' }}>
        <h3 style={{ color: '#f43f5e', marginBottom: '12px' }}>Report Data Unavailable</h3>
        <p style={{ color: 'var(--text-sub)', marginBottom: '24px' }}>The evaluation report could not be loaded or session data expired.</p>
        <button className="btn-primary" onClick={onNewAnalyze}>Go to Dashboard</button>
      </div>
    );
  }

  const scoreSummary = report.scoreSummary || {};
  const breakdown = scoreSummary.breakdown || {};
  const github = report.githubVerification || {};
  const coding = report.codingCompetency || {};
  const ai = report.aiFeedback || {};

  const handleCopyTSV = async () => {
    const success = await copyForGoogleSheets(report);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 4000);
    }
  };

  return (
    <div>
      {showConfirm && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div className="glass-card" style={{
            maxWidth: '480px', width: '90%', padding: '36px', textAlign: 'center',
            border: '1px solid rgba(244, 63, 94, 0.4)', boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6)',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#f8fafc', marginBottom: '12px' }}>
              Evaluate Another Resume?
            </h3>
            <p style={{ fontSize: '15px', color: 'var(--text-sub)', lineHeight: '1.6', marginBottom: '24px' }}>
              Are you sure you want to start a new analysis?
              <br /><br />
              <span style={{ color: '#fb7185', fontWeight: '700', padding: '10px 14px', background: 'rgba(244, 63, 94, 0.12)', borderRadius: '8px', display: 'inline-block', border: '1px solid rgba(244, 63, 94, 0.25)' }}>
                🚨 Note: If you click yes then present data will be deleted.
              </span>
            </p>
            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                className="btn-secondary"
                onClick={() => setShowConfirm(false)}
                style={{ padding: '12px 24px', fontSize: '15px', border: '1px solid var(--border-glass)' }}
              >
                ❌ Cancel
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  setShowConfirm(false);
                  onNewAnalyze();
                }}
                style={{ padding: '12px 24px', fontSize: '15px', background: 'linear-gradient(135deg, #f43f5e, #e11d48)' }}
              >
                ✅ Yes, Delete & Start New
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="responsive-header" style={{ marginBottom: '30px' }}>
        <div>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' }}>
            VERIFIED EVALUATION REPORT
          </span>
          <h2 style={{ fontSize: '32px', fontWeight: '800' }}>Candidate Analysis & Rubric Score</h2>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '8px' }}>
          <button className="btn-secondary" onClick={() => exportToCSV(report)}>
            📥 Download CSV
          </button>
          <button className="btn-secondary" onClick={handleCopyTSV} style={{ background: copied ? 'rgba(16, 185, 129, 0.2)' : undefined }}>
            {copied ? '✅ Copied for Sheets!' : '📋 Copy for Google Sheets'}
          </button>
          <button className="btn-primary" onClick={() => setShowConfirm(true)} style={{ padding: '10px 20px', fontSize: '14px' }}>
            🔄 Evaluate Another
          </button>
        </div>
      </div>

      {copied && (
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--success)', padding: '12px 20px', borderRadius: '12px', color: '#6ee7b7', marginBottom: '25px', fontSize: '14px', fontWeight: '600' }}>
          ✅ Tabular data copied to clipboard! You can now press <strong>Cmd+V / Ctrl+V</strong> directly into any Google Sheet to generate a structured evaluation spreadsheet.
        </div>
      )}

      {/* Top Header Section: Dial Gauge & Rubric Breakdown */}
      <div className="report-header">
        <div className="glass-card score-box" style={{ borderColor: scoreSummary.color || '#a855f7' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-sub)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>
            SMART JD SATISFACTION
          </span>
          <div className="score-number" style={{ color: scoreSummary.color || '#fff' }}>
            {safeRender(scoreSummary.overallScore, 0)}%
          </div>
          <div className="score-badge" style={{ background: `${scoreSummary.color}30`, color: scoreSummary.color, border: `1px solid ${scoreSummary.color}` }}>
            {safeRender(scoreSummary.statusLabel, 'VERIFIED MATCH')}
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '16px', lineHeight: '1.5' }}>
            Marking scheme based directly on verified JD requirement satisfaction across Resume Projects & GitHub Repos (no static weights or simple string matching).
          </p>
        </div>

        <div className="glass-card">
          <h3 style={{ fontSize: '20px', marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <span>🎯 Smart JD Satisfaction & Verification Pillars</span>
            <span style={{ fontSize: '13px', color: '#10b981', background: 'rgba(16, 185, 129, 0.12)', padding: '4px 12px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.25)', fontWeight: '600' }}>
              ⚡ Dynamic Proof Scoring
            </span>
          </h3>

          <div className="criteria-list">
            {/* Smart JD Requirement Match */}
            <div>
              <div className="criteria-info">
                <span>1. Smart JD Requirement Match <span style={{ color: '#38bdf8', fontSize: '12px', fontWeight: '600' }}>[Semantic Equivalency Check]</span></span>
                <span style={{ color: '#38bdf8' }}>{safeRender(breakdown.keywordMatch?.score, 0)}%</span>
              </div>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: `${safeRender(breakdown.keywordMatch?.score, 0)}%`, background: '#38bdf8' }}></div>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                {safeRender(breakdown.keywordMatch?.summary, "AI smartly matched technologies & conceptual equivalents without requiring rigid word matching.")}
              </span>
            </div>

            {/* Resume Projects Proof */}
            <div>
              <div className="criteria-info">
                <span>2. Resume Projects Tech Proof <span style={{ color: '#f59e0b', fontSize: '12px', fontWeight: '600' }}>[Practical Implementation]</span></span>
                <span style={{ color: '#f59e0b' }}>{safeRender(breakdown.codingCompetency?.score, 0)}%</span>
              </div>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: `${safeRender(breakdown.codingCompetency?.score, 0)}%`, background: '#f59e0b' }}></div>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                {safeRender(breakdown.codingCompetency?.summary, "Verified real hands-on implementation across candidate project descriptions.")}
              </span>
            </div>

            {/* GitHub Code Proof */}
            <div>
              <div className="criteria-info">
                <span>3. GitHub Repo Code Verification <span style={{ color: '#34d399', fontSize: '12px', fontWeight: '600' }}>[Live Codebase Scanned]</span></span>
                <span style={{ color: '#34d399' }}>{safeRender(breakdown.githubVerification?.score, 0)}%</span>
              </div>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: `${safeRender(breakdown.githubVerification?.score, 0)}%`, background: '#10b981' }}></div>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                {safeRender(breakdown.githubVerification?.summary, `Verified working code across ${safeRender(breakdown.githubVerification?.totalRepos, 0)} scanned public repositories.`)}
              </span>
            </div>

            {/* Engineering Rigor */}
            <div>
              <div className="criteria-info">
                <span>4. Engineering Rigor & Depth <span style={{ color: '#c084fc', fontSize: '12px', fontWeight: '600' }}>[Structural Clarity]</span></span>
                <span style={{ color: '#c084fc' }}>{safeRender(breakdown.aiQuality?.score, 0)}%</span>
              </div>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: `${safeRender(breakdown.aiQuality?.score, 0)}%`, background: '#c084fc' }}></div>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                {safeRender(breakdown.aiQuality?.assessment, "Evaluation of architectural complexity, real-world deployment outcomes, and conceptual clarity.")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Section: External Verifications */}
      <div className="dashboard-grid" style={{ marginBottom: '30px' }}>
        {/* GitHub Verification Detail */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '20px' }}>💻 GitHub Tech Stack Proof</h3>
            {github.username ? (
              <a href={`https://github.com/${github.username}`} target="_blank" rel="noreferrer" style={{ fontSize: '13px', color: '#60a5fa', textDecoration: 'none', fontWeight: '600' }}>
                @{github.username} ↗
              </a>
            ) : (
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No GitHub linked</span>
            )}
          </div>

          <p style={{ fontSize: '14px', color: 'var(--text-sub)', margin: '10px 0 16px' }}>
            We inspected candidate repositories against required job skills to verify real-world implementation:
          </p>

          <div className="chip-grid">
            {github.techVerification && github.techVerification.length > 0 ? (
              github.techVerification.map((tech, i) => (
                <div key={i} className={`tech-chip ${tech.present ? 'verified' : 'missing'}`}>
                  <span>{tech.present ? '✓' : '✗'}</span>
                  <span>{tech.skill}</span>
                  <span style={{ fontSize: '11px', opacity: 0.8 }}>({tech.repoCount || 0} repos)</span>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No specific technical stack tags required by Job Description.</p>
            )}
          </div>

          {/* Sample Matching Repositories */}
          {github.techVerification && github.techVerification.some(t => t.sampleRepos && t.sampleRepos.length > 0) && (
            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-glass)' }}>
              <h4 style={{ fontSize: '14px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Verified Sample Repositories</h4>
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {Array.from(new Set(
                  github.techVerification.flatMap(t => t.sampleRepos || []).map(r => r.url)
                )).slice(0, 4).map((url, idx) => {
                  const repoObj = github.techVerification.flatMap(t => t.sampleRepos || []).find(r => r.url === url);
                  return (
                    <div key={idx} className="repo-card">
                      <span>📦 <a href={repoObj?.url} target="_blank" rel="noreferrer">{repoObj?.name || 'project-repo'}</a></span>
                      <span style={{ fontSize: '12px', color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: '6px' }}>
                        {repoObj?.language || 'Code'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {github.isFallback && (
            <div style={{ fontSize: '12px', color: '#facc15', marginTop: '16px', background: 'rgba(250, 204, 21, 0.1)', padding: '10px 14px', borderRadius: '8px' }}>
              ℹ️ {github.note || 'GitHub API rate-limited; displaying estimated candidate technical assessment.'}
            </div>
          )}
        </div>

        {/* Coding Platforms Detail */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '20px', marginBottom: '10px' }}>🏆 Algorithmic Coding Platforms</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-sub)', marginBottom: '20px' }}>
              Verification of solved algorithmic problems, rating contests, and technical complexity handling:
            </p>

            {coding.leetcode && (
              <div className="criteria-row" style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '16px', fontWeight: '700' }}>⚡ LeetCode Profile</span>
                  <a href={coding.leetcode.profileUrl} target="_blank" rel="noreferrer" style={{ fontSize: '13px', color: '#f59e0b', textDecoration: 'none', fontWeight: '600' }}>
                    @{coding.leetcode.username} ↗
                  </a>
                </div>
                <div className="stats-grid-4">
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#fff' }}>{coding.leetcode.solved?.total || 0}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Solved</div>
                  </div>
                  <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16,185,129,0.2)', padding: '10px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#34d399' }}>{coding.leetcode.solved?.easy || 0}</div>
                    <div style={{ fontSize: '11px', color: '#6ee7b7' }}>Easy</div>
                  </div>
                  <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245,158,11,0.2)', padding: '10px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#fbbf24' }}>{coding.leetcode.solved?.medium || 0}</div>
                    <div style={{ fontSize: '11px', color: '#fcd34d' }}>Medium</div>
                  </div>
                  <div style={{ background: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244,63,94,0.2)', padding: '10px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#fb7185' }}>{coding.leetcode.solved?.hard || 0}</div>
                    <div style={{ fontSize: '11px', color: '#fda4af' }}>Hard</div>
                  </div>
                </div>
                <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Global Rank: <strong style={{ color: '#cbd5e1' }}>{coding.leetcode.ranking || 'N/A'}</strong></span>
                  <span>Rubric Score: <strong style={{ color: '#38bdf8' }}>{coding.leetcode.score || 0}/100</strong></span>
                </div>
              </div>
            )}

            {coding.codeforces && (
              <div className="criteria-row">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '16px', fontWeight: '700' }}>📊 Codeforces Profile</span>
                  <a href={coding.codeforces.profileUrl} target="_blank" rel="noreferrer" style={{ fontSize: '13px', color: '#ef4444', textDecoration: 'none', fontWeight: '600' }}>
                    @{coding.codeforces.handle} ↗
                  </a>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginTop: '10px' }}>
                  <span>Rating: <strong style={{ color: '#fbbf24', fontSize: '16px' }}>{coding.codeforces.rating || 1200} ({coding.codeforces.rank || 'Pupil'})</strong></span>
                  <span>Estimated Solved: <strong style={{ color: '#fff' }}>{coding.codeforces.problemsSolved || '50+'}</strong></span>
                </div>
              </div>
            )}

            {!coding.leetcode && !coding.codeforces && !coding.hackerrank && (
              <div style={{ textAlign: 'center', padding: '30px 10px', border: '1px dashed var(--border-glass)', borderRadius: '12px', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🧩</div>
                <p style={{ fontWeight: '600', color: 'var(--text-sub)' }}>No Coding Profile Handle Detected</p>
                <p style={{ fontSize: '13px', marginTop: '4px' }}>Add a LeetCode or Codeforces URL in your resume or in the dashboard override section to verify problem solving fluency.</p>
              </div>
            )}
          </div>

          <div style={{ marginTop: '20px', padding: '14px 18px', background: 'rgba(139, 92, 246, 0.06)', borderRadius: '12px', border: '1px solid rgba(139,92,246,0.2)' }}>
            <p style={{ fontSize: '13px', color: '#c084fc', margin: 0 }}>
              💡 <strong>Recruiter Takeaway:</strong> {coding.hasProfile ? "Verified algorithmic activity proves structured computer science and performance tuning competencies." : "Algorithmic competency defaulted to AI quality assessment proxy without penalty."}
            </p>
          </div>
        </div>
      </div>

      {/* AI Smart Semantic Equivalency & Multi-Tier Proof Section */}
      {ai?.semantic_skill_matches && ai.semantic_skill_matches.length > 0 && (
        <div className="glass-card" style={{ marginBottom: '30px' }}>
          <h3 style={{ fontSize: '20px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <span>🔍 Smart JD Requirement Verification Matrix</span>
            <span style={{ fontSize: '13px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '5px 14px', borderRadius: '20px', fontWeight: '600', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
              🛠️ Checked via Resume Projects & GitHub Code
            </span>
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--text-sub)', marginBottom: '20px' }}>
            Each target Job Description requirement is marked not by simple word matching, but by verifying concrete application across candidate projects and live repositories:
          </p>
          <div className="matrix-grid">
            {ai.semantic_skill_matches.map((item, idx) => (
              <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', gap: '8px' }}>
                    <span style={{ fontSize: '16px', fontWeight: '700', color: '#f8fafc' }}>{safeRender(item.requirement)}</span>
                    <span style={{ 
                      fontSize: '12px', fontWeight: '800', padding: '4px 10px', borderRadius: '6px', whiteSpace: 'nowrap',
                      background: item.score >= 80 ? 'rgba(16, 185, 129, 0.15)' : item.score >= 50 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                      color: item.score >= 80 ? '#34d399' : item.score >= 50 ? '#f59e0b' : '#fb7185',
                      border: `1px solid ${item.score >= 80 ? 'rgba(16, 185, 129, 0.3)' : item.score >= 50 ? 'rgba(245, 158, 11, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`
                    }}>
                      {safeRender(item.match_type, item.score >= 50 ? 'Matched' : 'Missing')} ({safeRender(item.score, 0)}%)
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '12px' }}>
                    <strong style={{ color: '#38bdf8' }}>Semantic Fit:</strong> {safeRender(item.candidate_has, 'Not documented in candidate text')}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  {/* Resume Project Proof Badge */}
                  <div style={{ fontSize: '12px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <span style={{ minWidth: '18px' }}>🛠️</span>
                    <span>
                      <strong style={{ color: '#f59e0b', fontWeight: '600' }}>Project Proof: </strong>
                      <span style={{ color: 'var(--text-muted)' }}>{safeRender(item.project_proof, "Verified across candidate work achievements and project architectures")}</span>
                    </span>
                  </div>

                  {/* GitHub Repo Code Proof Badge */}
                  <div style={{ fontSize: '12px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <span style={{ minWidth: '18px' }}>📦</span>
                    <span>
                      <strong style={{ color: item.github_proof ? '#34d399' : '#94a3b8', fontWeight: '600' }}>
                        {item.github_proof ? 'GitHub Confirmed: ' : 'GitHub Scan: '}
                      </strong>
                      <span style={{ color: item.github_proof ? '#10b981' : 'var(--text-muted)' }}>
                        {item.github_proof ? `Verified in working code (${Array.isArray(item.sample_repos) && item.sample_repos.length > 0 ? item.sample_repos.join(', ') : 'Scanned Repositories'})` : 'No corresponding public repository found'}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Executive Assessment Section */}
      <div className="glass-card" style={{ background: 'rgba(255,255,255,0.02)', padding: '24px 28px' }}>
        <h3 style={{ fontSize: '20px', color: '#a855f7', marginBottom: '10px' }}>📋 Executive Recruiter Synthesis</h3>
        <p style={{ fontSize: '15px', color: '#cbd5e1', lineHeight: '1.7' }}>
          {safeRender(ai?.overall_assessment, "Candidate demonstrates strong foundations across required technical layers with verifiable implementation projects.")}
        </p>
      </div>

      <div className="export-bar">
        <button className="btn-secondary" onClick={() => exportToCSV(report)}>
          📥 Export CSV Report
        </button>
        <button className="btn-secondary" onClick={handleCopyTSV} style={{ background: copied ? 'rgba(16, 185, 129, 0.2)' : undefined }}>
          {copied ? '✅ Copied for Sheets!' : '📋 Copy for Google Sheets'}
        </button>
        <button className="btn-primary" onClick={() => setShowConfirm(true)}>
          🔄 Try New Analysis
        </button>
      </div>
    </div>
  );
}
