import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';

export default function PublicApply() {
  const { token } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [resume, setResume] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    document.documentElement.classList.add('dark');
    fetch(`${import.meta.env.VITE_API_URL}/api/public/job/${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setNotFound(true);
        } else {
          setJob(data);
        }
        setLoading(false);
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resume) return alert('Please attach your resume (PDF).');

    setSubmitting(true);
    const formData = new FormData();
    formData.append('resume', resume);
    formData.append('name', name);
    formData.append('email', email);
    formData.append('phone', phone);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/public/apply/${token}`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        setSuccess(true);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to submit. Please try again.');
      }
    } catch (err) {
      alert('Network error. Please try again.');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="pa-screen">
        <div className="pa-loading">
          <div className="pa-spinner" />
          <p>Loading job details…</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="pa-screen">
        <div className="pa-card pa-not-found">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <h2>Link Not Found</h2>
          <p>This application link is invalid or has expired. Please contact the recruiter for a valid link.</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="pa-screen">
        <div className="pa-card pa-success animate-fade-in">
          <div className="pa-success-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h2>Application Submitted!</h2>
          <p>Thank you for applying for <strong>{job?.title}</strong>. Your resume is being reviewed by our AI and will be evaluated shortly. The recruiter will be in touch if your profile matches.</p>
          <span className="pa-badge">Application Received ✓</span>
        </div>
      </div>
    );
  }

  return (
    <div className="pa-screen">
      {/* Ambient background orbs */}
      <div className="pa-orb pa-orb1" />
      <div className="pa-orb pa-orb2" />

      <div className="pa-layout animate-fade-in">
        {/* Left — Job Info */}
        <div className="pa-job-info">
          <div className="pa-logo-badge">
            <svg viewBox="0 0 32 32" fill="none" width="28" height="28">
              <defs>
                <linearGradient id="lgPA" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1"/>
                  <stop offset="100%" stopColor="#22d3ee"/>
                </linearGradient>
              </defs>
              <path d="M16 3L4 8v8c0 6.627 5.373 12 12 12s12-5.373 12-12V8L16 3z" fill="url(#lgPA)"/>
              <path d="M11 16l3.5 3.5L21 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Powered by DRONA AI</span>
          </div>

          <h1 className="pa-job-title">{job.title}</h1>

          <div className="pa-job-meta">
            <span className="pa-tag">Now Hiring</span>
            <span className="pa-tag pa-tag-ai">AI Screened</span>
          </div>

          <div className="pa-job-desc-box">
            <h3>Job Description</h3>
            <p>{job.description}</p>
          </div>

          <div className="pa-info-tip">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            Your application is analyzed instantly by AI. Ensure your resume clearly reflects your skills and experience.
          </div>
        </div>

        {/* Right — Application Form */}
        <div className="pa-card">
          <h2 className="pa-form-title">Apply Now</h2>
          <p className="pa-form-sub">Fill in your details and attach your resume.</p>

          <form onSubmit={handleSubmit} className="pa-form">
            <div className="pa-field">
              <label>Full Name <span className="pa-req">*</span></label>
              <input
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>

            <div className="pa-field">
              <label>Email Address <span className="pa-req">*</span></label>
              <input
                type="email"
                placeholder="e.g. rahul@gmail.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="pa-field">
              <label>Phone Number <span style={{color:'var(--text-secondary)', fontWeight: 400}}>(optional)</span></label>
              <input
                type="tel"
                placeholder="e.g. +91 9876543210"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>

            <div className="pa-field">
              <label>Resume <span className="pa-req">*</span></label>
              <div
                className={`pa-dropzone ${resume ? 'pa-dropzone-active' : ''}`}
                onClick={() => fileInputRef.current?.click()}
              >
                {resume ? (
                  <>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    <span className="pa-filename">{resume.name}</span>
                    <span className="pa-change">Click to change</span>
                  </>
                ) : (
                  <>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    <span>Click to upload your resume</span>
                    <span className="pa-file-hint">PDF only · Max 10MB</span>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                style={{ display: 'none' }}
                onChange={e => setResume(e.target.files[0])}
              />
            </div>

            <button type="submit" className="pa-submit" disabled={submitting}>
              {submitting ? (
                <><div className="pa-btn-spinner" /> Submitting…</>
              ) : (
                <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Submit Application</>
              )}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; }

        .pa-screen {
          min-height: 100vh;
          background: #050b1a;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
          position: relative;
          overflow: hidden;
          font-family: 'Inter', sans-serif;
        }

        .pa-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          pointer-events: none;
          z-index: 0;
        }
        .pa-orb1 {
          width: 500px; height: 500px;
          background: rgba(99,102,241,0.15);
          top: -100px; left: -100px;
        }
        .pa-orb2 {
          width: 400px; height: 400px;
          background: rgba(34,211,238,0.1);
          bottom: -80px; right: -80px;
        }

        .pa-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          width: 100%;
          max-width: 1000px;
          position: relative;
          z-index: 10;
        }

        @media (max-width: 768px) {
          .pa-layout { grid-template-columns: 1fr; }
          .pa-job-info { order: 2; }
          .pa-card { order: 1; }
        }

        /* Job Info Panel */
        .pa-job-info {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          color: #e2e8f0;
        }

        .pa-logo-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          font-weight: 600;
          color: #94a3b8;
          letter-spacing: 0.03em;
        }

        .pa-job-title {
          font-size: 2.5rem;
          font-weight: 800;
          line-height: 1.2;
          background: linear-gradient(135deg, #f1f5f9, #6366f1);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          margin: 0;
        }

        .pa-job-meta {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .pa-tag {
          background: rgba(99,102,241,0.15);
          border: 1px solid rgba(99,102,241,0.3);
          color: #a5b4fc;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          letter-spacing: 0.03em;
        }

        .pa-tag-ai {
          background: rgba(34,211,238,0.1);
          border-color: rgba(34,211,238,0.3);
          color: #67e8f9;
        }

        .pa-job-desc-box {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 1rem;
          padding: 1.25rem;
        }

        .pa-job-desc-box h3 {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: #6366f1;
          margin: 0 0 0.75rem;
          text-transform: uppercase;
        }

        .pa-job-desc-box p {
          color: #94a3b8;
          line-height: 1.7;
          margin: 0;
          font-size: 0.9rem;
          white-space: pre-wrap;
          max-height: 200px;
          overflow-y: auto;
        }

        .pa-info-tip {
          display: flex;
          align-items: flex-start;
          gap: 0.6rem;
          font-size: 0.8rem;
          color: #64748b;
          line-height: 1.5;
        }

        .pa-info-tip svg { flex-shrink: 0; margin-top: 2px; }

        /* Application Form Card */
        .pa-card {
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 1.25rem;
          padding: 2rem;
        }

        .pa-form-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #f1f5f9;
          margin: 0 0 0.25rem;
        }

        .pa-form-sub {
          color: #64748b;
          font-size: 0.875rem;
          margin: 0 0 1.75rem;
        }

        .pa-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .pa-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .pa-field label {
          font-size: 0.82rem;
          font-weight: 600;
          color: #94a3b8;
        }

        .pa-req { color: #f87171; margin-left: 2px; }

        .pa-field input {
          background: rgba(15,23,42,0.6);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 0.625rem;
          padding: 0.8rem 1rem;
          color: #f1f5f9;
          font-size: 0.9rem;
          font-family: inherit;
          outline: none;
          transition: border-color 0.2s;
          width: 100%;
        }

        .pa-field input:focus {
          border-color: rgba(99,102,241,0.7);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
        }

        .pa-field input::placeholder { color: #475569; }

        /* Dropzone */
        .pa-dropzone {
          background: rgba(15,23,42,0.6);
          border: 1.5px dashed rgba(255,255,255,0.12);
          border-radius: 0.75rem;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.4rem;
          cursor: pointer;
          transition: all 0.2s;
          color: #64748b;
          font-size: 0.875rem;
          text-align: center;
        }

        .pa-dropzone:hover {
          border-color: rgba(99,102,241,0.5);
          background: rgba(99,102,241,0.05);
          color: #94a3b8;
        }

        .pa-dropzone-active {
          border-color: rgba(99,102,241,0.6);
          background: rgba(99,102,241,0.07);
        }

        .pa-filename {
          color: #a5b4fc;
          font-weight: 600;
          font-size: 0.875rem;
        }

        .pa-change {
          font-size: 0.75rem;
          color: #475569;
        }

        .pa-file-hint {
          font-size: 0.75rem;
          color: #475569;
        }

        /* Submit Button */
        .pa-submit {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #6366f1, #22d3ee);
          color: white;
          border: none;
          border-radius: 0.625rem;
          padding: 0.9rem 1.5rem;
          font-size: 0.95rem;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.25s;
          margin-top: 0.5rem;
        }

        .pa-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(99,102,241,0.35);
        }

        .pa-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* Loading & Error States */
        .pa-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          color: #64748b;
        }

        .pa-spinner {
          width: 40px; height: 40px;
          border: 3px solid rgba(99,102,241,0.2);
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .pa-btn-spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        /* Success State */
        .pa-not-found, .pa-success {
          max-width: 480px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          color: #e2e8f0;
        }

        .pa-success-icon {
          width: 72px; height: 72px;
          background: linear-gradient(135deg, #6366f1, #22d3ee);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 40px rgba(99,102,241,0.4);
          animation: popIn 0.4s cubic-bezier(0.175,0.885,0.32,1.275);
        }

        @keyframes popIn {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        .pa-success h2 { font-size: 1.75rem; font-weight: 800; margin: 0; }
        .pa-success p { color: #94a3b8; line-height: 1.6; margin: 0; }

        .pa-badge {
          background: rgba(34,211,238,0.12);
          border: 1px solid rgba(34,211,238,0.25);
          color: #67e8f9;
          font-size: 0.8rem;
          font-weight: 600;
          padding: 0.35rem 1rem;
          border-radius: 9999px;
        }

        .pa-not-found h2 { font-size: 1.5rem; font-weight: 700; margin: 0; color: #f87171; }
        .pa-not-found p { color: #94a3b8; line-height: 1.6; margin: 0; }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.5s ease forwards; }
      `}</style>
    </div>
  );
}
