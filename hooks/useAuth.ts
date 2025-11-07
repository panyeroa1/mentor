
import React, { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { supabase } from '../supabaseClient';
import type { Profile, UserRole } from '../types';
import type { Session } from '@supabase/supabase-js';


interface AuthContextType {
    user: Profile | null;
    session: Session | null;
    login: (email: string, password: string) => Promise<any>;
    signup: (email: string, password: string, fullName: string, role: UserRole) => Promise<any>;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<Profile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            if (session?.user) {
                const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
                setUser(profile as Profile);
            }
            setLoading(false);
        };
        getSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                setSession(session);
                 if (session?.user) {
                    const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
                    setUser(profile as Profile);
                } else {
                    setUser(null);
                }
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const login = async (email: string, password: string) => {
        return supabase.auth.signInWithPassword({ email, password });
    };

    const signup = async (email: string, password: string, fullName: string, role: UserRole) => {
        const { data: authData, error: authError } = await supabase.auth.signUp({ 
            email, 
            password
        });
        
        if (authError) return { user: null, error: authError };

        if (authData.user) {
            const { error: profileError } = await supabase.from('profiles').insert({
                id: authData.user.id,
                full_name: fullName,
                role,
            });
            return { user: authData.user, error: profileError };
        }
        return { user: null, error: new Error('User not created') };
    };


    const logout = () => {
        supabase.auth.signOut();
        setUser(null);
        setSession(null);
    };

    const value = {
        user,
        session,
        login,
        signup,
        logout,
        loading,
    };

    // FIX: A .ts file cannot contain JSX. Rewriting with React.createElement to solve parsing errors.
    return React.createElement(AuthContext.Provider, { value: value }, children);
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};