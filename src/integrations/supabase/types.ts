export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      academic_years: {
        Row: {
          created_at: string
          end_date: string
          id: string
          is_current: boolean | null
          name: string
          start_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          is_current?: boolean | null
          name: string
          start_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          is_current?: boolean | null
          name?: string
          start_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          event_type: Database["public"]["Enums"]["event_type"]
          exam_date: string | null
          external_id: string | null
          id: string
          room_number: string | null
          start_time: string
          subject_id: string | null
          teacher_name: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          event_type?: Database["public"]["Enums"]["event_type"]
          exam_date?: string | null
          external_id?: string | null
          id?: string
          room_number?: string | null
          start_time: string
          subject_id?: string | null
          teacher_name?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          event_type?: Database["public"]["Enums"]["event_type"]
          exam_date?: string | null
          external_id?: string | null
          id?: string
          room_number?: string | null
          start_time?: string
          subject_id?: string | null
          teacher_name?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcards: {
        Row: {
          answer: string
          created_at: string
          id: string
          image_prompt: string | null
          image_url: string | null
          last_reviewed_at: string | null
          mastered: boolean
          note_id: string | null
          question: string
          review_count: number
          subject_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          image_prompt?: string | null
          image_url?: string | null
          last_reviewed_at?: string | null
          mastered?: boolean
          note_id?: string | null
          question: string
          review_count?: number
          subject_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          image_prompt?: string | null
          image_url?: string | null
          last_reviewed_at?: string | null
          mastered?: boolean
          note_id?: string | null
          question?: string
          review_count?: number
          subject_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes_vault"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flashcards_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      notes_vault: {
        Row: {
          ai_summary: string | null
          created_at: string
          event_id: string | null
          id: string
          media_url: string | null
          raw_text: string | null
          subject_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_summary?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          media_url?: string | null
          raw_text?: string | null
          subject_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_summary?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          media_url?: string | null
          raw_text?: string | null
          subject_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_vault_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_vault_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          preferences: Json | null
          school_level: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          preferences?: Json | null
          school_level?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          preferences?: Json | null
          school_level?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      semesters: {
        Row: {
          academic_year_id: string | null
          created_at: string
          end_date: string
          id: string
          is_current: boolean | null
          name: string
          start_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          academic_year_id?: string | null
          created_at?: string
          end_date: string
          id?: string
          is_current?: boolean | null
          name: string
          start_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          academic_year_id?: string | null
          created_at?: string
          end_date?: string
          id?: string
          is_current?: boolean | null
          name?: string
          start_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "semesters_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          color_key: string
          created_at: string
          ical_code: string | null
          icon: string
          id: string
          name: string
          teacher_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color_key?: string
          created_at?: string
          ical_code?: string | null
          icon?: string
          id?: string
          name: string
          teacher_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color_key?: string
          created_at?: string
          ical_code?: string | null
          icon?: string
          id?: string
          name?: string
          teacher_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          created_at: string
          due_date: string | null
          energy_level: Database["public"]["Enums"]["energy_level"]
          id: string
          is_subtask: boolean
          linked_note_id: string | null
          parent_task_id: string | null
          priority_score: number
          status: Database["public"]["Enums"]["task_status"]
          subject_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          due_date?: string | null
          energy_level?: Database["public"]["Enums"]["energy_level"]
          id?: string
          is_subtask?: boolean
          linked_note_id?: string | null
          parent_task_id?: string | null
          priority_score?: number
          status?: Database["public"]["Enums"]["task_status"]
          subject_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          due_date?: string | null
          energy_level?: Database["public"]["Enums"]["energy_level"]
          id?: string
          is_subtask?: boolean
          linked_note_id?: string | null
          parent_task_id?: string | null
          priority_score?: number
          status?: Database["public"]["Enums"]["task_status"]
          subject_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_linked_note_id_fkey"
            columns: ["linked_note_id"]
            isOneToOne: false
            referencedRelation: "notes_vault"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          campus_latitude: number | null
          campus_longitude: number | null
          campus_name: string | null
          campus_radius_meters: number | null
          created_at: string
          ical_filter_group: string | null
          ical_url: string | null
          id: string
          last_synced_at: string | null
          sync_enabled: boolean
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          campus_latitude?: number | null
          campus_longitude?: number | null
          campus_name?: string | null
          campus_radius_meters?: number | null
          created_at?: string
          ical_filter_group?: string | null
          ical_url?: string | null
          id?: string
          last_synced_at?: string | null
          sync_enabled?: boolean
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          campus_latitude?: number | null
          campus_longitude?: number | null
          campus_name?: string | null
          campus_radius_meters?: number | null
          created_at?: string
          ical_filter_group?: string | null
          ical_url?: string | null
          id?: string
          last_synced_at?: string | null
          sync_enabled?: boolean
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vault_files: {
        Row: {
          ai_confidence: number | null
          ai_detected_subject: string | null
          ai_summary: string | null
          capture_latitude: number | null
          capture_longitude: number | null
          created_at: string
          extracted_text: string | null
          file_type: string | null
          file_url: string
          filing_status: string | null
          id: string
          original_filename: string | null
          semester_id: string | null
          subject_id: string | null
          tags: string[] | null
          thumbnail_url: string | null
          updated_at: string
          user_id: string
          was_on_campus: boolean | null
        }
        Insert: {
          ai_confidence?: number | null
          ai_detected_subject?: string | null
          ai_summary?: string | null
          capture_latitude?: number | null
          capture_longitude?: number | null
          created_at?: string
          extracted_text?: string | null
          file_type?: string | null
          file_url: string
          filing_status?: string | null
          id?: string
          original_filename?: string | null
          semester_id?: string | null
          subject_id?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          updated_at?: string
          user_id: string
          was_on_campus?: boolean | null
        }
        Update: {
          ai_confidence?: number | null
          ai_detected_subject?: string | null
          ai_summary?: string | null
          capture_latitude?: number | null
          capture_longitude?: number | null
          created_at?: string
          extracted_text?: string | null
          file_type?: string | null
          file_url?: string
          filing_status?: string | null
          id?: string
          original_filename?: string | null
          semester_id?: string | null
          subject_id?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          updated_at?: string
          user_id?: string
          was_on_campus?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "vault_files_semester_id_fkey"
            columns: ["semester_id"]
            isOneToOne: false
            referencedRelation: "semesters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_files_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_filing_history: {
        Row: {
          ai_suggested_subject_id: string | null
          context_data: Json | null
          created_at: string
          file_id: string | null
          final_subject_id: string | null
          id: string
          user_id: string
          was_correct: boolean | null
        }
        Insert: {
          ai_suggested_subject_id?: string | null
          context_data?: Json | null
          created_at?: string
          file_id?: string | null
          final_subject_id?: string | null
          id?: string
          user_id: string
          was_correct?: boolean | null
        }
        Update: {
          ai_suggested_subject_id?: string | null
          context_data?: Json | null
          created_at?: string
          file_id?: string | null
          final_subject_id?: string | null
          id?: string
          user_id?: string
          was_correct?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "vault_filing_history_ai_suggested_subject_id_fkey"
            columns: ["ai_suggested_subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_filing_history_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "vault_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_filing_history_final_subject_id_fkey"
            columns: ["final_subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      energy_level: "low" | "medium" | "high"
      event_type: "class" | "exam"
      task_status: "todo" | "done"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      energy_level: ["low", "medium", "high"],
      event_type: ["class", "exam"],
      task_status: ["todo", "done"],
    },
  },
} as const
