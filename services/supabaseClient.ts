import { createClient } from '@supabase/supabase-js';

// Supabase Configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file.'
  );
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Database Types (matching our schema)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          username: string;
          password: string;
          role: 'مدير النظام' | 'موظف';
          phone: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      customers: {
        Row: {
          id: string;
          name: string;
          type: 'client' | 'supplier';
          id_number: string;
          phone: string;
          email: string | null;
          address: string | null;
          contact_person: string | null;
          notes: string | null;
          balance: number;
          status: 'نشط' | 'غير نشط' | 'محظور';
          credit_limit: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['customers']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['customers']['Insert']>;
      };
      equipment: {
        Row: {
          id: string;
          name: string;
          serial_number: string;
          category: string;
          brand: string;
          model: string;
          condition: 'جديدة' | 'مستعملة' | 'ممتازة';
          type: 'مملوكة' | 'خارجية';
          status: 'متاحة' | 'محجوزة' | 'صيانة' | 'خارج الخدمة';
          daily_rate: number;
          weekly_rate: number | null;
          monthly_rate: number | null;
          image: string | null;
          supplier_name: string | null;
          supplier_cost: number | null;
          supplier_agreement: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['equipment']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['equipment']['Insert']>;
      };
      bookings: {
        Row: {
          id: string;
          customer_id: string;
          customer_name: string;
          start_date: string;
          end_date: string;
          total_amount: number;
          paid_amount: number;
          deposit: number;
          status: 'قيد الانتظار' | 'نشط' | 'مكتمل' | 'ملغي';
          notes: string | null;
          created_at: string;
          created_by: string | null;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['bookings']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['bookings']['Insert']>;
      };
      booking_items: {
        Row: {
          id: number;
          booking_id: string;
          equipment_id: string;
          equipment_name: string;
          daily_rate: number;
          days: number;
          total: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['booking_items']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['booking_items']['Insert']>;
      };
      transactions: {
        Row: {
          id: string;
          customer_id: string;
          booking_id: string | null;
          date: string;
          amount: number;
          type: 'Payment' | 'Invoice' | 'Refund';
          description: string;
          method: 'نقدي' | 'تحويل بنكي' | 'آجل' | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['transactions']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['transactions']['Insert']>;
      };
    };
  };
}

export type User = Database['public']['Tables']['users']['Row'];
export type Customer = Database['public']['Tables']['customers']['Row'];
export type Equipment = Database['public']['Tables']['equipment']['Row'];
export type Booking = Database['public']['Tables']['bookings']['Row'];
export type BookingItem = Database['public']['Tables']['booking_items']['Row'];
export type Transaction = Database['public']['Tables']['transactions']['Row'];
