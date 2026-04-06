import { createClient } from '@supabase/supabase-js';

const globalForSupabase = globalThis as unknown as {
  supabase: ReturnType<typeof createClient> | undefined;
};

export const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return null;
  }

  if (process.env.NODE_ENV === 'production') {
    return createClient(supabaseUrl, supabaseServiceRoleKey);
  }

  if (!globalForSupabase.supabase) {
    globalForSupabase.supabase = createClient(
      supabaseUrl,
      supabaseServiceRoleKey,
    );
  }

  return globalForSupabase.supabase;
};
