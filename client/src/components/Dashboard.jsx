import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

const SAMPLE_JD = `Senior Full Stack Engineer & System Architect
We are looking for a highly skilled Full Stack Engineer to lead technical design and feature deployment across our cloud architecture.

Key Technical Requirements:
- Deep expertise in JavaScript, TypeScript, and React.js for modern reactive web applications.
- Strong proven experience building REST APIs and backend microservices using Node.js and Express.
- Proficiency in NoSQL and database modeling with MongoDB or PostgreSQL.
- Understanding of cloud containerization using Docker and AWS deployments.
- Strong adherence to Git version control, CI/CD pipelines, and rigorous automated testing (Jest/Playwright).

Algorithmic & Coding Competency:
- Proven problem-solving ability on algorithmic coding platforms (LeetCode, Codeforces, HackerRank).

Required Experience:
- 4+ years in professional cloud full-stack software development.`;

const SAMPLE_RESUME_TEXT = `Kunal Raj - Senior Software & Systems Engineer
Email: kunal.raj@example.com | GitHub: https://github.com/torvalds | LeetCode: https://leetcode.com/neetcode

SUMMARY:
Results-driven Lead Engineer with over 5 years of architectural experience designing scalable cloud microservices, reactive frontends, and automated algorithmic trading pipelines.

TECHNICAL SKILLS:
- Languages & Frameworks: JavaScript, TypeScript, Python, C++, React.js, Next.js, Node.js, Express, Tailwind CSS.
- Databases & Infra: MongoDB, PostgreSQL, Redis, Docker, Kubernetes, AWS (EC2, ECS, S3), CI/CD, Git.

PROFESSIONAL EXPERIENCE:
Senior Full Stack Engineer | TechCorp Global (2021 - Present)
- Architected and deployed microservices using Node.js, Express, and Docker, reducing API latency by 35%.
- Built dynamic reactive frontends in TypeScript and React.js with real-time WebSocket state management.
- Modeled complex NoSQL database schemas in MongoDB and set up automated Jest CI/CD testing pipelines on AWS ECS.

Software Developer | Innovate Solutions (2019 - 2021)
- Developed secure authentication services and PostgreSQL schemas for enterprise SaaS workflows.
- Implemented responsive React components and stateful custom hooks for high-volume analytics dashboards.

EDUCATION:
Bachelor of Technology in Computer Science (2021)`;

export default function Dashboard({ 
  onComplete, 
  appMode: parentAppMode, 
  setAppMode: parentSetAppMode, 
  evalMode: parentEvalMode, 
  setEvalMode: parentSetEvalMode, 
  triggerAction 
}) {
  const [localAppMode, setLocalAppMode] = useState(() => localStorage.getItem('ats_app_mode') || 'live'); // 'live' | 'demo'
  const [localEvalMode, setLocalEvalMode] = useState(() => localStorage.getItem('ats_eval_mode') || 'single'); // 'single' | 'batch'

  const appMode = parentAppMode !== undefined ? parentAppMode : localAppMode;
  const setAppMode = parentSetAppMode || setLocalAppMode;

  const evalMode = parentEvalMode !== undefined ? parentEvalMode : localEvalMode;
  const setEvalMode = parentSetEvalMode || setLocalEvalMode;

  const [inputMode, setInputMode] = useState(() => localStorage.getItem('ats_input_mode') || 'file'); // 'file' | 'link' | 'text'
  const [selectedFile, setSelectedFile] = useState(null);
  const [resumeUrl, setResumeUrl] = useState(() => localStorage.getItem('ats_resume_url') || '');
  const [resumeText, setResumeText] = useState(() => localStorage.getItem('ats_resume_text') || '');
  const [jobDescription, setJobDescription] = useState(() => {
    const saved = localStorage.getItem('ats_jd_text');
    return saved !== null ? saved : '';
  });
  
  // Optional profile overrides for single evaluation
  const [githubOverride, setGithubOverride] = useState(() => localStorage.getItem('ats_github_override') || '');
  const [leetcodeOverride, setLeetcodeOverride] = useState(() => localStorage.getItem('ats_leetcode_override') || '');

  // Batch evaluation candidate array with persistent restoration
  const [candidates, setCandidates] = useState(() => {
    const saved = localStorage.getItem('ats_batch_candidates');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter(Boolean).map((c, i) => ({
            id: c?.id || `RES-00${i + 1}`,
            mode: c?.mode || 'text',
            file: c?.file || null,
            url: c?.url || '',
            text: c?.text || '',
            github: c?.github || '',
            leetcode: c?.leetcode || '',
            nameHint: c?.nameHint || ''
          }));
        }
      } catch (e) { /* fallback to default */ }
    }
    return [
      { id: 'RES-001', mode: 'file', file: null, url: '', text: '', github: '', leetcode: '', nameHint: '' }
    ];
  });

  // Execution state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Smart Bulk Paste state
  const [bulkPasteText, setBulkPasteText] = useState('');
  const [bulkStatus, setBulkStatus] = useState(null);

  // Synchronized count of entered entries
  const enteredCount = Array.isArray(candidates) ? candidates.length : 0;
  const countLabel = `${enteredCount} ${enteredCount === 1 ? 'Entry' : 'Entries'} Entered`;

  useEffect(() => {
    localStorage.setItem('ats_app_mode', appMode);
    localStorage.setItem('ats_eval_mode', evalMode);
    localStorage.setItem('ats_input_mode', inputMode);
    localStorage.setItem('ats_resume_url', resumeUrl || '');
    localStorage.setItem('ats_resume_text', resumeText || '');
    localStorage.setItem('ats_jd_text', jobDescription || '');
    localStorage.setItem('ats_github_override', githubOverride || '');
    localStorage.setItem('ats_leetcode_override', leetcodeOverride || '');
  }, [appMode, evalMode, inputMode, resumeUrl, resumeText, jobDescription, githubOverride, leetcodeOverride]);

  useEffect(() => {
    if (Array.isArray(candidates) && candidates.length > 0) {
      const serializable = candidates.map(c => ({
        id: c.id,
        mode: c.mode,
        url: c.url,
        text: c.text,
        github: c.github,
        leetcode: c.leetcode,
        nameHint: c.file ? c.file.name : (c.nameHint || '')
      }));
      localStorage.setItem('ats_batch_candidates', JSON.stringify(serializable));
    }
  }, [candidates]);

  // Drag & Drop File Handlers
  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (evalMode === 'batch' || e.dataTransfer.files.length > 1) {
        handleMultiFileUpload(e.dataTransfer.files);
      } else {
        setSelectedFile(e.dataTransfer.files[0]);
        setInputMode('file');
        setError('');
      }
    }
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleMultiFileUpload = (files) => {
    const fileArray = Array.from(files).slice(0, 10); // Max 10 files
    if (!fileArray || fileArray.length === 0) return;

    let baseCandidates = [...candidates];
    if (baseCandidates.length === 1 && !baseCandidates[0].file && !baseCandidates[0].url?.trim() && !baseCandidates[0].text?.trim() && !baseCandidates[0].github?.trim() && !baseCandidates[0].leetcode?.trim()) {
      baseCandidates = [];
    }

    const startIdx = baseCandidates.length;
    const newEntries = fileArray.map((file, i) => ({
      id: `RES-00${startIdx + i + 1}`,
      mode: 'file',
      file: file,
      url: '',
      text: '',
      github: '',
      leetcode: '',
      nameHint: file.name
    }));

    const combined = [...baseCandidates, ...newEntries].map((cand, idx) => ({
      ...cand,
      id: `RES-00${idx + 1}`
    }));

    setCandidates(combined);
    setEvalMode('batch');
    setError('');
  };

  const handleSwitchToSingleMode = () => {
    setEvalMode('single');
    setAppMode('live');
    setJobDescription('');
    setSelectedFile(null);
    setResumeUrl('');
    setResumeText('');
    setGithubOverride('');
    setLeetcodeOverride('');
    setCandidates([{ id: 'RES-001', mode: 'file', file: null, url: '', text: '', github: '', leetcode: '', nameHint: '' }]);
    setError('');
    setBulkPasteText('');
    setBulkStatus(null);
  };

  const handleSwitchToBatchMode = () => {
    setEvalMode('batch');
    setAppMode('live');
    setJobDescription('');
    setSelectedFile(null);
    setResumeUrl('');
    setResumeText('');
    setGithubOverride('');
    setLeetcodeOverride('');
    setCandidates([{ id: 'RES-001', mode: 'file', file: null, url: '', text: '', github: '', leetcode: '', nameHint: '' }]);
    setError('');
    setBulkPasteText('');
    setBulkStatus(null);
  };

  const handleFillSample = () => {
    setAppMode('demo');
    setEvalMode('single');
    setSelectedFile(null);
    setResumeUrl('');
    setCandidates([{ id: 'RES-001', mode: 'file', file: null, url: '', text: '', github: '', leetcode: '', nameHint: '' }]);
    setInputMode('text');
    setResumeText(SAMPLE_RESUME_TEXT);
    setJobDescription(SAMPLE_JD);
    setGithubOverride('torvalds');
    setLeetcodeOverride('neetcode');
    setError('');
    setBulkPasteText('');
    setBulkStatus(null);
  };

  const handleFillBatchSample = () => {
    setAppMode('demo');
    setEvalMode('batch');
    setSelectedFile(null);
    setResumeUrl('');
    setResumeText('');
    setGithubOverride('');
    setLeetcodeOverride('');
    setJobDescription(SAMPLE_JD);
    setCandidates([
      {
        id: 'RES-001',
        mode: 'text',
        file: null,
        url: '',
        text: SAMPLE_RESUME_TEXT,
        github: 'torvalds',
        leetcode: 'neetcode',
        nameHint: 'Kunal Raj'
      },
      {
        id: 'RES-002',
        mode: 'text',
        file: null,
        url: '',
        text: `Alice Smith - Senior Cloud Systems Engineer & Backend Lead\nEmail: alice.smith@example.com | GitHub: https://github.com/gaearon\n\nSUMMARY:\nExperienced Node.js and TypeScript system architect specializing in AWS microservices and Kubernetes deployments.\n\nTECHNICAL SKILLS:\nLanguages & Tools: TypeScript, JavaScript, Node.js, Express, PostgreSQL, Docker, AWS, Git.\n\nEXPERIENCE:\nLead Backend Developer | CloudScale (2020 - Present)\n- Designed fault-tolerant REST APIs and backend architectures in Node.js.\n- Engineered automated CI/CD pipelines and Docker container deployments on AWS ECS.\n\nEDUCATION:\nB.Sc in Computer Science (2019)`,
        github: 'gaearon',
        leetcode: '',
        nameHint: 'Alice Smith'
      },
      {
        id: 'RES-003',
        mode: 'text',
        file: null,
        url: '',
        text: `Robert Taylor - Frontend & Web Specialist\nEmail: robert.dev@example.com\n\nSUMMARY:\nCreative web developer focused on UI layouts and frontend styling using React and HTML/CSS.\n\nTECHNICAL SKILLS:\nLanguages: JavaScript, HTML5, CSS3, React.js.\n\nEXPERIENCE:\nUI Engineer | Designify (2021 - Present)\n- Developed responsive web interfaces and reusable CSS component libraries.\n- Collaborated with UX designers on frontend animations.`,
        github: '',
        leetcode: '',
        nameHint: 'Robert Taylor'
      }
    ]);
    setError('');
    setBulkPasteText('');
    setBulkStatus(null);
  };

  useEffect(() => {
    if (!triggerAction) return;
    if (triggerAction.type === 'FILL_SAMPLE_SINGLE') {
      handleFillSample();
    } else if (triggerAction.type === 'FILL_SAMPLE_BATCH') {
      handleFillBatchSample();
    } else if (triggerAction.type === 'SWITCH_LIVE_SINGLE') {
      handleSwitchToSingleMode();
    } else if (triggerAction.type === 'SWITCH_LIVE_BATCH') {
      handleSwitchToBatchMode();
    }
  }, [triggerAction]);

  const handleAddCandidate = () => {
    const newIndex = candidates.length + 1;
    const nextId = `RES-00${newIndex}`;
    setCandidates([...candidates, { id: nextId, mode: 'file', file: null, url: '', text: '', github: '', leetcode: '', nameHint: '' }]);
  };

  const handleRemoveCandidate = (index) => {
    const updated = [...candidates];
    updated.splice(index, 1);
    const renumbered = updated.map((item, idx) => ({ ...item, id: `RES-00${idx + 1}` }));
    setCandidates(renumbered);
  };

  const handleCandidateChange = (index, field, value) => {
    const updated = [...candidates];
    if (updated[index]) {
      updated[index][field] = value;
      setCandidates(updated);
    }
  };

  const handleBulkParseAndPopulate = (e) => {
    e?.preventDefault();
    if (!bulkPasteText.trim()) {
      setBulkStatus({ type: 'error', message: '⚠️ Please paste text containing one or more resume URL links.' });
      return;
    }
    const urlRegex = /(https?:\/\/[^\s,;<>)!"]+)/g;
    const matches = bulkPasteText.match(urlRegex) || [];
    const uniqueUrls = Array.from(new Set(matches.map(url => url.replace(/[.)"']$/, ''))));

    if (uniqueUrls.length === 0) {
      setBulkStatus({ type: 'error', message: '⚠️ No valid HTTP/HTTPS URLs were detected in the pasted text. Ensure links begin with http:// or https://' });
      return;
    }

    let baseCandidates = [...candidates];
    if (baseCandidates.length === 1 && !baseCandidates[0].file && !baseCandidates[0].url?.trim() && !baseCandidates[0].text?.trim() && !baseCandidates[0].github?.trim() && !baseCandidates[0].leetcode?.trim()) {
      baseCandidates = [];
    }

    const startIdx = baseCandidates.length;
    const newCandidateEntries = uniqueUrls.map((url, i) => ({
      id: `RES-00${startIdx + i + 1}`,
      mode: 'link',
      file: null,
      url: url,
      text: '',
      github: '',
      leetcode: '',
      nameHint: `Candidate Link #${startIdx + i + 1}`
    }));

    const combined = [...baseCandidates, ...newCandidateEntries].map((cand, idx) => ({
      ...cand,
      id: `RES-00${idx + 1}`
    }));

    setCandidates(combined);
    setBulkPasteText('');
    setBulkStatus({
      type: 'success',
      message: `✨ Successfully parsed & populated ${uniqueUrls.length} resume URL${uniqueUrls.length > 1 ? 's' : ''} into the batch list below!`
    });

    setTimeout(() => setBulkStatus(null), 6000);
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!jobDescription.trim()) {
      setError('Please provide a target Job Description.');
      return;
    }

    if (evalMode === 'single') {
      if (inputMode === 'file' && !selectedFile && !resumeText.trim()) {
        setError('Please upload a PDF or DOCX resume file, or switch to link/text input.');
        return;
      }
      if (inputMode === 'link' && !resumeUrl.trim() && !resumeText.trim()) {
        setError('Please provide a public link to the candidate resume.');
        return;
      }
      if (inputMode === 'text' && !resumeText.trim()) {
        setError('Please paste the candidate resume text.');
        return;
      }
    }

    if (evalMode === 'batch') {
      const validResumes = candidates.filter(c => (c.mode === 'file' && c.file) || (c.mode === 'link' && c.url?.trim()) || (c.mode === 'text' && c.text?.trim()) || c.nameHint);
      if (validResumes.length === 0) {
        setError('Please enter or upload at least one valid candidate resume in the batch list.');
        return;
      }
    }

    setError('');
    setLoading(true);

    try {
      if (evalMode === 'batch') {
        const processedResumes = await Promise.all(candidates.map(async (c, idx) => {
          let extractedText = c.text;
          let detectedProfiles = {};
          let filename = c.file ? c.file.name : (c.nameHint ? `${c.nameHint.replace(/\s+/g, '_')}_Resume.txt` : `Candidate_${idx + 1}.pdf`);

          if (c.mode === 'file' && c.file && c.file instanceof File) {
            const formData = new FormData();
            formData.append('resume', c.file);
            try {
              const uploadRes = await axios.post(`${API_BASE_URL}/resume/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 15000
              });
              extractedText = uploadRes.data.text;
              detectedProfiles = uploadRes.data.detectedProfiles || {};
            } catch (upErr) {
              console.warn("Upload file failed in batch for", c.id, upErr);
            }
          } else if (!extractedText && c.file && c.file.name) {
            extractedText = `Candidate Resume for ${c.file.name}`;
          }

          const customProfiles = {
            ...detectedProfiles,
            github: c.github || detectedProfiles.github,
            leetcode: c.leetcode || detectedProfiles.leetcode
          };

          return {
            id: c.id,
            resumeText: extractedText,
            resumeUrl: c.mode === 'link' ? c.url : undefined,
            filename,
            customProfiles
          };
        }));

        const analyzeRes = await axios.post(`${API_BASE_URL}/resume/analyze-batch`, {
          jobDescription,
          resumes: processedResumes
        }, { timeout: 45000 });

        if (analyzeRes.data && analyzeRes.data.success) {
          setTimeout(() => {
            setLoading(false);
            onComplete(analyzeRes.data);
          }, 800);
          return;
        } else {
          throw new Error('Batch analysis completed with errors or invalid response.');
        }
      }

      // Single Evaluation Mode
      let extractedText = resumeText;
      let detectedProfiles = {};
      let filename = selectedFile ? selectedFile.name : undefined;

      if (inputMode === 'file' && selectedFile && selectedFile instanceof File) {
        const formData = new FormData();
        formData.append('resume', selectedFile);
        const uploadRes = await axios.post(`${API_BASE_URL}/resume/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 15000
        });
        extractedText = uploadRes.data.text;
        detectedProfiles = uploadRes.data.detectedProfiles || {};
      }

      const customProfiles = {
        ...detectedProfiles,
        github: githubOverride || detectedProfiles.github,
        leetcode: leetcodeOverride || detectedProfiles.leetcode
      };

      const payload = {
        id: "RES-001",
        filename,
        resumeText: extractedText,
        jobDescription,
        resumeUrl: inputMode === 'link' ? resumeUrl : undefined,
        customProfiles
      };

      const analyzeRes = await axios.post(`${API_BASE_URL}/resume/analyze`, payload, {
        timeout: 25000
      });

      if (analyzeRes.data && analyzeRes.data.success) {
        setTimeout(() => {
          setLoading(false);
          onComplete(analyzeRes.data);
        }, 800);
      } else {
        throw new Error('Analysis completed with errors or invalid response.');
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      setError(err.response?.data?.error || err.message || 'Failed to analyze resume. Make sure backend server is running.');
    }
  };

  return (
    <div style={{ maxWidth: '1160px', margin: '0 auto', padding: '10px 24px 140px', position: 'relative' }}>
      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '14px 18px', borderRadius: '14px', marginBottom: '20px', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 2px 8px rgba(220, 38, 38, 0.08)' }}>
          ⚠️ {error}
        </div>
      )}

      {/* MASTER COMBINED CONTAINER: 2-Part Split Layout for Job Description and Resume Upload */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '24px',
        padding: '28px',
        marginBottom: '28px',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.04)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
        gap: '32px'
      }}>
        {/* PART 1 OF CONTAINER: Job Description side */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '22px' }}>📄</span>
              <span style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', letterSpacing: '-0.3px' }}>Job Description</span>
            </div>
            <span style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: '#64748b', fontWeight: '600', background: '#f1f5f9', padding: '3px 10px', borderRadius: '8px' }}>Required</span>
          </div>

          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '16px',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            flex: '1',
            minHeight: '420px',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste job description text here..."
              style={{
                width: '100%',
                flex: '1',
                minHeight: '320px',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#0f172a',
                fontSize: '15px',
                lineHeight: '1.6',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <label style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#c81e28',
                transition: 'all 0.2s',
                boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
              }} title="Upload Job Description File (.txt)">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="12" y1="18" x2="12" y2="12"/>
                  <polyline points="9 15 12 12 15 15"/>
                </svg>
                <input 
                  type="file" 
                  accept=".txt,.doc,.docx" 
                  style={{ display: 'none' }} 
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const reader = new FileReader();
                      reader.onload = (event) => setJobDescription(event.target.result);
                      reader.readAsText(e.target.files[0]);
                    }
                  }} 
                />
              </label>
            </div>
          </div>
        </div>

        {/* PART 2 OF CONTAINER: Resume Upload side */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '22px' }}>👥</span>
              <span style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', letterSpacing: '-0.3px' }}>Resumes</span>
            </div>
            <span style={{
              background: 'rgba(200, 30, 40, 0.08)',
              color: '#c81e28',
              padding: '5px 14px',
              borderRadius: '16px',
              fontSize: '12px',
              fontWeight: '700',
              fontFamily: 'var(--font-mono)',
              border: '1px solid rgba(200, 30, 40, 0.2)'
            }}>
              Multi-Upload Supported
            </span>
          </div>

          {/* Live vs Demo Section mode selection controls matching user request exactly */}
          <div style={{ marginBottom: '20px' }}>
            {appMode === 'live' ? (
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', background: '#f1f5f9', padding: '6px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <button
                  type="button"
                  onClick={handleSwitchToSingleMode}
                  style={{
                    flex: '1 1 auto',
                    padding: '10px 16px',
                    fontSize: '14px',
                    fontWeight: '700',
                    borderRadius: '10px',
                    background: evalMode === 'single' ? '#c81e28' : 'transparent',
                    color: evalMode === 'single' ? '#ffffff' : '#64748b',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'center',
                    boxShadow: evalMode === 'single' ? '0 3px 12px rgba(200, 30, 40, 0.25)' : 'none'
                  }}
                >
                  👤 Single Candidate Mode
                </button>
                <button
                  type="button"
                  onClick={handleSwitchToBatchMode}
                  style={{
                    flex: '1 1 auto',
                    padding: '10px 16px',
                    fontSize: '14px',
                    fontWeight: '700',
                    borderRadius: '10px',
                    background: evalMode === 'batch' ? '#c81e28' : 'transparent',
                    color: evalMode === 'batch' ? '#ffffff' : '#64748b',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'center',
                    boxShadow: evalMode === 'batch' ? '0 3px 12px rgba(200, 30, 40, 0.25)' : 'none'
                  }}
                >
                  👥 Batch Multi-Resume ({countLabel})
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', background: '#f1f5f9', padding: '6px', borderRadius: '14px', border: '1px solid rgba(200, 30, 40, 0.25)' }}>
                <button
                  type="button"
                  onClick={handleFillSample}
                  style={{
                    flex: '1 1 auto',
                    padding: '10px 16px',
                    fontSize: '14px',
                    fontWeight: '700',
                    borderRadius: '10px',
                    background: evalMode === 'single' ? '#c81e28' : 'transparent',
                    color: evalMode === 'single' ? '#ffffff' : '#64748b',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'center',
                    boxShadow: evalMode === 'single' ? '0 3px 12px rgba(200, 30, 40, 0.25)' : 'none'
                  }}
                >
                  ⚡ Demo: Single Senior Engineer
                </button>
                <button
                  type="button"
                  onClick={handleFillBatchSample}
                  style={{
                    flex: '1 1 auto',
                    padding: '10px 16px',
                    fontSize: '14px',
                    fontWeight: '700',
                    borderRadius: '10px',
                    background: evalMode === 'batch' ? '#c81e28' : 'transparent',
                    color: evalMode === 'batch' ? '#ffffff' : '#64748b',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'center',
                    boxShadow: evalMode === 'batch' ? '0 3px 12px rgba(200, 30, 40, 0.25)' : 'none'
                  }}
                >
                  👥 Demo: Batch Comparisons ({countLabel})
                </button>
              </div>
            )}
          </div>

          {/* Dashed dropzone precisely themed for light corporate aesthetic */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => document.getElementById('resume-main-upload').click()}
            style={{
              border: '2px dashed #cbd5e1',
              borderRadius: '16px',
              padding: '38px 20px',
              textAlign: 'center',
              background: '#f8fafc',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              marginBottom: '18px'
            }}
            className="dropzone-hover-effect"
          >
            <input
              id="resume-main-upload"
              type="file"
              multiple={evalMode === 'batch'}
              accept=".pdf,.doc,.docx,.txt"
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  if (evalMode === 'batch' || e.target.files.length > 1) {
                    handleMultiFileUpload(e.target.files);
                  } else {
                    setSelectedFile(e.target.files[0]);
                    setInputMode('file');
                    setError('');
                  }
                }
              }}
            />

            <div style={{
              width: '54px',
              height: '54px',
              background: 'rgba(200, 30, 40, 0.08)',
              borderRadius: '14px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#c81e28',
              marginBottom: '16px',
              boxShadow: '0 4px 14px rgba(200, 30, 40, 0.12)',
              border: '1px solid rgba(200, 30, 40, 0.2)'
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/>
                <path d="M12 12v9"/>
                <path d="m16 16-4-4-4 4"/>
              </svg>
            </div>

            {evalMode === 'single' && selectedFile ? (
              <div>
                <p style={{ color: '#059669', fontWeight: '700', fontSize: '17px', marginBottom: '4px' }}>✓ Selected: {selectedFile.name}</p>
                <p style={{ color: '#64748b', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>{(selectedFile.size/1024).toFixed(1)} KB — Ready for analysis</p>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '17px', fontWeight: '700', color: '#0f172a', marginBottom: '6px', letterSpacing: '-0.2px' }}>
                  Click to upload or drag & drop
                </p>
                <p style={{ fontSize: '13px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                  PDF, DOCX (Max 10 files)
                </p>
              </div>
            )}
          </div>

          {/* SINGLE EVALUATION CONTROLS & DEMO TEXT PREVIEW */}
          {evalMode === 'single' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: '#334155', fontWeight: '700' }}>Or input via alternative formats:</span>
                <div className="tabs-container" style={{ margin: 0, padding: '3px', background: '#f1f5f9' }}>
                  <button type="button" className={`tab-btn ${inputMode === 'file' ? 'active' : ''}`} onClick={() => setInputMode('file')} style={{ fontSize: '12px', padding: '5px 12px' }}>File</button>
                  <button type="button" className={`tab-btn ${inputMode === 'link' ? 'active' : ''}`} onClick={() => setInputMode('link')} style={{ fontSize: '12px', padding: '5px 12px' }}>URL Link</button>
                  <button type="button" className={`tab-btn ${inputMode === 'text' ? 'active' : ''}`} onClick={() => setInputMode('text')} style={{ fontSize: '12px', padding: '5px 12px' }}>Paste Text</button>
                </div>
              </div>

              {inputMode === 'link' && (
                <input
                  type="url"
                  className="input-field"
                  placeholder="https://example.com/candidate_resume.pdf"
                  value={resumeUrl}
                  onChange={(e) => setResumeUrl(e.target.value)}
                  style={{ fontSize: '14px', background: '#ffffff', borderColor: '#cbd5e1' }}
                />
              )}

              {inputMode === 'text' && (
                <textarea
                  className="textarea-field"
                  placeholder="Paste candidate resume text or summary here..."
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  style={{ minHeight: '120px', fontSize: '14px', background: '#ffffff', borderColor: '#cbd5e1' }}
                />
              )}

              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '4px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', display: 'block', marginBottom: '10px' }}>
                  ⚡ Optional GitHub & Coding Platform Verification:
                </span>
                <div className="grid-2-col" style={{ gap: '12px' }}>
                  <div>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="GitHub Username (e.g. torvalds)"
                      value={githubOverride}
                      onChange={(e) => setGithubOverride(e.target.value)}
                      style={{ fontSize: '13px', background: '#ffffff', borderColor: '#cbd5e1' }}
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="LeetCode Username (e.g. neetcode)"
                      value={leetcodeOverride}
                      onChange={(e) => setLeetcodeOverride(e.target.value)}
                      style={{ fontSize: '13px', background: '#ffffff', borderColor: '#cbd5e1' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BATCH EVALUATION CONTROLS & SMART BULK PASTE */}
          {evalMode === 'batch' && (
            <div style={{ marginTop: '6px' }}>
              {/* Smart Bulk Paste URL Feature */}
              <div style={{ background: 'rgba(200, 30, 40, 0.04)', border: '1px solid rgba(200, 30, 40, 0.2)', borderRadius: '14px', padding: '16px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    ⚡ Smart Bulk Paste Links
                  </span>
                  <span style={{ fontSize: '12px', color: '#c81e28', fontWeight: '600' }}>
                    Auto-parse multiple resume URLs from any text block
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
                  <textarea
                    className="textarea-field"
                    placeholder="Paste an email, spreadsheet dump, or text block containing multiple links (e.g. https://drive.google.com/... https://github.com/...)..."
                    value={bulkPasteText}
                    onChange={(e) => {
                      setBulkPasteText(e.target.value);
                      if (bulkStatus?.type === 'error') setBulkStatus(null);
                    }}
                    style={{ minHeight: '70px', padding: '12px 14px', fontSize: '13px', background: '#ffffff', borderColor: '#cbd5e1' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    {bulkStatus ? (
                      <span style={{ fontSize: '13px', fontWeight: '600', color: bulkStatus.type === 'success' ? '#059669' : '#dc2626' }}>
                        {bulkStatus.message}
                      </span>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                        💡 Extracts links automatically and syncs directly with candidate entries
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={handleBulkParseAndPopulate}
                      style={{ padding: '8px 18px', fontSize: '13px', borderRadius: '10px', background: '#c81e28', color: '#fff', fontWeight: '700', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(200, 30, 40, 0.25)' }}
                    >
                      ✨ Extract & Populate
                    </button>
                  </div>
                </div>
              </div>

              {/* Candidate Entry List */}
              <div style={{ maxHeight: '450px', overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' }}>
                {candidates.map((cand, index) => (
                  <div key={cand.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: '800', color: '#c81e28', fontSize: '13px', background: 'rgba(200, 30, 40, 0.08)', padding: '2px 8px', borderRadius: '6px', border: '1px solid rgba(200, 30, 40, 0.15)' }}>{cand.id}</span>
                        <span style={{ fontSize: '14px', color: '#0f172a', fontWeight: '700' }}>Candidate #{index + 1} {cand.nameHint && `— ${cand.nameHint}` || (cand.file && `— ${cand.file.name}`)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="tabs-container" style={{ margin: 0, padding: '2px', background: '#f1f5f9' }}>
                          <button type="button" className={`tab-btn ${cand.mode === 'file' ? 'active' : ''}`} onClick={() => handleCandidateChange(index, 'mode', 'file')} style={{ padding: '3px 8px', fontSize: '11px' }}>File</button>
                          <button type="button" className={`tab-btn ${cand.mode === 'link' ? 'active' : ''}`} onClick={() => handleCandidateChange(index, 'mode', 'link')} style={{ padding: '3px 8px', fontSize: '11px' }}>URL</button>
                          <button type="button" className={`tab-btn ${cand.mode === 'text' ? 'active' : ''}`} onClick={() => handleCandidateChange(index, 'mode', 'text')} style={{ padding: '3px 8px', fontSize: '11px' }}>Text</button>
                        </div>
                        <button type="button" onClick={() => handleRemoveCandidate(index)} style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px' }} title="Delete Candidate">
                          🗑️
                        </button>
                      </div>
                    </div>

                    {cand.mode === 'file' && (
                      <div className="dropzone" style={{ padding: '12px', minHeight: '60px', background: '#ffffff', borderColor: '#cbd5e1', cursor: 'pointer' }} onClick={() => document.getElementById(`file-upload-${index}`).click()}>
                        <input id={`file-upload-${index}`} type="file" accept=".pdf,.doc,.docx,.txt" style={{ display: 'none' }} onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleCandidateChange(index, 'file', e.target.files[0]);
                          }
                        }} />
                        {cand.file ? (
                          <p style={{ color: '#059669', fontWeight: '700', margin: 0, fontSize: '13px' }}>✓ File: {cand.file.name} ({(cand.file.size/1024).toFixed(1)} KB)</p>
                        ) : (
                          <p style={{ color: '#64748b', margin: 0, fontSize: '13px' }}>📁 Click to attach candidate PDF / Word file</p>
                        )}
                      </div>
                    )}

                    {cand.mode === 'link' && (
                      <input
                        type="url"
                        className="input-field"
                        placeholder="https://example.com/candidate_resume.pdf"
                        value={cand.url || ''}
                        onChange={(e) => handleCandidateChange(index, 'url', e.target.value)}
                        style={{ fontSize: '13px', padding: '10px 12px', background: '#ffffff', borderColor: '#cbd5e1' }}
                      />
                    )}

                    {cand.mode === 'text' && (
                      <textarea
                        className="textarea-field"
                        placeholder="Paste candidate resume text..."
                        value={cand.text || ''}
                        onChange={(e) => handleCandidateChange(index, 'text', e.target.value)}
                        style={{ minHeight: '75px', fontSize: '13px', padding: '10px 12px', background: '#ffffff', borderColor: '#cbd5e1' }}
                      />
                    )}

                    <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed #e2e8f0' }}>
                      <div className="grid-2-col" style={{ gap: '8px' }}>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="GitHub Username"
                          value={cand.github || ''}
                          onChange={(e) => handleCandidateChange(index, 'github', e.target.value)}
                          style={{ fontSize: '12px', padding: '8px 10px', background: '#ffffff', borderColor: '#cbd5e1' }}
                        />
                        <input
                          type="text"
                          className="input-field"
                          placeholder="LeetCode Handle"
                          value={cand.leetcode || ''}
                          onChange={(e) => handleCandidateChange(index, 'leetcode', e.target.value)}
                          style={{ fontSize: '12px', padding: '8px 10px', background: '#ffffff', borderColor: '#cbd5e1' }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleAddCandidate}
                style={{ width: '100%', padding: '12px', background: '#ffffff', color: '#c81e28', border: '1px dashed rgba(200, 30, 40, 0.4)', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', transition: 'all 0.2s', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}
              >
                ➕ Add Another Resume Slot
              </button>
            </div>
          )}
        </div>
        {/* End of PART 2 and Master Combined Container */}
      </div>

      {/* ANALYZE NOW BUTTON themed after the rich red Start New Search button in screen.png */}
      <button
        type="button"
        onClick={handleAnalyze}
        disabled={loading}
        style={{
          width: '100%',
          padding: '18px 24px',
          background: '#c81e28',
          color: '#ffffff',
          border: 'none',
          borderRadius: '16px',
          fontSize: '18px',
          fontWeight: '700',
          cursor: loading ? 'not-allowed' : 'pointer',
          boxShadow: '0 6px 20px rgba(200, 30, 40, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          transition: 'all 0.2s',
          letterSpacing: '-0.2px',
          opacity: loading ? 0.7 : 1
        }}
      >
        {loading ? (
          <>
            <span className="loading-spinner" style={{ width: '22px', height: '22px', borderWidth: '3px' }}></span>
            <span>Evaluating Candidate Satisfaction...</span>
          </>
        ) : (
          <>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#ffffff' }}>
              <path d="M13 2.05v8.95h5.95l-7.95 11v-8.95H5.05l7.95-11z"/>
            </svg>
            <span>Analyze Now</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14"/>
              <path d="m12 5 7 7-7 7"/>
            </svg>
          </>
        )}
      </button>
    </div>
  );
}
