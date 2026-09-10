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
      bodeguero_profiles: {
        Row: {
          bank_account_last4: string | null
          bank_name: string | null
          created_at: string
          email: string | null
          host_since: string
          phone: string | null
          preferred_comunas: string[]
          profile_id: string
          rating: number
          ratings_count: number
          rut: string | null
          updated_at: string
        }
        Insert: {
          bank_account_last4?: string | null
          bank_name?: string | null
          created_at?: string
          email?: string | null
          host_since?: string
          phone?: string | null
          preferred_comunas?: string[]
          profile_id: string
          rating?: number
          ratings_count?: number
          rut?: string | null
          updated_at?: string
        }
        Update: {
          bank_account_last4?: string | null
          bank_name?: string | null
          created_at?: string
          email?: string | null
          host_since?: string
          phone?: string | null
          preferred_comunas?: string[]
          profile_id?: string
          rating?: number
          ratings_count?: number
          rut?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bodeguero_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bodeguero_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          base_amount: number
          capacity_m3: number | null
          commission_amount: number
          contract_no: string
          created_at: string
          ended_at: string | null
          id: string
          m2: number
          next_charge_date: string | null
          price_per_m2: number
          pyme_id: string
          refund_amount: number | null
          start_date: string | null
          status: Database["public"]["Enums"]["contract_status"]
          termination_days_used: number | null
          total_amount: number
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          base_amount: number
          capacity_m3?: number | null
          commission_amount: number
          contract_no?: string
          created_at?: string
          ended_at?: string | null
          id?: string
          m2: number
          next_charge_date?: string | null
          price_per_m2: number
          pyme_id: string
          refund_amount?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          termination_days_used?: number | null
          total_amount: number
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          base_amount?: number
          capacity_m3?: number | null
          commission_amount?: number
          contract_no?: string
          created_at?: string
          ended_at?: string | null
          id?: string
          m2?: number
          next_charge_date?: string | null
          price_per_m2?: number
          pyme_id?: string
          refund_amount?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          termination_days_used?: number | null
          total_amount?: number
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_pyme_id_fkey"
            columns: ["pyme_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_pyme_id_fkey"
            columns: ["pyme_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouse_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          bodeguero_id: string
          created_at: string
          id: string
          last_message_at: string | null
          pyme_id: string
          warehouse_id: string | null
        }
        Insert: {
          bodeguero_id: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          pyme_id: string
          warehouse_id?: string | null
        }
        Update: {
          bodeguero_id?: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          pyme_id?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_bodeguero_id_fkey"
            columns: ["bodeguero_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_bodeguero_id_fkey"
            columns: ["bodeguero_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_pyme_id_fkey"
            columns: ["pyme_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_pyme_id_fkey"
            columns: ["pyme_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouse_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      discrepancies: {
        Row: {
          capacity_m3: number | null
          code: string
          created_at: string
          declared_m3: number | null
          declared_units: number
          evidence_photo_url: string | null
          excess_m3: number | null
          host_note: string | null
          id: string
          received_m3: number | null
          received_units: number
          resolution: string | null
          resolved_at: string | null
          resolved_by: string | null
          shipment_id: string
          status: Database["public"]["Enums"]["discrepancy_status"]
          type: Database["public"]["Enums"]["discrepancy_type"]
          units_over: number
          units_short: number
          updated_at: string
        }
        Insert: {
          capacity_m3?: number | null
          code?: string
          created_at?: string
          declared_m3?: number | null
          declared_units?: number
          evidence_photo_url?: string | null
          excess_m3?: number | null
          host_note?: string | null
          id?: string
          received_m3?: number | null
          received_units?: number
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          shipment_id: string
          status?: Database["public"]["Enums"]["discrepancy_status"]
          type: Database["public"]["Enums"]["discrepancy_type"]
          units_over?: number
          units_short?: number
          updated_at?: string
        }
        Update: {
          capacity_m3?: number | null
          code?: string
          created_at?: string
          declared_m3?: number | null
          declared_units?: number
          evidence_photo_url?: string | null
          excess_m3?: number | null
          host_note?: string | null
          id?: string
          received_m3?: number | null
          received_units?: number
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          shipment_id?: string
          status?: Database["public"]["Enums"]["discrepancy_status"]
          type?: Database["public"]["Enums"]["discrepancy_type"]
          units_over?: number
          units_short?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "discrepancies_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discrepancies_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discrepancies_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      discrepancy_notes: {
        Row: {
          author_id: string
          body: string
          created_at: string
          discrepancy_id: string
          id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          discrepancy_id: string
          id?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          discrepancy_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discrepancy_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discrepancy_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discrepancy_notes_discrepancy_id_fkey"
            columns: ["discrepancy_id"]
            isOneToOne: false
            referencedRelation: "discrepancies"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_notes: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          incident_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          incident_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          incident_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_notes_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          code: string
          created_at: string
          id: string
          pyme_id: string | null
          related_id: string | null
          related_type: string | null
          resolved_at: string | null
          severity: Database["public"]["Enums"]["incident_severity"]
          status: Database["public"]["Enums"]["incident_status"]
          title: string
          warehouse_id: string | null
        }
        Insert: {
          code?: string
          created_at?: string
          id?: string
          pyme_id?: string | null
          related_id?: string | null
          related_type?: string | null
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["incident_severity"]
          status?: Database["public"]["Enums"]["incident_status"]
          title: string
          warehouse_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          pyme_id?: string | null
          related_id?: string | null
          related_type?: string | null
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["incident_severity"]
          status?: Database["public"]["Enums"]["incident_status"]
          title?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incidents_pyme_id_fkey"
            columns: ["pyme_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_pyme_id_fkey"
            columns: ["pyme_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouse_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          id: string
          position_label: string | null
          product_id: string
          quantity: number
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          id?: string
          position_label?: string | null
          product_id: string
          quantity?: number
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          id?: string
          position_label?: string | null
          product_id?: string
          quantity?: number
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouse_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          comuna: string | null
          created_at: string
          email: string
          id: string
          message: string | null
          name: string | null
          role_interest: Database["public"]["Enums"]["user_role"]
          source: string | null
        }
        Insert: {
          comuna?: string | null
          created_at?: string
          email: string
          id?: string
          message?: string | null
          name?: string | null
          role_interest?: Database["public"]["Enums"]["user_role"]
          source?: string | null
        }
        Update: {
          comuna?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          name?: string | null
          role_interest?: Database["public"]["Enums"]["user_role"]
          source?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string | null
          conversation_id: string
          created_at: string
          duration_seconds: number | null
          id: string
          kind: string
          media_url: string | null
          read_at: string | null
          sender_id: string
        }
        Insert: {
          body?: string | null
          conversation_id: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          kind?: string
          media_url?: string | null
          read_at?: string | null
          sender_id: string
        }
        Update: {
          body?: string | null
          conversation_id?: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          kind?: string
          media_url?: string | null
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          email: boolean
          profile_id: string
          push: boolean
          topics: Json
          updated_at: string
        }
        Insert: {
          email?: boolean
          profile_id: string
          push?: boolean
          topics?: Json
          updated_at?: string
        }
        Update: {
          email?: boolean
          profile_id?: string
          push?: boolean
          topics?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_preferences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string
          link: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind: string
          link?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          link?: string | null
          read_at?: string | null
          title?: string
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
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_events: {
        Row: {
          actor_id: string | null
          created_at: string
          id: string
          note: string | null
          order_id: string
          photo_url: string | null
          status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: string
          note?: string | null
          order_id: string
          photo_url?: string | null
          status: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: string
          note?: string | null
          order_id?: string
          photo_url?: string | null
          status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "order_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          name: string
          order_id: string
          picked: boolean
          product_id: string
          quantity: number
          sku: string
          unit_price: number
        }
        Insert: {
          id?: string
          name: string
          order_id: string
          picked?: boolean
          product_id: string
          quantity: number
          sku: string
          unit_price?: number
        }
        Update: {
          id?: string
          name?: string
          order_id?: string
          picked?: boolean
          product_id?: string
          quantity?: number
          sku?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          buyer_address: string
          buyer_comuna: string
          buyer_name: string
          buyer_phone: string | null
          channel: Database["public"]["Enums"]["sales_channel"]
          code: string
          courier_cost: number | null
          courier_name: string | null
          courier_receipt_url: string | null
          created_at: string
          delivered_at: string | null
          delivery_method: Database["public"]["Enums"]["delivery_method"] | null
          delivery_notes: string | null
          delivery_photo_url: string | null
          distance_km: number | null
          eta_minutes: number | null
          external_ref: string | null
          id: string
          items_total: number
          packing_photo_url: string | null
          pyme_id: string
          rating: number | null
          shipping_cost: number
          shipping_zone: string | null
          status: Database["public"]["Enums"]["order_status"]
          total_amount: number | null
          tracking_number: string | null
          tracking_token: string
          tracking_url: string | null
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          buyer_address: string
          buyer_comuna: string
          buyer_name: string
          buyer_phone?: string | null
          channel?: Database["public"]["Enums"]["sales_channel"]
          code?: string
          courier_cost?: number | null
          courier_name?: string | null
          courier_receipt_url?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_method?:
            | Database["public"]["Enums"]["delivery_method"]
            | null
          delivery_notes?: string | null
          delivery_photo_url?: string | null
          distance_km?: number | null
          eta_minutes?: number | null
          external_ref?: string | null
          id?: string
          items_total?: number
          packing_photo_url?: string | null
          pyme_id: string
          rating?: number | null
          shipping_cost?: number
          shipping_zone?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_amount?: number | null
          tracking_number?: string | null
          tracking_token?: string
          tracking_url?: string | null
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          buyer_address?: string
          buyer_comuna?: string
          buyer_name?: string
          buyer_phone?: string | null
          channel?: Database["public"]["Enums"]["sales_channel"]
          code?: string
          courier_cost?: number | null
          courier_name?: string | null
          courier_receipt_url?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_method?:
            | Database["public"]["Enums"]["delivery_method"]
            | null
          delivery_notes?: string | null
          delivery_photo_url?: string | null
          distance_km?: number | null
          eta_minutes?: number | null
          external_ref?: string | null
          id?: string
          items_total?: number
          packing_photo_url?: string | null
          pyme_id?: string
          rating?: number | null
          shipping_cost?: number
          shipping_zone?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_amount?: number | null
          tracking_number?: string | null
          tracking_token?: string
          tracking_url?: string | null
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_pyme_id_fkey"
            columns: ["pyme_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_pyme_id_fkey"
            columns: ["pyme_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouse_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          brand: string
          created_at: string
          exp_month: number | null
          exp_year: number | null
          holder_name: string | null
          id: string
          is_default: boolean
          last4: string
          profile_id: string
          provider: string
          provider_token: string | null
        }
        Insert: {
          brand: string
          created_at?: string
          exp_month?: number | null
          exp_year?: number | null
          holder_name?: string | null
          id?: string
          is_default?: boolean
          last4: string
          profile_id: string
          provider?: string
          provider_token?: string | null
        }
        Update: {
          brand?: string
          created_at?: string
          exp_month?: number | null
          exp_year?: number | null
          holder_name?: string | null
          id?: string
          is_default?: boolean
          last4?: string
          profile_id?: string
          provider?: string
          provider_token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_methods_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          attempt: number
          contract_id: string | null
          created_at: string
          failure_reason: string | null
          held_at: string | null
          id: string
          payment_method_id: string | null
          provider: string
          provider_ref: string | null
          pyme_id: string
          refund_amount: number | null
          refunded_at: string | null
          released_at: string | null
          status: Database["public"]["Enums"]["payment_status"]
        }
        Insert: {
          amount: number
          attempt?: number
          contract_id?: string | null
          created_at?: string
          failure_reason?: string | null
          held_at?: string | null
          id?: string
          payment_method_id?: string | null
          provider?: string
          provider_ref?: string | null
          pyme_id: string
          refund_amount?: number | null
          refunded_at?: string | null
          released_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Update: {
          amount?: number
          attempt?: number
          contract_id?: string | null
          created_at?: string
          failure_reason?: string | null
          held_at?: string | null
          id?: string
          payment_method_id?: string | null
          provider?: string
          provider_ref?: string | null
          pyme_id?: string
          refund_amount?: number | null
          refunded_at?: string | null
          released_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "payments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_pyme_id_fkey"
            columns: ["pyme_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_pyme_id_fkey"
            columns: ["pyme_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_items: {
        Row: {
          amount: number
          contract_id: string | null
          created_at: string
          description: string
          id: string
          payment_id: string | null
          payout_id: string
        }
        Insert: {
          amount: number
          contract_id?: string | null
          created_at?: string
          description: string
          id?: string
          payment_id?: string | null
          payout_id: string
        }
        Update: {
          amount?: number
          contract_id?: string | null
          created_at?: string
          description?: string
          id?: string
          payment_id?: string | null
          payout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_items_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_items_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_items_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "payouts"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          bodeguero_id: string
          commission_amount: number
          created_at: string
          gross_amount: number
          id: string
          net_amount: number
          period_end: string
          period_start: string
          released_at: string | null
          status: Database["public"]["Enums"]["payout_status"]
        }
        Insert: {
          bodeguero_id: string
          commission_amount?: number
          created_at?: string
          gross_amount?: number
          id?: string
          net_amount?: number
          period_end: string
          period_start: string
          released_at?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
        }
        Update: {
          bodeguero_id?: string
          commission_amount?: number
          created_at?: string
          gross_amount?: number
          id?: string
          net_amount?: number
          period_end?: string
          period_start?: string
          released_at?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
        }
        Relationships: [
          {
            foreignKeyName: "payouts_bodeguero_id_fkey"
            columns: ["bodeguero_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_bodeguero_id_fkey"
            columns: ["bodeguero_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          category: string | null
          created_at: string
          id: string
          name: string
          photo_url: string | null
          pyme_id: string
          sku: string
          unit_volume_m3: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          category?: string | null
          created_at?: string
          id?: string
          name: string
          photo_url?: string | null
          pyme_id: string
          sku: string
          unit_volume_m3?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string | null
          created_at?: string
          id?: string
          name?: string
          photo_url?: string | null
          pyme_id?: string
          sku?: string
          unit_volume_m3?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_pyme_id_fkey"
            columns: ["pyme_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_pyme_id_fkey"
            columns: ["pyme_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          verified: boolean
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          verified?: boolean
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          verified?: boolean
        }
        Relationships: []
      }
      pyme_profiles: {
        Row: {
          address: string | null
          business_name: string
          comuna: string | null
          created_at: string
          email: string | null
          giro: string | null
          legal_name: string | null
          phone: string | null
          profile_id: string
          rut: string | null
          sales_channels: Database["public"]["Enums"]["sales_channel"][]
          updated_at: string
        }
        Insert: {
          address?: string | null
          business_name: string
          comuna?: string | null
          created_at?: string
          email?: string | null
          giro?: string | null
          legal_name?: string | null
          phone?: string | null
          profile_id: string
          rut?: string | null
          sales_channels?: Database["public"]["Enums"]["sales_channel"][]
          updated_at?: string
        }
        Update: {
          address?: string | null
          business_name?: string
          comuna?: string | null
          created_at?: string
          email?: string | null
          giro?: string | null
          legal_name?: string | null
          phone?: string | null
          profile_id?: string
          rut?: string | null
          sales_channels?: Database["public"]["Enums"]["sales_channel"][]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pyme_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pyme_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shipment_items: {
        Row: {
          category: string | null
          declared_qty: number
          id: string
          name: string
          product_id: string
          received_qty: number | null
          shipment_id: string
          sku: string
          unit_volume_m3: number
        }
        Insert: {
          category?: string | null
          declared_qty: number
          id?: string
          name: string
          product_id: string
          received_qty?: number | null
          shipment_id: string
          sku: string
          unit_volume_m3?: number
        }
        Update: {
          category?: string | null
          declared_qty?: number
          id?: string
          name?: string
          product_id?: string
          received_qty?: number | null
          shipment_id?: string
          sku?: string
          unit_volume_m3?: number
        }
        Relationships: [
          {
            foreignKeyName: "shipment_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipment_items_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      shipments: {
        Row: {
          capacity_m3: number | null
          code: string
          contract_id: string | null
          created_at: string
          declared_volume_m3: number
          description: string | null
          dispatch_photo_url: string | null
          dispatched_at: string | null
          host_note: string | null
          id: string
          method: Database["public"]["Enums"]["shipment_method"]
          packages_count: number
          pickup_address: string | null
          pyme_id: string
          received_at: string | null
          received_volume_m3: number | null
          reception_photo_url: string | null
          status: Database["public"]["Enums"]["shipment_status"]
          updated_at: string
          warehouse_id: string
          weight_kg: number | null
        }
        Insert: {
          capacity_m3?: number | null
          code?: string
          contract_id?: string | null
          created_at?: string
          declared_volume_m3?: number
          description?: string | null
          dispatch_photo_url?: string | null
          dispatched_at?: string | null
          host_note?: string | null
          id?: string
          method?: Database["public"]["Enums"]["shipment_method"]
          packages_count?: number
          pickup_address?: string | null
          pyme_id: string
          received_at?: string | null
          received_volume_m3?: number | null
          reception_photo_url?: string | null
          status?: Database["public"]["Enums"]["shipment_status"]
          updated_at?: string
          warehouse_id: string
          weight_kg?: number | null
        }
        Update: {
          capacity_m3?: number | null
          code?: string
          contract_id?: string | null
          created_at?: string
          declared_volume_m3?: number
          description?: string | null
          dispatch_photo_url?: string | null
          dispatched_at?: string | null
          host_note?: string | null
          id?: string
          method?: Database["public"]["Enums"]["shipment_method"]
          packages_count?: number
          pickup_address?: string | null
          pyme_id?: string
          received_at?: string | null
          received_volume_m3?: number | null
          reception_photo_url?: string | null
          status?: Database["public"]["Enums"]["shipment_status"]
          updated_at?: string
          warehouse_id?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shipments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_pyme_id_fkey"
            columns: ["pyme_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_pyme_id_fkey"
            columns: ["pyme_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouse_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_counts: {
        Row: {
          counted_at: string
          counted_by: string | null
          delta: number | null
          digital_qty: number
          id: string
          physical_qty: number
          product_id: string
          warehouse_id: string
        }
        Insert: {
          counted_at?: string
          counted_by?: string | null
          delta?: number | null
          digital_qty: number
          id?: string
          physical_qty: number
          product_id: string
          warehouse_id: string
        }
        Update: {
          counted_at?: string
          counted_by?: string | null
          delta?: number | null
          digital_qty?: number
          id?: string
          physical_qty?: number
          product_id?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_counts_counted_by_fkey"
            columns: ["counted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_counts_counted_by_fkey"
            columns: ["counted_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_counts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_counts_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouse_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_counts_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          note: string | null
          product_id: string
          quantity: number
          reference_id: string | null
          reference_type: string | null
          type: Database["public"]["Enums"]["movement_type"]
          warehouse_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          product_id: string
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
          type: Database["public"]["Enums"]["movement_type"]
          warehouse_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          product_id?: string
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
          type?: Database["public"]["Enums"]["movement_type"]
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouse_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_notes: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          ticket_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          ticket_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_notes_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          code: string
          created_at: string
          id: string
          opened_by: string
          reason: string | null
          related_id: string | null
          related_type: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
        }
        Insert: {
          code?: string
          created_at?: string
          id?: string
          opened_by: string
          reason?: string | null
          related_id?: string | null
          related_type?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          opened_by?: string
          reason?: string | null
          related_id?: string | null
          related_type?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_checklist: {
        Row: {
          checked_at: string | null
          checked_by: string | null
          hint: string | null
          id: string
          item: string
          status: string
          warehouse_id: string
        }
        Insert: {
          checked_at?: string | null
          checked_by?: string | null
          hint?: string | null
          id?: string
          item: string
          status?: string
          warehouse_id: string
        }
        Update: {
          checked_at?: string | null
          checked_by?: string | null
          hint?: string | null
          id?: string
          item?: string
          status?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_checklist_checked_by_fkey"
            columns: ["checked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_checklist_checked_by_fkey"
            columns: ["checked_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_checklist_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouse_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_checklist_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_photos: {
        Row: {
          created_at: string
          id: string
          sort_order: number
          storage_path: string
          warehouse_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          sort_order?: number
          storage_path: string
          warehouse_id: string
        }
        Update: {
          created_at?: string
          id?: string
          sort_order?: number
          storage_path?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_photos_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouse_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_photos_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouses: {
        Row: {
          access_24_7: boolean
          address: string
          address_reference: string | null
          bodeguero_id: string
          capacity_m3: number | null
          code: string
          comuna: string
          created_at: string
          description: string | null
          id: string
          lat: number | null
          lng: number | null
          price_per_m2: number
          published_at: string | null
          rating: number
          ratings_count: number
          region: string
          sector_label: string | null
          services: string[]
          status: Database["public"]["Enums"]["warehouse_status"]
          total_m2: number
          updated_at: string
        }
        Insert: {
          access_24_7?: boolean
          address: string
          address_reference?: string | null
          bodeguero_id: string
          capacity_m3?: number | null
          code?: string
          comuna: string
          created_at?: string
          description?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          price_per_m2: number
          published_at?: string | null
          rating?: number
          ratings_count?: number
          region?: string
          sector_label?: string | null
          services?: string[]
          status?: Database["public"]["Enums"]["warehouse_status"]
          total_m2: number
          updated_at?: string
        }
        Update: {
          access_24_7?: boolean
          address?: string
          address_reference?: string | null
          bodeguero_id?: string
          capacity_m3?: number | null
          code?: string
          comuna?: string
          created_at?: string
          description?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          price_per_m2?: number
          published_at?: string | null
          rating?: number
          ratings_count?: number
          region?: string
          sector_label?: string | null
          services?: string[]
          status?: Database["public"]["Enums"]["warehouse_status"]
          total_m2?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouses_bodeguero_id_fkey"
            columns: ["bodeguero_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouses_bodeguero_id_fkey"
            columns: ["bodeguero_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          verified: boolean | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          verified?: boolean | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          verified?: boolean | null
        }
        Relationships: []
      }
      warehouse_listings: {
        Row: {
          access_24_7: boolean | null
          address_reference: string | null
          available_m2: number | null
          bodeguero_avatar: string | null
          bodeguero_id: string | null
          bodeguero_name: string | null
          bodeguero_rating: number | null
          capacity_m3: number | null
          code: string | null
          comuna: string | null
          description: string | null
          id: string | null
          lat: number | null
          lng: number | null
          occupancy_pct: number | null
          photo_path: string | null
          price_per_m2: number | null
          published_at: string | null
          rating: number | null
          ratings_count: number | null
          region: string | null
          sector_label: string | null
          services: string[] | null
          total_m2: number | null
        }
        Relationships: [
          {
            foreignKeyName: "warehouses_bodeguero_id_fkey"
            columns: ["bodeguero_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouses_bodeguero_id_fkey"
            columns: ["bodeguero_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      advance_order: {
        Args: {
          p_note?: string
          p_order_id: string
          p_photo_url?: string
          p_status: Database["public"]["Enums"]["order_status"]
        }
        Returns: {
          buyer_address: string
          buyer_comuna: string
          buyer_name: string
          buyer_phone: string | null
          channel: Database["public"]["Enums"]["sales_channel"]
          code: string
          courier_cost: number | null
          courier_name: string | null
          courier_receipt_url: string | null
          created_at: string
          delivered_at: string | null
          delivery_method: Database["public"]["Enums"]["delivery_method"] | null
          delivery_notes: string | null
          delivery_photo_url: string | null
          distance_km: number | null
          eta_minutes: number | null
          external_ref: string | null
          id: string
          items_total: number
          packing_photo_url: string | null
          pyme_id: string
          rating: number | null
          shipping_cost: number
          shipping_zone: string | null
          status: Database["public"]["Enums"]["order_status"]
          total_amount: number | null
          tracking_number: string | null
          tracking_token: string
          tracking_url: string | null
          updated_at: string
          warehouse_id: string
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      apply_order_status: {
        Args: {
          p_actor: string
          p_note: string
          p_order_id: string
          p_photo_url: string
          p_status: Database["public"]["Enums"]["order_status"]
        }
        Returns: {
          buyer_address: string
          buyer_comuna: string
          buyer_name: string
          buyer_phone: string | null
          channel: Database["public"]["Enums"]["sales_channel"]
          code: string
          courier_cost: number | null
          courier_name: string | null
          courier_receipt_url: string | null
          created_at: string
          delivered_at: string | null
          delivery_method: Database["public"]["Enums"]["delivery_method"] | null
          delivery_notes: string | null
          delivery_photo_url: string | null
          distance_km: number | null
          eta_minutes: number | null
          external_ref: string | null
          id: string
          items_total: number
          packing_photo_url: string | null
          pyme_id: string
          rating: number | null
          shipping_cost: number
          shipping_zone: string | null
          status: Database["public"]["Enums"]["order_status"]
          total_amount: number | null
          tracking_number: string | null
          tracking_token: string
          tracking_url: string | null
          updated_at: string
          warehouse_id: string
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      confirm_reception: {
        Args: {
          p_counts?: Json
          p_note?: string
          p_photo_url?: string
          p_received_volume_m3?: number
          p_shipment_id: string
        }
        Returns: {
          capacity_m3: number | null
          code: string
          contract_id: string | null
          created_at: string
          declared_volume_m3: number
          description: string | null
          dispatch_photo_url: string | null
          dispatched_at: string | null
          host_note: string | null
          id: string
          method: Database["public"]["Enums"]["shipment_method"]
          packages_count: number
          pickup_address: string | null
          pyme_id: string
          received_at: string | null
          received_volume_m3: number | null
          reception_photo_url: string | null
          status: Database["public"]["Enums"]["shipment_status"]
          updated_at: string
          warehouse_id: string
          weight_kg: number | null
        }
        SetofOptions: {
          from: "*"
          to: "shipments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_contract: {
        Args: {
          p_m2: number
          p_payment_method_id?: string
          p_warehouse_id: string
        }
        Returns: {
          base_amount: number
          capacity_m3: number | null
          commission_amount: number
          contract_no: string
          created_at: string
          ended_at: string | null
          id: string
          m2: number
          next_charge_date: string | null
          price_per_m2: number
          pyme_id: string
          refund_amount: number | null
          start_date: string | null
          status: Database["public"]["Enums"]["contract_status"]
          termination_days_used: number | null
          total_amount: number
          updated_at: string
          warehouse_id: string
        }
        SetofOptions: {
          from: "*"
          to: "contracts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      current_role_name: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      dispatch_shipment: {
        Args: { p_photo_url?: string; p_shipment_id: string }
        Returns: {
          capacity_m3: number | null
          code: string
          contract_id: string | null
          created_at: string
          declared_volume_m3: number
          description: string | null
          dispatch_photo_url: string | null
          dispatched_at: string | null
          host_note: string | null
          id: string
          method: Database["public"]["Enums"]["shipment_method"]
          packages_count: number
          pickup_address: string | null
          pyme_id: string
          received_at: string | null
          received_volume_m3: number | null
          reception_photo_url: string | null
          status: Database["public"]["Enums"]["shipment_status"]
          updated_at: string
          warehouse_id: string
          weight_kg: number | null
        }
        SetofOptions: {
          from: "*"
          to: "shipments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      host_commission_rate: { Args: never; Returns: number }
      host_stores_product: { Args: { product: string }; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_warehouse_party: { Args: { warehouse: string }; Returns: boolean }
      notify: {
        Args: {
          always?: boolean
          body?: string
          kind: string
          link?: string
          target: string
          title: string
        }
        Returns: string
      }
      owns_warehouse: { Args: { warehouse: string }; Returns: boolean }
      platform_commission_rate: { Args: never; Returns: number }
      product_owner: { Args: { product: string }; Returns: string }
      register_courier: {
        Args: {
          p_courier_cost?: number
          p_courier_name: string
          p_order_id: string
          p_receipt_url?: string
          p_tracking_number?: string
          p_tracking_url?: string
        }
        Returns: {
          buyer_address: string
          buyer_comuna: string
          buyer_name: string
          buyer_phone: string | null
          channel: Database["public"]["Enums"]["sales_channel"]
          code: string
          courier_cost: number | null
          courier_name: string | null
          courier_receipt_url: string | null
          created_at: string
          delivered_at: string | null
          delivery_method: Database["public"]["Enums"]["delivery_method"] | null
          delivery_notes: string | null
          delivery_photo_url: string | null
          distance_km: number | null
          eta_minutes: number | null
          external_ref: string | null
          id: string
          items_total: number
          packing_photo_url: string | null
          pyme_id: string
          rating: number | null
          shipping_cost: number
          shipping_zone: string | null
          status: Database["public"]["Enums"]["order_status"]
          total_amount: number | null
          tracking_number: string | null
          tracking_token: string
          tracking_url: string | null
          updated_at: string
          warehouse_id: string
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      stack_height_m: { Args: never; Returns: number }
      terminate_contract: {
        Args: { p_contract_id: string; p_days_used: number }
        Returns: {
          base_amount: number
          capacity_m3: number | null
          commission_amount: number
          contract_no: string
          created_at: string
          ended_at: string | null
          id: string
          m2: number
          next_charge_date: string | null
          price_per_m2: number
          pyme_id: string
          refund_amount: number | null
          start_date: string | null
          status: Database["public"]["Enums"]["contract_status"]
          termination_days_used: number | null
          total_amount: number
          updated_at: string
          warehouse_id: string
        }
        SetofOptions: {
          from: "*"
          to: "contracts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      track_order: {
        Args: { p_token: string }
        Returns: {
          buyer_address: string
          buyer_comuna: string
          buyer_name: string
          code: string
          courier_name: string
          created_at: string
          delivered_at: string
          delivery_notes: string
          delivery_photo_url: string
          items_total: number
          origin_comuna: string
          shipping_cost: number
          status: Database["public"]["Enums"]["order_status"]
          total_amount: number
          tracking_number: string
          tracking_url: string
        }[]
      }
      track_order_events: {
        Args: { p_token: string }
        Returns: {
          created_at: string
          note: string
          status: Database["public"]["Enums"]["order_status"]
        }[]
      }
      track_order_items: {
        Args: { p_token: string }
        Returns: {
          name: string
          quantity: number
          sku: string
          unit_price: number
        }[]
      }
    }
    Enums: {
      contract_status: "pending_payment" | "active" | "ended" | "cancelled"
      delivery_method:
        | "buyer_pickup"
        | "external_courier"
        | "integrated_courier"
      discrepancy_status:
        | "open"
        | "notified"
        | "accepted"
        | "recount"
        | "escalated"
        | "resolved"
      discrepancy_type: "units" | "volume" | "both"
      incident_severity: "low" | "medium" | "high"
      incident_status: "open" | "in_progress" | "resolved"
      movement_type: "inbound" | "outbound" | "adjustment" | "transfer"
      order_status:
        | "pending"
        | "queued"
        | "picking"
        | "ready"
        | "picked_up"
        | "in_transit"
        | "delivered"
        | "cancelled"
      payment_status: "pending" | "held" | "released" | "refunded" | "failed"
      payout_status: "scheduled" | "released" | "failed"
      sales_channel: "mercadolibre" | "shopify" | "woocommerce" | "manual"
      shipment_method: "own" | "external_courier"
      shipment_status:
        | "draft"
        | "ready"
        | "in_transit"
        | "received"
        | "discrepancy"
      ticket_status: "open" | "in_progress" | "resolved"
      user_role: "pyme" | "bodeguero" | "admin" | "repartidor"
      warehouse_status:
        | "draft"
        | "pending_review"
        | "active"
        | "paused"
        | "rejected"
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
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string | null
          versioning_status: string
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
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
          versioning_status?: string
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
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
          versioning_status?: string
        }
        Relationships: []
      }
      buckets_analytics: {
        Row: {
          created_at: string
          deleted_at: string | null
          format: string
          id: string
          name: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      buckets_vectors: {
        Row: {
          created_at: string
          id: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
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
          archived_at: string | null
          bucket_id: string | null
          created_at: string | null
          id: string
          is_delete_marker: boolean
          is_versioned: boolean
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          archived_at?: string | null
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          is_delete_marker?: boolean
          is_versioned?: boolean
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          archived_at?: string | null
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          is_delete_marker?: boolean
          is_versioned?: boolean
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          metadata: Json | null
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          metadata?: Json | null
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          metadata?: Json | null
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      vector_indexes: {
        Row: {
          bucket_id: string
          created_at: string
          data_type: string
          dimension: number
          distance_metric: string
          id: string
          metadata_configuration: Json | null
          name: string
          updated_at: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          data_type: string
          dimension: number
          distance_metric: string
          id?: string
          metadata_configuration?: Json | null
          name: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          data_type?: string
          dimension?: number
          distance_metric?: string
          id?: string
          metadata_configuration?: Json | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vector_indexes_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets_vectors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      allow_any_operation: {
        Args: { expected_operations: string[] }
        Returns: boolean
      }
      allow_only_operation: {
        Args: { expected_operation: string }
        Returns: boolean
      }
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string }
        Returns: undefined
      }
      extension: { Args: { name: string }; Returns: string }
      filename: { Args: { name: string }; Returns: string }
      foldername: { Args: { name: string }; Returns: string[] }
      get_common_prefix: {
        Args: { p_delimiter: string; p_key: string; p_prefix: string }
        Returns: string
      }
      get_size_by_bucket: {
        Args: never
        Returns: {
          bucket_id: string
          size: number
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
          prefix_param: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          _bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_token?: string
          prefix_param: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      operation: { Args: never; Returns: string }
      search: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_by_timestamp: {
        Args: {
          p_bucket_id: string
          p_level: number
          p_limit: number
          p_prefix: string
          p_sort_column: string
          p_sort_column_after: string
          p_sort_order: string
          p_start_after: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v2: {
        Args: {
          bucket_name: string
          levels?: number
          limits?: number
          prefix: string
          sort_column?: string
          sort_column_after?: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      buckettype: "STANDARD" | "ANALYTICS" | "VECTOR"
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
    Enums: {
      contract_status: ["pending_payment", "active", "ended", "cancelled"],
      delivery_method: [
        "buyer_pickup",
        "external_courier",
        "integrated_courier",
      ],
      discrepancy_status: [
        "open",
        "notified",
        "accepted",
        "recount",
        "escalated",
        "resolved",
      ],
      discrepancy_type: ["units", "volume", "both"],
      incident_severity: ["low", "medium", "high"],
      incident_status: ["open", "in_progress", "resolved"],
      movement_type: ["inbound", "outbound", "adjustment", "transfer"],
      order_status: [
        "pending",
        "queued",
        "picking",
        "ready",
        "picked_up",
        "in_transit",
        "delivered",
        "cancelled",
      ],
      payment_status: ["pending", "held", "released", "refunded", "failed"],
      payout_status: ["scheduled", "released", "failed"],
      sales_channel: ["mercadolibre", "shopify", "woocommerce", "manual"],
      shipment_method: ["own", "external_courier"],
      shipment_status: [
        "draft",
        "ready",
        "in_transit",
        "received",
        "discrepancy",
      ],
      ticket_status: ["open", "in_progress", "resolved"],
      user_role: ["pyme", "bodeguero", "admin", "repartidor"],
      warehouse_status: [
        "draft",
        "pending_review",
        "active",
        "paused",
        "rejected",
      ],
    },
  },
  storage: {
    Enums: {
      buckettype: ["STANDARD", "ANALYTICS", "VECTOR"],
    },
  },
} as const
