export type PlanStatus = 'active' | 'completed' | 'cancelled' | 'expired';

export type CutStatus =
  | 'pending'
  | 'completed'
  | 'rescheduled'
  | 'missed'
  | 'cancelled';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };

      clients: {
        Row: {
          id: string;
          barber_id: string;
          full_name: string;
          phone: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          barber_id: string;
          full_name: string;
          phone?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          barber_id?: string;
          full_name?: string;
          phone?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      plans: {
        Row: {
          id: string;
          client_id: string;
          barber_id: string;
          token: string;
          status: PlanStatus;
          total_cuts: number;
          remaining_cuts: number;
          paid: boolean;
          payment_amount: number | null;
          payment_date: string | null;
          start_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          barber_id: string;
          token?: string;
          status?: PlanStatus;
          total_cuts?: number;
          remaining_cuts?: number;
          paid?: boolean;
          payment_amount?: number | null;
          payment_date?: string | null;
          start_date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          barber_id?: string;
          token?: string;
          status?: PlanStatus;
          total_cuts?: number;
          remaining_cuts?: number;
          paid?: boolean;
          payment_amount?: number | null;
          payment_date?: string | null;
          start_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      cuts: {
        Row: {
          id: string;
          plan_id: string;
          client_id: string;
          barber_id: string;
          cut_number: number;
          scheduled_date: string;
          original_scheduled_date: string;
          completed_at: string | null;
          status: CutStatus;
          reschedule_count_applied: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          plan_id: string;
          client_id: string;
          barber_id: string;
          cut_number: number;
          scheduled_date: string;
          original_scheduled_date: string;
          completed_at?: string | null;
          status?: CutStatus;
          reschedule_count_applied?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          plan_id?: string;
          client_id?: string;
          barber_id?: string;
          cut_number?: number;
          scheduled_date?: string;
          original_scheduled_date?: string;
          completed_at?: string | null;
          status?: CutStatus;
          reschedule_count_applied?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      reschedules: {
        Row: {
          id: string;
          plan_id: string;
          cut_id: string;
          barber_id: string;
          old_date: string;
          new_date: string;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          plan_id: string;
          cut_id: string;
          barber_id: string;
          old_date: string;
          new_date: string;
          reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          plan_id?: string;
          cut_id?: string;
          barber_id?: string;
          old_date?: string;
          new_date?: string;
          reason?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };

      activity_log: {
        Row: {
          id: string;
          barber_id: string;
          client_id: string | null;
          plan_id: string | null;
          cut_id: string | null;
          action_type: string;
          description: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          barber_id: string;
          client_id?: string | null;
          plan_id?: string | null;
          cut_id?: string | null;
          action_type: string;
          description: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          barber_id?: string;
          client_id?: string | null;
          plan_id?: string | null;
          cut_id?: string | null;
          action_type?: string;
          description?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}