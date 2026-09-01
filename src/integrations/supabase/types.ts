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
      bot_admin_state: {
        Row: {
          action: string
          payload: Json
          telegram_id: number
          updated_at: string
        }
        Insert: {
          action: string
          payload?: Json
          telegram_id: number
          updated_at?: string
        }
        Update: {
          action?: string
          payload?: Json
          telegram_id?: number
          updated_at?: string
        }
        Relationships: []
      }
      bot_admins: {
        Row: {
          created_at: string
          label: string | null
          telegram_id: number
        }
        Insert: {
          created_at?: string
          label?: string | null
          telegram_id: number
        }
        Update: {
          created_at?: string
          label?: string | null
          telegram_id?: number
        }
        Relationships: []
      }
      bot_ads: {
        Row: {
          body: string
          created_at: string
          id: string
          is_active: boolean
          title: string
          url: string | null
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_active?: boolean
          title?: string
          url?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_active?: boolean
          title?: string
          url?: string | null
        }
        Relationships: []
      }
      bot_broadcasts: {
        Row: {
          created_at: string
          failed_count: number
          from_chat_id: number | null
          id: string
          message_id: number | null
          sent_by: number | null
          sent_count: number
        }
        Insert: {
          created_at?: string
          failed_count?: number
          from_chat_id?: number | null
          id?: string
          message_id?: number | null
          sent_by?: number | null
          sent_count?: number
        }
        Update: {
          created_at?: string
          failed_count?: number
          from_chat_id?: number | null
          id?: string
          message_id?: number | null
          sent_by?: number | null
          sent_count?: number
        }
        Relationships: []
      }
      bot_featured_searches: {
        Row: {
          created_at: string
          id: string
          position: number
          query: string
        }
        Insert: {
          created_at?: string
          id?: string
          position?: number
          query: string
        }
        Update: {
          created_at?: string
          id?: string
          position?: number
          query?: string
        }
        Relationships: []
      }
      bot_forced_channels: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          title: string | null
          username: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          title?: string | null
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          title?: string | null
          username?: string
        }
        Relationships: []
      }
      bot_rate_limits: {
        Row: {
          request_count: number
          telegram_user_id: number
          updated_at: string
          window_started_at: string
        }
        Insert: {
          request_count?: number
          telegram_user_id: number
          updated_at?: string
          window_started_at?: string
        }
        Update: {
          request_count?: number
          telegram_user_id?: number
          updated_at?: string
          window_started_at?: string
        }
        Relationships: []
      }
      bot_reports: {
        Row: {
          created_at: string
          id: string
          message: string
          status: string
          telegram_id: number | null
          username: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          status?: string
          telegram_id?: number | null
          username?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          status?: string
          telegram_id?: number | null
          username?: string | null
        }
        Relationships: []
      }
      bot_search_log: {
        Row: {
          category: string
          created_at: string
          id: number
          query: string
          telegram_id: number | null
        }
        Insert: {
          category: string
          created_at?: string
          id?: number
          query: string
          telegram_id?: number | null
        }
        Update: {
          category?: string
          created_at?: string
          id?: number
          query?: string
          telegram_id?: number | null
        }
        Relationships: []
      }
      bot_users: {
        Row: {
          created_at: string
          first_name: string | null
          is_active: boolean
          language: string
          last_seen: string
          telegram_id: number
          username: string | null
        }
        Insert: {
          created_at?: string
          first_name?: string | null
          is_active?: boolean
          language?: string
          last_seen?: string
          telegram_id: number
          username?: string | null
        }
        Update: {
          created_at?: string
          first_name?: string | null
          is_active?: boolean
          language?: string
          last_seen?: string
          telegram_id?: number
          username?: string | null
        }
        Relationships: []
      }
      search_cache: {
        Row: {
          category: string
          channel_name: string | null
          channel_username: string | null
          content_type: string | null
          created_at: string
          expires_at: string
          id: number
          link: string | null
          member_count: number
          message_id: number | null
          message_text: string | null
          search_query: string
        }
        Insert: {
          category: string
          channel_name?: string | null
          channel_username?: string | null
          content_type?: string | null
          created_at?: string
          expires_at?: string
          id?: number
          link?: string | null
          member_count?: number
          message_id?: number | null
          message_text?: string | null
          search_query: string
        }
        Update: {
          category?: string
          channel_name?: string | null
          channel_username?: string | null
          content_type?: string | null
          created_at?: string
          expires_at?: string
          id?: number
          link?: string | null
          member_count?: number
          message_id?: number | null
          message_text?: string | null
          search_query?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bot_top_searches: {
        Args: { _days?: number; _limit?: number }
        Returns: {
          hits: number
          query: string
        }[]
      }
      check_bot_rate_limit: {
        Args: {
          _max_requests?: number
          _user_id: number
          _window_seconds?: number
        }
        Returns: {
          allowed: boolean
          retry_after: number
        }[]
      }
      delete_expired_cache: { Args: never; Returns: number }
      get_cache_stats: {
        Args: never
        Returns: {
          db_size_mb: number
          expired_count: number
          newest_record: string
          oldest_record: string
          total_records: number
          unique_queries: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
