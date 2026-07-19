import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

// إذا لم تُضبط المتغيّرات، يعمل التطبيق في وضع تجريبي (بيانات وهمية بلا حفظ)
export const hasSupabase = Boolean(url && key);
export const supabase = hasSupabase ? createClient(url, key) : null;
