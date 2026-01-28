// Supabase Configuration for OSLAN
// This file contains the Supabase client initialization

const SUPABASE_URL = 'https://zxebhnshrvrdsoddjwpo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4ZWJobnNocnZyZHNvZGRqd3BvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MjYzMjAsImV4cCI6MjA4NTIwMjMyMH0.kPT8E3Tjlsp4xZN5dnQTdBWqRwtEpQqV2GcWhfc4bDo';

// Initialize Supabase client
let supabaseClient = null;

function getSupabaseClient() {
    if (supabaseClient) return supabaseClient;

    // For CDN version, supabase is available on window
    if (typeof window !== 'undefined' && window.supabase) {
        // CDN v2 exposes createClient directly
        if (typeof window.supabase.createClient === 'function') {
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('✅ Supabase client initialized successfully');
            return supabaseClient;
        }
    }

    console.error('❌ Supabase library not loaded. Make sure the SDK script is included before this file.');
    return null;
}

// Auth helper functions
async function signUpUser(email, password, metadata = {}) {
    const client = getSupabaseClient();
    if (!client) {
        return { data: null, error: { message: 'Supabase not initialized' } };
    }

    try {
        const { data, error } = await client.auth.signUp({
            email: email,
            password: password,
            options: {
                data: metadata
            }
        });
        console.log('SignUp result:', { data, error });
        return { data, error };
    } catch (err) {
        console.error('SignUp error:', err);
        return { data: null, error: { message: err.message } };
    }
}

async function signInUser(email, password) {
    const client = getSupabaseClient();
    if (!client) {
        return { data: null, error: { message: 'Supabase not initialized' } };
    }

    try {
        const { data, error } = await client.auth.signInWithPassword({
            email: email,
            password: password
        });
        console.log('SignIn result:', { data, error });
        return { data, error };
    } catch (err) {
        console.error('SignIn error:', err);
        return { data: null, error: { message: err.message } };
    }
}

async function signOutUser() {
    const client = getSupabaseClient();
    if (!client) return { error: { message: 'Supabase not initialized' } };

    const { error } = await client.auth.signOut();
    return { error };
}

async function getCurrentUser() {
    const client = getSupabaseClient();
    if (!client) return null;

    const { data: { user } } = await client.auth.getUser();
    return user;
}

async function isLoggedIn() {
    const user = await getCurrentUser();
    return user !== null;
}

// ===== Admin Helper Functions =====
async function isAdmin() {
    const client = getSupabaseClient();
    if (!client) return false;

    try {
        const { data: { user } } = await client.auth.getUser();
        if (!user) return false;

        const { data: profile } = await client
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        return profile && profile.role === 'admin';
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', getSupabaseClient);
} else {
    getSupabaseClient();
}

