export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
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
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
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
      context: {
        Row: {
          id: string
          previous_context_id: string | null
          project_id: string
          state: Json | null
          type: string
        }
        Insert: {
          id: string
          previous_context_id?: string | null
          project_id: string
          state?: Json | null
          type: string
        }
        Update: {
          id?: string
          previous_context_id?: string | null
          project_id?: string
          state?: Json | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "context_project_id_project_id_fk"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project"
            referencedColumns: ["id"]
          }
        ]
      }
      node_execution_data: {
        Row: {
          completed_at: string | null
          context_id: string
          created_at: string
          duration: number | null
          id: string
          project_id: string
          state: Json | null
          type: string
          updated_at: string
          workflow_execution_id: string
          workflow_id: string
          workflow_node_id: string
          workflow_version_id: string
        }
        Insert: {
          completed_at?: string | null
          context_id: string
          created_at?: string
          duration?: number | null
          id: string
          project_id: string
          state?: Json | null
          type: string
          updated_at?: string
          workflow_execution_id: string
          workflow_id: string
          workflow_node_id: string
          workflow_version_id: string
        }
        Update: {
          completed_at?: string | null
          context_id?: string
          created_at?: string
          duration?: number | null
          id?: string
          project_id?: string
          state?: Json | null
          type?: string
          updated_at?: string
          workflow_execution_id?: string
          workflow_id?: string
          workflow_node_id?: string
          workflow_version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "node_execution_data_context_id_context_id_fk"
            columns: ["context_id"]
            isOneToOne: false
            referencedRelation: "context"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "node_execution_data_project_id_project_id_fk"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "node_execution_data_workflow_execution_id_workflow_execution_id"
            columns: ["workflow_execution_id"]
            isOneToOne: false
            referencedRelation: "workflow_execution"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "node_execution_data_workflow_id_workflow_id_fk"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflow"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "node_execution_data_workflow_node_id_workflow_node_id_fk"
            columns: ["workflow_node_id"]
            isOneToOne: false
            referencedRelation: "workflow_node"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "node_execution_data_workflow_version_id_workflow_version_id_fk"
            columns: ["workflow_version_id"]
            isOneToOne: false
            referencedRelation: "workflow_version"
            referencedColumns: ["id"]
          }
        ]
      }
      project: {
        Row: {
          id: string
          name: string
          personal: boolean
          site: string | null
          slug: string
        }
        Insert: {
          id: string
          name: string
          personal?: boolean
          site?: string | null
          slug: string
        }
        Update: {
          id?: string
          name?: string
          personal?: boolean
          site?: string | null
          slug?: string
        }
        Relationships: []
      }
      project_api_key: {
        Row: {
          id: string
          key: string
          name: string
          project_id: string
        }
        Insert: {
          id: string
          key: string
          name: string
          project_id: string
        }
        Update: {
          id?: string
          key?: string
          name?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_api_key_project_id_project_id_fk"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project"
            referencedColumns: ["id"]
          }
        ]
      }
      project_members: {
        Row: {
          id: string
          member_role: Database["public"]["Enums"]["member_role"]
          project_id: string
          user_id: string
        }
        Insert: {
          id: string
          member_role?: Database["public"]["Enums"]["member_role"]
          project_id: string
          user_id: string
        }
        Update: {
          id?: string
          member_role?: Database["public"]["Enums"]["member_role"]
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_project_id_fk"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_user_id_user_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          }
        ]
      }
      project_variable: {
        Row: {
          default: boolean
          id: string
          is_system: boolean
          key: string
          project_id: string
          provider: string | null
          refresh_token: string | null
          value: string | null
        }
        Insert: {
          default?: boolean
          id: string
          is_system?: boolean
          key: string
          project_id: string
          provider?: string | null
          refresh_token?: string | null
          value?: string | null
        }
        Update: {
          default?: boolean
          id?: string
          is_system?: boolean
          key?: string
          project_id?: string
          provider?: string | null
          refresh_token?: string | null
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_variable_project_id_project_id_fk"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project"
            referencedColumns: ["id"]
          }
        ]
      }
      user: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          google_access_token: string | null
          google_refresh_token: string | null
          google_scopes: string[] | null
          id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          google_access_token?: string | null
          google_refresh_token?: string | null
          google_scopes?: string[] | null
          id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          google_access_token?: string | null
          google_refresh_token?: string | null
          google_scopes?: string[] | null
          id?: string
          username?: string | null
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
          platforms: string[] | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          platforms?: string[] | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          platforms?: string[] | null
        }
        Relationships: []
      }
      workflow: {
        Row: {
          created_at: string
          description: string | null
          featured: boolean
          id: string
          layout: Json | null
          name: string
          project_id: string
          project_slug: string
          public: boolean
          published_at: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          featured?: boolean
          id: string
          layout?: Json | null
          name: string
          project_id: string
          project_slug: string
          public?: boolean
          published_at?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          featured?: boolean
          id?: string
          layout?: Json | null
          name?: string
          project_id?: string
          project_slug?: string
          public?: boolean
          published_at?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_project_id_project_id_fk"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project"
            referencedColumns: ["id"]
          }
        ]
      }
      workflow_edge: {
        Row: {
          source: string
          source_output: string
          target: string
          target_input: string
          workflow_id: string
          workflow_version_id: string
        }
        Insert: {
          source: string
          source_output: string
          target: string
          target_input: string
          workflow_id: string
          workflow_version_id: string
        }
        Update: {
          source?: string
          source_output?: string
          target?: string
          target_input?: string
          workflow_id?: string
          workflow_version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_edge_source_workflow_node_id_fk"
            columns: ["source"]
            isOneToOne: false
            referencedRelation: "workflow_node"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_edge_target_workflow_node_id_fk"
            columns: ["target"]
            isOneToOne: false
            referencedRelation: "workflow_node"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_edge_workflow_id_workflow_id_fk"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflow"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_edge_workflow_version_id_workflow_version_id_fk"
            columns: ["workflow_version_id"]
            isOneToOne: false
            referencedRelation: "workflow_version"
            referencedColumns: ["id"]
          }
        ]
      }
      workflow_execution: {
        Row: {
          completed_at: string | null
          duration: number | null
          entry_node_id: string
          exit_node_id: string | null
          id: string
          status: string
          timestamp: string
          updated_at: string
          workflow_id: string
          workflow_version_id: string
        }
        Insert: {
          completed_at?: string | null
          duration?: number | null
          entry_node_id: string
          exit_node_id?: string | null
          id: string
          status?: string
          timestamp?: string
          updated_at?: string
          workflow_id: string
          workflow_version_id: string
        }
        Update: {
          completed_at?: string | null
          duration?: number | null
          entry_node_id?: string
          exit_node_id?: string | null
          id?: string
          status?: string
          timestamp?: string
          updated_at?: string
          workflow_id?: string
          workflow_version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_execution_entry_node_id_workflow_node_id_fk"
            columns: ["entry_node_id"]
            isOneToOne: false
            referencedRelation: "workflow_node"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_execution_exit_node_id_workflow_node_id_fk"
            columns: ["exit_node_id"]
            isOneToOne: false
            referencedRelation: "workflow_node"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_execution_workflow_id_workflow_id_fk"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflow"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_execution_workflow_version_id_workflow_version_id_fk"
            columns: ["workflow_version_id"]
            isOneToOne: false
            referencedRelation: "workflow_version"
            referencedColumns: ["id"]
          }
        ]
      }
      workflow_execution_step: {
        Row: {
          created_at: string
          id: string
          source_node_id: string
          target_node_id: string
          workflow_execution_id: string
        }
        Insert: {
          created_at?: string
          id: string
          source_node_id: string
          target_node_id: string
          workflow_execution_id: string
        }
        Update: {
          created_at?: string
          id?: string
          source_node_id?: string
          target_node_id?: string
          workflow_execution_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_execution_step_source_node_id_node_execution_data_id_f"
            columns: ["source_node_id"]
            isOneToOne: false
            referencedRelation: "node_execution_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_execution_step_target_node_id_node_execution_data_id_f"
            columns: ["target_node_id"]
            isOneToOne: false
            referencedRelation: "node_execution_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_execution_step_workflow_execution_id_workflow_executio"
            columns: ["workflow_execution_id"]
            isOneToOne: false
            referencedRelation: "workflow_execution"
            referencedColumns: ["id"]
          }
        ]
      }
      workflow_node: {
        Row: {
          color: string
          context_id: string
          description: string | null
          height: number
          id: string
          label: string
          position: Json
          project_id: string
          type: string
          width: number
          workflow_id: string
          workflow_version_id: string
        }
        Insert: {
          color: string
          context_id: string
          description?: string | null
          height: number
          id: string
          label: string
          position: Json
          project_id: string
          type: string
          width: number
          workflow_id: string
          workflow_version_id: string
        }
        Update: {
          color?: string
          context_id?: string
          description?: string | null
          height?: number
          id?: string
          label?: string
          position?: Json
          project_id?: string
          type?: string
          width?: number
          workflow_id?: string
          workflow_version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_node_context_id_context_id_fk"
            columns: ["context_id"]
            isOneToOne: false
            referencedRelation: "context"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_node_project_id_project_id_fk"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_node_workflow_id_workflow_id_fk"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflow"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_node_workflow_version_id_workflow_version_id_fk"
            columns: ["workflow_version_id"]
            isOneToOne: false
            referencedRelation: "workflow_version"
            referencedColumns: ["id"]
          }
        ]
      }
      workflow_version: {
        Row: {
          change_log: string | null
          id: string
          previous_workflow_version_id: string | null
          project_id: string
          published_at: string | null
          version: number
          workflow_id: string
        }
        Insert: {
          change_log?: string | null
          id: string
          previous_workflow_version_id?: string | null
          project_id: string
          published_at?: string | null
          version?: number
          workflow_id: string
        }
        Update: {
          change_log?: string | null
          id?: string
          previous_workflow_version_id?: string | null
          project_id?: string
          published_at?: string | null
          version?: number
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_version_project_id_project_id_fk"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_version_workflow_id_workflow_id_fk"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflow"
            referencedColumns: ["id"]
          }
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
      member_role: "owner" | "admin" | "editor" | "viewer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_insert_object: {
        Args: {
          bucketid: string
          name: string
          owner: string
          metadata: Json
        }
        Returns: undefined
      }
      extension: {
        Args: {
          name: string
        }
        Returns: string
      }
      filename: {
        Args: {
          name: string
        }
        Returns: string
      }
      foldername: {
        Args: {
          name: string
        }
        Returns: unknown
      }
      get_size_by_bucket: {
        Args: Record<PropertyKey, never>
        Returns: {
          size: number
          bucket_id: string
        }[]
      }
      search: {
        Args: {
          prefix: string
          bucketname: string
          limits?: number
          levels?: number
          offsets?: number
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          name: string
          id: string
          updated_at: string
          created_at: string
          last_accessed_at: string
          metadata: Json
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

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never

