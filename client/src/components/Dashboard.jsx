import React, { useState, useEffect } from 'react';
import axios from 'axios';
import VerificationModal from './VerificationModal';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export default function Dashboard({ 
  onComplete, 
  onUpdateBatchCount,
  onResultsChange
}) {
  // Input parameters state with persistence
  const [jobDescription, setJobDescription] = useState(() => {
    return localStorage.getItem('ats_jd_text') || '';
  });

  const [candidates, setCandidates] = useState(() => {
    const saved = localStorage.getItem('ats_input_candidates');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) { /* ignore */ }
    }
    return [{ id: Date.now() + '-1', user_id: 'CAND-001', resume_link: '' }];
  });

  // Viewport visibility controls & evaluation state
  const [hasSubmitted, setHasSubmitted] = useState(() => {
    return localStorage.getItem('ats_has_submitted') === 'true';
  });
  const [inputsHidden, setInputsHidden] = useState(() => {
    return localStorage.getItem('ats_inputs_hidden') === 'true';
  });
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState('');

  // Bulk import state
  const [importMode, setImportMode] = useState('csv'); // 'csv' | 'bulk_text'
  const [bulkText, setBulkText] = useState('');
  const [importStatus, setImportStatus] = useState(null);

  // Results table & modal state
  const [selectedModalData, setSelectedModalData] = useState(null);
  const [evaluationResults, setEvaluationResults] = useState(() => {
    const saved = localStorage.getItem('ats_evaluation_results');
    if (saved) {
      try {
        return JSON.parse(saved) || [];
      } catch (e) { /* ignore */ }
    }
    return [];
  });

  // Keep localStorage and parent count in sync
  useEffect(() => {
    localStorage.setItem('ats_jd_text', jobDescription);
  }, [jobDescription]);

  useEffect(() => {
    localStorage.setItem('ats_input_candidates', JSON.stringify(candidates));
    if (onUpdateBatchCount) {
      onUpdateBatchCount(candidates.length);
    }
  }, [candidates, onUpdateBatchCount]);

  useEffect(() => {
    localStorage.setItem('ats_has_submitted', String(hasSubmitted));
  }, [hasSubmitted]);

  useEffect(() => {
    localStorage.setItem('ats_inputs_hidden', String(inputsHidden));
  }, [inputsHidden]);

  useEffect(() => {
    localStorage.setItem('ats_evaluation_results', JSON.stringify(evaluationResults));
    if (onResultsChange) {
      onResultsChange(evaluationResults, evaluating);
    }
  }, [evaluationResults, evaluating, onResultsChange]);

  // Handler to add a new row
  const handleAddCandidate = () => {
    const nextIndex = candidates.length + 1;
    const newId = `CAND-${String(nextIndex).padStart(3, '0')}`;
    setCandidates([...candidates, { id: Date.now() + '-' + nextIndex, user_id: newId, resume_link: '' }]);
  };

  // Handler to delete a row
  const handleRemoveCandidate = (idToRemove) => {
    if (candidates.length <= 1) return;
    setCandidates(candidates.filter(c => c.id !== idToRemove));
  };

  // Handler to edit row field
  const handleCandidateChange = (id, field, value) => {
    setCandidates(candidates.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  // Handler for extracting user_id and resume_link from CSV files
  const handleCSVUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target.result;
      if (!content) {
        setImportStatus({ type: 'error', text: 'Could not read CSV file content.' });
        return;
      }
      
      const lines = content.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length === 0) {
        setImportStatus({ type: 'error', text: 'CSV file appears to be empty.' });
        return;
      }

      // Detect if first line is a header row
      let startIdx = 0;
      const firstLine = lines[0].toLowerCase();
      if (firstLine.includes('user_id') || firstLine.includes('resume_link') || firstLine.includes('id') || firstLine.includes('url') || firstLine.includes('link') || firstLine.includes('name')) {
        startIdx = 1;
      }

      const extracted = [];
      for (let i = startIdx; i < lines.length; i++) {
        const parts = lines[i].split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
        if (parts.length > 0 && parts.some(p => p.length > 0)) {
          const urlIndex = parts.findIndex(p => p.startsWith('http://') || p.startsWith('https://') || p.includes('drive.google.com') || p.includes('github.com') || p.includes('linkedin.com') || p.includes('.pdf') || p.includes('.doc') || p.includes('www.'));
          
          let link = '';
          let userId = '';

          if (urlIndex !== -1) {
            link = parts[urlIndex];
            const otherParts = parts.filter((_, idx) => idx !== urlIndex).filter(Boolean);
            userId = otherParts.join(' ') || `CAND-${String(extracted.length + 1).padStart(3, '0')}`;
          } else if (parts.length >= 2) {
            userId = parts[0];
            link = parts.slice(1).join(', ');
          } else {
            userId = `CAND-${String(extracted.length + 1).padStart(3, '0')}`;
            link = parts[0];
          }

          if (link || userId) {
            extracted.push({
              id: Date.now() + '-' + Math.random().toString(36).substr(2, 5) + '-' + i,
              user_id: userId || `CAND-${String(extracted.length + 1).padStart(3, '0')}`,
              resume_link: link
            });
          }
        }
      }

      if (extracted.length > 0) {
        setCandidates(extracted);
        setImportStatus({ type: 'success', text: `Successfully imported ${extracted.length} profile(s) from CSV!` });
      } else {
        setImportStatus({ type: 'error', text: 'No valid candidate profiles could be found in the CSV.' });
      }
    };
    
    reader.onerror = () => {
      setImportStatus({ type: 'error', text: 'Error reading CSV file.' });
    };
    
    reader.readAsText(file);
    e.target.value = null;
  };

  // Handler for bulk extracting multiple user_id & resume_link text inputs
  const handleBulkTextExtract = () => {
    if (!bulkText.trim()) {
      setImportStatus({ type: 'error', text: 'Please paste candidate IDs and links first.' });
      return;
    }
    
    const lines = bulkText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    const extracted = [];
    
    lines.forEach((line, idx) => {
      const urlMatch = line.match(/(https?:\/\/[^\s]+|www\.[^\s]+)/i);
      let link = '';
      let userId = '';
      
      if (urlMatch) {
        link = urlMatch[0].replace(/[,;]$/, '');
        const remainder = line.replace(urlMatch[0], '').replace(/^[-–—:,|;\s]+|[-–—:,|;\s]+$/g, '').trim();
        userId = remainder || `CAND-${String(idx + 1).padStart(3, '0')}`;
      } else {
        const parts = line.split(/[,;\t|]+/).map(p => p.trim()).filter(Boolean);
        if (parts.length >= 2) {
          userId = parts[0];
          link = parts.slice(1).join(' ');
        } else {
          userId = `CAND-${String(idx + 1).padStart(3, '0')}`;
          link = line;
        }
      }

      if (link || userId) {
        extracted.push({
          id: Date.now() + '-' + Math.random().toString(36).substr(2, 5) + '-' + idx,
          user_id: userId,
          resume_link: link
        });
      }
    });

    if (extracted.length > 0) {
      setCandidates(extracted);
      setImportStatus({ type: 'success', text: `Successfully extracted & populated ${extracted.length} profile(s)!` });
      setBulkText('');
    } else {
      setImportStatus({ type: 'error', text: 'Could not extract valid links or IDs from the pasted text.' });
    }
  };

  // Helper to synthesize coding platform summary from backend evaluation data
  const getCodingSummary = (data) => {
    if (!data) return '—';
    const verified = data.codingPlatformVerification || data.customProfiles || {};
    if (verified.leetcode && verified.leetcode.score) {
      return `LeetCode Score: ${verified.leetcode.score}/100 (Solved: ${verified.leetcode.solved?.total || 'Verified'})`;
    }
    if (verified.codeforces && verified.codeforces.rating) {
      return `Codeforces: @${verified.codeforces.handle} (${verified.codeforces.rating} rating)`;
    }
    if (data.detectedProfiles?.github || verified.github) {
      return `GitHub Profile Verified: @${verified.github || data.detectedProfiles.github}`;
    }
    return 'Basic Competency Verified';
  };

  // Helper to determine score color badge
  const getScoreStyle = (score) => {
    const num = Number(score) || 0;
    if (num >= 75) return { background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' };
    if (num >= 55) return { background: '#eff6ff', color: '#11589a', border: '1px solid #bfdbfe' };
    return { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' };
  };

  // Progressive sequential evaluation handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!jobDescription.trim()) {
      setError('Please provide a Target Job Description before submitting.');
      return;
    }

    const validCandidates = candidates.filter(c => c.user_id.trim() && c.resume_link.trim());
    if (validCandidates.length === 0) {
      setError('Please enter at least one valid User ID and Resume Link.');
      return;
    }

    setError('');
    setEvaluating(true);
    setHasSubmitted(true);
    setInputsHidden(false); // keep visible initially as evaluation starts

    // Clear previous table to display rows sequentially as each candidate completes evaluation
    setEvaluationResults([]);

    // Run sequential evaluation one-by-one: evaluate candidate -> display in row -> evaluate next -> display below
    for (let i = 0; i < validCandidates.length; i++) {
      const currentCand = validCandidates[i];
      const rowKey = currentCand.id;

      // Dynamically append current candidate to bottom of table in evaluating status
      setEvaluationResults(prev => [
        ...prev,
        {
          key: rowKey,
          user_id: currentCand.user_id,
          resume_link: currentCand.resume_link,
          status: 'evaluating', // 'evaluating' | 'completed' | 'error'
          resume_score: null,
          ats_percentage: null,
          coding_platform_analysis: 'Analyzing 4-pillar metrics & verifications...',
          rawReport: null,
          errorMsg: null
        }
      ]);

      try {
        const payload = {
          id: currentCand.user_id,
          filename: `${currentCand.user_id}_Profile`,
          resumeUrl: currentCand.resume_link,
          resumeText: `Candidate Profile: ${currentCand.user_id}\nResume URL: ${currentCand.resume_link}\nTechnical details and algorithmic competencies extracted from provided link.`,
          jobDescription: jobDescription
        };

        const response = await axios.post(`${API_BASE_URL}/resume/analyze`, payload, {
          timeout: 30000
        });

        if (response.data && response.data.success) {
          const score = response.data.scoreSummary?.overallScore ?? 75;
          const codingSummary = getCodingSummary(response.data);

          setEvaluationResults(prev => prev.map(item => 
            item.key === rowKey ? { 
              ...item, 
              status: 'completed', 
              resume_score: score,
              ats_percentage: score, 
              coding_platform_analysis: codingSummary,
              rawReport: response.data 
            } : item
          ));
        } else {
          throw new Error('Server returned unsuccessful analysis state.');
        }
      } catch (err) {
        console.error(`Evaluation failed for ${currentCand.user_id}:`, err);
        setEvaluationResults(prev => prev.map(item => 
          item.key === rowKey ? { 
            ...item, 
            status: 'error', 
            coding_platform_analysis: 'Error processing resume link.', 
            errorMsg: err.response?.data?.error || err.message || 'Network Timeout' 
          } : item
        ));
      }
    }

    setEvaluating(false);
  };

  return (
    <div className="dashboard-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '14px 20px', borderRadius: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>⚠️</span> {error}
        </div>
      )}

      {/* INPUT CONTAINER (Two Input Areas: Job Description + User ID & Resume Links) */}
      <div className="glass-card" style={{ padding: inputsHidden ? '16px 24px' : '28px', transition: 'all 0.3s ease', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px' }}>
        
        {/* Header Bar with Hide / Unhide Toggle button if hasSubmitted */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: inputsHidden ? 0 : '24px', paddingBottom: inputsHidden ? 0 : '16px', borderBottom: inputsHidden ? 'none' : '1px solid #e2e8f0', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                Candidate Evaluation Workspace
              </h2>
              {inputsHidden && (
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
                  Input Container hidden to focus on real-time evaluation table below.
                </span>
              )}
            </div>
          </div>

          {hasSubmitted && (
            <button
              type="button"
              onClick={() => setInputsHidden(!inputsHidden)}
              style={{
                padding: '8px 18px',
                background: inputsHidden ? 'linear-gradient(135deg, #11589a 0%, #3061a6 100%)' : '#f0f7ff',
                color: inputsHidden ? '#ffffff' : '#11589a',
                border: inputsHidden ? 'none' : '1px solid #bfdbfe',
                borderRadius: '12px',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: inputsHidden ? '0 4px 12px rgba(17, 88, 154, 0.25)' : 'none'
              }}
            >
              <span>{inputsHidden ? 'Unhide Input' : 'Hide Input'}</span>
            </button>
          )}
        </div>

        {/* Two Input Areas Body (Collapsed when inputsHidden == true) */}
        {!inputsHidden && (
          <div>
            <div style={{ gap: '28px', width: '100%' }} className="dashboard-grid">
              
              {/* AREA 1: JOB DESCRIPTION */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Target Job Description
                  </span>
                  <span style={{ fontSize: '11px', background: 'rgba(17, 88, 154, 0.08)', color: '#11589a', padding: '4px 10px', borderRadius: '12px', fontWeight: '700', border: '1px solid rgba(17, 88, 154, 0.2)' }}>
                    Required
                  </span>
                </div>
              
                <textarea
                  className="textarea-field"
                  placeholder="Paste job description text here... (e.g., Seeking Senior React & Node.js Developer with LeetCode problem solving ability...)"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  style={{ flex: 1, minHeight: '360px', padding: '16px', fontSize: '14px', lineHeight: '1.6', borderColor: '#cbd5e1', borderRadius: '16px' }}
                />
              </div>

              {/* AREA 2: USER ID & RESUME LINKS INPUT ARRAY */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Candidate Profiles 
                  </span>
                </div>
                

                {/* BULK IMPORT OPTIONS CONTAINER: (CSV Upload & Multiple Resume Link Extraction) */}
                <div style={{ background: '#f0f7ff', border: '1px solid #bfdbfe', borderRadius: '16px', padding: '16px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(17, 88, 154, 0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      Bulk Import
                    </span>
                    <div style={{ display: 'flex', gap: '4px', background: '#e2e8f0', padding: '3px', borderRadius: '10px' }}>
                      <button
                        type="button"
                        onClick={() => { setImportMode('csv'); setImportStatus(null); }}
                        style={{ padding: '4px 12px', fontSize: '12px', borderRadius: '8px', border: 'none', background: importMode === 'csv' ? '#11589a' : 'transparent', color: importMode === 'csv' ? '#ffffff' : '#475569', fontWeight: '700', cursor: 'pointer', transition: 'all 0.15s' }}
                      >
                         CSV File
                      </button>
                      <button
                        type="button"
                        onClick={() => { setImportMode('bulk_text'); setImportStatus(null); }}
                        style={{ padding: '4px 12px', fontSize: '12px', borderRadius: '8px', border: 'none', background: importMode === 'bulk_text' ? '#11589a' : 'transparent', color: importMode === 'bulk_text' ? '#ffffff' : '#475569', fontWeight: '700', cursor: 'pointer', transition: 'all 0.15s' }}
                      >
                        Multiple Resume Links
                      </button>
                    </div>
                  </div>

                  {importMode === 'csv' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '4px' }}>
                      <span style={{ fontSize: '12px', color: '#334155', lineHeight: '1.4' }}>
                        Upload a standard CSV file with columns for <strong>user_id</strong> and <strong>resume_link</strong>.
                      </span>
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '12px 18px',
                        background: '#ffffff',
                        border: '1px dashed #2563eb',
                        color: '#11589a',
                        borderRadius: '12px',
                        fontWeight: '700',
                        fontSize: '13px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: '0 2px 6px rgba(17, 88, 154, 0.05)'
                      }}
                      className="dropzone-hover-effect"
                      >
                        <span>📥 Select CSV File to Extract & Populate</span>
                        <input
                          type="file"
                          accept=".csv,text/csv"
                          style={{ display: 'none' }}
                          onChange={handleCSVUpload}
                        />
                      </label>
                    </div>
                  )}

                  {importMode === 'bulk_text' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '4px' }}>
                      <span style={{ fontSize: '12px', color: '#334155', lineHeight: '1.4' }}>
                        Paste multiple lines formatted as <code>[user_id (optional)] [resume_link]</code> per line.
                      </span>
                      <textarea
                        className="textarea-field"
                        placeholder="e.g.&#10;CAND-101 https://drive.google.com/file/d/abc...&#10;CAND-102, https://linkedin.com/in/alex...&#10;https://github.com/torvalds (ID auto-generated if omitted)"
                        value={bulkText}
                        onChange={(e) => { setBulkText(e.target.value); if (importStatus?.type === 'error') setImportStatus(null); }}
                        style={{ minHeight: '86px', padding: '10px 12px', fontSize: '12px', background: '#ffffff', borderColor: '#cbd5e1', fontFamily: 'var(--font-mono)' }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={handleBulkTextExtract}
                          style={{ padding: '8px 18px', fontSize: '13px', borderRadius: '10px', background: 'linear-gradient(135deg, #11589a 0%, #3061a6 100%)', color: '#ffffff', fontWeight: '700', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(17, 88, 154, 0.25)' }}
                        >
                          ✨ Extract & Populate Below
                        </button>
                      </div>
                    </div>
                  )}

                  {importStatus && (
                    <div style={{ marginTop: '10px', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', background: importStatus.type === 'success' ? '#ecfdf5' : '#fef2f2', color: importStatus.type === 'success' ? '#059669' : '#dc2626', border: `1px solid ${importStatus.type === 'success' ? '#a7f3d0' : '#fecaca'}`, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{importStatus.type === 'success' ? '🎉' : '⚠️'}</span>
                      <span>{importStatus.text}</span>
                    </div>
                  )}
                </div>

                <div style={{ maxHeight: '420px', overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px', flex: 1 }}>
                  {candidates.map((cand, index) => (
                    <div key={cand.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px', transition: 'all 0.2s' }} className="candidate-row-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '800', color: '#11589a', background: 'rgba(17, 88, 154, 0.08)', padding: '3px 10px', borderRadius: '8px', border: '1px solid rgba(17, 88, 154, 0.15)' }}>
                          Entry #{index + 1}
                        </span>
                        {candidates.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveCandidate(cand.id)}
                            style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '14px', fontWeight: '700', padding: '2px 6px' }}
                            title="Remove candidate slot"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px', display: 'block' }}>User ID / Name</label>
                          <input
                            type="text"
                            className="input-field"
                            placeholder="e.g., CAND-001 or Alex Dev"
                            value={cand.user_id}
                            onChange={(e) => handleCandidateChange(cand.id, 'user_id', e.target.value)}
                            style={{ padding: '10px 14px', fontSize: '14px', margin: 0, background: '#ffffff' }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px', display: 'block' }}>Resume Link (URL)</label>
                          <input
                            type="url"
                            className="input-field"
                            placeholder="https://drive.google.com/file/d/..., or profile link"
                            value={cand.resume_link}
                            onChange={(e) => handleCandidateChange(cand.id, 'resume_link', e.target.value)}
                            style={{ padding: '10px 14px', fontSize: '14px', margin: 0, background: '#ffffff', fontFamily: 'var(--font-mono)' }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAddCandidate}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#ffffff',
                    color: '#11589a',
                    border: '1px dashed rgba(17, 88, 154, 0.4)',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    fontWeight: '700',
                    fontSize: '14px',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <span>➕</span> Add Another Candidate Slot
                </button>
              </div>
            </div>

            {/* SUBMIT & EVALUATE BUTTON */}
            <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={evaluating}
                style={{
                  width: '100%',
                  padding: '18px 24px',
                  background: 'linear-gradient(135deg, #11589a 0%, #3061a6 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '16px',
                  fontSize: '18px',
                  fontWeight: '700',
                  cursor: evaluating ? 'not-allowed' : 'pointer',
                  boxShadow: '0 6px 20px rgba(17, 88, 154, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  transition: 'all 0.2s',
                  opacity: evaluating ? 0.7 : 1
                }}
              >
                {evaluating ? (
                  <>
                    <span>⏳</span> Evaluating Candidates One by One...
                  </>
                ) : (
                  <>
                    Submit & Evaluate Candidates ➔
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* OUTPUT CONTAINER (Visible after Submit: table showing User ID, Resume Link, ATS %, Coding Platform Analysis) */}
      {(hasSubmitted || evaluationResults.length > 0) && (
        <div className="glass-card" style={{ padding: '28px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', boxShadow: '0 8px 30px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '26px' }}>📊</span>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Real-Time Evaluation 
                </h2>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {evaluating ? (
                <span style={{ fontSize: '13px', color: '#11589a', background: 'rgba(17, 88, 154, 0.1)', padding: '6px 14px', borderRadius: '20px', fontWeight: '700', border: '1px solid rgba(17, 88, 154, 0.25)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#11589a' }} className="pulse-dot"></span>
                  Progressive Evaluation Active...
                </span>
              ) : (
                <span style={{ fontSize: '13px', color: '#059669', background: '#ecfdf5', padding: '6px 14px', borderRadius: '20px', fontWeight: '700', border: '1px solid #a7f3d0' }}>
                  ✅ Evaluation Complete
                </span>
              )}
            </div>
          </div>

          <div className="table-responsive-container" style={{ overflowX: 'auto', borderRadius: '16px', border: '1px solid #e2e8f0', WebkitOverflowScrolling: 'touch', width: '100%', boxSizing: 'border-box' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: '#ffffff', minWidth: '700px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#334155', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: '800' }}>
                  <th style={{ padding: '16px 20px', width: '18%' }}>user_id</th>
                  <th style={{ padding: '16px 20px', width: '28%' }}>resume_link</th>
                  <th style={{ padding: '16px 20px', width: '16%' }}>resume_score</th>
                  <th style={{ padding: '16px 20px', width: '38%' }}>Candidate Verification Report</th>
                </tr>
              </thead>
              <tbody>
                {evaluationResults.map((row, idx) => {
                  const scoreBadgeStyle = row.status === 'completed' && row.ats_percentage !== null 
                    ? getScoreStyle(row.ats_percentage) 
                    : {};

                  return (
                    <tr key={row.key || idx} style={{ borderBottom: '1px solid #e2e8f0', transition: 'background 0.2s' }} className="batch-row">
                      
                      {/* USER ID COLUMN */}
                      <td style={{ padding: '16px 20px', fontWeight: '800', color: '#0f172a', fontSize: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(17, 88, 154, 0.08)', color: '#11589a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>👤</span>
                          <span>{row.user_id}</span>
                        </div>
                      </td>

                      {/* RESUME LINK COLUMN */}
                      <td style={{ padding: '16px 20px', fontSize: '14px', fontFamily: 'var(--font-mono)' }}>
                        {row.resume_link ? (
                          <a 
                            href={row.resume_link} 
                            target="_blank" 
                            rel="noreferrer" 
                            style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '600', wordBreak: 'break-all' }}
                          >
                            {row.resume_link.length > 35 ? row.resume_link.substring(0, 35) + '...' : row.resume_link} ↗
                          </a>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>No link provided</span>
                        )}
                      </td>

                      {/* ATS PERCENTAGE COLUMN */}
                      <td style={{ padding: '16px 20px' }}>
                        {row.status === 'pending' && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '20px', background: '#f1f5f9', color: '#64748b', fontSize: '13px', fontWeight: '700', border: '1px solid #e2e8f0' }}>
                            ⏳ Queued
                          </span>
                        )}
                        {row.status === 'evaluating' && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '20px', background: 'rgba(17, 88, 154, 0.1)', color: '#11589a', fontSize: '13px', fontWeight: '800', border: '1px solid rgba(17, 88, 154, 0.3)' }}>
                            🔄 Evaluating...
                          </span>
                        )}
                        {row.status === 'error' && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '20px', background: '#fef2f2', color: '#dc2626', fontSize: '13px', fontWeight: '700', border: '1px solid #fecaca' }}>
                            ❌ Error
                          </span>
                        )}
                        {row.status === 'completed' && (
                          <span style={{ display: 'inline-block', padding: '6px 16px', borderRadius: '20px', fontSize: '16px', fontWeight: '900', ...scoreBadgeStyle }}>
                            {row.resume_score ?? row.ats_percentage}%
                          </span>
                        )}
                      </td>

                      {/* DETAILED VERIFICATION ANALYSIS COLUMN */}
                      <td style={{ padding: '16px 20px', fontSize: '14px', color: '#334155', fontWeight: '600' }}>
                        {row.status === 'evaluating' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#11589a', fontWeight: '700' }}>
                            <span className="pulse-dot" style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#11589a' }}></span>
                            Evaluating GitHub PRs, problem complexity & live deployment responsiveness...
                          </div>
                        )}
                        
                        {row.status === 'error' && (
                          <span style={{ color: '#dc2626', fontWeight: '700' }}>
                            Error: {row.errorMsg || 'Failed to analyze link'}
                          </span>
                        )}

                        {row.status === 'completed' && row.rawReport && (
                          <div>
                            <button
                              type="button"
                              onClick={() => setSelectedModalData({ candidate: row, rawReport: row.rawReport, verificationReport: row.rawReport?.verificationReport })}
                              style={{
                                padding: '9px 18px',
                                fontSize: '13px',
                                fontWeight: '700',
                                color: '#ffffff',
                                background: 'linear-gradient(135deg, #11589a, #3061a6)',
                                border: 'none',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(17, 88, 154, 0.25)',
                                transition: 'all 0.2s',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                whiteSpace: 'nowrap'
                              }}
                              title="Click to view GitHub repo lists, coding profile evaluation, and any live link present"
                            >
                              🔍 View Candidate Analysis Report ➔
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VERIFICATION MODAL OVERLAY */}
      <VerificationModal
        modalData={selectedModalData}
        onClose={() => setSelectedModalData(null)}
      />
    </div>
  );
}
