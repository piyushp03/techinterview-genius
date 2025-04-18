
import React, { createContext, useState, useEffect, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  setSession: (session: Session | null) => void;
  loading: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  loginAsGuest: () => Promise<void>;
}

// Create AuthContext
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      } catch (error: any) {
        console.error('Error getting session:', error.message);
        setSession(null);
        setUser(null);
        setLoading(false);
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    getSession();
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (error: any) {
      console.error("Login failed:", error.message);
      toast.error(`Login failed: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, name?: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });
      
      if (error) throw error;
      
      if (data.user) {
        setUser(data.user);
        toast.success("Signup successful! Please check your email to verify your account.");
      }
    } catch (error: any) {
      console.error("Signup failed:", error.message);
      toast.error(`Signup failed: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });
      
      if (error) throw error;
      
      if (data.user) {
        setUser(data.user);
        toast.success("Registration successful! Please check your email to verify your account.");
      }
    } catch (error: any) {
      console.error("Registration failed:", error.message);
      toast.error(`Registration failed: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginAsGuest = async () => {
    setLoading(true);
    try {
      // Generate a unique guest ID using UUID to prevent the "invalid UUID" error
      const guestId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      
      const guestEmail = `guest_${guestId}@example.com`;
      const guestPassword = `guest${guestId}`;
      
      // Try to create a new guest account
      const { data, error } = await supabase.auth.signUp({
        email: guestEmail,
        password: guestPassword,
        options: {
          data: {
            name: `Guest User`,
            is_guest: true,
          },
        },
      });
      
      if (error) {
        // If signup fails, try to sign in directly (this is a fallback)
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: 'guest@example.com',
          password: 'guestpassword',
        });
        
        if (signInError) throw signInError;
      } else {
        // If signup succeeds, immediately sign in with the created credentials
        if (data.user) {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: guestEmail,
            password: guestPassword,
          });
          
          if (signInError) throw signInError;
        }
      }
      
      toast.success("Signed in as guest");
    } catch (error: any) {
      console.error("Guest login failed:", error.message);
      toast.error(`Guest login failed: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Logged out successfully");
    } catch (error: any) {
      console.error("Logout failed:", error.message);
      toast.error(`Logout failed: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (error) throw error;
      toast.success("Password reset email sent");
    } catch (error: any) {
      console.error("Password reset failed:", error.message);
      toast.error(`Password reset failed: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    setSession,
    loading,
    isLoading: loading,
    isAuthenticated: !!session,
    login,
    signup,
    register,
    logout,
    resetPassword,
    loginAsGuest,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
