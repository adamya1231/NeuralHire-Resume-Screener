import React, { useState, useEffect } from 'react';

const PIPELINE_STEPS = [
  { icon: '📄', label: 'PDF Parsing', desc: 'Extracting text & structure' },
  { icon: '🧬', label: 'NLP Analysis', desc: 'Deep semantic matching' },
  { icon: '⚖️', label: 'Bias Audit', desc: 'Removing institutional bias' },
  { icon: '🎯', label: 'Score Engine', desc: 'Ranking by match quality' },
  { icon: '🚩', label: 'Red Flags', desc: 'Detecting inconsistencies' },
  { icon: '✅', label: 'Shortlisting', desc: 'Top candidates selected' },
];

const Hero = () => {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep(prev => (prev + 1) % PIPELINE_STEPS.length);
    }, 1600);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="hero-section animate-fade-in">
      {/* Ambient orbs */}
      <div className="hero-orb orb-purple" />
      <div className="hero-orb orb-cyan" />
      <div className="hero-orb orb-violet" />

      <div className="hero-grid">
        {/* ─── Left Column ─────────────────────────── */}
        <div className="hero-left animate-slide-up">
          <div className="hero-badge">
            <span className="badge-dot" />
            AI-Powered Recruitment Platform
          </div>

          <h1 className="heading-1 hero-title">
            Identify Champions<br />with Drona AI
          </h1>

          <p className="hero-subtitle">
            Inspired by the legendary guru of potential. Drona AI uses advanced NLP
            to analyse resumes, detect red flags, and rank the most promising
            talent with surgical precision — bias-free.
          </p>

          <div className="hero-actions">
            <button className="btn-primary hero-cta">
              Start Hiring
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
            <button className="btn-secondary">View Demo</button>
          </div>

          {/* Stats strip */}
          <div className="stats-strip">
            {[
              { value: '10×', label: 'Faster Screening' },
              { value: '85%', label: 'Bias Reduced' },
              { value: '99%', label: 'Accuracy Rate' },
              { value: '7', label: 'AI Steps' },
            ].map((s, i) => (
              <div className="stat-item" key={i}>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Right Column: Pipeline Card ─────────── */}
        <div className="hero-right animate-scale-in" style={{ animationDelay: '0.2s' }}>
          <div className="pipeline-card glass-panel">
            <div className="pipeline-header">
              <div className="pipeline-title">
                <div className="live-dot" />
                Live AI Pipeline
              </div>
              <div className="pipeline-score">
                Score Preview <span>87</span>
              </div>
            </div>

            <div className="pipeline-steps">
              {PIPELINE_STEPS.map((step, i) => (
                <div
                  key={i}
                  className={`pipeline-step ${i === activeStep ? 'active' : ''} ${i < activeStep ? 'done' : ''}`}
                >
                  <div className="step-icon-wrap">
                    {i === activeStep ? (
                      <div className="step-spinner" />
                    ) : (
                      <span className="step-emoji">{step.icon}</span>
                    )}
                  </div>
                  <div className="step-info">
                    <div className="step-label">{step.label}</div>
                    <div className="step-desc">{step.desc}</div>
                  </div>
                  {i < activeStep && (
                    <svg className="step-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
              ))}
            </div>

            <div className="pipeline-footer">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${((activeStep + 1) / PIPELINE_STEPS.length) * 100}%` }} />
              </div>
              <span className="progress-label">{activeStep + 1} / {PIPELINE_STEPS.length} steps</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .hero-section {
          padding: 7rem 0 3rem;
          position: relative;
          overflow: hidden;
        }

        .hero-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          opacity: 0.5;
        }
        .orb-purple { width: 500px; height: 500px; background: rgba(99,102,241,0.15); top: -100px; left: -100px; animation: float 14s ease-in-out infinite alternate; }
        .orb-cyan   { width: 400px; height: 400px; background: rgba(34,211,238,0.12); bottom: 0; right: -80px; animation: float 10s ease-in-out infinite alternate-reverse; }
        .orb-violet { width: 300px; height: 300px; background: rgba(167,139,250,0.10); top: 40%; left: 50%; transform: translate(-50%,-50%); animation: float 18s ease-in-out infinite alternate; }

        .hero-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: center;
          position: relative;
          z-index: 2;
        }

        .hero-left { display: flex; flex-direction: column; gap: 1.75rem; }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(99,102,241,0.08);
          border: 1px solid rgba(99,102,241,0.2);
          color: var(--accent-primary);
          padding: 0.35rem 0.9rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.03em;
          width: fit-content;
        }

        .badge-dot {
          width: 7px; height: 7px;
          background: var(--success-color);
          border-radius: 50%;
          box-shadow: 0 0 8px var(--success-color);
          animation: pulseGlow 2s ease-in-out infinite;
        }

        .hero-title { margin: 0; }

        .hero-subtitle {
          font-size: 1.05rem;
          color: var(--text-secondary);
          line-height: 1.75;
          max-width: 480px;
        }

        .hero-actions {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .hero-cta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1rem;
          padding: 0.85rem 2rem;
        }

        /* Stats strip */
        .stats-strip {
          display: flex;
          gap: 2.5rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border-color);
        }

        .stat-item { display: flex; flex-direction: column; gap: 0.2rem; }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          line-height: 1;
        }

        .stat-label {
          font-size: 0.72rem;
          color: var(--text-secondary);
          font-weight: 500;
          letter-spacing: 0.02em;
        }

        /* Pipeline Card */
        .hero-right { display: flex; align-items: center; justify-content: center; }

        .pipeline-card {
          width: 100%;
          max-width: 420px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          border: 1px solid var(--glass-border);
          animation: pulseGlow 5s ease-in-out infinite;
        }

        .pipeline-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .pipeline-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          color: var(--text-secondary);
          text-transform: uppercase;
        }

        .live-dot {
          width: 8px; height: 8px;
          background: var(--success-color);
          border-radius: 50%;
          box-shadow: 0 0 10px var(--success-color);
          animation: pulseGlow 2s ease-in-out infinite;
        }

        .pipeline-score {
          font-size: 0.8rem;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .pipeline-score span {
          display: inline-block;
          margin-left: 0.4rem;
          font-size: 1.1rem;
          font-weight: 700;
          background: linear-gradient(135deg, var(--success-color), var(--accent-secondary));
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .pipeline-steps {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .pipeline-step {
          display: flex;
          align-items: center;
          gap: 0.9rem;
          padding: 0.6rem 0.8rem;
          border-radius: 0.6rem;
          border: 1px solid transparent;
          transition: all 0.3s ease;
          opacity: 0.45;
        }

        .pipeline-step.done {
          opacity: 0.65;
          background: rgba(16,185,129,0.04);
        }

        .pipeline-step.active {
          opacity: 1;
          border-color: rgba(99,102,241,0.3);
          background: rgba(99,102,241,0.07);
          box-shadow: 0 0 20px rgba(99,102,241,0.1);
        }

        .step-icon-wrap {
          width: 32px; height: 32px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        .step-emoji { font-size: 1.1rem; }

        .step-spinner {
          width: 22px; height: 22px;
          border: 2.5px solid rgba(99,102,241,0.15);
          border-top-color: var(--accent-primary);
          border-radius: 50%;
          animation: spin 0.65s linear infinite;
        }

        .step-info { flex: 1; }

        .step-label {
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--text-primary);
          line-height: 1;
        }

        .step-desc {
          font-size: 0.7rem;
          color: var(--text-secondary);
          margin-top: 0.15rem;
        }

        .step-check { color: var(--success-color); flex-shrink: 0; }

        .pipeline-footer {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .progress-bar {
          flex: 1;
          height: 4px;
          background: rgba(99,102,241,0.12);
          border-radius: 9999px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
          border-radius: 9999px;
          transition: width 0.4s cubic-bezier(0.4,0,0.2,1);
        }

        .progress-label {
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--text-secondary);
          white-space: nowrap;
        }

        @media (max-width: 900px) {
          .hero-grid { grid-template-columns: 1fr; gap: 3rem; }
          .hero-right { display: none; }
          .hero-section { padding: 6rem 0 2rem; }
        }
      `}</style>
    </section>
  );
};

export default Hero;
