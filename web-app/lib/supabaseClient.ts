import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_anon_key';

// Client สำหรับเรียกใช้งานบน Web Browser (Frontend) - ใช้ Anon Key ร่วมกับ User Session RLS
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
