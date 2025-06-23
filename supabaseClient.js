import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const supabaseUrl = "https://wlasebqjtbhtekwnvnxu.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsYXNlYnFqdGJodGVrd252bnh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MzMyMDksImV4cCI6MjA2NjAwOTIwOX0.p61Vw269X724itp-EtR8j03L60pMob35-XnGmqGcF_k";

// Create Supabase client with proper configuration for both web and mobile
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Enable automatic token refresh
    autoRefreshToken: true,
    // Persist session across app restarts
    persistSession: true,
    // For web: detect session in URL (useful for magic links, OAuth, etc.)
    detectSessionInUrl: Platform.OS === "web",
    // Use AsyncStorage for session persistence (works on both web and mobile)
    storage: AsyncStorage,
    // Additional configuration for better session handling
    storageKey: "supabase.auth.token",
    // Set to false to prevent automatic session detection from URL fragments
    // This is useful if you want to handle auth redirects manually
    ...(Platform.OS === "web" && {
      flowType: "pkce", // Use PKCE flow for better security on web
    }),
  },
  // Global options
  global: {
    headers: {
      // Add any custom headers if needed
      "X-Client-Info": Platform.OS === "web" ? "qrush-web" : "qrush-mobile",
    },
  },
  // Database options
  db: {
    schema: "public",
  },
  // Realtime options (if you plan to use realtime features)
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
