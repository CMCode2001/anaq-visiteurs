/**
 * Typage du schéma PostgreSQL exposé par Supabase.
 *
 * Ce fichier peut être régénéré à tout moment avec :
 *   npx supabase gen types typescript --project-id <ref> > src/types/database.ts
 *
 * Il est maintenu à la main ici pour éviter une dépendance à la CLI Supabase
 * lors du premier démarrage du projet.
 */

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
      visitors: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          country: string;
          phone: string;
          email: string | null;
          formation_requested: string;
          establishment: string | null;
          consent_given: boolean;
          consent_date: string | null;
          consent_version: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          first_name: string;
          last_name: string;
          country: string;
          phone: string;
          email?: string | null;
          formation_requested: string;
          establishment: string | null;
          consent_given: boolean;
          consent_date?: string | null;
          consent_version?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["visitors"]["Insert"]>;
        Relationships: [];
      };
      admin_users: {
        Row: {
          user_id: string;
          email: string | null;
          full_name: string | null;
          role: "admin" | "super_admin";
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          user_id: string;
          email?: string | null;
          full_name?: string | null;
          role?: "admin" | "super_admin";
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["admin_users"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: { uid?: string };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
