
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

type TGuestUser = {
  id: string;
  email: string;
  user_metadata: {
    name: string;
  };
};

type TAuthState = {
  user: User | TGuestUser | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loginAsGuest: () => void;
};

const AuthContext = createContext<TAuthState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | TGuestUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadSession = async () => {
      try {
        // Check for guest user first
        const guestUser = localStorage.getItem('guestUser');
        if (guestUser) {
          const parsedUser = JSON.parse(guestUser) as TGuestUser;
          setUser(parsedUser);
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        }

        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          console.log('Auth state changed:', event, session?.user?.id);
          if (session) {
            setUser(session.user);
            setSession(session);
            setIsAuthenticated(true);
          } else {
            setUser(null);
            setSession(null);
            setIsAuthenticated(false);
          }
        });

        // Check for existing session
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setIsAuthenticated(!!currentSession);
        setIsLoading(false);

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error loading auth session:', error);
        setIsLoading(false);
      }
    };

    loadSession();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      toast.success('Logged in successfully');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Failed to login');
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (error) {
        throw error;
      }

      toast.success('Registration successful! Please check your email for confirmation.');
      navigate('/auth?pendingConfirmation=true');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Failed to register');
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Check if user is a guest
      if (user && 'email' in user && user.email === 'guest@example.com') {
        localStorage.removeItem('guestUser');
        setUser(null);
        setIsAuthenticated(false);
        toast.success('Logged out of guest account');
        navigate('/');
        return;
      }

      // Regular user logout
      await supabase.auth.signOut();
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error: any) {
      console.error('Logout error:', error);
      toast.error(error.message || 'Failed to logout');
    }
  };

  const loginAsGuest = () => {
    try {
      const guestUser = {
        id: `guest-${Date.now()}`,
        email: 'guest@example.com',
        user_metadata: {
          name: 'Guest User',
        },
      };
      
      localStorage.setItem('guestUser', JSON.stringify(guestUser));
      setUser(guestUser);
      setIsAuthenticated(true);
      toast.success('Logged in as guest');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Guest login error:', error);
      toast.error(error.message || 'Failed to login as guest');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        loginAsGuest,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
