import React, { useState } from 'react';
import Navbar from './components/Navbar.jsx';
import Dashboard from './components/Dashboard.jsx';

export default function App() {
  const [evaluationResults, setEvaluationResults] = useState(() => {
    const saved = localStorage.getItem('ats_evaluation_results');
    if (saved) {
      try { return JSON.parse(saved) || []; } catch (e) { return []; }
    }
    return [];
  });
  
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const handleResultsChange = (results, evaluating) => {
    setEvaluationResults(results);
    setIsEvaluating(evaluating);
  };

  const handleReset = () => {
    localStorage.clear();
    setEvaluationResults([]);
    setIsEvaluating(false);
    // Incrementing resetKey remounts Dashboard from scratch with default blank forms
    setResetKey(prevKey => prevKey + 1);
  };

  return (
    <div className="app-root-layout" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
      <Navbar 
        evaluationResults={evaluationResults}
        isEvaluating={isEvaluating}
        onReset={handleReset}
      />

      <main className="main-content-area" style={{ flex: 1, width: '100%', padding: '32px' }}>
        <Dashboard 
          key={resetKey}
          onResultsChange={handleResultsChange}
        />
      </main>
    </div>
  );
}
