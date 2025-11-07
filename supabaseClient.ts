
// This is a placeholder for the actual Supabase client.
// In a real project, you would install `@supabase/supabase-js`
// and initialize it with your project URL and anon key.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dzthyzgsclutgsktumdq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6dGh5emdzY2x1dGdza3R1bWRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1NDQwNjUsImV4cCI6MjA3ODEyMDA2NX0.9JgcbS_xeyiGXBRanT-fp7fScJFzd9oteIlXfJVT6lo';

export const supabase = createClient(supabaseUrl, supabaseKey);