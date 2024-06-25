// export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
//   // auth: {
//   // persistSession: true,
//   // storageKey: "CustomApp",
//   // storage: window.localStorage,
//   // flowType: "pkce",
//   // },
// });

import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      flowType: "pkce",
      autoRefreshToken: true,
      storage: window.localStorage,
      detectSessionInUrl: true,
    },
  });
}
