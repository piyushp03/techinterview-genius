
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginAsGuest: () => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session);
        setSession(session);
        setUser(session?.user ?? null);
        setIsAuthenticated(!!session);
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session);
      setIsLoading(false);
    });

    // Check for guest user in local storage
    const guestUser = localStorage.getItem('guestUser');
    if (guestUser && !user) {
      const parsedUser = JSON.parse(guestUser);
      setUser(parsedUser);
      setIsAuthenticated(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
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
      console.error('Login failed:', error);
      toast.error(error.message || 'Login failed. Please try again.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
          emailRedirectTo: `${window.location.origin}/auth?confirmation=true`,
        },
      });
      
      if (error) {
        throw error;
      }
      
      toast.success('Account created successfully. Please check your email for confirmation link.');
      navigate('/auth?pendingConfirmation=true');
    } catch (error: any) {
      console.error('Registration failed:', error);
      toast.error(error.message || 'Registration failed. Please try again.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsGuest = () => {
    // Create a guest user object that conforms to the User type structure
    // Cast to User since we're intentionally creating a simplified version
    const guestUser = {
      id: `guest-${Date.now()}`,
      email: 'guest@example.com',
      app_metadata: {},
      user_metadata: {
        name: 'Guest User'
      },
      aud: 'guest',
      created_at: new Date().toISOString()
    } as User;
    
    setUser(guestUser);
    setIsAuthenticated(true);
    localStorage.setItem('guestUser', JSON.stringify(guestUser));
    toast.success('Logged in as guest');
    navigate('/dashboard');
  };

  const logout = async () => {
    try {
      // For guest users, just clear local state
      if (user?.email === 'guest@example.com') {
        localStorage.removeItem('guestUser');
        setUser(null);
        setSession(null);
        setIsAuthenticated(false);
      } else {
        // For real users, use Supabase sign out
        await supabase.auth.signOut();
      }
      
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Logout failed. Please try again.');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isAuthenticated,
        login,
        register,
        loginAsGuest,
        logout,
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
