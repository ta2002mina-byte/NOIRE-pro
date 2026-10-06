// AUTO-GENERATED from the NOIRÉ Phase 1 migrations. Do not edit by hand.
// Regenerate on Supabase with: npx supabase gen types typescript --project-id <id> > types/database.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          restaurant_id: string;
          name: string;
          slug: string;
          description: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          name: string;
          slug: string;
          description?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "categories_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
        ];
      };
      chef_notes: {
        Row: {
          id: string;
          restaurant_id: string;
          author_id: string | null;
          ingredient_id: string | null;
          title: string;
          body: string;
          image_url: string | null;
          status: string;
          is_featured: boolean;
          publish_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          author_id?: string | null;
          ingredient_id?: string | null;
          title: string;
          body: string;
          image_url?: string | null;
          status?: string;
          is_featured?: boolean;
          publish_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          author_id?: string | null;
          ingredient_id?: string | null;
          title?: string;
          body?: string;
          image_url?: string | null;
          status?: string;
          is_featured?: boolean;
          publish_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chef_notes_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chef_notes_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chef_notes_ingredient_id_fkey";
            columns: ["ingredient_id"];
            isOneToOne: false;
            referencedRelation: "ingredients";
            referencedColumns: ["id"];
          },
        ];
      };
      dining_experiences: {
        Row: {
          id: string;
          restaurant_id: string;
          title: string;
          slug: string;
          description: string | null;
          image_url: string | null;
          min_guests: number | null;
          max_guests: number | null;
          available_areas: string[];
          preparation_notes: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          title: string;
          slug: string;
          description?: string | null;
          image_url?: string | null;
          min_guests?: number | null;
          max_guests?: number | null;
          available_areas?: string[];
          preparation_notes?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          title?: string;
          slug?: string;
          description?: string | null;
          image_url?: string | null;
          min_guests?: number | null;
          max_guests?: number | null;
          available_areas?: string[];
          preparation_notes?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dining_experiences_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
        ];
      };
      dining_history: {
        Row: {
          id: string;
          customer_id: string;
          restaurant_id: string;
          reservation_id: string | null;
          experience_id: string | null;
          visit_date: string;
          guest_count: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          restaurant_id: string;
          reservation_id?: string | null;
          experience_id?: string | null;
          visit_date: string;
          guest_count?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          restaurant_id?: string;
          reservation_id?: string | null;
          experience_id?: string | null;
          visit_date?: string;
          guest_count?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dining_history_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dining_history_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dining_history_reservation_id_fkey";
            columns: ["reservation_id"];
            isOneToOne: true;
            referencedRelation: "reservations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dining_history_experience_id_fkey";
            columns: ["experience_id"];
            isOneToOne: false;
            referencedRelation: "dining_experiences";
            referencedColumns: ["id"];
          },
        ];
      };
      dining_journal: {
        Row: {
          id: string;
          customer_id: string;
          menu_item_id: string | null;
          order_id: string | null;
          dining_history_id: string | null;
          personal_note: string | null;
          rating: number | null;
          visited_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          menu_item_id?: string | null;
          order_id?: string | null;
          dining_history_id?: string | null;
          personal_note?: string | null;
          rating?: number | null;
          visited_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          menu_item_id?: string | null;
          order_id?: string | null;
          dining_history_id?: string | null;
          personal_note?: string | null;
          rating?: number | null;
          visited_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dining_journal_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dining_journal_menu_item_id_fkey";
            columns: ["menu_item_id"];
            isOneToOne: false;
            referencedRelation: "menu_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dining_journal_dining_history_id_fkey";
            columns: ["dining_history_id"];
            isOneToOne: false;
            referencedRelation: "dining_history";
            referencedColumns: ["id"];
          },
        ];
      };
      dining_passports: {
        Row: {
          id: string;
          customer_id: string;
          visits_count: number;
          dishes_explored_count: number;
          experiences_completed_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          visits_count?: number;
          dishes_explored_count?: number;
          experiences_completed_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          visits_count?: number;
          dishes_explored_count?: number;
          experiences_completed_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dining_passports_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      dish_preferences: {
        Row: {
          id: string;
          menu_item_id: string;
          mood: string | null;
          flavor: string | null;
          texture: string | null;
          meal_type: string | null;
          occasion: string | null;
          spice_level: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          menu_item_id: string;
          mood?: string | null;
          flavor?: string | null;
          texture?: string | null;
          meal_type?: string | null;
          occasion?: string | null;
          spice_level?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          menu_item_id?: string;
          mood?: string | null;
          flavor?: string | null;
          texture?: string | null;
          meal_type?: string | null;
          occasion?: string | null;
          spice_level?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dish_preferences_menu_item_id_fkey";
            columns: ["menu_item_id"];
            isOneToOne: false;
            referencedRelation: "menu_items";
            referencedColumns: ["id"];
          },
        ];
      };
      favorites: {
        Row: {
          id: string;
          customer_id: string;
          menu_item_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          menu_item_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          menu_item_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "favorites_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "favorites_menu_item_id_fkey";
            columns: ["menu_item_id"];
            isOneToOne: false;
            referencedRelation: "menu_items";
            referencedColumns: ["id"];
          },
        ];
      };
      gallery: {
        Row: {
          id: string;
          restaurant_id: string;
          image_url: string;
          alt_text: string | null;
          caption: string | null;
          space: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          image_url: string;
          alt_text?: string | null;
          caption?: string | null;
          space?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          image_url?: string;
          alt_text?: string | null;
          caption?: string | null;
          space?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "gallery_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
        ];
      };
      ingredient_sources: {
        Row: {
          id: string;
          ingredient_id: string;
          source_name: string;
          source_type: string | null;
          location: string | null;
          season_start_month: number | null;
          season_end_month: number | null;
          harvest_date: string | null;
          notes: string | null;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          ingredient_id: string;
          source_name: string;
          source_type?: string | null;
          location?: string | null;
          season_start_month?: number | null;
          season_end_month?: number | null;
          harvest_date?: string | null;
          notes?: string | null;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          ingredient_id?: string;
          source_name?: string;
          source_type?: string | null;
          location?: string | null;
          season_start_month?: number | null;
          season_end_month?: number | null;
          harvest_date?: string | null;
          notes?: string | null;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ingredient_sources_ingredient_id_fkey";
            columns: ["ingredient_id"];
            isOneToOne: false;
            referencedRelation: "ingredients";
            referencedColumns: ["id"];
          },
        ];
      };
      ingredients: {
        Row: {
          id: string;
          restaurant_id: string;
          name: string;
          slug: string;
          description: string | null;
          image_url: string | null;
          season: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          name: string;
          slug: string;
          description?: string | null;
          image_url?: string | null;
          season?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          image_url?: string | null;
          season?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ingredients_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
        ];
      };
      menu_item_ingredients: {
        Row: {
          menu_item_id: string;
          ingredient_id: string;
          is_primary: boolean;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          menu_item_id: string;
          ingredient_id: string;
          is_primary?: boolean;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          menu_item_id?: string;
          ingredient_id?: string;
          is_primary?: boolean;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "menu_item_ingredients_menu_item_id_fkey";
            columns: ["menu_item_id"];
            isOneToOne: false;
            referencedRelation: "menu_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "menu_item_ingredients_ingredient_id_fkey";
            columns: ["ingredient_id"];
            isOneToOne: false;
            referencedRelation: "ingredients";
            referencedColumns: ["id"];
          },
        ];
      };
      menu_items: {
        Row: {
          id: string;
          restaurant_id: string;
          category_id: string | null;
          name: string;
          slug: string;
          description: string | null;
          story: string | null;
          chef_note: string | null;
          price: number;
          image_url: string | null;
          spice_level: number;
          diet_type: string | null;
          dietary_tags: string[];
          nutrition: Json | null;
          is_featured: boolean;
          is_chef_choice: boolean;
          is_available: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          category_id?: string | null;
          name: string;
          slug: string;
          description?: string | null;
          story?: string | null;
          chef_note?: string | null;
          price: number;
          image_url?: string | null;
          spice_level?: number;
          diet_type?: string | null;
          dietary_tags?: string[];
          nutrition?: Json | null;
          is_featured?: boolean;
          is_chef_choice?: boolean;
          is_available?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          category_id?: string | null;
          name?: string;
          slug?: string;
          description?: string | null;
          story?: string | null;
          chef_note?: string | null;
          price?: number;
          image_url?: string | null;
          spice_level?: number;
          diet_type?: string | null;
          dietary_tags?: string[];
          nutrition?: Json | null;
          is_featured?: boolean;
          is_chef_choice?: boolean;
          is_available?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "menu_items_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "menu_items_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          id: string;
          customer_id: string;
          type: string;
          title: string;
          body: string | null;
          link_url: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          type: string;
          title: string;
          body?: string | null;
          link_url?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          type?: string;
          title?: string;
          body?: string | null;
          link_url?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      passport_milestones: {
        Row: {
          id: string;
          customer_id: string;
          milestone_key: string;
          awarded_at: string;
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          customer_id: string;
          milestone_key: string;
          awarded_at?: string;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          customer_id?: string;
          milestone_key?: string;
          awarded_at?: string;
          metadata?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "passport_milestones_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "dining_passports";
            referencedColumns: ["customer_id"];
          },
        ];
      };
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
        ];
      };
      reservation_preferences: {
        Row: {
          id: string;
          reservation_id: string;
          preference: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          reservation_id: string;
          preference: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          reservation_id?: string;
          preference?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reservation_preferences_reservation_id_fkey";
            columns: ["reservation_id"];
            isOneToOne: false;
            referencedRelation: "reservations";
            referencedColumns: ["id"];
          },
        ];
      };
      reservations: {
        Row: {
          id: string;
          restaurant_id: string;
          customer_id: string | null;
          table_id: string | null;
          reservation_date: string;
          reservation_time: string;
          duration_minutes: number;
          guest_count: number;
          experience_id: string | null;
          occasion: string | null;
          special_request: string | null;
          contact_name: string | null;
          contact_phone: string | null;
          contact_email: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          customer_id?: string | null;
          table_id?: string | null;
          reservation_date: string;
          reservation_time: string;
          duration_minutes?: number;
          guest_count: number;
          experience_id?: string | null;
          occasion?: string | null;
          special_request?: string | null;
          contact_name?: string | null;
          contact_phone?: string | null;
          contact_email?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          customer_id?: string | null;
          table_id?: string | null;
          reservation_date?: string;
          reservation_time?: string;
          duration_minutes?: number;
          guest_count?: number;
          experience_id?: string | null;
          occasion?: string | null;
          special_request?: string | null;
          contact_name?: string | null;
          contact_phone?: string | null;
          contact_email?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reservations_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reservations_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reservations_table_id_fkey";
            columns: ["table_id"];
            isOneToOne: false;
            referencedRelation: "tables";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reservations_experience_id_fkey";
            columns: ["experience_id"];
            isOneToOne: false;
            referencedRelation: "dining_experiences";
            referencedColumns: ["id"];
          },
        ];
      };
      restaurant_stories: {
        Row: {
          id: string;
          restaurant_id: string;
          title: string;
          description: string | null;
          media_url: string | null;
          story_type: string;
          published_at: string | null;
          expires_at: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          title: string;
          description?: string | null;
          media_url?: string | null;
          story_type?: string;
          published_at?: string | null;
          expires_at?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          title?: string;
          description?: string | null;
          media_url?: string | null;
          story_type?: string;
          published_at?: string | null;
          expires_at?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "restaurant_stories_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
        ];
      };
      restaurants: {
        Row: {
          id: string;
          name: string;
          slug: string;
          tagline: string | null;
          description: string | null;
          address_line: string | null;
          city: string | null;
          region: string | null;
          postal_code: string | null;
          country: string | null;
          phone: string | null;
          email: string | null;
          latitude: number | null;
          longitude: number | null;
          timezone: string;
          currency: string;
          opening_hours: Json | null;
          reservation_duration_minutes: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          tagline?: string | null;
          description?: string | null;
          address_line?: string | null;
          city?: string | null;
          region?: string | null;
          postal_code?: string | null;
          country?: string | null;
          phone?: string | null;
          email?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          timezone?: string;
          currency?: string;
          opening_hours?: Json | null;
          reservation_duration_minutes?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          tagline?: string | null;
          description?: string | null;
          address_line?: string | null;
          city?: string | null;
          region?: string | null;
          postal_code?: string | null;
          country?: string | null;
          phone?: string | null;
          email?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          timezone?: string;
          currency?: string;
          opening_hours?: Json | null;
          reservation_duration_minutes?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
        ];
      };
      reviews: {
        Row: {
          id: string;
          customer_id: string;
          restaurant_id: string;
          menu_item_id: string | null;
          rating: number;
          title: string | null;
          body: string | null;
          status: string;
          is_verified_visit: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          restaurant_id: string;
          menu_item_id?: string | null;
          rating: number;
          title?: string | null;
          body?: string | null;
          status?: string;
          is_verified_visit?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          restaurant_id?: string;
          menu_item_id?: string | null;
          rating?: number;
          title?: string | null;
          body?: string | null;
          status?: string;
          is_verified_visit?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_menu_item_id_fkey";
            columns: ["menu_item_id"];
            isOneToOne: false;
            referencedRelation: "menu_items";
            referencedColumns: ["id"];
          },
        ];
      };
      contact_messages: {
        Row: {
          id: string;
          restaurant_id: string;
          name: string;
          email: string;
          phone: string | null;
          subject: string | null;
          message: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          name: string;
          email: string;
          phone?: string | null;
          subject?: string | null;
          message: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          subject?: string | null;
          message?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contact_messages_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
        ];
      };
      site_content: {
        Row: {
          id: string;
          restaurant_id: string;
          hero_image_url: string | null;
          hero_eyebrow: string | null;
          hero_heading: string | null;
          hero_subtext: string | null;
          hero_primary_label: string | null;
          hero_primary_href: string | null;
          hero_secondary_label: string | null;
          hero_secondary_href: string | null;
          banner_enabled: boolean;
          banner_message: string | null;
          banner_link_label: string | null;
          banner_link_href: string | null;
          banner_starts_at: string | null;
          banner_ends_at: string | null;
          footer_tagline: string | null;
          footer_copyright: string | null;
          footer_instagram_url: string | null;
          footer_facebook_url: string | null;
          footer_tiktok_url: string | null;
          footer_youtube_url: string | null;
          footer_x_url: string | null;
          footer_logo_url: string | null;
          footer_image_url: string | null;
          footer_links: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          hero_image_url?: string | null;
          hero_eyebrow?: string | null;
          hero_heading?: string | null;
          hero_subtext?: string | null;
          hero_primary_label?: string | null;
          hero_primary_href?: string | null;
          hero_secondary_label?: string | null;
          hero_secondary_href?: string | null;
          banner_enabled?: boolean;
          banner_message?: string | null;
          banner_link_label?: string | null;
          banner_link_href?: string | null;
          banner_starts_at?: string | null;
          banner_ends_at?: string | null;
          footer_tagline?: string | null;
          footer_copyright?: string | null;
          footer_instagram_url?: string | null;
          footer_facebook_url?: string | null;
          footer_tiktok_url?: string | null;
          footer_youtube_url?: string | null;
          footer_x_url?: string | null;
          footer_logo_url?: string | null;
          footer_image_url?: string | null;
          footer_links?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          hero_image_url?: string | null;
          hero_eyebrow?: string | null;
          hero_heading?: string | null;
          hero_subtext?: string | null;
          hero_primary_label?: string | null;
          hero_primary_href?: string | null;
          hero_secondary_label?: string | null;
          hero_secondary_href?: string | null;
          banner_enabled?: boolean;
          banner_message?: string | null;
          banner_link_label?: string | null;
          banner_link_href?: string | null;
          banner_starts_at?: string | null;
          banner_ends_at?: string | null;
          footer_tagline?: string | null;
          footer_copyright?: string | null;
          footer_instagram_url?: string | null;
          footer_facebook_url?: string | null;
          footer_tiktok_url?: string | null;
          footer_youtube_url?: string | null;
          footer_x_url?: string | null;
          footer_logo_url?: string | null;
          footer_image_url?: string | null;
          footer_links?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "site_content_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: true;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
        ];
      };
      tables: {
        Row: {
          id: string;
          restaurant_id: string;
          label: string;
          area: string;
          min_capacity: number;
          capacity: number;
          shape: string;
          pos_x: number;
          pos_y: number;
          width: number;
          height: number;
          notes: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          label: string;
          area: string;
          min_capacity?: number;
          capacity: number;
          shape?: string;
          pos_x?: number;
          pos_y?: number;
          width?: number;
          height?: number;
          notes?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          label?: string;
          area?: string;
          min_capacity?: number;
          capacity?: number;
          shape?: string;
          pos_x?: number;
          pos_y?: number;
          width?: number;
          height?: number;
          notes?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tables_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
        ];
      };
      taste_profiles: {
        Row: {
          id: string;
          customer_id: string;
          preferred_moods: string[];
          spice_preference: number | null;
          flavor_preferences: string[];
          texture_preferences: string[];
          dietary_preferences: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          preferred_moods?: string[];
          spice_preference?: number | null;
          flavor_preferences?: string[];
          texture_preferences?: string[];
          dietary_preferences?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          preferred_moods?: string[];
          spice_preference?: number | null;
          flavor_preferences?: string[];
          texture_preferences?: string[];
          dietary_preferences?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "taste_profiles_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      is_staff: { Args: Record<PropertyKey, never>; Returns: boolean };
      reserved_table_ids: {
        Args: { p_restaurant_id: string; p_date: string; p_time: string; p_duration_minutes?: number };
        Returns: string[];
      };
      set_user_role: { Args: { p_user_id: string; p_role: string }; Returns: undefined };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

type PublicSchema = Database['public'];
export type Tables<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Row'];
export type TablesInsert<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Update'];
