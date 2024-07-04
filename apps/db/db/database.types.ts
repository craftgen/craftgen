export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          operationName?: string;
          query?: string;
          variables?: Json;
          extensions?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      context: {
        Row: {
          id: string;
          parent_id: string | null;
          previous_context_id: string | null;
          project_id: string;
          state: Json | null;
          type: string;
          workflow_id: string;
          workflow_version_id: string;
        };
        Insert: {
          id: string;
          parent_id?: string | null;
          previous_context_id?: string | null;
          project_id: string;
          state?: Json | null;
          type: string;
          workflow_id: string;
          workflow_version_id: string;
        };
        Update: {
          id?: string;
          parent_id?: string | null;
          previous_context_id?: string | null;
          project_id?: string;
          state?: Json | null;
          type?: string;
          workflow_id?: string;
          workflow_version_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "context_parent_id_context_id_fk";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "context";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "context_project_id_project_id_fk";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "project";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "context_workflow_id_workflow_id_fk";
            columns: ["workflow_id"];
            isOneToOne: false;
            referencedRelation: "workflow";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "context_workflow_version_id_workflow_version_id_fk";
            columns: ["workflow_version_id"];
            isOneToOne: false;
            referencedRelation: "workflow_version";
            referencedColumns: ["id"];
          },
        ];
      };
      directus_roles: {
        Row: {
          admin_access: boolean;
          app_access: boolean;
          description: string | null;
          enforce_tfa: boolean;
          icon: string;
          id: string;
          ip_access: string | null;
          name: string;
        };
        Insert: {
          admin_access?: boolean;
          app_access?: boolean;
          description?: string | null;
          enforce_tfa?: boolean;
          icon?: string;
          id: string;
          ip_access?: string | null;
          name: string;
        };
        Update: {
          admin_access?: boolean;
          app_access?: boolean;
          description?: string | null;
          enforce_tfa?: boolean;
          icon?: string;
          id?: string;
          ip_access?: string | null;
          name?: string;
        };
        Relationships: [];
      };
      directus_users: {
        Row: {
          appearance: string | null;
          auth_data: Json | null;
          avatar: string | null;
          description: string | null;
          email: string | null;
          email_notifications: boolean | null;
          external_identifier: string | null;
          first_name: string | null;
          id: string;
          language: string | null;
          last_access: string | null;
          last_name: string | null;
          last_page: string | null;
          location: string | null;
          password: string | null;
          provider: string;
          role: string | null;
          status: string;
          tags: Json | null;
          tfa_secret: string | null;
          theme_dark: string | null;
          theme_dark_overrides: Json | null;
          theme_light: string | null;
          theme_light_overrides: Json | null;
          title: string | null;
          token: string | null;
        };
        Insert: {
          appearance?: string | null;
          auth_data?: Json | null;
          avatar?: string | null;
          description?: string | null;
          email?: string | null;
          email_notifications?: boolean | null;
          external_identifier?: string | null;
          first_name?: string | null;
          id: string;
          language?: string | null;
          last_access?: string | null;
          last_name?: string | null;
          last_page?: string | null;
          location?: string | null;
          password?: string | null;
          provider?: string;
          role?: string | null;
          status?: string;
          tags?: Json | null;
          tfa_secret?: string | null;
          theme_dark?: string | null;
          theme_dark_overrides?: Json | null;
          theme_light?: string | null;
          theme_light_overrides?: Json | null;
          title?: string | null;
          token?: string | null;
        };
        Update: {
          appearance?: string | null;
          auth_data?: Json | null;
          avatar?: string | null;
          description?: string | null;
          email?: string | null;
          email_notifications?: boolean | null;
          external_identifier?: string | null;
          first_name?: string | null;
          id?: string;
          language?: string | null;
          last_access?: string | null;
          last_name?: string | null;
          last_page?: string | null;
          location?: string | null;
          password?: string | null;
          provider?: string;
          role?: string | null;
          status?: string;
          tags?: Json | null;
          tfa_secret?: string | null;
          theme_dark?: string | null;
          theme_dark_overrides?: Json | null;
          theme_light?: string | null;
          theme_light_overrides?: Json | null;
          title?: string | null;
          token?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "directus_users_role_directus_roles_id_fk";
            columns: ["role"];
            isOneToOne: false;
            referencedRelation: "directus_roles";
            referencedColumns: ["id"];
          },
        ];
      };
      integration: {
        Row: {
          date_created: string | null;
          date_updated: string | null;
          featured: boolean | null;
          icon: string | null;
          id: string;
          slug: string | null;
          sort: number | null;
          status: string;
          user_created: string | null;
          user_updated: string | null;
        };
        Insert: {
          date_created?: string | null;
          date_updated?: string | null;
          featured?: boolean | null;
          icon?: string | null;
          id: string;
          slug?: string | null;
          sort?: number | null;
          status?: string;
          user_created?: string | null;
          user_updated?: string | null;
        };
        Update: {
          date_created?: string | null;
          date_updated?: string | null;
          featured?: boolean | null;
          icon?: string | null;
          id?: string;
          slug?: string | null;
          sort?: number | null;
          status?: string;
          user_created?: string | null;
          user_updated?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "integration_user_created_directus_users_id_fk";
            columns: ["user_created"];
            isOneToOne: false;
            referencedRelation: "directus_users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "integration_user_updated_directus_users_id_fk";
            columns: ["user_updated"];
            isOneToOne: false;
            referencedRelation: "directus_users";
            referencedColumns: ["id"];
          },
        ];
      };
      integration_categories: {
        Row: {
          date_created: string | null;
          date_updated: string | null;
          id: string;
          slug: string | null;
          sort: number | null;
          status: string;
          user_created: string | null;
          user_updated: string | null;
        };
        Insert: {
          date_created?: string | null;
          date_updated?: string | null;
          id: string;
          slug?: string | null;
          sort?: number | null;
          status?: string;
          user_created?: string | null;
          user_updated?: string | null;
        };
        Update: {
          date_created?: string | null;
          date_updated?: string | null;
          id?: string;
          slug?: string | null;
          sort?: number | null;
          status?: string;
          user_created?: string | null;
          user_updated?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "integration_categories_user_created_directus_users_id_fk";
            columns: ["user_created"];
            isOneToOne: false;
            referencedRelation: "directus_users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "integration_categories_user_updated_directus_users_id_fk";
            columns: ["user_updated"];
            isOneToOne: false;
            referencedRelation: "directus_users";
            referencedColumns: ["id"];
          },
        ];
      };
      integration_categories_translations: {
        Row: {
          id: number;
          integration_categories_id: string | null;
          languages_code: string | null;
          name: string | null;
        };
        Insert: {
          id?: number;
          integration_categories_id?: string | null;
          languages_code?: string | null;
          name?: string | null;
        };
        Update: {
          id?: number;
          integration_categories_id?: string | null;
          languages_code?: string | null;
          name?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "integration_categories_translations_integration_categories_id_i";
            columns: ["integration_categories_id"];
            isOneToOne: false;
            referencedRelation: "integration_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "integration_categories_translations_languages_code_languages_co";
            columns: ["languages_code"];
            isOneToOne: false;
            referencedRelation: "languages";
            referencedColumns: ["code"];
          },
        ];
      };
      integration_integration_categories: {
        Row: {
          id: number;
          integration_categories_id: string | null;
          integration_id: string | null;
        };
        Insert: {
          id?: number;
          integration_categories_id?: string | null;
          integration_id?: string | null;
        };
        Update: {
          id?: number;
          integration_categories_id?: string | null;
          integration_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "integration_integration_categories_integration_categories_id_in";
            columns: ["integration_categories_id"];
            isOneToOne: false;
            referencedRelation: "integration_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "integration_integration_categories_integration_id_integration_i";
            columns: ["integration_id"];
            isOneToOne: false;
            referencedRelation: "integration";
            referencedColumns: ["id"];
          },
        ];
      };
      integration_solution: {
        Row: {
          id: number;
          integration_id: string | null;
          solution_id: string | null;
        };
        Insert: {
          id?: number;
          integration_id?: string | null;
          solution_id?: string | null;
        };
        Update: {
          id?: number;
          integration_id?: string | null;
          solution_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "integration_solution_integration_id_integration_id_fk";
            columns: ["integration_id"];
            isOneToOne: false;
            referencedRelation: "integration";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "integration_solution_solution_id_solution_id_fk";
            columns: ["solution_id"];
            isOneToOne: false;
            referencedRelation: "solution";
            referencedColumns: ["id"];
          },
        ];
      };
      integration_translations: {
        Row: {
          description: string | null;
          id: number;
          integration_id: string | null;
          languages_code: string | null;
          name: string | null;
        };
        Insert: {
          description?: string | null;
          id?: number;
          integration_id?: string | null;
          languages_code?: string | null;
          name?: string | null;
        };
        Update: {
          description?: string | null;
          id?: number;
          integration_id?: string | null;
          languages_code?: string | null;
          name?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "integration_translations_integration_id_integration_id_fk";
            columns: ["integration_id"];
            isOneToOne: false;
            referencedRelation: "integration";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "integration_translations_languages_code_languages_code_fk";
            columns: ["languages_code"];
            isOneToOne: false;
            referencedRelation: "languages";
            referencedColumns: ["code"];
          },
        ];
      };
      languages: {
        Row: {
          code: string;
          direction: string | null;
          name: string | null;
        };
        Insert: {
          code: string;
          direction?: string | null;
          name?: string | null;
        };
        Update: {
          code?: string;
          direction?: string | null;
          name?: string | null;
        };
        Relationships: [];
      };
      node_execution_data: {
        Row: {
          completed_at: string | null;
          context_id: string;
          created_at: string;
          duration: number | null;
          id: string;
          project_id: string;
          state: Json | null;
          type: string;
          updated_at: string;
          workflow_execution_id: string;
          workflow_id: string;
          workflow_version_id: string;
        };
        Insert: {
          completed_at?: string | null;
          context_id: string;
          created_at?: string;
          duration?: number | null;
          id: string;
          project_id: string;
          state?: Json | null;
          type: string;
          updated_at?: string;
          workflow_execution_id: string;
          workflow_id: string;
          workflow_version_id: string;
        };
        Update: {
          completed_at?: string | null;
          context_id?: string;
          created_at?: string;
          duration?: number | null;
          id?: string;
          project_id?: string;
          state?: Json | null;
          type?: string;
          updated_at?: string;
          workflow_execution_id?: string;
          workflow_id?: string;
          workflow_version_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "node_execution_data_context_id_context_id_fk";
            columns: ["context_id"];
            isOneToOne: false;
            referencedRelation: "context";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "node_execution_data_project_id_project_id_fk";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "project";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "node_execution_data_workflow_execution_id_workflow_execution_id";
            columns: ["workflow_execution_id"];
            isOneToOne: false;
            referencedRelation: "workflow_execution";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "node_execution_data_workflow_id_workflow_id_fk";
            columns: ["workflow_id"];
            isOneToOne: false;
            referencedRelation: "workflow";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "node_execution_data_workflow_version_id_workflow_version_id_fk";
            columns: ["workflow_version_id"];
            isOneToOne: false;
            referencedRelation: "workflow_version";
            referencedColumns: ["id"];
          },
        ];
      };
      project: {
        Row: {
          id: string;
          name: string;
          personal: boolean;
          site: string | null;
          slug: string;
          stripe_account_id: string | null;
        };
        Insert: {
          id: string;
          name: string;
          personal?: boolean;
          site?: string | null;
          slug: string;
          stripe_account_id?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          personal?: boolean;
          site?: string | null;
          slug?: string;
          stripe_account_id?: string | null;
        };
        Relationships: [];
      };
      project_api_key: {
        Row: {
          id: string;
          key: string;
          name: string;
          project_id: string;
        };
        Insert: {
          id: string;
          key: string;
          name: string;
          project_id: string;
        };
        Update: {
          id?: string;
          key?: string;
          name?: string;
          project_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_api_key_project_id_project_id_fk";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "project";
            referencedColumns: ["id"];
          },
        ];
      };
      project_members: {
        Row: {
          id: string;
          member_role: Database["public"]["Enums"]["member_role"];
          project_id: string;
          user_id: string;
        };
        Insert: {
          id: string;
          member_role?: Database["public"]["Enums"]["member_role"];
          project_id: string;
          user_id: string;
        };
        Update: {
          id?: string;
          member_role?: Database["public"]["Enums"]["member_role"];
          project_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_project_id_fk";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "project";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_members_user_id_user_id_fk";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
        ];
      };
      project_variable: {
        Row: {
          default: boolean;
          id: string;
          is_system: boolean;
          key: string;
          project_id: string;
          provider: string | null;
          refresh_token: string | null;
          value: string | null;
        };
        Insert: {
          default?: boolean;
          id: string;
          is_system?: boolean;
          key: string;
          project_id: string;
          provider?: string | null;
          refresh_token?: string | null;
          value?: string | null;
        };
        Update: {
          default?: boolean;
          id?: string;
          is_system?: boolean;
          key?: string;
          project_id?: string;
          provider?: string | null;
          refresh_token?: string | null;
          value?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "project_variable_project_id_project_id_fk";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "project";
            referencedColumns: ["id"];
          },
        ];
      };
      solution: {
        Row: {
          date_created: string | null;
          date_updated: string | null;
          id: string;
          slug: string | null;
          sort: number | null;
          status: string;
          user_created: string | null;
          user_updated: string | null;
        };
        Insert: {
          date_created?: string | null;
          date_updated?: string | null;
          id: string;
          slug?: string | null;
          sort?: number | null;
          status?: string;
          user_created?: string | null;
          user_updated?: string | null;
        };
        Update: {
          date_created?: string | null;
          date_updated?: string | null;
          id?: string;
          slug?: string | null;
          sort?: number | null;
          status?: string;
          user_created?: string | null;
          user_updated?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "solution_user_created_directus_users_id_fk";
            columns: ["user_created"];
            isOneToOne: false;
            referencedRelation: "directus_users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "solution_user_updated_directus_users_id_fk";
            columns: ["user_updated"];
            isOneToOne: false;
            referencedRelation: "directus_users";
            referencedColumns: ["id"];
          },
        ];
      };
      solution_translations: {
        Row: {
          id: number;
          languages_code: string | null;
          name: string | null;
          solution_id: string | null;
          title: string | null;
        };
        Insert: {
          id?: number;
          languages_code?: string | null;
          name?: string | null;
          solution_id?: string | null;
          title?: string | null;
        };
        Update: {
          id?: number;
          languages_code?: string | null;
          name?: string | null;
          solution_id?: string | null;
          title?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "solution_translations_languages_code_languages_code_fk";
            columns: ["languages_code"];
            isOneToOne: false;
            referencedRelation: "languages";
            referencedColumns: ["code"];
          },
          {
            foreignKeyName: "solution_translations_solution_id_solution_id_fk";
            columns: ["solution_id"];
            isOneToOne: false;
            referencedRelation: "solution";
            referencedColumns: ["id"];
          },
        ];
      };
      user: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          email: string;
          full_name: string | null;
          google_access_token: string | null;
          google_refresh_token: string | null;
          google_scopes: string[] | null;
          id: string;
          username: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          email: string;
          full_name?: string | null;
          google_access_token?: string | null;
          google_refresh_token?: string | null;
          google_scopes?: string[] | null;
          id: string;
          username?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string;
          full_name?: string | null;
          google_access_token?: string | null;
          google_refresh_token?: string | null;
          google_scopes?: string[] | null;
          id?: string;
          username?: string | null;
        };
        Relationships: [];
      };
      waitlist: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          platforms: string[] | null;
        };
        Insert: {
          created_at?: string;
          email: string;
          id?: string;
          platforms?: string[] | null;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          platforms?: string[] | null;
        };
        Relationships: [];
      };
      workflow: {
        Row: {
          created_at: string;
          description: string | null;
          featured: boolean;
          id: string;
          layout: Json | null;
          name: string;
          project_id: string;
          project_slug: string;
          public: boolean;
          published_at: string | null;
          slug: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          featured?: boolean;
          id: string;
          layout?: Json | null;
          name: string;
          project_id: string;
          project_slug: string;
          public?: boolean;
          published_at?: string | null;
          slug: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          featured?: boolean;
          id?: string;
          layout?: Json | null;
          name?: string;
          project_id?: string;
          project_slug?: string;
          public?: boolean;
          published_at?: string | null;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workflow_project_id_project_id_fk";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "project";
            referencedColumns: ["id"];
          },
        ];
      };
      workflow_edge: {
        Row: {
          source: string;
          source_output: string;
          target: string;
          target_input: string;
          workflow_id: string;
          workflow_version_id: string;
        };
        Insert: {
          source: string;
          source_output: string;
          target: string;
          target_input: string;
          workflow_id: string;
          workflow_version_id: string;
        };
        Update: {
          source?: string;
          source_output?: string;
          target?: string;
          target_input?: string;
          workflow_id?: string;
          workflow_version_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workflow_edge_source_workflow_node_id_fk";
            columns: ["source"];
            isOneToOne: false;
            referencedRelation: "workflow_node";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workflow_edge_target_workflow_node_id_fk";
            columns: ["target"];
            isOneToOne: false;
            referencedRelation: "workflow_node";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workflow_edge_workflow_id_workflow_id_fk";
            columns: ["workflow_id"];
            isOneToOne: false;
            referencedRelation: "workflow";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workflow_edge_workflow_version_id_workflow_version_id_fk";
            columns: ["workflow_version_id"];
            isOneToOne: false;
            referencedRelation: "workflow_version";
            referencedColumns: ["id"];
          },
        ];
      };
      workflow_execution: {
        Row: {
          completed_at: string | null;
          current_context_id: string | null;
          duration: number | null;
          entry_context_id: string | null;
          id: string;
          state: Json | null;
          status: string;
          timestamp: string;
          updated_at: string;
          workflow_id: string;
          workflow_version_id: string;
        };
        Insert: {
          completed_at?: string | null;
          current_context_id?: string | null;
          duration?: number | null;
          entry_context_id?: string | null;
          id: string;
          state?: Json | null;
          status?: string;
          timestamp?: string;
          updated_at?: string;
          workflow_id: string;
          workflow_version_id: string;
        };
        Update: {
          completed_at?: string | null;
          current_context_id?: string | null;
          duration?: number | null;
          entry_context_id?: string | null;
          id?: string;
          state?: Json | null;
          status?: string;
          timestamp?: string;
          updated_at?: string;
          workflow_id?: string;
          workflow_version_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workflow_execution_workflow_id_workflow_id_fk";
            columns: ["workflow_id"];
            isOneToOne: false;
            referencedRelation: "workflow";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workflow_execution_workflow_version_id_workflow_version_id_fk";
            columns: ["workflow_version_id"];
            isOneToOne: false;
            referencedRelation: "workflow_version";
            referencedColumns: ["id"];
          },
        ];
      };
      workflow_execution_event: {
        Row: {
          created_at: string;
          event: Json | null;
          id: string;
          run_id: string | null;
          source_context_id: string | null;
          status: string;
          type: string;
          workflow_execution_id: string;
        };
        Insert: {
          created_at?: string;
          event?: Json | null;
          id: string;
          run_id?: string | null;
          source_context_id?: string | null;
          status?: string;
          type: string;
          workflow_execution_id: string;
        };
        Update: {
          created_at?: string;
          event?: Json | null;
          id?: string;
          run_id?: string | null;
          source_context_id?: string | null;
          status?: string;
          type?: string;
          workflow_execution_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workflow_execution_event_source_context_id_context_id_fk";
            columns: ["source_context_id"];
            isOneToOne: false;
            referencedRelation: "context";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workflow_execution_event_workflow_execution_id_workflow_executi";
            columns: ["workflow_execution_id"];
            isOneToOne: false;
            referencedRelation: "workflow_execution";
            referencedColumns: ["id"];
          },
        ];
      };
      workflow_node: {
        Row: {
          color: string;
          context_id: string;
          description: string | null;
          height: number;
          id: string;
          label: string;
          position: Json;
          project_id: string;
          type: string;
          width: number;
          workflow_id: string;
          workflow_version_id: string;
        };
        Insert: {
          color: string;
          context_id: string;
          description?: string | null;
          height: number;
          id: string;
          label: string;
          position: Json;
          project_id: string;
          type: string;
          width: number;
          workflow_id: string;
          workflow_version_id: string;
        };
        Update: {
          color?: string;
          context_id?: string;
          description?: string | null;
          height?: number;
          id?: string;
          label?: string;
          position?: Json;
          project_id?: string;
          type?: string;
          width?: number;
          workflow_id?: string;
          workflow_version_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workflow_node_context_id_context_id_fk";
            columns: ["context_id"];
            isOneToOne: false;
            referencedRelation: "context";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workflow_node_project_id_project_id_fk";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "project";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workflow_node_workflow_id_workflow_id_fk";
            columns: ["workflow_id"];
            isOneToOne: false;
            referencedRelation: "workflow";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workflow_node_workflow_version_id_workflow_version_id_fk";
            columns: ["workflow_version_id"];
            isOneToOne: false;
            referencedRelation: "workflow_version";
            referencedColumns: ["id"];
          },
        ];
      };
      workflow_version: {
        Row: {
          change_log: string | null;
          context_id: string | null;
          id: string;
          previous_workflow_version_id: string | null;
          project_id: string;
          published_at: string | null;
          version: number;
          workflow_id: string;
        };
        Insert: {
          change_log?: string | null;
          context_id?: string | null;
          id: string;
          previous_workflow_version_id?: string | null;
          project_id: string;
          published_at?: string | null;
          version?: number;
          workflow_id: string;
        };
        Update: {
          change_log?: string | null;
          context_id?: string | null;
          id?: string;
          previous_workflow_version_id?: string | null;
          project_id?: string;
          published_at?: string | null;
          version?: number;
          workflow_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workflow_version_context_id_context_id_fk";
            columns: ["context_id"];
            isOneToOne: false;
            referencedRelation: "context";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workflow_version_project_id_project_id_fk";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "project";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workflow_version_workflow_id_workflow_id_fk";
            columns: ["workflow_id"];
            isOneToOne: false;
            referencedRelation: "workflow";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      member_role: "owner" | "admin" | "editor" | "viewer";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null;
          avif_autodetection: boolean | null;
          created_at: string | null;
          file_size_limit: number | null;
          id: string;
          name: string;
          owner: string | null;
          owner_id: string | null;
          public: boolean | null;
          updated_at: string | null;
        };
        Insert: {
          allowed_mime_types?: string[] | null;
          avif_autodetection?: boolean | null;
          created_at?: string | null;
          file_size_limit?: number | null;
          id: string;
          name: string;
          owner?: string | null;
          owner_id?: string | null;
          public?: boolean | null;
          updated_at?: string | null;
        };
        Update: {
          allowed_mime_types?: string[] | null;
          avif_autodetection?: boolean | null;
          created_at?: string | null;
          file_size_limit?: number | null;
          id?: string;
          name?: string;
          owner?: string | null;
          owner_id?: string | null;
          public?: boolean | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      migrations: {
        Row: {
          executed_at: string | null;
          hash: string;
          id: number;
          name: string;
        };
        Insert: {
          executed_at?: string | null;
          hash: string;
          id: number;
          name: string;
        };
        Update: {
          executed_at?: string | null;
          hash?: string;
          id?: number;
          name?: string;
        };
        Relationships: [];
      };
      objects: {
        Row: {
          bucket_id: string | null;
          created_at: string | null;
          id: string;
          last_accessed_at: string | null;
          metadata: Json | null;
          name: string | null;
          owner: string | null;
          owner_id: string | null;
          path_tokens: string[] | null;
          updated_at: string | null;
          version: string | null;
        };
        Insert: {
          bucket_id?: string | null;
          created_at?: string | null;
          id?: string;
          last_accessed_at?: string | null;
          metadata?: Json | null;
          name?: string | null;
          owner?: string | null;
          owner_id?: string | null;
          path_tokens?: string[] | null;
          updated_at?: string | null;
          version?: string | null;
        };
        Update: {
          bucket_id?: string | null;
          created_at?: string | null;
          id?: string;
          last_accessed_at?: string | null;
          metadata?: Json | null;
          name?: string | null;
          owner?: string | null;
          owner_id?: string | null;
          path_tokens?: string[] | null;
          updated_at?: string | null;
          version?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey";
            columns: ["bucket_id"];
            isOneToOne: false;
            referencedRelation: "buckets";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      can_insert_object: {
        Args: {
          bucketid: string;
          name: string;
          owner: string;
          metadata: Json;
        };
        Returns: undefined;
      };
      extension: {
        Args: {
          name: string;
        };
        Returns: string;
      };
      filename: {
        Args: {
          name: string;
        };
        Returns: string;
      };
      foldername: {
        Args: {
          name: string;
        };
        Returns: unknown;
      };
      get_size_by_bucket: {
        Args: Record<PropertyKey, never>;
        Returns: {
          size: number;
          bucket_id: string;
        }[];
      };
      search: {
        Args: {
          prefix: string;
          bucketname: string;
          limits?: number;
          levels?: number;
          offsets?: number;
          search?: string;
          sortcolumn?: string;
          sortorder?: string;
        };
        Returns: {
          name: string;
          id: string;
          updated_at: string;
          created_at: string;
          last_accessed_at: string;
          metadata: Json;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never;
