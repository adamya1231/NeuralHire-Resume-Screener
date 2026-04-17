import React, { useState, useRef } from 'react';

const UploadSection = ({ activeWorkspace, onMatchResults }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processPhase, setProcessPhase] = useState('');
  const [files, setFiles] = useState([]);
  const [processedCount, setProcessedCount] = useState(0);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);

  const processFiles = async (selectedFiles) => {
    if (selectedFiles.length === 0) return;
    if (!activeWorkspace) {
      alert("Please select or create a Campaign Workspace first!");
      return;
    }

    setIsProcessing(true);
    setProcessPhase('Extracting Text...');
    setTimeout(() => setProcessPhase('AI Processing...'), 1800);

    const formData = new FormData();
    formData.append('job_description', activeWorkspace.description);
    formData.append('workspace_id', activeWorkspace.id);
    formData.append('min_score', activeWorkspace.min_score || 75);
    Array.from(selectedFiles).forEach(file => formData.append('resumes', file));

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/match`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.candidates) {
        setProcessedCount(prev => prev + data.candidates.length);
        onMatchResults(data.candidates);
      } else {
        alert("Error analyzing resumes. Check backend console.");
      }
    } catch (error) {
      console.error("Error processing resumes:", error);
      alert("Could not connect to the backend server.");
    } finally {
      setIsProcessing(false);
      setProcessPhase('');
      setFiles([]);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault(); setIsDragging(false);
    const droppedFiles = e.dataTransfer.files;
    setFiles(droppedFiles);
    await processFiles(droppedFiles);
  };

  const handleFileSelect = async (e) => {
    const selectedFiles = e.target.files;
    setFiles(selectedFiles);
    await processFiles(selectedFiles);
  };

  if (!activeWorkspace) {
    return (
      <div className="upload-container animate-slide-up" style={{ opacity: 0.45, pointerEvents: 'none' }}>
        <div className="upload-heading-row">
          <h2 className="upload-heading">Resume Upload Zone</h2>
        </div>
        <div className="drop-zone locked">
          <div className="pdf-float-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Create a Campaign first to unlock uploading</p>
        </div>
      </div>
    );
  }

  return (
    <div className="upload-container animate-slide-up" style={{ animationDelay: '0.1s' }}>
      <div className="upload-heading-row">
        <h2 className="upload-heading">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          Upload to "{activeWorkspace.title}"
        </h2>
      </div>

      <div
        className={`drop-zone ${isDragging ? 'dragging' : ''} ${isProcessing ? 'processing' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!isProcessing ? () => fileInputRef.current.click() : undefined}
      >
        <input type="file" multiple accept=".pdf" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileSelect} />

        {isProcessing ? (
          <div className="processing-state">
            <div className="spinner-wrap">
              <div className="spinner-outer" />
              <div className="spinner-inner" />
            </div>
            <p className="phase-label">{processPhase}</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Drona AI is evaluating candidates...</p>
          </div>
        ) : (
          <div className="upload-prompt">
            <div className="pdf-float-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="url(#pdfGrad)" strokeWidth="1.5" strokeLinecap="round">
                <defs>
                  <linearGradient id="pdfGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1"/>
                    <stop offset="100%" stopColor="#22d3ee"/>
                  </linearGradient>
                </defs>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
            <h3 className="heading-3" style={{ color: 'var(--text-primary)' }}>Click or Drag Resumes</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Drop PDF files here to start AI matching</p>
            <div className="drop-formats">
              <span className="tag-pill">PDF only</span>
              <span className="tag-pill">Batch supported</span>
            </div>
          </div>
        )}
      </div>

      {/* 3-stat strip */}
      <div className="upload-stats">
        {[
          { num: processedCount, label: 'Processed', color: 'var(--accent-primary)' },
          { num: '100%', label: 'Bias Removed', color: 'var(--success-color)' },
          { num: '~8s', label: 'Avg AI Time', color: 'var(--accent-secondary)' },
        ].map((s, i) => (
          <div className="u-stat" key={i}>
            <span className="u-val" style={{ color: s.color }}>{s.num}</span>
            <span className="u-label">{s.label}</span>
          </div>
        ))}
      </div>

      <style>{`
        .upload-container {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          height: 100%;
        }

        .upload-heading-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .upload-heading {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .upload-heading svg { color: var(--accent-secondary); }

        .drop-zone {
          flex: 1;
          min-height: 260px;
          background: var(--glass-bg);
          backdrop-filter: var(--glass-blur);
          border: 2px dashed var(--border-color);
          border-radius: 1.25rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          cursor: pointer;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .drop-zone::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(99,102,241,0.04), rgba(34,211,238,0.04));
          opacity: 0;
          transition: opacity 0.3s ease;
          border-radius: inherit;
        }

        .drop-zone:hover::before, .drop-zone.dragging::before { opacity: 1; }

        .drop-zone:hover {
          border-color: var(--accent-primary);
          box-shadow: 0 0 30px rgba(99,102,241,0.12), inset 0 0 30px rgba(99,102,241,0.04);
          transform: translateY(-2px);
        }

        .drop-zone.dragging {
          border-color: var(--accent-secondary);
          box-shadow: 0 0 50px rgba(34,211,238,0.22);
          transform: scale(1.01);
        }

        .drop-zone.processing {
          border-color: var(--success-color);
          cursor: wait;
        }

        .drop-zone.locked { cursor: default; }

        .upload-prompt {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          position: relative;
          z-index: 1;
        }

        .drop-formats {
          display: flex;
          gap: 0.5rem;
          margin-top: 0.25rem;
        }

        .pdf-float-icon {
          width: 72px; height: 72px;
          background: rgba(99,102,241,0.08);
          border: 1px solid rgba(99,102,241,0.2);
          border-radius: 1.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: float 4s ease-in-out infinite;
          box-shadow: 0 8px 24px rgba(99,102,241,0.15);
        }

        /* Dual spinner */
        .processing-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          position: relative;
          z-index: 1;
        }

        .spinner-wrap {
          position: relative;
          width: 56px; height: 56px;
        }

        .spinner-outer {
          position: absolute; inset: 0;
          border: 3px solid rgba(99,102,241,0.15);
          border-top-color: var(--accent-primary);
          border-radius: 50%;
          animation: spin 0.9s linear infinite;
        }

        .spinner-inner {
          position: absolute; inset: 10px;
          border: 2px solid rgba(34,211,238,0.15);
          border-top-color: var(--accent-secondary);
          border-radius: 50%;
          animation: spin 0.6s linear infinite reverse;
        }

        .phase-label {
          font-size: 0.95rem;
          font-weight: 600;
          background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        /* Stats strip */
        .upload-stats {
          display: flex;
          gap: 0;
          background: var(--glass-bg);
          backdrop-filter: var(--glass-blur);
          border: 1px solid var(--border-color);
          border-radius: 0.9rem;
          overflow: hidden;
        }

        .u-stat {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0.65rem 0.5rem;
          gap: 0.15rem;
          border-right: 1px solid var(--border-color);
        }

        .u-stat:last-child { border-right: none; }

        .u-val {
          font-size: 1.1rem;
          font-weight: 700;
          line-height: 1;
        }

        .u-label {
          font-size: 0.65rem;
          color: var(--text-secondary);
          font-weight: 500;
          letter-spacing: 0.03em;
        }
      `}</style>
    </div>
  );
};

export default UploadSection;
