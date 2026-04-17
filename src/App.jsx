import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Dashboard from './pages/Dashboard';
import Auth from './pages/Auth';
import PublicApply from './pages/PublicApply';
import Account from './pages/Account';
import InterviewPage from './pages/InterviewPage';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  if (loading) return <div style={{display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center'}}>Loading...</div>;

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/" 
          element={session ? <Dashboard session={session} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/account" 
          element={session ? <Account session={session} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/login" 
          element={!session ? <Auth /> : <Navigate to="/" />} 
        />
        <Route 
          path="/apply/:token" 
          element={<PublicApply />} 
        />
        <Route 
          path="/interview/:token" 
          element={<InterviewPage />} 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
