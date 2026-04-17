import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import Navbar from '../components/Navbar';

export default function Account() {
  const [theme, setTheme] = useState('dark');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        setEmail(user.email || '');
        setFullName(user.user_metadata?.full_name || '');
        setCompanyName(user.user_metadata?.company_name || '');
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: fullName,
        company_name: companyName
      }
    });

    if (error) {
      alert(error.message);
    } else {
      alert('Profile updated successfully!');
    }
    setSaving(false);
  };

  if (loading) return <div style={{display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center'}}>Loading...</div>;

  return (
    <div className="app-wrapper">
      <div className="mesh-orb3" />
      <Navbar theme={theme} toggleTheme={toggleTheme} />
      
      <main className="container" style={{ marginTop: '5.5rem', paddingBottom: '5rem', display: 'flex', justifyContent: 'center' }}>
        <div className="glass-panel animate-fade-in" style={{ padding: '2.5rem', width: '100%', maxWidth: '600px', marginTop: '3rem' }}>
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.8rem' }}>Account Settings</h2>
          
          <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="form-group">
              <label>Email Address (Cannot be changed)</label>
              <input type="email" className="input-field" value={email} disabled style={{ opacity: 0.7 }} />
            </div>
            
            <div className="form-group">
              <label>Full Name</label>
              <input 
                type="text" 
                className="input-field" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Company Name</label>
              <input 
                type="text" 
                className="input-field" 
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Update Profile'}
            </button>
          </form>
        </div>
      </main>

      <style>{`
        .app-wrapper {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .form-group label {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .input-field {
          width: 100%;
          padding: 0.875rem 1rem;
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid var(--border-color);
          border-radius: 0.5rem;
          color: var(--text-primary);
          transition: all 0.2s;
        }
        .input-field:focus {
          outline: none;
          border-color: var(--accent-primary);
        }
      `}</style>
    </div>
  );
}
