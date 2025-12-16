import { createClient } from '@supabase/supabase-js';

// Using the credentials found in lib/supabase.ts
const SUPABASE_URL = 'https://gljttvvdiqkxgrlgzuom.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_TOLW2pjWxZGCf8elcOZTzA_zxkGpTgW';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
    console.log('Testing connection...');
    try {
        // 1. Test Auth (usually easiest to check if key is valid format)
        const { data: authData, error: authError } = await supabase.auth.getSession();
        if (authError) {
            console.error('Auth check failed:', authError.message);
        } else {
            console.log('Auth check passed (Session fetched).');
        }

        // 2. Test DB Access (reading public table)
        // We saw 'tasks' table usage in code
        const { data, error: dbError } = await supabase.from('tasks').select('*').limit(1);

        if (dbError) {
            console.error('Database check failed:', dbError.message);
            if (dbError.code) console.error('Error Code:', dbError.code);
        } else {
            console.log('Database check passed. Tasks found:', data.length);
        }

    } catch (err) {
        console.error('Unexpected script error:', err);
    }
}

testConnection();
