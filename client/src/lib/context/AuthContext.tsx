import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';

// Profile type matching the database structure
export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  job_title: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoadingAuth: boolean;
  isLoadingProfile: boolean;
  signOut: () => Promise<void>;
  setProfileData: (newProfile: Profile) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  const user = session?.user || null;

  const fetchProfile = async (userId: string) => {
    try {
      console.log('🔍 Fetching profile for user:', userId);
      setIsLoadingProfile(true);
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 10000)
      );
      
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      const { data, error } = await Promise.race([profilePromise, timeoutPromise]) as any;

      if (error) {
        console.error('❌ Error fetching profile:', error);
        // Don't set to null immediately - maybe the profile doesn't exist yet
        if (error.code === 'PGRST116') {
          console.log('📝 Profile not found - this might be a new user');
        }
        setProfile(null);
        return;
      }

      console.log('✅ Profile fetched successfully:', data);
      setProfile(data);
    } catch (error) {
      console.error('❌ Error in fetchProfile:', error);
      setProfile(null);
    } finally {
      console.log('🏁 Profile fetch completed, setting loading to false');
      setIsLoadingProfile(false);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const setProfileData = (newProfile: Profile) => {
    console.log('🔄 Updating profile data in context:', newProfile);
    setProfile(newProfile);
  };

  useEffect(() => {
    console.log('🚀 AuthContext initializing...');
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('📋 Initial session check:', { session: !!session, error });
      
      if (error) {
        console.error('❌ Error getting initial session:', error);
      }
      
      setSession(session);
      if (session?.user) {
        console.log('👤 User found in session, fetching profile...');
        fetchProfile(session.user.id);
      } else {
        console.log('👻 No user in session');
      }
      setIsLoadingAuth(false);
      console.log('✅ Auth loading completed');
    }).catch((error) => {
      console.error('❌ Fatal error getting session:', error);
      setIsLoadingAuth(false);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('🔄 Auth state changed:', event, { session: !!newSession });
      
      setSession(newSession);
      
      if (newSession?.user) {
        console.log('👤 New user session, fetching profile...');
        await fetchProfile(newSession.user.id);
      } else {
        console.log('👻 User signed out, clearing profile');
        setProfile(null);
      }
      
      setIsLoadingAuth(false);
      console.log('✅ Auth state change handled');
    });

    return () => {
      console.log('🧹 Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    session,
    user,
    profile,
    isLoadingAuth,
    isLoadingProfile,
    signOut,
    setProfileData,
  };

  console.log('🎯 AuthContext render:', { 
    hasSession: !!session, 
    hasUser: !!user, 
    hasProfile: !!profile, 
    isLoadingAuth, 
    isLoadingProfile 
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 