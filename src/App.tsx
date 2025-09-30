import { useState, useEffect } from 'react';
import { projectId } from './utils/supabase/info';
import { getSupabaseClient } from './utils/supabase/client';
import { Login } from './components/Login';
import { SignUp } from './components/SignUp';
import { AthleteView } from './components/AthleteView';
import { CoachView } from './components/CoachView';

type View = 'login' | 'signup' | 'athlete' | 'coach';

export default function App() {
  const [view, setView] = useState<View>('login');
  const [accessToken, setAccessToken] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const supabase = getSupabaseClient();

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.log('Session check error:', error);
        setLoading(false);
        return;
      }

      if (data.session) {
        // Get user profile to determine role
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-156de6d6/profile`,
          {
            headers: {
              Authorization: `Bearer ${data.session.access_token}`,
            },
          }
        );

        const result = await response.json();

        if (response.ok) {
          setAccessToken(data.session.access_token);
          setView(result.profile.role === 'coach' ? 'coach' : 'athlete');
        }
      }
    } catch (err) {
      console.log('Session check error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (token: string, role: string) => {
    setAccessToken(token);
    setView(role === 'coach' ? 'coach' : 'athlete');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAccessToken('');
    setView('login');
  };

  const handleSignupSuccess = () => {
    setView('login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-xl text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  if (view === 'signup') {
    return (
      <SignUp
        onSignupSuccess={handleSignupSuccess}
        onSwitchToLogin={() => setView('login')}
      />
    );
  }

  if (view === 'login') {
    return (
      <Login
        onLogin={handleLogin}
        onSwitchToSignup={() => setView('signup')}
      />
    );
  }

  if (view === 'athlete') {
    return (
      <AthleteView
        accessToken={accessToken}
        onLogout={handleLogout}
      />
    );
  }

  if (view === 'coach') {
    return (
      <CoachView
        accessToken={accessToken}
        onLogout={handleLogout}
      />
    );
  }

  return null;
}