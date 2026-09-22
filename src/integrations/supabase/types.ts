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
    PostgrestVersion: "14.5"
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
          event_date: string | null
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
          event_date?: string | null
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
          event_date?: string | null
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
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
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
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          preferences: Json | null
          school_level: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          preferences?: Json | null
          school_level?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
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
      quiz_debug_runs: {
        Row: {
          candidate_questions_count: number | null
          created_at: string
          error: string | null
          final_questions: Json
          id: string
          merge_used: boolean
          note_id: string | null
          original_bytes: number | null
          req_id: string
          segments: Json
          segments_count: number | null
          source_kind: string | null
          source_mime: string | null
          subject_id: string | null
          total_duration_ms: number | null
          user_id: string
        }
        Insert: {
          candidate_questions_count?: number | null
          created_at?: string
          error?: string | null
          final_questions?: Json
          id?: string
          merge_used?: boolean
          note_id?: string | null
          original_bytes?: number | null
          req_id: string
          segments?: Json
          segments_count?: number | null
          source_kind?: string | null
          source_mime?: string | null
          subject_id?: string | null
          total_duration_ms?: number | null
          user_id: string
        }
        Update: {
          candidate_questions_count?: number | null
          created_at?: string
          error?: string | null
          final_questions?: Json
          id?: string
          merge_used?: boolean
          note_id?: string | null
          original_bytes?: number | null
          req_id?: string
          segments?: Json
          segments_count?: number | null
          source_kind?: string | null
          source_mime?: string | null
          subject_id?: string | null
          total_duration_ms?: number | null
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
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
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
      timeline_tasks: {
        Row: {
          category: string
          color: string | null
          completed: boolean | null
          created_at: string | null
          estimated_duration: number
          icon: string | null
          id: string
          note: string | null
          priority: string | null
          scheduled_at: string
          title: string
          user_id: string
        }
        Insert: {
          category?: string
          color?: string | null
          completed?: boolean | null
          created_at?: string | null
          estimated_duration: number
          icon?: string | null
          id?: string
          note?: string | null
          priority?: string | null
          scheduled_at: string
          title: string
          user_id: string
        }
        Update: {
          category?: string
          color?: string | null
          completed?: boolean | null
          created_at?: string | null
          estimated_duration?: number
          icon?: string | null
          id?: string
          note?: string | null
          priority?: string | null
          scheduled_at?: string
          title?: string
          user_id?: string
        }
        Relationships: []
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
      daily_sync_calendar: { Args: never; Returns: undefined }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_active_subscription: { Args: { _user_id: string }; Returns: boolean }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
