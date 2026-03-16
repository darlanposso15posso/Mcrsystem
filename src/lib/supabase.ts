import { createClient } from '@supabase/supabase-js';

import { supabaseToken } from './supabaseToken';

// Capture BEFORE createClient runs (Supabase clears the hash after processing)
export const isOAuthCallback =
    typeof window !== 'undefined' &&
    (window.location.hash.includes('access_token') ||
        window.location.hash.includes('error_description'));

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    console.warn(
        '[supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not set.\n' +
        'Add them to .env.local to connect to the database.'
    );
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        flowType: 'implicit',
    },
    global: {
        fetch: async (url, options: any = {}) => {
            const headers = new Headers(options.headers);
            if (supabaseToken) {
                headers.set('Authorization', `Bearer ${supabaseToken}`);
            }
            return fetch(url, { ...options, headers });
        },
    },
});
