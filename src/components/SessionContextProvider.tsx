"use client";

import React, { useState, useEffect, createContext, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface SessionContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user || null);
      setLoading(false);

      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        // Redirect authenticated users from login to home
        if (window.location.pathname === '/login') {
          navigate('/');
        }
      } else if (event === 'SIGNED_OUT') {
        // Redirect unauthenticated users to login
        navigate('/login');
        toast.info("Você foi desconectado.");
      } else if (event === 'INITIAL_SESSION') {
        // Handle initial session load
        if (!currentSession && window.location.pathname !== '/login' && !window.location.pathname.startsWith('/portfolio-view') && !window.location.pathname.startsWith('/public-portfolio')) {
          navigate('/login');
        }
      }
    });

    // Fetch initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user || null);
      setLoading(false);
      if (!initialSession && window.location.pathname !== '/login' && !window.location.pathname.startsWith('/portfolio-view') && !window.location.pathname.startsWith('/public-portfolio')) {
        navigate('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <SessionContext.Provider value={{ session, user, loading }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionContextProvider');
  }
  return context;
};