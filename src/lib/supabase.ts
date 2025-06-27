import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY!;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key:', supabaseAnonKey ? 'Present' : 'Missing');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Helper function to get IP hash for anonymous voting
export const getIpHash = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    // Simple hash function for IP (in production, use a proper hash)
    return btoa(data.ip).replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
  } catch (error) {
    console.error('Failed to get IP:', error);
    // Fallback to random string
    return Math.random().toString(36).substring(2, 12);
  }
};

// Database types for better TypeScript support
export type Database = {
  public: {
    Tables: {
      polls: {
        Row: {
          id: string;
          question: string;
          options: any;
          settings: any;
          created_by: string;
          created_at: string;
          ends_at: string | null;
          total_votes: number;
          is_active: boolean;
        };
        Insert: {
          question: string;
          options: any;
          settings: any;
          created_by: string;
          ends_at?: string | null;
        };
        Update: {
          question?: string;
          options?: any;
          settings?: any;
          ends_at?: string | null;
          is_active?: boolean;
        };
      };
      votes: {
        Row: {
          id: string;
          poll_id: string;
          user_id: string | null;
          ip_hash: string | null;
          selected_options: string[];
          created_at: string;
        };
        Insert: {
          poll_id: string;
          user_id?: string | null;
          ip_hash?: string | null;
          selected_options: string[];
        };
        Update: {
          selected_options?: string[];
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          created_polls_count: number;
        };
        Insert: {
          id: string;
          email: string;
        };
        Update: {
          created_polls_count?: number;
        };
      };
    };
  };
}; 