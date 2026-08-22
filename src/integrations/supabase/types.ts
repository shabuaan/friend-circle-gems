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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      birthday_wishes: {
        Row: {
          created_at: string
          friend_id: string
          id: string
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          user_id: string
          year: number
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "birthday_wishes_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "friends"
            referencedColumns: ["id"]
          },
        ]
      }
      circle_invites: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          circle_id: string
          created_at: string
          expires_at: string
          id: string
          invited_email: string | null
          owner_id: string
          status: string
          token: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          circle_id: string
          created_at?: string
          expires_at?: string
          id?: string
          invited_email?: string | null
          owner_id: string
          status?: string
          token: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          circle_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          invited_email?: string | null
          owner_id?: string
          status?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "circle_invites_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "circles"
            referencedColumns: ["id"]
          },
        ]
      }
      circle_members: {
        Row: {
          circle_id: string
          created_at: string
          friend_id: string
          id: string
          user_id: string
        }
        Insert: {
          circle_id: string
          created_at?: string
          friend_id: string
          id?: string
          user_id: string
        }
        Update: {
          circle_id?: string
          created_at?: string
          friend_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "circle_members_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "circles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "circle_members_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "friends"
            referencedColumns: ["id"]
          },
        ]
      }
      circle_shares: {
        Row: {
          circle_id: string
          created_at: string
          id: string
          owner_id: string
          shared_with_user_id: string
        }
        Insert: {
          circle_id: string
          created_at?: string
          id?: string
          owner_id: string
          shared_with_user_id: string
        }
        Update: {
          circle_id?: string
          created_at?: string
          id?: string
          owner_id?: string
          shared_with_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "circle_shares_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "circles"
            referencedColumns: ["id"]
          },
        ]
      }
      circles: {
        Row: {
          color: string
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      duplicate_dismissals: {
        Row: {
          created_at: string
          friend_a: string
          friend_b: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_a: string
          friend_b: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_a?: string
          friend_b?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "duplicate_dismissals_friend_a_fkey"
            columns: ["friend_a"]
            isOneToOne: false
            referencedRelation: "friends"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duplicate_dismissals_friend_b_fkey"
            columns: ["friend_b"]
            isOneToOne: false
            referencedRelation: "friends"
            referencedColumns: ["id"]
          },
        ]
      }
      friend_interests: {
        Row: {
          created_at: string
          friend_id: string
          id: string
          interest: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          interest: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          interest?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "friend_interests_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "friends"
            referencedColumns: ["id"]
          },
        ]
      }
      friend_notes: {
        Row: {
          body: string
          created_at: string
          friend_id: string
          id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          friend_id: string
          id?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          friend_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "friend_notes_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "friends"
            referencedColumns: ["id"]
          },
        ]
      }
      friends: {
        Row: {
          birthday: string | null
          birthday_has_year: boolean
          clothing_size: string | null
          created_at: string
          dislikes: string | null
          email: string | null
          favorite_color: string | null
          favorite_foods: string | null
          favorite_media: string | null
          how_we_met: string | null
          id: string
          is_self: boolean
          linked_user_id: string | null
          name: string
          nickname: string | null
          notes: string | null
          phone: string | null
          photo_url: string | null
          shoe_size: string | null
          updated_at: string
          user_id: string
          wishlist: string | null
        }
        Insert: {
          birthday?: string | null
          birthday_has_year?: boolean
          clothing_size?: string | null
          created_at?: string
          dislikes?: string | null
          email?: string | null
          favorite_color?: string | null
          favorite_foods?: string | null
          favorite_media?: string | null
          how_we_met?: string | null
          id?: string
          is_self?: boolean
          linked_user_id?: string | null
          name: string
          nickname?: string | null
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          shoe_size?: string | null
          updated_at?: string
          user_id: string
          wishlist?: string | null
        }
        Update: {
          birthday?: string | null
          birthday_has_year?: boolean
          clothing_size?: string | null
          created_at?: string
          dislikes?: string | null
          email?: string | null
          favorite_color?: string | null
          favorite_foods?: string | null
          favorite_media?: string | null
          how_we_met?: string | null
          id?: string
          is_self?: boolean
          linked_user_id?: string | null
          name?: string
          nickname?: string | null
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          shoe_size?: string | null
          updated_at?: string
          user_id?: string
          wishlist?: string | null
        }
        Relationships: []
      }
      gift_ideas: {
        Row: {
          created_at: string
          friend_id: string
          gifted_on: string | null
          id: string
          price_range: string | null
          reason: string | null
          source: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          gifted_on?: string | null
          id?: string
          price_range?: string | null
          reason?: string | null
          source?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          gifted_on?: string | null
          id?: string
          price_range?: string | null
          reason?: string | null
          source?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gift_ideas_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "friends"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_circle_invite: { Args: { _token: string }; Returns: string }
      can_access_circle: {
        Args: { _circle: string; _user: string }
        Returns: boolean
      }
      can_access_friend: {
        Args: { _friend: string; _user: string }
        Returns: boolean
      }
      circle_access_list: {
        Args: { _circle: string }
        Returns: {
          created_at: string
          display_name: string
          email: string
          user_id: string
        }[]
      }
      find_circle_duplicates: {
        Args: { _circle: string }
        Returns: {
          mine_id: string
          mine_name: string
          other_id: string
          other_is_self: boolean
          other_name: string
          reason: string
        }[]
      }
      merge_friends: {
        Args: { _drop: string; _keep: string }
        Returns: undefined
      }
      shares_circle_with: { Args: { _a: string; _b: string }; Returns: boolean }
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
