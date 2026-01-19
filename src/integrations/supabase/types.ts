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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      activation_codes: {
        Row: {
          code: string
          created_at: string
          duration_days: number
          expires_at: string
          id: string
          payment_proof_id: string | null
          payment_type: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          status: string
          updated_at: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          duration_days: number
          expires_at: string
          id?: string
          payment_proof_id?: string | null
          payment_type?: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          status?: string
          updated_at?: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          duration_days?: number
          expires_at?: string
          id?: string
          payment_proof_id?: string | null
          payment_type?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          status?: string
          updated_at?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      attendance: {
        Row: {
          branch_id: string | null
          check_in: string | null
          check_out: string | null
          created_at: string
          date: string
          employee_id: string
          id: string
          notes: string | null
          organization_id: string
          status: string | null
        }
        Insert: {
          branch_id?: string | null
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          date?: string
          employee_id: string
          id?: string
          notes?: string | null
          organization_id: string
          status?: string | null
        }
        Update: {
          branch_id?: string | null
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          date?: string
          employee_id?: string
          id?: string
          notes?: string | null
          organization_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          organization_id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "branches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      business_settings: {
        Row: {
          address: string | null
          business_name: string
          city: string | null
          country: string | null
          created_at: string
          email: string | null
          id: string
          logo_url: string | null
          organization_id: string
          phone: string | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          business_name: string
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          organization_id: string
          phone?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          business_name?: string
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          organization_id?: string
          phone?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cash_registers: {
        Row: {
          branch_id: string | null
          closed_at: string | null
          closed_by: string | null
          created_at: string
          current_balance: number
          id: string
          name: string
          opened_at: string | null
          opened_by: string | null
          opening_balance: number
          organization_id: string
          status: string | null
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          current_balance?: number
          id?: string
          name: string
          opened_at?: string | null
          opened_by?: string | null
          opening_balance?: number
          organization_id: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          current_balance?: number
          id?: string
          name?: string
          opened_at?: string | null
          opened_by?: string | null
          opening_balance?: number
          organization_id?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      code_redemption_logs: {
        Row: {
          code_id: string
          created_at: string
          failure_reason: string | null
          id: string
          ip_address: unknown
          organization_id: string | null
          success: boolean
          user_agent: string | null
          user_id: string
        }
        Insert: {
          code_id: string
          created_at?: string
          failure_reason?: string | null
          id?: string
          ip_address?: unknown
          organization_id?: string | null
          success?: boolean
          user_agent?: string | null
          user_id: string
        }
        Update: {
          code_id?: string
          created_at?: string
          failure_reason?: string | null
          id?: string
          ip_address?: unknown
          organization_id?: string | null
          success?: boolean
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          address: string | null
          city: string | null
          contact_type: string | null
          country: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          organization_id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          contact_type?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          contact_type?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_notes: {
        Row: {
          amount: number
          applied_date: string | null
          contact_id: string | null
          created_at: string
          credit_note_number: string
          id: string
          issued_date: string
          note_type: string
          notes: string | null
          organization_id: string
          purchase_return_id: string | null
          reason: string | null
          sale_return_id: string | null
          status: string | null
          tax_amount: number | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          amount?: number
          applied_date?: string | null
          contact_id?: string | null
          created_at?: string
          credit_note_number: string
          id?: string
          issued_date?: string
          note_type: string
          notes?: string | null
          organization_id: string
          purchase_return_id?: string | null
          reason?: string | null
          sale_return_id?: string | null
          status?: string | null
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string
        }
        Update: {
          amount?: number
          applied_date?: string | null
          contact_id?: string | null
          created_at?: string
          credit_note_number?: string
          id?: string
          issued_date?: string
          note_type?: string
          notes?: string | null
          organization_id?: string
          purchase_return_id?: string | null
          reason?: string | null
          sale_return_id?: string | null
          status?: string | null
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_notes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_notes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_notes_purchase_return_id_fkey"
            columns: ["purchase_return_id"]
            isOneToOne: false
            referencedRelation: "purchase_returns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_notes_sale_return_id_fkey"
            columns: ["sale_return_id"]
            isOneToOne: false
            referencedRelation: "sale_returns"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          created_at: string
          custom_message: string | null
          footer_text: string | null
          header_text: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          organization_id: string
          primary_color: string | null
          show_business_details: boolean | null
          show_items_table: boolean | null
          subject: string
          template_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          custom_message?: string | null
          footer_text?: string | null
          header_text?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          organization_id: string
          primary_color?: string | null
          show_business_details?: boolean | null
          show_items_table?: boolean | null
          subject: string
          template_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          custom_message?: string | null
          footer_text?: string | null
          header_text?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          organization_id?: string
          primary_color?: string | null
          show_business_details?: boolean | null
          show_items_table?: boolean | null
          subject?: string
          template_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_payroll_details: {
        Row: {
          bank_account_number: string | null
          bank_branch: string | null
          bank_name: string | null
          basic_salary: number | null
          created_at: string
          employee_id: string
          employment_type: string | null
          housing_allowance: number | null
          id: string
          nssf_number: string | null
          organization_id: string
          other_allowances: number | null
          tin_number: string | null
          transport_allowance: number | null
          updated_at: string
        }
        Insert: {
          bank_account_number?: string | null
          bank_branch?: string | null
          bank_name?: string | null
          basic_salary?: number | null
          created_at?: string
          employee_id: string
          employment_type?: string | null
          housing_allowance?: number | null
          id?: string
          nssf_number?: string | null
          organization_id: string
          other_allowances?: number | null
          tin_number?: string | null
          transport_allowance?: number | null
          updated_at?: string
        }
        Update: {
          bank_account_number?: string | null
          bank_branch?: string | null
          bank_name?: string | null
          basic_salary?: number | null
          created_at?: string
          employee_id?: string
          employment_type?: string | null
          housing_allowance?: number | null
          id?: string
          nssf_number?: string | null
          organization_id?: string
          other_allowances?: number | null
          tin_number?: string | null
          transport_allowance?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_payroll_details_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_payroll_details_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          branch_id: string | null
          created_at: string
          department: string | null
          email: string | null
          employee_id: string | null
          first_name: string
          hire_date: string | null
          id: string
          last_name: string
          organization_id: string
          phone: string | null
          position: string | null
          salary: number | null
          status: string | null
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          employee_id?: string | null
          first_name: string
          hire_date?: string | null
          id?: string
          last_name: string
          organization_id: string
          phone?: string | null
          position?: string | null
          salary?: number | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          employee_id?: string | null
          first_name?: string
          hire_date?: string | null
          id?: string
          last_name?: string
          organization_id?: string
          phone?: string | null
          position?: string | null
          salary?: number | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          branch_id: string | null
          category: string
          created_at: string
          created_by: string | null
          description: string
          expense_date: string
          id: string
          organization_id: string
          payment_method: string | null
          receipt_url: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          branch_id?: string | null
          category: string
          created_at?: string
          created_by?: string | null
          description: string
          expense_date?: string
          id?: string
          organization_id: string
          payment_method?: string | null
          receipt_url?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          branch_id?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string
          expense_date?: string
          id?: string
          organization_id?: string
          payment_method?: string | null
          receipt_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      faqs: {
        Row: {
          answer: string
          category: string | null
          created_at: string
          display_order: number | null
          id: string
          is_active: boolean | null
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          question?: string
          updated_at?: string
        }
        Relationships: []
      }
      feature_configs: {
        Row: {
          basic_enabled: boolean | null
          category: string | null
          created_at: string
          description: string | null
          enterprise_enabled: boolean | null
          feature_key: string
          feature_name: string
          free_enabled: boolean | null
          id: string
          premium_enabled: boolean | null
          updated_at: string
        }
        Insert: {
          basic_enabled?: boolean | null
          category?: string | null
          created_at?: string
          description?: string | null
          enterprise_enabled?: boolean | null
          feature_key: string
          feature_name: string
          free_enabled?: boolean | null
          id?: string
          premium_enabled?: boolean | null
          updated_at?: string
        }
        Update: {
          basic_enabled?: boolean | null
          category?: string | null
          created_at?: string
          description?: string | null
          enterprise_enabled?: boolean | null
          feature_key?: string
          feature_name?: string
          free_enabled?: boolean | null
          id?: string
          premium_enabled?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      footer_links: {
        Row: {
          category: string | null
          created_at: string
          display_order: number | null
          id: string
          is_active: boolean | null
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          title: string
          updated_at?: string
          url: string
        }
        Update: {
          category?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      inventory_movements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          movement_type: string
          notes: string | null
          organization_id: string
          product_id: string
          quantity: number
          reference_id: string | null
          reference_type: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          movement_type: string
          notes?: string | null
          organization_id: string
          product_id: string
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          movement_type?: string
          notes?: string | null
          organization_id?: string
          product_id?: string
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          branch_id: string | null
          contact_id: string
          created_at: string
          discount_amount: number | null
          due_date: string | null
          id: string
          invoice_date: string
          invoice_number: string
          notes: string | null
          organization_id: string
          status: string | null
          tax_amount: number | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          contact_id: string
          created_at?: string
          discount_amount?: number | null
          due_date?: string | null
          id?: string
          invoice_date?: string
          invoice_number: string
          notes?: string | null
          organization_id: string
          status?: string | null
          tax_amount?: number | null
          total_amount: number
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          contact_id?: string
          created_at?: string
          discount_amount?: number | null
          due_date?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          notes?: string | null
          organization_id?: string
          status?: string | null
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_pages: {
        Row: {
          content: string
          created_at: string
          id: string
          last_updated_by: string | null
          page_type: string
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          last_updated_by?: string | null
          page_type: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          last_updated_by?: string | null
          page_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      module_configs: {
        Row: {
          basic_enabled: boolean | null
          created_at: string
          description: string | null
          display_order: number | null
          enterprise_enabled: boolean | null
          free_enabled: boolean | null
          icon: string | null
          id: string
          is_active: boolean | null
          module_key: string
          module_name: string
          parent_module_id: string | null
          premium_enabled: boolean | null
          updated_at: string
        }
        Insert: {
          basic_enabled?: boolean | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          enterprise_enabled?: boolean | null
          free_enabled?: boolean | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          module_key: string
          module_name: string
          parent_module_id?: string | null
          premium_enabled?: boolean | null
          updated_at?: string
        }
        Update: {
          basic_enabled?: boolean | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          enterprise_enabled?: boolean | null
          free_enabled?: boolean | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          module_key?: string
          module_name?: string
          parent_module_id?: string | null
          premium_enabled?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_configs_parent_module_id_fkey"
            columns: ["parent_module_id"]
            isOneToOne: false
            referencedRelation: "module_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          message: string
          organization_id: string | null
          read: boolean
          title: string
          type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          message: string
          organization_id?: string | null
          read?: boolean
          title: string
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          message?: string
          organization_id?: string | null
          read?: boolean
          title?: string
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_content: {
        Row: {
          content: string | null
          content_key: string
          created_at: string
          display_order: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          metadata: Json | null
          subtitle: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          content?: string | null
          content_key: string
          created_at?: string
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          metadata?: Json | null
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          content?: string | null
          content_key?: string
          created_at?: string
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          metadata?: Json | null
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      organization_memberships: {
        Row: {
          branch_id: string | null
          id: string
          is_owner: boolean
          joined_at: string
          organization_id: string
          permissions: Json | null
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          branch_id?: string | null
          id?: string
          is_owner?: boolean
          joined_at?: string
          organization_id: string
          permissions?: Json | null
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          branch_id?: string | null
          id?: string
          is_owner?: boolean
          joined_at?: string
          organization_id?: string
          permissions?: Json | null
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_memberships_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_payments: {
        Row: {
          amount: number
          created_at: string
          currency: string | null
          id: string
          organization_id: string
          payment_type: string
          plan: Database["public"]["Enums"]["subscription_plan"] | null
          status: string
          stripe_session_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string | null
          id?: string
          organization_id: string
          payment_type: string
          plan?: Database["public"]["Enums"]["subscription_plan"] | null
          status?: string
          stripe_session_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          id?: string
          organization_id?: string
          payment_type?: string
          plan?: Database["public"]["Enums"]["subscription_plan"] | null
          status?: string
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          approved_at: string | null
          approved_by: string | null
          business_sector: Database["public"]["Enums"]["business_sector"]
          city: string | null
          country: string | null
          created_at: string
          description: string | null
          email: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          phone: string | null
          status: string | null
          subscription_end: string | null
          subscription_plan: Database["public"]["Enums"]["subscription_plan"]
          timezone: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          approved_at?: string | null
          approved_by?: string | null
          business_sector?: Database["public"]["Enums"]["business_sector"]
          city?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          phone?: string | null
          status?: string | null
          subscription_end?: string | null
          subscription_plan?: Database["public"]["Enums"]["subscription_plan"]
          timezone?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          approved_at?: string | null
          approved_by?: string | null
          business_sector?: Database["public"]["Enums"]["business_sector"]
          city?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          phone?: string | null
          status?: string | null
          subscription_end?: string | null
          subscription_plan?: Database["public"]["Enums"]["subscription_plan"]
          timezone?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      payment_proofs: {
        Row: {
          admin_notes: string | null
          amount: number
          approved_at: string | null
          approved_by: string | null
          created_at: string
          currency: string
          id: string
          notes: string | null
          organization_id: string
          payment_method: string
          payment_type: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          proof_image_url: string | null
          status: string
          transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          organization_id: string
          payment_method: string
          payment_type?: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          proof_image_url?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          organization_id?: string
          payment_method?: string
          payment_type?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          proof_image_url?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_proofs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_proofs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_config: {
        Row: {
          config_key: string
          config_value: Json
          created_at: string
          description: string | null
          id: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          config_key: string
          config_value: Json
          created_at?: string
          description?: string | null
          id?: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          config_key?: string
          config_value?: Json
          created_at?: string
          description?: string | null
          id?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_config_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_runs: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          period_month: number
          period_year: number
          processed_at: string | null
          processed_by: string | null
          status: string | null
          total_gross: number | null
          total_net: number | null
          total_nssf_employee: number | null
          total_nssf_employer: number | null
          total_paye: number | null
          total_sdl: number | null
          total_wcf: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          period_month: number
          period_year: number
          processed_at?: string | null
          processed_by?: string | null
          status?: string | null
          total_gross?: number | null
          total_net?: number | null
          total_nssf_employee?: number | null
          total_nssf_employer?: number | null
          total_paye?: number | null
          total_sdl?: number | null
          total_wcf?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          period_month?: number
          period_year?: number
          processed_at?: string | null
          processed_by?: string | null
          status?: string | null
          total_gross?: number | null
          total_net?: number | null
          total_nssf_employee?: number | null
          total_nssf_employer?: number | null
          total_paye?: number | null
          total_sdl?: number | null
          total_wcf?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_runs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      payslips: {
        Row: {
          basic_salary: number | null
          created_at: string
          employee_id: string
          gross_salary: number | null
          housing_allowance: number | null
          id: string
          net_salary: number | null
          nssf_employee: number | null
          nssf_employer: number | null
          organization_id: string
          other_allowances: number | null
          other_deductions: number | null
          paye: number | null
          payroll_run_id: string
          sdl_employer: number | null
          taxable_income: number | null
          total_deductions: number | null
          transport_allowance: number | null
          wcf_employer: number | null
        }
        Insert: {
          basic_salary?: number | null
          created_at?: string
          employee_id: string
          gross_salary?: number | null
          housing_allowance?: number | null
          id?: string
          net_salary?: number | null
          nssf_employee?: number | null
          nssf_employer?: number | null
          organization_id: string
          other_allowances?: number | null
          other_deductions?: number | null
          paye?: number | null
          payroll_run_id: string
          sdl_employer?: number | null
          taxable_income?: number | null
          total_deductions?: number | null
          transport_allowance?: number | null
          wcf_employer?: number | null
        }
        Update: {
          basic_salary?: number | null
          created_at?: string
          employee_id?: string
          gross_salary?: number | null
          housing_allowance?: number | null
          id?: string
          net_salary?: number | null
          nssf_employee?: number | null
          nssf_employer?: number | null
          organization_id?: string
          other_allowances?: number | null
          other_deductions?: number | null
          paye?: number | null
          payroll_run_id?: string
          sdl_employer?: number | null
          taxable_income?: number | null
          total_deductions?: number | null
          transport_allowance?: number | null
          wcf_employer?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payslips_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payslips_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payslips_payroll_run_id_fkey"
            columns: ["payroll_run_id"]
            isOneToOne: false
            referencedRelation: "payroll_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      product_brands: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          organization_id: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      product_taxes: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          organization_id: string
          rate: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          rate: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          rate?: number
          updated_at?: string
        }
        Relationships: []
      }
      product_units: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          organization_id: string
          short_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          short_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          short_name?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          brand_id: string | null
          category: string | null
          cost: number | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          min_stock_level: number | null
          name: string
          organization_id: string
          price: number | null
          sku: string | null
          stock_quantity: number | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          brand_id?: string | null
          category?: string | null
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          min_stock_level?: number | null
          name: string
          organization_id: string
          price?: number | null
          sku?: string | null
          stock_quantity?: number | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          brand_id?: string | null
          category?: string | null
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          min_stock_level?: number | null
          name?: string
          organization_id?: string
          price?: number | null
          sku?: string | null
          stock_quantity?: number | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "product_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          first_name: string | null
          id: string
          last_name: string | null
          organization_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          organization_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          organization_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          purchase_order_id: string
          quantity: number
          total_amount: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          purchase_order_id: string
          quantity: number
          total_amount: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          purchase_order_id?: string
          quantity?: number
          total_amount?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          branch_id: string | null
          created_at: string
          expected_date: string | null
          id: string
          notes: string | null
          order_date: string
          organization_id: string
          po_number: string
          status: string | null
          supplier_id: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          expected_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          organization_id: string
          po_number: string
          status?: string | null
          supplier_id?: string | null
          total_amount?: number
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          expected_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          organization_id?: string
          po_number?: string
          status?: string | null
          supplier_id?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_return_items: {
        Row: {
          condition: string | null
          created_at: string
          discount_amount: number | null
          id: string
          product_id: string
          purchase_return_id: string
          quantity: number
          tax_amount: number | null
          tax_rate: number | null
          total_amount: number
          unit: string | null
          unit_price: number
        }
        Insert: {
          condition?: string | null
          created_at?: string
          discount_amount?: number | null
          id?: string
          product_id: string
          purchase_return_id: string
          quantity: number
          tax_amount?: number | null
          tax_rate?: number | null
          total_amount: number
          unit?: string | null
          unit_price: number
        }
        Update: {
          condition?: string | null
          created_at?: string
          discount_amount?: number | null
          id?: string
          product_id?: string
          purchase_return_id?: string
          quantity?: number
          tax_amount?: number | null
          tax_rate?: number | null
          total_amount?: number
          unit?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_return_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_return_items_purchase_return_id_fkey"
            columns: ["purchase_return_id"]
            isOneToOne: false
            referencedRelation: "purchase_returns"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_returns: {
        Row: {
          branch_id: string | null
          created_at: string
          id: string
          notes: string | null
          organization_id: string
          purchase_order_id: string | null
          reason: string | null
          return_date: string
          return_number: string
          status: string | null
          supplier_id: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          organization_id: string
          purchase_order_id?: string | null
          reason?: string | null
          return_date?: string
          return_number: string
          status?: string | null
          supplier_id?: string | null
          total_amount?: number
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          organization_id?: string
          purchase_order_id?: string | null
          reason?: string | null
          return_date?: string
          return_number?: string
          status?: string | null
          supplier_id?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_returns_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          quotation_id: string
          total_amount: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity: number
          quotation_id: string
          total_amount: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          quotation_id?: string
          total_amount?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotation_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_items_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotations: {
        Row: {
          branch_id: string | null
          created_at: string
          id: string
          notes: string | null
          organization_id: string
          quotation_date: string
          quotation_number: string
          status: string | null
          supplier_id: string | null
          total_amount: number
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          organization_id: string
          quotation_date?: string
          quotation_number: string
          status?: string | null
          supplier_id?: string | null
          total_amount?: number
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          organization_id?: string
          quotation_date?: string
          quotation_number?: string
          status?: string | null
          supplier_id?: string | null
          total_amount?: number
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      sale_items: {
        Row: {
          created_at: string
          discount_amount: number | null
          id: string
          product_id: string
          quantity: number
          sale_id: string
          total_amount: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          discount_amount?: number | null
          id?: string
          product_id: string
          quantity: number
          sale_id: string
          total_amount: number
          unit_price: number
        }
        Update: {
          created_at?: string
          discount_amount?: number | null
          id?: string
          product_id?: string
          quantity?: number
          sale_id?: string
          total_amount?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_return_items: {
        Row: {
          condition: string | null
          created_at: string
          discount_amount: number | null
          id: string
          product_id: string
          quantity: number
          sale_return_id: string
          tax_amount: number | null
          tax_rate: number | null
          total_amount: number
          unit: string | null
          unit_price: number
        }
        Insert: {
          condition?: string | null
          created_at?: string
          discount_amount?: number | null
          id?: string
          product_id: string
          quantity: number
          sale_return_id: string
          tax_amount?: number | null
          tax_rate?: number | null
          total_amount: number
          unit?: string | null
          unit_price: number
        }
        Update: {
          condition?: string | null
          created_at?: string
          discount_amount?: number | null
          id?: string
          product_id?: string
          quantity?: number
          sale_return_id?: string
          tax_amount?: number | null
          tax_rate?: number | null
          total_amount?: number
          unit?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_return_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_return_items_sale_return_id_fkey"
            columns: ["sale_return_id"]
            isOneToOne: false
            referencedRelation: "sale_returns"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_returns: {
        Row: {
          branch_id: string | null
          contact_id: string | null
          created_at: string
          credit_note_id: string | null
          id: string
          notes: string | null
          organization_id: string
          reason: string | null
          refund_amount: number | null
          refund_reason: string | null
          refund_type: string | null
          return_date: string
          return_number: string
          sale_id: string | null
          status: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          contact_id?: string | null
          created_at?: string
          credit_note_id?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          reason?: string | null
          refund_amount?: number | null
          refund_reason?: string | null
          refund_type?: string | null
          return_date?: string
          return_number: string
          sale_id?: string | null
          status?: string | null
          total_amount?: number
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          contact_id?: string | null
          created_at?: string
          credit_note_id?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          reason?: string | null
          refund_amount?: number | null
          refund_reason?: string | null
          refund_type?: string | null
          return_date?: string
          return_number?: string
          sale_id?: string | null
          status?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sale_returns_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          branch_id: string | null
          confirmation_status: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          contact_id: string | null
          created_at: string
          discount_amount: number | null
          employee_id: string | null
          id: string
          notes: string | null
          organization_id: string
          payment_method: string | null
          payment_status: string | null
          rejection_reason: string | null
          sale_date: string
          sale_number: string | null
          tax_amount: number | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          confirmation_status?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          contact_id?: string | null
          created_at?: string
          discount_amount?: number | null
          employee_id?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          payment_method?: string | null
          payment_status?: string | null
          rejection_reason?: string | null
          sale_date?: string
          sale_number?: string | null
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          confirmation_status?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          contact_id?: string | null
          created_at?: string
          discount_amount?: number | null
          employee_id?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          payment_method?: string | null
          payment_status?: string | null
          rejection_reason?: string | null
          sale_date?: string
          sale_number?: string | null
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      super_admin_actions: {
        Row: {
          action_details: Json | null
          action_type: string
          created_at: string
          id: string
          super_admin_id: string
          target_organization_id: string | null
          target_user_id: string | null
        }
        Insert: {
          action_details?: Json | null
          action_type: string
          created_at?: string
          id?: string
          super_admin_id: string
          target_organization_id?: string | null
          target_user_id?: string | null
        }
        Update: {
          action_details?: Json | null
          action_type?: string
          created_at?: string
          id?: string
          super_admin_id?: string
          target_organization_id?: string | null
          target_user_id?: string | null
        }
        Relationships: []
      }
      system_logs: {
        Row: {
          action: string | null
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown
          level: string
          message: string
          module: string
          organization_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          level: string
          message: string
          module: string
          organization_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          level?: string
          message?: string
          module?: string
          organization_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      trash_bin: {
        Row: {
          deleted_at: string
          deleted_by: string | null
          id: string
          old_data: Json
          organization_id: string
          purge_at: string
          record_id: string
          table_name: string
        }
        Insert: {
          deleted_at?: string
          deleted_by?: string | null
          id?: string
          old_data: Json
          organization_id: string
          purge_at?: string
          record_id: string
          table_name: string
        }
        Update: {
          deleted_at?: string
          deleted_by?: string | null
          id?: string
          old_data?: Json
          organization_id?: string
          purge_at?: string
          record_id?: string
          table_name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_manage_user_profile: {
        Args: { profile_user_id: string }
        Returns: boolean
      }
      create_organization_with_membership: {
        Args: {
          org_description?: string
          org_name: string
          org_sector?: Database["public"]["Enums"]["business_sector"]
        }
        Returns: string
      }
      generate_activation_code: { Args: never; Returns: string }
      is_organization_owner: {
        Args: { org_id: string; user_id: string }
        Returns: boolean
      }
      is_super_admin: { Args: { check_user_id: string }; Returns: boolean }
      promote_to_admin: { Args: { target_user_id: string }; Returns: undefined }
      purge_expired_trash: { Args: never; Returns: undefined }
    }
    Enums: {
      business_sector:
        | "retail"
        | "manufacturing"
        | "technology"
        | "healthcare"
        | "finance"
        | "education"
        | "hospitality"
        | "real_estate"
        | "construction"
        | "transportation"
        | "agriculture"
        | "entertainment"
        | "consulting"
        | "non_profit"
        | "other"
      subscription_plan: "free" | "basic" | "premium" | "enterprise"
      user_role:
        | "super_admin"
        | "business_owner"
        | "manager"
        | "admin_staff"
        | "sales_staff"
        | "inventory_staff"
        | "finance_staff"
        | "cashier"
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
      business_sector: [
        "retail",
        "manufacturing",
        "technology",
        "healthcare",
        "finance",
        "education",
        "hospitality",
        "real_estate",
        "construction",
        "transportation",
        "agriculture",
        "entertainment",
        "consulting",
        "non_profit",
        "other",
      ],
      subscription_plan: ["free", "basic", "premium", "enterprise"],
      user_role: [
        "super_admin",
        "business_owner",
        "manager",
        "admin_staff",
        "sales_staff",
        "inventory_staff",
        "finance_staff",
        "cashier",
      ],
    },
  },
} as const
