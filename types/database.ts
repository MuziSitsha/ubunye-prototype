export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      help_requests: {
        Row: {
          created_at: string
          id: string
          message: string | null
          status: string
          topic: string
          user_id: string
          venture_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          status?: string
          topic: string
          user_id: string
          venture_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          status?: string
          topic?: string
          user_id?: string
          venture_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "help_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "help_requests_venture_id_fkey"
            columns: ["venture_id"]
            isOneToOne: false
            referencedRelation: "ventures"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_programmes: {
        Row: {
          created_at: string
          duration: string
          format: string
          id: string
          is_demo_data: boolean
          provider: string
          reason: string
          skill_id: string | null
          title: string
          url: string | null
        }
        Insert: {
          created_at?: string
          duration: string
          format: string
          id?: string
          is_demo_data?: boolean
          provider: string
          reason: string
          skill_id?: string | null
          title: string
          url?: string | null
        }
        Update: {
          created_at?: string
          duration?: string
          format?: string
          id?: string
          is_demo_data?: boolean
          provider?: string
          reason?: string
          skill_id?: string | null
          title?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_programmes_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          category: string
          created_at: string
          customer_segment: string
          demand_score: number
          demand_summary: string
          description: string
          estimated_startup_level: string
          geography: string
          id: string
          market_signal: string
          name: string
          prototype_only: boolean
          why_now: string
        }
        Insert: {
          category: string
          created_at?: string
          customer_segment: string
          demand_score: number
          demand_summary: string
          description: string
          estimated_startup_level: string
          geography?: string
          id?: string
          market_signal: string
          name: string
          prototype_only?: boolean
          why_now: string
        }
        Update: {
          category?: string
          created_at?: string
          customer_segment?: string
          demand_score?: number
          demand_summary?: string
          description?: string
          estimated_startup_level?: string
          geography?: string
          id?: string
          market_signal?: string
          name?: string
          prototype_only?: boolean
          why_now?: string
        }
        Relationships: []
      }
      opportunity_resources: {
        Row: {
          id: string
          opportunity_id: string
          requirement_type: string
          resource_id: string
        }
        Insert: {
          id?: string
          opportunity_id: string
          requirement_type: string
          resource_id: string
        }
        Update: {
          id?: string
          opportunity_id?: string
          requirement_type?: string
          resource_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_resources_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_resources_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_skills: {
        Row: {
          id: string
          opportunity_id: string
          requirement_type: string
          skill_id: string
        }
        Insert: {
          id?: string
          opportunity_id: string
          requirement_type: string
          skill_id: string
        }
        Update: {
          id?: string
          opportunity_id?: string
          requirement_type?: string
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_skills_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          availability: string | null
          city: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          is_demo_persona: boolean
          last_name: string
          mobile_number: string | null
          onboarding_completed_at: string | null
          province: string | null
          situation: string | null
          skills_confirmed_at: string | null
          updated_at: string
        }
        Insert: {
          availability?: string | null
          city?: string | null
          created_at?: string
          email: string
          first_name: string
          id: string
          is_demo_persona?: boolean
          last_name: string
          mobile_number?: string | null
          onboarding_completed_at?: string | null
          province?: string | null
          situation?: string | null
          skills_confirmed_at?: string | null
          updated_at?: string
        }
        Update: {
          availability?: string | null
          city?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          is_demo_persona?: boolean
          last_name?: string
          mobile_number?: string | null
          onboarding_completed_at?: string | null
          province?: string | null
          situation?: string | null
          skills_confirmed_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      recommendations: {
        Row: {
          candidate_user_id: string | null
          components: Json
          created_at: string
          id: string
          kind: string
          opportunity_id: string | null
          subject_user_id: string
          team_id: string | null
          total: number
        }
        Insert: {
          candidate_user_id?: string | null
          components: Json
          created_at?: string
          id?: string
          kind: string
          opportunity_id?: string | null
          subject_user_id: string
          team_id?: string | null
          total: number
        }
        Update: {
          candidate_user_id?: string | null
          components?: Json
          created_at?: string
          id?: string
          kind?: string
          opportunity_id?: string | null
          subject_user_id?: string
          team_id?: string | null
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "recommendations_candidate_user_id_fkey"
            columns: ["candidate_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendations_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendations_subject_user_id_fkey"
            columns: ["subject_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          category: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      skills: {
        Row: {
          category: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      support_programmes: {
        Row: {
          amount_range: string
          category: string
          closing_date: string | null
          created_at: string
          description: string
          id: string
          is_demo_data: boolean
          programme_name: string
          provider: string
          support_type: string
          typical_eligibility: string
        }
        Insert: {
          amount_range: string
          category: string
          closing_date?: string | null
          created_at?: string
          description: string
          id?: string
          is_demo_data?: boolean
          programme_name: string
          provider: string
          support_type: string
          typical_eligibility: string
        }
        Update: {
          amount_range?: string
          category?: string
          closing_date?: string | null
          created_at?: string
          description?: string
          id?: string
          is_demo_data?: boolean
          programme_name?: string
          provider?: string
          support_type?: string
          typical_eligibility?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          id: string
          joined_at: string
          role: string | null
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role?: string | null
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role?: string | null
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          opportunity_id: string | null
          status: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
          opportunity_id?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          opportunity_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      user_resources: {
        Row: {
          created_at: string
          id: string
          resource_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          resource_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          resource_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_resources_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_resources_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_skills: {
        Row: {
          confidence: number | null
          created_at: string
          experience_level: string | null
          id: string
          skill_id: string
          source: string
          user_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          experience_level?: string | null
          id?: string
          skill_id: string
          source?: string
          user_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          experience_level?: string | null
          id?: string
          skill_id?: string
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_skills_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      venture_stages: {
        Row: {
          completed_at: string | null
          id: string
          order_index: number
          stage: string
          status: string
          venture_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          order_index: number
          stage: string
          status?: string
          venture_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          order_index?: number
          stage?: string
          status?: string
          venture_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venture_stages_venture_id_fkey"
            columns: ["venture_id"]
            isOneToOne: false
            referencedRelation: "ventures"
            referencedColumns: ["id"]
          },
        ]
      }
      ventures: {
        Row: {
          business_concept: Json
          created_at: string
          current_stage: string
          customer: Json
          id: string
          launched_at: string | null
          money: Json
          name: string
          operations: Json
          opportunity_id: string
          readiness_checklist: Json
          readiness_score: number
          team_id: string
          updated_at: string
        }
        Insert: {
          business_concept?: Json
          created_at?: string
          current_stage?: string
          customer?: Json
          id?: string
          launched_at?: string | null
          money?: Json
          name: string
          operations?: Json
          opportunity_id: string
          readiness_checklist?: Json
          readiness_score?: number
          team_id: string
          updated_at?: string
        }
        Update: {
          business_concept?: Json
          created_at?: string
          current_stage?: string
          customer?: Json
          id?: string
          launched_at?: string | null
          money?: Json
          name?: string
          operations?: Json
          opportunity_id?: string
          readiness_checklist?: Json
          readiness_score?: number
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ventures_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ventures_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: true
            referencedRelation: "teams"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

