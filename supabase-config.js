// Supabase Configuration for OSLAN
// This file contains the Supabase client initialization

const SUPABASE_URL = 'https://zxebhnshrvrdsoddjwpo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4ZWJobnNocnZyZHNvZGRqd3BvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MjYzMjAsImV4cCI6MjA4NTIwMjMyMH0.kPT8E3Tjlsp4xZN5dnQTdBWqRwtEpQqV2GcWhfc4bDo';

// Initialize Supabase client (requires supabase-js to be loaded first)
let supabase;

function initSupabase() {
    if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase client initialized successfully');
        return supabase;
    } else {
        console.error('Supabase library not loaded');
        return null;
    }
}

// Auth helper functions
async function signUpUser(email, password, metadata = {}) {
    if (!supabase) initSupabase();

    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
            data: metadata // For storing first name, last name, etc.
        }
    });

    return { data, error };
}

async function signInUser(email, password) {
    if (!supabase) initSupabase();

    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    });

    return { data, error };
}

async function signOutUser() {
    if (!supabase) initSupabase();

    const { error } = await supabase.auth.signOut();
    return { error };
}

async function getCurrentUser() {
    if (!supabase) initSupabase();

    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

// Check if user is logged in
async function isLoggedIn() {
    const user = await getCurrentUser();
    return user !== null;
}

// Initialize on script load
document.addEventListener('DOMContentLoaded', () => {
    initSupabase();
});
