import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import JobPanel from '../components/JobPanel';
import UploadSection from '../components/UploadSection';
import CandidateList from '../components/CandidateList';
import WorkspaceTabs from '../components/WorkspaceTabs';
import EditWorkspacePanel from '../components/EditWorkspacePanel';
import TrustedBy from '../components/TrustedBy';
import InterviewDashboard from '../components/InterviewDashboard';

function App({ session }) {
  const [theme, setTheme] = useState('dark');
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showInterviews, setShowInterviews] = useState(false);

  // Load theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Load workspaces on initial mount
  useEffect(() => {
    fetchWorkspaces();
  }, []);

  // Fetch candidates whenever active workspace changes
  useEffect(() => {
    setIsEditing(false); // Reset edit view when switching tabs
    if (activeWorkspaceId) {
      fetchHistoricalCandidates(activeWorkspaceId);
    } else {
      setCandidates([]); // Clear candidates if we are on "New Campaign" tab
    }
  }, [activeWorkspaceId]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${session?.access_token}`
  });

  const fetchWorkspaces = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/workspaces`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      setWorkspaces(data.workspaces || []);
      
      // If we have workspaces and none selected, select the first one
      if (data.workspaces && data.workspaces.length > 0 && !activeWorkspaceId) {
        setActiveWorkspaceId(data.workspaces[0].id);
      }
    } catch (e) {
      console.error("Failed to fetch workspaces", e);
    }
  };

  const fetchHistoricalCandidates = async (id) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/workspaces/${id}/candidates`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      setCandidates(data.candidates || []);
    } catch (e) {
      console.error("Failed to fetch candidates", e);
    }
  };

  const handleMatchResults = (newResults) => {
    setCandidates(prev => {
      const combined = [...prev, ...newResults];
      return combined.sort((a, b) => b.overall_score - a.overall_score);
    });
  };

  const handleClearCampaign = async () => {
    if (!activeWorkspaceId) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/workspaces/${activeWorkspaceId}/candidates`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        setCandidates([]);
      } else {
        alert("Failed to clear campaign candidates.");
      }
    } catch (e) {
      console.error("Failed to clear candidates", e);
    }
  };

  const handleDeleteCandidate = async (candidateId) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/candidates/${candidateId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        setCandidates(prev => prev.filter(c => c.id !== candidateId));
      } else {
        alert("Failed to delete candidate.");
      }
    } catch (e) {
      console.error("Failed to delete candidate", e);
    }
  };

  const handleWorkspaceCreated = (newWorkspace) => {
    setWorkspaces(prev => [newWorkspace, ...prev]);
    setActiveWorkspaceId(newWorkspace.id);
  };

  const getActiveWorkspaceMeta = () => {
    return workspaces.find(w => w.id === activeWorkspaceId);
  };

  return (
    <div className="app-wrapper">
      <div className="mesh-orb3" />
      <Navbar theme={theme} toggleTheme={toggleTheme} />
      
      <main className="container" style={{ marginTop: '5.5rem', paddingBottom: '5rem' }}>
        <Hero />
        <TrustedBy />
        
        <div className="dashboard-grid glass-panel" style={{ padding: '2rem', marginTop: '3rem' }}>
          
          <WorkspaceTabs 
            workspaces={workspaces}
            activeWorkspaceId={activeWorkspaceId}
            onSelectWorkspace={(id) => setActiveWorkspaceId(id)}
            onNewWorkspace={() => setActiveWorkspaceId(null)}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {activeWorkspaceId === null ? (
              // If no workspace active, show Creation form side by side with locked uploader
              <>
                <JobPanel onWorkspaceCreated={handleWorkspaceCreated} session={session} />
                <UploadSection activeWorkspace={null} onMatchResults={handleMatchResults} />
              </>
            ) : isEditing ? (
              // Show Edit Mode Panel
              <>
                <EditWorkspacePanel 
                  workspace={getActiveWorkspaceMeta()}
                  onSave={(updatedWorkspace) => {
                    setWorkspaces(prev => prev.map(w => w.id === updatedWorkspace.id ? updatedWorkspace : w));
                    setIsEditing(false);
                  }}
                  onCancel={() => setIsEditing(false)}
                  onDelete={(id) => {
                    setWorkspaces(prev => prev.filter(w => w.id !== id));
                    setActiveWorkspaceId(null);
                    setIsEditing(false);
                  }}
                />
                <UploadSection 
                  activeWorkspace={getActiveWorkspaceMeta()} 
                  onMatchResults={handleMatchResults} 
                />
              </>
            ) : (
              // If workspace active, show active metadata & functional uploader
              <>
                <div className="active-workspace-card animate-fade-in">
                  <div className="workspace-card-header">
                    <div className="status-indicator">
                      <span className="dot"></span> ACTIVE CAMPAIGN
                    </div>
                    <button onClick={() => setIsEditing(true)} className="btn-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                    </button>
                  </div>

                  <h2 className="workspace-title">{getActiveWorkspaceMeta()?.title}</h2>
                  
                  <div className="workspace-desc">
                    {getActiveWorkspaceMeta()?.description}
                  </div>

                  <div className="workspace-stats">
                    <div className="w-stat">
                      <span className="w-label">MINIMUM SCORE</span>
                      <span className="w-value">{getActiveWorkspaceMeta()?.min_score || 75}</span>
                    </div>
                    <div className="w-stat">
                      <span className="w-label">TOTAL APPLICANTS</span>
                      <span className="w-value">{candidates.length}</span>
                    </div>
                  </div>

                  {/* Shareable Application Link */}
                  {getActiveWorkspaceMeta()?.public_token && (
                    <div className="share-link-section">
                      <span className="w-label" style={{ display: 'block', marginBottom: '0.5rem' }}>
                        🔗 CANDIDATE APPLICATION LINK
                      </span>
                      <div className="share-link-row">
                        <span className="share-link-url">
                          {window.location.origin}/apply/{getActiveWorkspaceMeta().public_token}
                        </span>
                        <button
                          className="copy-btn"
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/apply/${getActiveWorkspaceMeta().public_token}`);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}
                        >
                          {copied ? '✓ Copied!' : 'Copy'}
                        </button>
                      </div>
                      <p className="share-hint">Share this link with candidates — they can apply directly and will be automatically rated in this campaign.</p>
                    </div>
                  )}
                  {/* Interview Analytics Button */}
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '0.75rem' }}>
                    <button
                      onClick={() => setShowInterviews(v => !v)}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: showInterviews ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.06)', border: `1px solid ${showInterviews ? 'var(--accent-primary)' : 'var(--border-color)'}`, borderRadius: '0.6rem', color: showInterviews ? 'var(--accent-primary)' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, fontFamily: 'inherit', transition: 'all 0.2s' }}
                    >
                      📊 {showInterviews ? 'Hide' : 'View'} Interview Analytics
                    </button>
                  </div>
                </div>
                <UploadSection 
                  activeWorkspace={getActiveWorkspaceMeta()} 
                  onMatchResults={handleMatchResults} 
                />
              </>
            )}
          </div>
          
          {/* Historical & New Candidates Grid */}
          <div style={{ marginTop: '3rem' }}>
            {showInterviews && activeWorkspaceId ? (
              <div className="glass-panel" style={{ padding: '2rem' }}>
                <InterviewDashboard workspace={getActiveWorkspaceMeta()} session={session} />
              </div>
            ) : (
              <CandidateList
                candidatesData={candidates}
                onClearAll={handleClearCampaign}
                onDelete={handleDeleteCandidate}
                isWorkspaceActive={activeWorkspaceId !== null}
                activeWorkspace={getActiveWorkspaceMeta()}
                session={session}
              />
            )}
          </div>
        </div>
      </main>

      <style>{`
        .app-wrapper {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .dashboard-grid {
          animation: slideUp 0.8s ease forwards;
          animation-delay: 0.2s;
          opacity: 0;
        }

        /* Professional Campaign Card */
        .active-workspace-card {
          background: rgba(15, 23, 42, 0.3);
          border: 1px solid var(--border-color);
          border-radius: 1.25rem;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          height: 100%;
        }

        .dark .active-workspace-card {
           background: rgba(15, 23, 42, 0.4);
        }

        .workspace-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.65rem;
          font-weight: 800;
          color: var(--accent-primary);
          letter-spacing: 0.05em;
        }

        .status-indicator .dot {
          width: 6px;
          height: 6px;
          background: var(--accent-primary);
          border-radius: 50%;
          box-shadow: 0 0 8px var(--accent-primary);
        }

        .workspace-title {
          font-size: 1.5rem;
          margin: 0;
          color: var(--text-primary);
        }

        .workspace-desc {
          font-size: 0.95rem;
          color: var(--text-secondary);
          line-height: 1.6;
          max-height: 100px;
          overflow-y: auto;
          background: rgba(0,0,0,0.1);
          padding: 0.75rem;
          border-radius: 0.5rem;
        }

        .workspace-stats {
          display: flex;
          gap: 1.5rem;
          margin-top: auto;
        }

        .w-stat {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .w-label {
          font-size: 0.6rem;
          font-weight: 700;
          color: var(--text-secondary);
        }

        .w-value {
          font-size: 1rem;
          font-weight: 800;
          color: var(--text-primary);
        }

        .btn-icon {
          background: transparent;
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .btn-icon:hover {
          color: var(--accent-primary);
          border-color: var(--accent-primary);
        }

        /* Share Link Section */
        .share-link-section {
          background: rgba(99,102,241,0.07);
          border: 1px solid rgba(99,102,241,0.2);
          border-radius: 0.75rem;
          padding: 1rem;
          margin-top: 0.25rem;
        }

        .share-link-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(0,0,0,0.2);
          border: 1px solid var(--border-color);
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          margin-bottom: 0.5rem;
        }

        .share-link-url {
          flex: 1;
          font-size: 0.78rem;
          color: var(--accent-secondary);
          font-family: monospace;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .copy-btn {
          flex-shrink: 0;
          background: var(--accent-primary);
          color: white;
          border: none;
          border-radius: 0.375rem;
          padding: 0.35rem 0.75rem;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
        }

        .copy-btn:hover {
          background: var(--accent-secondary);
        }

        .share-hint {
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.5;
        }

        @media (max-width: 768px) {
          .dashboard-grid > div:nth-child(2) {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

export default App;
