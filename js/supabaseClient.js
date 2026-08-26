// js/supabaseClient.js

// Replace these placeholders with your actual Supabase URL and anon key:
const SUPABASE_URL = window.ENV.SUPABASE_URL;
const SUPABASE_ANON_KEY = window.ENV.SUPABASE_ANON_KEY; 

let _supabase = null;

if (typeof supabase !== 'undefined') {
    try {
        _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                flowType: 'pkce',
                // Security: do NOT auto-detect/exchange tokens in the URL. This prevents a
                // password-reset link (or any GET request) from silently creating an active
                // session. Sessions are only established explicitly (e.g. on password form submit).
                detectSessionInUrl: false,
                persistSession: true,
                autoRefreshToken: true
            }
        });
        console.log('SpendTree: Supabase initialized successfully!');
    } catch (err) {
        console.error('SpendTree: Error initializing Supabase:', err);
    }
}