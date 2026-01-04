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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          content: string
          created_at: string
          group_id: string
          id: string
          message_type: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          group_id: string
          id?: string
          message_type?: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          group_id?: string
          id?: string
          message_type?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_read_status: {
        Row: {
          created_at: string
          group_id: string
          id: string
          last_read_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          last_read_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          last_read_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_read_status_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_exercises: {
        Row: {
          category: string
          created_at: string
          id: string
          is_cardio: boolean
          muscle_group: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          is_cardio?: boolean
          muscle_group: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_cardio?: boolean
          muscle_group?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      custom_foods: {
        Row: {
          base_unit: string
          calories: number
          carbs: number
          created_at: string
          fat: number
          id: string
          name: string
          protein: number
          updated_at: string
          user_id: string
        }
        Insert: {
          base_unit?: string
          calories?: number
          carbs?: number
          created_at?: string
          fat?: number
          id?: string
          name: string
          protein?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          base_unit?: string
          calories?: number
          carbs?: number
          created_at?: string
          fat?: number
          id?: string
          name?: string
          protein?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      feedback_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      feedback_upvotes: {
        Row: {
          created_at: string
          feedback_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          feedback_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          feedback_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_upvotes_feedback_id_fkey"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "feedback_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          status: string
          updated_at: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          requester_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      group_join_requests: {
        Row: {
          created_at: string
          group_id: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_join_requests_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          avatar_url: string | null
          created_at: string
          creator_id: string | null
          description: string | null
          id: string
          is_system: boolean
          name: string
          slug: string
          updated_at: string
          visibility: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          creator_id?: string | null
          description?: string | null
          id?: string
          is_system?: boolean
          name: string
          slug: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          creator_id?: string | null
          description?: string | null
          id?: string
          is_system?: boolean
          name?: string
          slug?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: []
      }
      meal_logs: {
        Row: {
          created_at: string
          foods: Json
          id: string
          log_date: string
          meal_type: string
          total_calories: number | null
          total_carbs: number | null
          total_fat: number | null
          total_protein: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          foods?: Json
          id?: string
          log_date?: string
          meal_type: string
          total_calories?: number | null
          total_carbs?: number | null
          total_fat?: number | null
          total_protein?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          foods?: Json
          id?: string
          log_date?: string
          meal_type?: string
          total_calories?: number | null
          total_carbs?: number | null
          total_fat?: number | null
          total_protein?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string | null
          related_content_id: string | null
          related_content_type: string | null
          related_user_id: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          related_content_id?: string | null
          related_content_type?: string | null
          related_user_id?: string | null
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          related_content_id?: string | null
          related_content_type?: string | null
          related_user_id?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          content_data: Json
          content_type: string
          created_at: string
          description: string | null
          id: string
          images: string[] | null
          updated_at: string
          user_id: string
          visibility: string
        }
        Insert: {
          content_data?: Json
          content_type: string
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          updated_at?: string
          user_id: string
          visibility?: string
        }
        Update: {
          content_data?: Json
          content_type?: string
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          updated_at?: string
          user_id?: string
          visibility?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          activity_level: string | null
          avatar_url: string | null
          bio: string | null
          biological_sex: string | null
          birthdate: string | null
          created_at: string
          current_weight: number | null
          daily_calorie_target: number | null
          exercise_frequency: string | null
          first_name: string | null
          goal_weight: number | null
          height_feet: number | null
          height_inches: number | null
          hobbies: string[] | null
          id: string
          last_name: string | null
          onboarding_completed: boolean | null
          primary_goal: string | null
          updated_at: string
          user_id: string
          username: string | null
          weight_loss_rate: string | null
          zip_code: string | null
        }
        Insert: {
          activity_level?: string | null
          avatar_url?: string | null
          bio?: string | null
          biological_sex?: string | null
          birthdate?: string | null
          created_at?: string
          current_weight?: number | null
          daily_calorie_target?: number | null
          exercise_frequency?: string | null
          first_name?: string | null
          goal_weight?: number | null
          height_feet?: number | null
          height_inches?: number | null
          hobbies?: string[] | null
          id?: string
          last_name?: string | null
          onboarding_completed?: boolean | null
          primary_goal?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
          weight_loss_rate?: string | null
          zip_code?: string | null
        }
        Update: {
          activity_level?: string | null
          avatar_url?: string | null
          bio?: string | null
          biological_sex?: string | null
          birthdate?: string | null
          created_at?: string
          current_weight?: number | null
          daily_calorie_target?: number | null
          exercise_frequency?: string | null
          first_name?: string | null
          goal_weight?: number | null
          height_feet?: number | null
          height_inches?: number | null
          hobbies?: string[] | null
          id?: string
          last_name?: string | null
          onboarding_completed?: boolean | null
          primary_goal?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
          weight_loss_rate?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      routine_instances: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          scheduled_date: string
          scheduled_routine_id: string
          scheduled_time: string | null
          status: string
          updated_at: string
          user_id: string
          workout_log_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          scheduled_date: string
          scheduled_routine_id: string
          scheduled_time?: string | null
          status?: string
          updated_at?: string
          user_id: string
          workout_log_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          scheduled_date?: string
          scheduled_routine_id?: string
          scheduled_time?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          workout_log_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "routine_instances_scheduled_routine_id_fkey"
            columns: ["scheduled_routine_id"]
            isOneToOne: false
            referencedRelation: "scheduled_routines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_instances_workout_log_id_fkey"
            columns: ["workout_log_id"]
            isOneToOne: false
            referencedRelation: "workout_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_routines: {
        Row: {
          created_at: string
          day_of_week: string
          end_date: string | null
          id: string
          is_active: boolean
          post_id: string | null
          recurring: string
          routine_data: Json
          routine_name: string
          scheduled_time: string | null
          start_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day_of_week: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          post_id?: string | null
          recurring?: string
          routine_data?: Json
          routine_name: string
          scheduled_time?: string | null
          start_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          day_of_week?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          post_id?: string | null
          recurring?: string
          routine_data?: Json
          routine_name?: string
          scheduled_time?: string | null
          start_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_routines_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      set_muscle_volume: {
        Row: {
          allocated_tonnage: number
          created_at: string
          exercise_name: string
          id: string
          log_date: string
          muscle: string
          primary_group: string
          set_index: number
          user_id: string
          workout_log_id: string
        }
        Insert: {
          allocated_tonnage?: number
          created_at?: string
          exercise_name: string
          id?: string
          log_date: string
          muscle: string
          primary_group: string
          set_index: number
          user_id: string
          workout_log_id: string
        }
        Update: {
          allocated_tonnage?: number
          created_at?: string
          exercise_name?: string
          id?: string
          log_date?: string
          muscle?: string
          primary_group?: string
          set_index?: number
          user_id?: string
          workout_log_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "set_muscle_volume_workout_log_id_fkey"
            columns: ["workout_log_id"]
            isOneToOne: false
            referencedRelation: "workout_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_posts: {
        Row: {
          created_at: string
          id: string
          message: string | null
          post_id: string | null
          recipient_group_id: string | null
          recipient_user_id: string | null
          sender_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          post_id?: string | null
          recipient_group_id?: string | null
          recipient_user_id?: string | null
          sender_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          post_id?: string | null
          recipient_group_id?: string | null
          recipient_user_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_posts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_posts_recipient_group_id_fkey"
            columns: ["recipient_group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      user_streaks: {
        Row: {
          created_at: string
          current_streak: number
          id: string
          last_log_date: string | null
          longest_streak: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          id?: string
          last_log_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          id?: string
          last_log_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      water_logs: {
        Row: {
          created_at: string
          glasses: number
          id: string
          log_date: string
          target_glasses: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          glasses?: number
          id?: string
          log_date?: string
          target_glasses?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          glasses?: number
          id?: string
          log_date?: string
          target_glasses?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      weight_logs: {
        Row: {
          created_at: string
          id: string
          log_date: string
          notes: string | null
          updated_at: string
          user_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          id?: string
          log_date?: string
          notes?: string | null
          updated_at?: string
          user_id: string
          weight: number
        }
        Update: {
          created_at?: string
          id?: string
          log_date?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
          weight?: number
        }
        Relationships: []
      }
      workout_logs: {
        Row: {
          created_at: string
          duration_seconds: number | null
          exercises: Json
          id: string
          log_date: string
          notes: string | null
          photos: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          exercises?: Json
          id?: string
          log_date?: string
          notes?: string | null
          photos?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          exercises?: Json
          id?: string
          log_date?: string
          notes?: string | null
          photos?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_stats: { Args: { target_user_id: string }; Returns: Json }
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
