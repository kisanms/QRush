import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://wlasebqjtbhtekwnvnxu.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsYXNlYnFqdGJodGVrd252bnh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MzMyMDksImV4cCI6MjA2NjAwOTIwOX0.p61Vw269X724itp-EtR8j03L60pMob35-XnGmqGcF_k";
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
