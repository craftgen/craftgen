
> @seocraft/supabase@0.1.0 with-env /Users/necmttn/Projects/craftgen/apps/supabase
> dotenv -e ../.env -- "supabase" "gen" "types" "typescript" "--local"

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
      case_study: {
        Row: {
          date_created: string | null
          date_updated: string | null
          id: string
          sort: number | null
          status: string
          user_created: string | null
          user_updated: string | null
        }
        Insert: {
          date_created?: string | null
          date_updated?: string | null
          id: string
          sort?: number | null
          status?: string
          user_created?: string | null
          user_updated?: string | null
        }
        Update: {
          date_created?: string | null
          date_updated?: string | null
          id?: string
          sort?: number | null
          status?: string
          user_created?: string | null
          user_updated?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_study_user_created_foreign"
            columns: ["user_created"]
            isOneToOne: false
            referencedRelation: "directus_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_study_user_updated_foreign"
            columns: ["user_updated"]
            isOneToOne: false
            referencedRelation: "directus_users"
            referencedColumns: ["id"]
          }
        ]
      }
      case_study_translations: {
        Row: {
          case_study_id: string | null
          content: string | null
          excerpt: string | null
          id: number
          languages_code: string | null
          title: string | null
        }
        Insert: {
          case_study_id?: string | null
          content?: string | null
          excerpt?: string | null
          id?: number
          languages_code?: string | null
          title?: string | null
        }
        Update: {
          case_study_id?: string | null
          content?: string | null
          excerpt?: string | null
          id?: number
          languages_code?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_study_translations_case_study_id_foreign"
            columns: ["case_study_id"]
            isOneToOne: false
            referencedRelation: "case_study"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_study_translations_languages_code_foreign"
            columns: ["languages_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          }
        ]
      }
      context: {
        Row: {
          id: string
          parent_id: string | null
          previous_context_id: string | null
          project_id: string
          state: Json | null
          type: string
          workflow_id: string
          workflow_version_id: string
        }
        Insert: {
          id: string
          parent_id?: string | null
          previous_context_id?: string | null
          project_id: string
          state?: Json | null
          type: string
          workflow_id: string
          workflow_version_id: string
        }
        Update: {
          id?: string
          parent_id?: string | null
          previous_context_id?: string | null
          project_id?: string
          state?: Json | null
          type?: string
          workflow_id?: string
          workflow_version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "context_parent_id_context_id_fk"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "context"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "context_project_id_project_id_fk"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "context_workflow_id_workflow_id_fk"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflow"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "context_workflow_version_id_workflow_version_id_fk"
            columns: ["workflow_version_id"]
            isOneToOne: false
            referencedRelation: "workflow_version"
            referencedColumns: ["id"]
          }
        ]
      }
      directus_activity: {
        Row: {
          action: string
          collection: string
          comment: string | null
          id: number
          ip: string | null
          item: string
          origin: string | null
          timestamp: string
          user: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          collection: string
          comment?: string | null
          id?: number
          ip?: string | null
          item: string
          origin?: string | null
          timestamp?: string
          user?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          collection?: string
          comment?: string | null
          id?: number
          ip?: string | null
          item?: string
          origin?: string | null
          timestamp?: string
          user?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      directus_collections: {
        Row: {
          accountability: string | null
          archive_app_filter: boolean
          archive_field: string | null
          archive_value: string | null
          collapse: string
          collection: string
          color: string | null
          display_template: string | null
          group: string | null
          hidden: boolean
          icon: string | null
          item_duplication_fields: Json | null
          note: string | null
          preview_url: string | null
          singleton: boolean
          sort: number | null
          sort_field: string | null
          translations: Json | null
          unarchive_value: string | null
          versioning: boolean
        }
        Insert: {
          accountability?: string | null
          archive_app_filter?: boolean
          archive_field?: string | null
          archive_value?: string | null
          collapse?: string
          collection: string
          color?: string | null
          display_template?: string | null
          group?: string | null
          hidden?: boolean
          icon?: string | null
          item_duplication_fields?: Json | null
          note?: string | null
          preview_url?: string | null
          singleton?: boolean
          sort?: number | null
          sort_field?: string | null
          translations?: Json | null
          unarchive_value?: string | null
          versioning?: boolean
        }
        Update: {
          accountability?: string | null
          archive_app_filter?: boolean
          archive_field?: string | null
          archive_value?: string | null
          collapse?: string
          collection?: string
          color?: string | null
          display_template?: string | null
          group?: string | null
          hidden?: boolean
          icon?: string | null
          item_duplication_fields?: Json | null
          note?: string | null
          preview_url?: string | null
          singleton?: boolean
          sort?: number | null
          sort_field?: string | null
          translations?: Json | null
          unarchive_value?: string | null
          versioning?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "directus_collections_group_foreign"
            columns: ["group"]
            isOneToOne: false
            referencedRelation: "directus_collections"
            referencedColumns: ["collection"]
          }
        ]
      }
      directus_dashboards: {
        Row: {
          color: string | null
          date_created: string | null
          icon: string
          id: string
          name: string
          note: string | null
          user_created: string | null
        }
        Insert: {
          color?: string | null
          date_created?: string | null
          icon?: string
          id: string
          name: string
          note?: string | null
          user_created?: string | null
        }
        Update: {
          color?: string | null
          date_created?: string | null
          icon?: string
          id?: string
          name?: string
          note?: string | null
          user_created?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "directus_dashboards_user_created_foreign"
            columns: ["user_created"]
            isOneToOne: false
            referencedRelation: "directus_users"
            referencedColumns: ["id"]
          }
        ]
      }
      directus_extensions: {
        Row: {
          bundle: string | null
          enabled: boolean
          folder: string
          id: string
          source: string
        }
        Insert: {
          bundle?: string | null
          enabled?: boolean
          folder: string
          id: string
          source: string
        }
        Update: {
          bundle?: string | null
          enabled?: boolean
          folder?: string
          id?: string
          source?: string
        }
        Relationships: []
      }
      directus_fields: {
        Row: {
          collection: string
          conditions: Json | null
          display: string | null
          display_options: Json | null
          field: string
          group: string | null
          hidden: boolean
          id: number
          interface: string | null
          note: string | null
          options: Json | null
          readonly: boolean
          required: boolean | null
          sort: number | null
          special: string | null
          translations: Json | null
          validation: Json | null
          validation_message: string | null
          width: string | null
        }
        Insert: {
          collection: string
          conditions?: Json | null
          display?: string | null
          display_options?: Json | null
          field: string
          group?: string | null
          hidden?: boolean
          id?: number
          interface?: string | null
          note?: string | null
          options?: Json | null
          readonly?: boolean
          required?: boolean | null
          sort?: number | null
          special?: string | null
          translations?: Json | null
          validation?: Json | null
          validation_message?: string | null
          width?: string | null
        }
        Update: {
          collection?: string
          conditions?: Json | null
          display?: string | null
          display_options?: Json | null
          field?: string
          group?: string | null
          hidden?: boolean
          id?: number
          interface?: string | null
          note?: string | null
          options?: Json | null
          readonly?: boolean
          required?: boolean | null
          sort?: number | null
          special?: string | null
          translations?: Json | null
          validation?: Json | null
          validation_message?: string | null
          width?: string | null
        }
        Relationships: []
      }
      directus_files: {
        Row: {
          charset: string | null
          description: string | null
          duration: number | null
          embed: string | null
          filename_disk: string | null
          filename_download: string
          filesize: number | null
          focal_point_x: number | null
          focal_point_y: number | null
          folder: string | null
          height: number | null
          id: string
          location: string | null
          metadata: Json | null
          modified_by: string | null
          modified_on: string
          storage: string
          tags: string | null
          title: string | null
          type: string | null
          uploaded_by: string | null
          uploaded_on: string
          width: number | null
        }
        Insert: {
          charset?: string | null
          description?: string | null
          duration?: number | null
          embed?: string | null
          filename_disk?: string | null
          filename_download: string
          filesize?: number | null
          focal_point_x?: number | null
          focal_point_y?: number | null
          folder?: string | null
          height?: number | null
          id: string
          location?: string | null
          metadata?: Json | null
          modified_by?: string | null
          modified_on?: string
          storage: string
          tags?: string | null
          title?: string | null
          type?: string | null
          uploaded_by?: string | null
          uploaded_on?: string
          width?: number | null
        }
        Update: {
          charset?: string | null
          description?: string | null
          duration?: number | null
          embed?: string | null
          filename_disk?: string | null
          filename_download?: string
          filesize?: number | null
          focal_point_x?: number | null
          focal_point_y?: number | null
          folder?: string | null
          height?: number | null
          id?: string
          location?: string | null
          metadata?: Json | null
          modified_by?: string | null
          modified_on?: string
          storage?: string
          tags?: string | null
          title?: string | null
          type?: string | null
          uploaded_by?: string | null
          uploaded_on?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "directus_files_folder_foreign"
            columns: ["folder"]
            isOneToOne: false
            referencedRelation: "directus_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directus_files_modified_by_foreign"
            columns: ["modified_by"]
            isOneToOne: false
            referencedRelation: "directus_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directus_files_uploaded_by_foreign"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "directus_users"
            referencedColumns: ["id"]
          }
        ]
      }
      directus_flows: {
        Row: {
          accountability: string | null
          color: string | null
          date_created: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          operation: string | null
          options: Json | null
          status: string
          trigger: string | null
          user_created: string | null
        }
        Insert: {
          accountability?: string | null
          color?: string | null
          date_created?: string | null
          description?: string | null
          icon?: string | null
          id: string
          name: string
          operation?: string | null
          options?: Json | null
          status?: string
          trigger?: string | null
          user_created?: string | null
        }
        Update: {
          accountability?: string | null
          color?: string | null
          date_created?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          operation?: string | null
          options?: Json | null
          status?: string
          trigger?: string | null
          user_created?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "directus_flows_user_created_foreign"
            columns: ["user_created"]
            isOneToOne: false
            referencedRelation: "directus_users"
            referencedColumns: ["id"]
          }
        ]
      }
      directus_folders: {
        Row: {
          id: string
          name: string
          parent: string | null
        }
        Insert: {
          id: string
          name: string
          parent?: string | null
        }
        Update: {
          id?: string
          name?: string
          parent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "directus_folders_parent_foreign"
            columns: ["parent"]
            isOneToOne: false
            referencedRelation: "directus_folders"
            referencedColumns: ["id"]
          }
        ]
      }
      directus_migrations: {
        Row: {
          name: string
          timestamp: string | null
          version: string
        }
        Insert: {
          name: string
          timestamp?: string | null
          version: string
        }
        Update: {
          name?: string
          timestamp?: string | null
          version?: string
        }
        Relationships: []
      }
      directus_notifications: {
        Row: {
          collection: string | null
          id: number
          item: string | null
          message: string | null
          recipient: string
          sender: string | null
          status: string | null
          subject: string
          timestamp: string | null
        }
        Insert: {
          collection?: string | null
          id?: number
          item?: string | null
          message?: string | null
          recipient: string
          sender?: string | null
          status?: string | null
          subject: string
          timestamp?: string | null
        }
        Update: {
          collection?: string | null
          id?: number
          item?: string | null
          message?: string | null
          recipient?: string
          sender?: string | null
          status?: string | null
          subject?: string
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "directus_notifications_recipient_foreign"
            columns: ["recipient"]
            isOneToOne: false
            referencedRelation: "directus_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directus_notifications_sender_foreign"
            columns: ["sender"]
            isOneToOne: false
            referencedRelation: "directus_users"
            referencedColumns: ["id"]
          }
        ]
      }
      directus_operations: {
        Row: {
          date_created: string | null
          flow: string
          id: string
          key: string
          name: string | null
          options: Json | null
          position_x: number
          position_y: number
          reject: string | null
          resolve: string | null
          type: string
          user_created: string | null
        }
        Insert: {
          date_created?: string | null
          flow: string
          id: string
          key: string
          name?: string | null
          options?: Json | null
          position_x: number
          position_y: number
          reject?: string | null
          resolve?: string | null
          type: string
          user_created?: string | null
        }
        Update: {
          date_created?: string | null
          flow?: string
          id?: string
          key?: string
          name?: string | null
          options?: Json | null
          position_x?: number
          position_y?: number
          reject?: string | null
          resolve?: string | null
          type?: string
          user_created?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "directus_operations_flow_foreign"
            columns: ["flow"]
            isOneToOne: false
            referencedRelation: "directus_flows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directus_operations_reject_foreign"
            columns: ["reject"]
            isOneToOne: true
            referencedRelation: "directus_operations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directus_operations_resolve_foreign"
            columns: ["resolve"]
            isOneToOne: true
            referencedRelation: "directus_operations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directus_operations_user_created_foreign"
            columns: ["user_created"]
            isOneToOne: false
            referencedRelation: "directus_users"
            referencedColumns: ["id"]
          }
        ]
      }
      directus_panels: {
        Row: {
          color: string | null
          dashboard: string
          date_created: string | null
          height: number
          icon: string | null
          id: string
          name: string | null
          note: string | null
          options: Json | null
          position_x: number
          position_y: number
          show_header: boolean
          type: string
          user_created: string | null
          width: number
        }
        Insert: {
          color?: string | null
          dashboard: string
          date_created?: string | null
          height: number
          icon?: string | null
          id: string
          name?: string | null
          note?: string | null
          options?: Json | null
          position_x: number
          position_y: number
          show_header?: boolean
          type: string
          user_created?: string | null
          width: number
        }
        Update: {
          color?: string | null
          dashboard?: string
          date_created?: string | null
          height?: number
          icon?: string | null
          id?: string
          name?: string | null
          note?: string | null
          options?: Json | null
          position_x?: number
          position_y?: number
          show_header?: boolean
          type?: string
          user_created?: string | null
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "directus_panels_dashboard_foreign"
            columns: ["dashboard"]
            isOneToOne: false
            referencedRelation: "directus_dashboards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directus_panels_user_created_foreign"
            columns: ["user_created"]
            isOneToOne: false
            referencedRelation: "directus_users"
            referencedColumns: ["id"]
          }
        ]
      }
      directus_permissions: {
        Row: {
          action: string
          collection: string
          fields: string | null
          id: number
          permissions: Json | null
          presets: Json | null
          role: string | null
          validation: Json | null
        }
        Insert: {
          action: string
          collection: string
          fields?: string | null
          id?: number
          permissions?: Json | null
          presets?: Json | null
          role?: string | null
          validation?: Json | null
        }
        Update: {
          action?: string
          collection?: string
          fields?: string | null
          id?: number
          permissions?: Json | null
          presets?: Json | null
          role?: string | null
          validation?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "directus_permissions_role_foreign"
            columns: ["role"]
            isOneToOne: false
            referencedRelation: "directus_roles"
            referencedColumns: ["id"]
          }
        ]
      }
      directus_presets: {
        Row: {
          bookmark: string | null
          collection: string | null
          color: string | null
          filter: Json | null
          icon: string | null
          id: number
          layout: string | null
          layout_options: Json | null
          layout_query: Json | null
          refresh_interval: number | null
          role: string | null
          search: string | null
          user: string | null
        }
        Insert: {
          bookmark?: string | null
          collection?: string | null
          color?: string | null
          filter?: Json | null
          icon?: string | null
          id?: number
          layout?: string | null
          layout_options?: Json | null
          layout_query?: Json | null
          refresh_interval?: number | null
          role?: string | null
          search?: string | null
          user?: string | null
        }
        Update: {
          bookmark?: string | null
          collection?: string | null
          color?: string | null
          filter?: Json | null
          icon?: string | null
          id?: number
          layout?: string | null
          layout_options?: Json | null
          layout_query?: Json | null
          refresh_interval?: number | null
          role?: string | null
          search?: string | null
          user?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "directus_presets_role_foreign"
            columns: ["role"]
            isOneToOne: false
            referencedRelation: "directus_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directus_presets_user_foreign"
            columns: ["user"]
            isOneToOne: false
            referencedRelation: "directus_users"
            referencedColumns: ["id"]
          }
        ]
      }
      directus_relations: {
        Row: {
          id: number
          junction_field: string | null
          many_collection: string
          many_field: string
          one_allowed_collections: string | null
          one_collection: string | null
          one_collection_field: string | null
          one_deselect_action: string
          one_field: string | null
          sort_field: string | null
        }
        Insert: {
          id?: number
          junction_field?: string | null
          many_collection: string
          many_field: string
          one_allowed_collections?: string | null
          one_collection?: string | null
          one_collection_field?: string | null
          one_deselect_action?: string
          one_field?: string | null
          sort_field?: string | null
        }
        Update: {
          id?: number
          junction_field?: string | null
          many_collection?: string
          many_field?: string
          one_allowed_collections?: string | null
          one_collection?: string | null
          one_collection_field?: string | null
          one_deselect_action?: string
          one_field?: string | null
          sort_field?: string | null
        }
        Relationships: []
      }
      directus_revisions: {
        Row: {
          activity: number
          collection: string
          data: Json | null
          delta: Json | null
          id: number
          item: string
          parent: number | null
          version: string | null
        }
        Insert: {
          activity: number
          collection: string
          data?: Json | null
          delta?: Json | null
          id?: number
          item: string
          parent?: number | null
          version?: string | null
        }
        Update: {
          activity?: number
          collection?: string
          data?: Json | null
          delta?: Json | null
          id?: number
          item?: string
          parent?: number | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "directus_revisions_activity_foreign"
            columns: ["activity"]
            isOneToOne: false
            referencedRelation: "directus_activity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directus_revisions_parent_foreign"
            columns: ["parent"]
            isOneToOne: false
            referencedRelation: "directus_revisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directus_revisions_version_foreign"
            columns: ["version"]
            isOneToOne: false
            referencedRelation: "directus_versions"
            referencedColumns: ["id"]
          }
        ]
      }
      directus_roles: {
        Row: {
          admin_access: boolean
          app_access: boolean
          description: string | null
          enforce_tfa: boolean
          icon: string
          id: string
          ip_access: string | null
          name: string
        }
        Insert: {
          admin_access?: boolean
          app_access?: boolean
          description?: string | null
          enforce_tfa?: boolean
          icon?: string
          id: string
          ip_access?: string | null
          name: string
        }
        Update: {
          admin_access?: boolean
          app_access?: boolean
          description?: string | null
          enforce_tfa?: boolean
          icon?: string
          id?: string
          ip_access?: string | null
          name?: string
        }
        Relationships: []
      }
      directus_sessions: {
        Row: {
          expires: string
          ip: string | null
          origin: string | null
          share: string | null
          token: string
          user: string | null
          user_agent: string | null
        }
        Insert: {
          expires: string
          ip?: string | null
          origin?: string | null
          share?: string | null
          token: string
          user?: string | null
          user_agent?: string | null
        }
        Update: {
          expires?: string
          ip?: string | null
          origin?: string | null
          share?: string | null
          token?: string
          user?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "directus_sessions_share_foreign"
            columns: ["share"]
            isOneToOne: false
            referencedRelation: "directus_shares"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directus_sessions_user_foreign"
            columns: ["user"]
            isOneToOne: false
            referencedRelation: "directus_users"
            referencedColumns: ["id"]
          }
        ]
      }
      directus_settings: {
        Row: {
          auth_login_attempts: number | null
          auth_password_policy: string | null
          basemaps: Json | null
          custom_aspect_ratios: Json | null
          custom_css: string | null
          default_appearance: string
          default_language: string
          default_theme_dark: string | null
          default_theme_light: string | null
          id: number
          mapbox_key: string | null
          module_bar: Json | null
          project_color: string
          project_descriptor: string | null
          project_logo: string | null
          project_name: string
          project_url: string | null
          public_background: string | null
          public_favicon: string | null
          public_foreground: string | null
          public_note: string | null
          storage_asset_presets: Json | null
          storage_asset_transform: string | null
          storage_default_folder: string | null
          theme_dark_overrides: Json | null
          theme_light_overrides: Json | null
        }
        Insert: {
          auth_login_attempts?: number | null
          auth_password_policy?: string | null
          basemaps?: Json | null
          custom_aspect_ratios?: Json | null
          custom_css?: string | null
          default_appearance?: string
          default_language?: string
          default_theme_dark?: string | null
          default_theme_light?: string | null
          id?: number
          mapbox_key?: string | null
          module_bar?: Json | null
          project_color?: string
          project_descriptor?: string | null
          project_logo?: string | null
          project_name?: string
          project_url?: string | null
          public_background?: string | null
          public_favicon?: string | null
          public_foreground?: string | null
          public_note?: string | null
          storage_asset_presets?: Json | null
          storage_asset_transform?: string | null
          storage_default_folder?: string | null
          theme_dark_overrides?: Json | null
          theme_light_overrides?: Json | null
        }
        Update: {
          auth_login_attempts?: number | null
          auth_password_policy?: string | null
          basemaps?: Json | null
          custom_aspect_ratios?: Json | null
          custom_css?: string | null
          default_appearance?: string
          default_language?: string
          default_theme_dark?: string | null
          default_theme_light?: string | null
          id?: number
          mapbox_key?: string | null
          module_bar?: Json | null
          project_color?: string
          project_descriptor?: string | null
          project_logo?: string | null
          project_name?: string
          project_url?: string | null
          public_background?: string | null
          public_favicon?: string | null
          public_foreground?: string | null
          public_note?: string | null
          storage_asset_presets?: Json | null
          storage_asset_transform?: string | null
          storage_default_folder?: string | null
          theme_dark_overrides?: Json | null
          theme_light_overrides?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "directus_settings_project_logo_foreign"
            columns: ["project_logo"]
            isOneToOne: false
            referencedRelation: "directus_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directus_settings_public_background_foreign"
            columns: ["public_background"]
            isOneToOne: false
            referencedRelation: "directus_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directus_settings_public_favicon_foreign"
            columns: ["public_favicon"]
            isOneToOne: false
            referencedRelation: "directus_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directus_settings_public_foreground_foreign"
            columns: ["public_foreground"]
            isOneToOne: false
            referencedRelation: "directus_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directus_settings_storage_default_folder_foreign"
            columns: ["storage_default_folder"]
            isOneToOne: false
            referencedRelation: "directus_folders"
            referencedColumns: ["id"]
          }
        ]
      }
      directus_shares: {
        Row: {
          collection: string
          date_created: string | null
          date_end: string | null
          date_start: string | null
          id: string
          item: string
          max_uses: number | null
          name: string | null
          password: string | null
          role: string | null
          times_used: number | null
          user_created: string | null
        }
        Insert: {
          collection: string
          date_created?: string | null
          date_end?: string | null
          date_start?: string | null
          id: string
          item: string
          max_uses?: number | null
          name?: string | null
          password?: string | null
          role?: string | null
          times_used?: number | null
          user_created?: string | null
        }
        Update: {
          collection?: string
          date_created?: string | null
          date_end?: string | null
          date_start?: string | null
          id?: string
          item?: string
          max_uses?: number | null
          name?: string | null
          password?: string | null
          role?: string | null
          times_used?: number | null
          user_created?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "directus_shares_collection_foreign"
            columns: ["collection"]
            isOneToOne: false
            referencedRelation: "directus_collections"
            referencedColumns: ["collection"]
          },
          {
            foreignKeyName: "directus_shares_role_foreign"
            columns: ["role"]
            isOneToOne: false
            referencedRelation: "directus_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directus_shares_user_created_foreign"
            columns: ["user_created"]
            isOneToOne: false
            referencedRelation: "directus_users"
            referencedColumns: ["id"]
          }
        ]
      }
      directus_translations: {
        Row: {
          id: string
          key: string
          language: string
          value: string
        }
        Insert: {
          id: string
          key: string
          language: string
          value: string
        }
        Update: {
          id?: string
          key?: string
          language?: string
          value?: string
        }
        Relationships: []
      }
      directus_users: {
        Row: {
          appearance: string | null
          auth_data: Json | null
          avatar: string | null
          description: string | null
          email: string | null
          email_notifications: boolean | null
          external_identifier: string | null
          first_name: string | null
          id: string
          language: string | null
          last_access: string | null
          last_name: string | null
          last_page: string | null
          location: string | null
          password: string | null
          provider: string
          role: string | null
          status: string
          tags: Json | null
          tfa_secret: string | null
          theme_dark: string | null
          theme_dark_overrides: Json | null
          theme_light: string | null
          theme_light_overrides: Json | null
          title: string | null
          token: string | null
        }
        Insert: {
          appearance?: string | null
          auth_data?: Json | null
          avatar?: string | null
          description?: string | null
          email?: string | null
          email_notifications?: boolean | null
          external_identifier?: string | null
          first_name?: string | null
          id: string
          language?: string | null
          last_access?: string | null
          last_name?: string | null
          last_page?: string | null
          location?: string | null
          password?: string | null
          provider?: string
          role?: string | null
          status?: string
          tags?: Json | null
          tfa_secret?: string | null
          theme_dark?: string | null
          theme_dark_overrides?: Json | null
          theme_light?: string | null
          theme_light_overrides?: Json | null
          title?: string | null
          token?: string | null
        }
        Update: {
          appearance?: string | null
          auth_data?: Json | null
          avatar?: string | null
          description?: string | null
          email?: string | null
          email_notifications?: boolean | null
          external_identifier?: string | null
          first_name?: string | null
          id?: string
          language?: string | null
          last_access?: string | null
          last_name?: string | null
          last_page?: string | null
          location?: string | null
          password?: string | null
          provider?: string
          role?: string | null
          status?: string
          tags?: Json | null
          tfa_secret?: string | null
          theme_dark?: string | null
          theme_dark_overrides?: Json | null
          theme_light?: string | null
          theme_light_overrides?: Json | null
          title?: string | null
          token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "directus_users_role_directus_roles_id_fk"
            columns: ["role"]
            isOneToOne: false
            referencedRelation: "directus_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directus_users_role_foreign"
            columns: ["role"]
            isOneToOne: false
            referencedRelation: "directus_roles"
            referencedColumns: ["id"]
          }
        ]
      }
      directus_versions: {
        Row: {
          collection: string
          date_created: string | null
          date_updated: string | null
          hash: string | null
          id: string
          item: string
          key: string
          name: string | null
          user_created: string | null
          user_updated: string | null
        }
        Insert: {
          collection: string
          date_created?: string | null
          date_updated?: string | null
          hash?: string | null
          id: string
          item: string
          key: string
          name?: string | null
          user_created?: string | null
          user_updated?: string | null
        }
        Update: {
          collection?: string
          date_created?: string | null
          date_updated?: string | null
          hash?: string | null
          id?: string
          item?: string
          key?: string
          name?: string | null
          user_created?: string | null
          user_updated?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "directus_versions_collection_foreign"
            columns: ["collection"]
            isOneToOne: false
            referencedRelation: "directus_collections"
            referencedColumns: ["collection"]
          },
          {
            foreignKeyName: "directus_versions_user_created_foreign"
            columns: ["user_created"]
            isOneToOne: false
            referencedRelation: "directus_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directus_versions_user_updated_foreign"
            columns: ["user_updated"]
            isOneToOne: false
            referencedRelation: "directus_users"
            referencedColumns: ["id"]
          }
        ]
      }
      directus_webhooks: {
        Row: {
          actions: string
          collections: string
          data: boolean
          headers: Json | null
          id: number
          method: string
          name: string
          status: string
          url: string
        }
        Insert: {
          actions: string
          collections: string
          data?: boolean
          headers?: Json | null
          id?: number
          method?: string
          name: string
          status?: string
          url: string
        }
        Update: {
          actions?: string
          collections?: string
          data?: boolean
          headers?: Json | null
          id?: number
          method?: string
          name?: string
          status?: string
          url?: string
        }
        Relationships: []
      }
      integration: {
        Row: {
          date_created: string | null
          date_updated: string | null
          featured: boolean | null
          icon: string | null
          id: string
          slug: string | null
          sort: number | null
          status: string
          user_created: string | null
          user_updated: string | null
        }
        Insert: {
          date_created?: string | null
          date_updated?: string | null
          featured?: boolean | null
          icon?: string | null
          id: string
          slug?: string | null
          sort?: number | null
          status?: string
          user_created?: string | null
          user_updated?: string | null
        }
        Update: {
          date_created?: string | null
          date_updated?: string | null
          featured?: boolean | null
          icon?: string | null
          id?: string
          slug?: string | null
          sort?: number | null
          status?: string
          user_created?: string | null
          user_updated?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_user_created_directus_users_id_fk"
            columns: ["user_created"]
            isOneToOne: false
            referencedRelation: "directus_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_user_created_foreign"
            columns: ["user_created"]
            isOneToOne: false
            referencedRelation: "directus_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_user_updated_directus_users_id_fk"
            columns: ["user_updated"]
            isOneToOne: false
            referencedRelation: "directus_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_user_updated_foreign"
            columns: ["user_updated"]
            isOneToOne: false
            referencedRelation: "directus_users"
            referencedColumns: ["id"]
          }
        ]
      }
      integration_categories: {
        Row: {
          date_created: string | null
          date_updated: string | null
          id: string
          slug: string | null
          sort: number | null
          status: string
          user_created: string | null
          user_updated: string | null
        }
        Insert: {
          date_created?: string | null
          date_updated?: string | null
          id: string
          slug?: string | null
          sort?: number | null
          status?: string
          user_created?: string | null
          user_updated?: string | null
        }
        Update: {
          date_created?: string | null
          date_updated?: string | null
          id?: string
          slug?: string | null
          sort?: number | null
          status?: string
          user_created?: string | null
          user_updated?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_categories_user_created_directus_users_id_fk"
            columns: ["user_created"]
            isOneToOne: false
            referencedRelation: "directus_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_categories_user_created_foreign"
            columns: ["user_created"]
            isOneToOne: false
            referencedRelation: "directus_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_categories_user_updated_directus_users_id_fk"
            columns: ["user_updated"]
            isOneToOne: false
            referencedRelation: "directus_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_categories_user_updated_foreign"
            columns: ["user_updated"]
            isOneToOne: false
            referencedRelation: "directus_users"
            referencedColumns: ["id"]
          }
        ]
      }
      integration_categories_translations: {
        Row: {
          id: number
          integration_categories_id: string | null
          languages_code: string | null
          name: string | null
        }
        Insert: {
          id?: number
          integration_categories_id?: string | null
          languages_code?: string | null
          name?: string | null
        }
        Update: {
          id?: number
          integration_categories_id?: string | null
          languages_code?: string | null
          name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_categories_translations_integrat__6f1c43_foreign"
            columns: ["integration_categories_id"]
            isOneToOne: false
            referencedRelation: "integration_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_categories_translations_integration_categories_id_i"
            columns: ["integration_categories_id"]
            isOneToOne: false
            referencedRelation: "integration_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_categories_translations_languages_code_foreign"
            columns: ["languages_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "integration_categories_translations_languages_code_languages_co"
            columns: ["languages_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          }
        ]
      }
      integration_integration_categories: {
        Row: {
          id: number
          integration_categories_id: string | null
          integration_id: string | null
        }
        Insert: {
          id?: number
          integration_categories_id?: string | null
          integration_id?: string | null
        }
        Update: {
          id?: number
          integration_categories_id?: string | null
          integration_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_integration_categories_integra__6b9b8145_foreign"
            columns: ["integration_categories_id"]
            isOneToOne: false
            referencedRelation: "integration_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_integration_categories_integration_categories_id_in"
            columns: ["integration_categories_id"]
            isOneToOne: false
            referencedRelation: "integration_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_integration_categories_integration_id_foreign"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integration"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_integration_categories_integration_id_integration_i"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integration"
            referencedColumns: ["id"]
          }
        ]
      }
      integration_solution: {
        Row: {
          id: number
          integration_id: string | null
          solution_id: string | null
        }
        Insert: {
          id?: number
          integration_id?: string | null
          solution_id?: string | null
        }
        Update: {
          id?: number
          integration_id?: string | null
          solution_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_solution_integration_id_integration_id_fk"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integration"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_solution_solution_id_solution_id_fk"
            columns: ["solution_id"]
            isOneToOne: false
            referencedRelation: "solution"
            referencedColumns: ["id"]
          }
        ]
      }
      integration_translations: {
        Row: {
          description: string | null
          id: number
          integration_id: string | null
          languages_code: string | null
          name: string | null
        }
        Insert: {
          description?: string | null
          id?: number
          integration_id?: string | null
          languages_code?: string | null
          name?: string | null
        }
        Update: {
          description?: string | null
          id?: number
          integration_id?: string | null
          languages_code?: string | null
          name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_translations_integration_id_foreign"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integration"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_translations_integration_id_integration_id_fk"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integration"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_translations_languages_code_foreign"
            columns: ["languages_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "integration_translations_languages_code_languages_code_fk"
            columns: ["languages_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          }
        ]
      }
      languages: {
        Row: {
          code: string
          direction: string | null
          name: string | null
        }
        Insert: {
          code?: string
          direction?: string | null
          name?: string | null
        }
        Update: {
          code?: string
          direction?: string | null
          name?: string | null
        }
        Relationships: []
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
          stripe_account_id: string | null
        }
        Insert: {
          id: string
          name: string
          personal?: boolean
          site?: string | null
          slug: string
          stripe_account_id?: string | null
        }
        Update: {
          id?: string
          name?: string
          personal?: boolean
          site?: string | null
          slug?: string
          stripe_account_id?: string | null
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
      provider: {
        Row: {
          date_created: string | null
          date_updated: string | null
          icon: string | null
          id: string
          slug: string | null
          sort: number | null
          status: string
          user_created: string | null
          user_updated: string | null
        }
        Insert: {
          date_created?: string | null
          date_updated?: string | null
          icon?: string | null
          id: string
          slug?: string | null
          sort?: number | null
          status?: string
          user_created?: string | null
          user_updated?: string | null
        }
        Update: {
          date_created?: string | null
          date_updated?: string | null
          icon?: string | null
          id?: string
          slug?: string | null
          sort?: number | null
          status?: string
          user_created?: string | null
          user_updated?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_user_created_foreign"
            columns: ["user_created"]
            isOneToOne: false
            referencedRelation: "directus_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_user_updated_foreign"
            columns: ["user_updated"]
            isOneToOne: false
            referencedRelation: "directus_users"
            referencedColumns: ["id"]
          }
        ]
      }
      provider_translations: {
        Row: {
          description: string | null
          id: number
          languages_code: string | null
          name: string | null
          provider_id: string | null
          summary: string | null
        }
        Insert: {
          description?: string | null
          id?: number
          languages_code?: string | null
          name?: string | null
          provider_id?: string | null
          summary?: string | null
        }
        Update: {
          description?: string | null
          id?: number
          languages_code?: string | null
          name?: string | null
          provider_id?: string | null
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_translations_languages_code_foreign"
            columns: ["languages_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "provider_translations_provider_id_foreign"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "provider"
            referencedColumns: ["id"]
          }
        ]
      }
      solution: {
        Row: {
          date_created: string | null
          date_updated: string | null
          id: string
          slug: string | null
          sort: number | null
          status: string
          user_created: string | null
          user_updated: string | null
        }
        Insert: {
          date_created?: string | null
          date_updated?: string | null
          id: string
          slug?: string | null
          sort?: number | null
          status?: string
          user_created?: string | null
          user_updated?: string | null
        }
        Update: {
          date_created?: string | null
          date_updated?: string | null
          id?: string
          slug?: string | null
          sort?: number | null
          status?: string
          user_created?: string | null
          user_updated?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "solution_user_created_directus_users_id_fk"
            columns: ["user_created"]
            isOneToOne: false
            referencedRelation: "directus_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solution_user_created_foreign"
            columns: ["user_created"]
            isOneToOne: false
            referencedRelation: "directus_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solution_user_updated_directus_users_id_fk"
            columns: ["user_updated"]
            isOneToOne: false
            referencedRelation: "directus_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solution_user_updated_foreign"
            columns: ["user_updated"]
            isOneToOne: false
            referencedRelation: "directus_users"
            referencedColumns: ["id"]
          }
        ]
      }
      solution_translations: {
        Row: {
          id: number
          languages_code: string | null
          name: string | null
          solution_id: string | null
          title: string | null
        }
        Insert: {
          id?: number
          languages_code?: string | null
          name?: string | null
          solution_id?: string | null
          title?: string | null
        }
        Update: {
          id?: number
          languages_code?: string | null
          name?: string | null
          solution_id?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "solution_translations_languages_code_foreign"
            columns: ["languages_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "solution_translations_languages_code_languages_code_fk"
            columns: ["languages_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "solution_translations_solution_id_foreign"
            columns: ["solution_id"]
            isOneToOne: false
            referencedRelation: "solution"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solution_translations_solution_id_solution_id_fk"
            columns: ["solution_id"]
            isOneToOne: false
            referencedRelation: "solution"
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
          current_context_id: string | null
          duration: number | null
          entry_context_id: string | null
          id: string
          state: Json | null
          status: string
          timestamp: string
          updated_at: string
          workflow_id: string
          workflow_version_id: string
        }
        Insert: {
          completed_at?: string | null
          current_context_id?: string | null
          duration?: number | null
          entry_context_id?: string | null
          id: string
          state?: Json | null
          status?: string
          timestamp?: string
          updated_at?: string
          workflow_id: string
          workflow_version_id: string
        }
        Update: {
          completed_at?: string | null
          current_context_id?: string | null
          duration?: number | null
          entry_context_id?: string | null
          id?: string
          state?: Json | null
          status?: string
          timestamp?: string
          updated_at?: string
          workflow_id?: string
          workflow_version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_execution_current_context_id_context_id_fk"
            columns: ["current_context_id"]
            isOneToOne: false
            referencedRelation: "context"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_execution_entry_context_id_context_id_fk"
            columns: ["entry_context_id"]
            isOneToOne: false
            referencedRelation: "context"
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
      workflow_execution_event: {
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
            foreignKeyName: "workflow_execution_event_source_node_id_node_execution_data_id_"
            columns: ["source_node_id"]
            isOneToOne: false
            referencedRelation: "node_execution_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_execution_event_target_node_id_node_execution_data_id_"
            columns: ["target_node_id"]
            isOneToOne: false
            referencedRelation: "node_execution_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_execution_event_workflow_execution_id_workflow_executi"
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
          context_id: string | null
          id: string
          previous_workflow_version_id: string | null
          project_id: string
          published_at: string | null
          version: number
          workflow_id: string
        }
        Insert: {
          change_log?: string | null
          context_id?: string | null
          id: string
          previous_workflow_version_id?: string | null
          project_id: string
          published_at?: string | null
          version?: number
          workflow_id: string
        }
        Update: {
          change_log?: string | null
          context_id?: string | null
          id?: string
          previous_workflow_version_id?: string | null
          project_id?: string
          published_at?: string | null
          version?: number
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_version_context_id_context_id_fk"
            columns: ["context_id"]
            isOneToOne: false
            referencedRelation: "context"
            referencedColumns: ["id"]
          },
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

