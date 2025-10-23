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
      admit_card_content_sections: {
        Row: {
          content: string
          created_at: string
          display_order: number | null
          id: string
          is_active: boolean | null
          section_key: string
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          section_key: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          section_key?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      admit_cards: {
        Row: {
          author_id: string | null
          content: string | null
          created_at: string
          download_link: string | null
          exam_name: string
          featured: boolean | null
          id: string
          published: boolean | null
          published_date: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          content?: string | null
          created_at?: string
          download_link?: string | null
          exam_name: string
          featured?: boolean | null
          id?: string
          published?: boolean | null
          published_date?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          content?: string | null
          created_at?: string
          download_link?: string | null
          exam_name?: string
          featured?: boolean | null
          id?: string
          published?: boolean | null
          published_date?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      affiliate_products: {
        Row: {
          affiliate_url: string
          category_id: string | null
          commission_rate: number | null
          created_at: string
          currency: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          price: number | null
          updated_at: string
        }
        Insert: {
          affiliate_url: string
          category_id?: string | null
          commission_rate?: number | null
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          price?: number | null
          updated_at?: string
        }
        Update: {
          affiliate_url?: string
          category_id?: string | null
          commission_rate?: number | null
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          price?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      article_likes: {
        Row: {
          article_id: string
          created_at: string
          id: string
          ip_address: string | null
          user_id: string | null
        }
        Insert: {
          article_id: string
          created_at?: string
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Update: {
          article_id?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      article_shares: {
        Row: {
          article_id: string
          created_at: string
          id: string
          ip_address: string | null
          platform: string
          user_id: string | null
        }
        Insert: {
          article_id: string
          created_at?: string
          id?: string
          ip_address?: string | null
          platform: string
          user_id?: string | null
        }
        Update: {
          article_id?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          platform?: string
          user_id?: string | null
        }
        Relationships: []
      }
      article_translations: {
        Row: {
          ai_summary: string | null
          article_id: string
          content: string
          created_at: string
          excerpt: string | null
          id: string
          language_code: string
          meta_description: string | null
          meta_title: string | null
          seo_keywords: string[] | null
          slug: string
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          ai_summary?: string | null
          article_id: string
          content: string
          created_at?: string
          excerpt?: string | null
          id?: string
          language_code: string
          meta_description?: string | null
          meta_title?: string | null
          seo_keywords?: string[] | null
          slug: string
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          ai_summary?: string | null
          article_id?: string
          content?: string
          created_at?: string
          excerpt?: string | null
          id?: string
          language_code?: string
          meta_description?: string | null
          meta_title?: string | null
          seo_keywords?: string[] | null
          slug?: string
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      articles: {
        Row: {
          ads_enabled: boolean | null
          affiliate_products_enabled: boolean | null
          ai_keywords: string[] | null
          ai_summary: string | null
          author: string
          author_id: string | null
          canonical_url: string | null
          category_id: string
          comments_count: number | null
          content: string
          created_at: string
          excerpt: string | null
          featured: boolean | null
          has_translations: boolean | null
          id: string
          image_url: string | null
          is_premium: boolean | null
          language: string | null
          language_code: string | null
          likes_count: number | null
          meta_description: string | null
          meta_title: string | null
          original_article_id: string | null
          premium_preview_length: number | null
          published: boolean | null
          published_at: string | null
          reading_time: number | null
          seo_keywords: string[] | null
          seo_score: number | null
          shares_count: number | null
          slug: string
          summary: string | null
          tags: string[] | null
          title: string
          translations_available: boolean | null
          updated_at: string
          views_count: number | null
        }
        Insert: {
          ads_enabled?: boolean | null
          affiliate_products_enabled?: boolean | null
          ai_keywords?: string[] | null
          ai_summary?: string | null
          author?: string
          author_id?: string | null
          canonical_url?: string | null
          category_id: string
          comments_count?: number | null
          content: string
          created_at?: string
          excerpt?: string | null
          featured?: boolean | null
          has_translations?: boolean | null
          id?: string
          image_url?: string | null
          is_premium?: boolean | null
          language?: string | null
          language_code?: string | null
          likes_count?: number | null
          meta_description?: string | null
          meta_title?: string | null
          original_article_id?: string | null
          premium_preview_length?: number | null
          published?: boolean | null
          published_at?: string | null
          reading_time?: number | null
          seo_keywords?: string[] | null
          seo_score?: number | null
          shares_count?: number | null
          slug: string
          summary?: string | null
          tags?: string[] | null
          title: string
          translations_available?: boolean | null
          updated_at?: string
          views_count?: number | null
        }
        Update: {
          ads_enabled?: boolean | null
          affiliate_products_enabled?: boolean | null
          ai_keywords?: string[] | null
          ai_summary?: string | null
          author?: string
          author_id?: string | null
          canonical_url?: string | null
          category_id?: string
          comments_count?: number | null
          content?: string
          created_at?: string
          excerpt?: string | null
          featured?: boolean | null
          has_translations?: boolean | null
          id?: string
          image_url?: string | null
          is_premium?: boolean | null
          language?: string | null
          language_code?: string | null
          likes_count?: number | null
          meta_description?: string | null
          meta_title?: string | null
          original_article_id?: string | null
          premium_preview_length?: number | null
          published?: boolean | null
          published_at?: string | null
          reading_time?: number | null
          seo_keywords?: string[] | null
          seo_score?: number | null
          shares_count?: number | null
          slug?: string
          summary?: string | null
          tags?: string[] | null
          title?: string
          translations_available?: boolean | null
          updated_at?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "articles_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_original_article_id_fkey"
            columns: ["original_article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          parent_id: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          parent_id?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          article_id: string
          author_email: string | null
          author_name: string | null
          content: string
          created_at: string
          id: string
          is_approved: boolean
          updated_at: string
          user_id: string | null
        }
        Insert: {
          article_id: string
          author_email?: string | null
          author_name?: string | null
          content: string
          created_at?: string
          id?: string
          is_approved?: boolean
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          article_id?: string
          author_email?: string | null
          author_name?: string | null
          content?: string
          created_at?: string
          id?: string
          is_approved?: boolean
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_trending_scores: {
        Row: {
          article_id: string
          engagement_score: number
          freshness_score: number
          id: string
          score_date: string
          trending_score: number
        }
        Insert: {
          article_id: string
          engagement_score?: number
          freshness_score?: number
          id?: string
          score_date?: string
          trending_score?: number
        }
        Update: {
          article_id?: string
          engagement_score?: number
          freshness_score?: number
          id?: string
          score_date?: string
          trending_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "daily_trending_scores_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_list: {
        Row: {
          category: string
          created_at: string
          exam_name: string
          id: string
          logo_url: string | null
          short_description: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          exam_name: string
          id?: string
          logo_url?: string | null
          short_description?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          exam_name?: string
          id?: string
          logo_url?: string | null
          short_description?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      exam_papers: {
        Row: {
          created_at: string
          download_count: number | null
          exam_id: string | null
          file_size: number | null
          file_url: string
          id: string
          tier: string | null
          updated_at: string
          uploaded_by: string | null
          year: number
        }
        Insert: {
          created_at?: string
          download_count?: number | null
          exam_id?: string | null
          file_size?: number | null
          file_url: string
          id?: string
          tier?: string | null
          updated_at?: string
          uploaded_by?: string | null
          year: number
        }
        Update: {
          created_at?: string
          download_count?: number | null
          exam_id?: string | null
          file_size?: number | null
          file_url?: string
          id?: string
          tier?: string | null
          updated_at?: string
          uploaded_by?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "exam_papers_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exam_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_papers_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_papers_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      languages: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          native_name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          native_name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          native_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      monetization_analytics: {
        Row: {
          article_id: string | null
          created_at: string
          currency: string | null
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          revenue_amount: number | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          article_id?: string | null
          created_at?: string
          currency?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          revenue_amount?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          article_id?: string | null
          created_at?: string
          currency?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          revenue_amount?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      newsletter_preferences: {
        Row: {
          active: boolean
          categories: string[] | null
          created_at: string
          email: string
          frequency: string
          id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          active?: boolean
          categories?: string[] | null
          created_at?: string
          email: string
          frequency?: string
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          active?: boolean
          categories?: string[] | null
          created_at?: string
          email?: string
          frequency?: string
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          email: string
          id: string
          is_active: boolean
          subscribed_at: string
        }
        Insert: {
          email: string
          id?: string
          is_active?: boolean
          subscribed_at?: string
        }
        Update: {
          email?: string
          id?: string
          is_active?: boolean
          subscribed_at?: string
        }
        Relationships: []
      }
      photo_stories: {
        Row: {
          alt_text: string
          author_id: string | null
          caption: string | null
          created_at: string
          id: string
          media_url: string
          publish_at: string | null
          slug: string
          status: string
          theme: string | null
          title: string
          updated_at: string
        }
        Insert: {
          alt_text: string
          author_id?: string | null
          caption?: string | null
          created_at?: string
          id?: string
          media_url: string
          publish_at?: string | null
          slug: string
          status?: string
          theme?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          alt_text?: string
          author_id?: string | null
          caption?: string | null
          created_at?: string
          id?: string
          media_url?: string
          publish_at?: string | null
          slug?: string
          status?: string
          theme?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          author_bio: string | null
          author_image_url: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          job_title: string | null
          role: string | null
          updated_at: string
          username: string
        }
        Insert: {
          author_bio?: string | null
          author_image_url?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          job_title?: string | null
          role?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          author_bio?: string | null
          author_image_url?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          job_title?: string | null
          role?: string | null
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string | null
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id?: string | null
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string | null
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          resource: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          resource?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          resource?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      seo_automation_logs: {
        Row: {
          action_type: string
          article_id: string | null
          created_at: string | null
          error_message: string | null
          id: string
          retry_count: number | null
          service_name: string
          status: string
        }
        Insert: {
          action_type: string
          article_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          retry_count?: number | null
          service_name: string
          status: string
        }
        Update: {
          action_type?: string
          article_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          retry_count?: number | null
          service_name?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "seo_automation_logs_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_analytics: {
        Row: {
          article_id: string | null
          browser: string | null
          click_target: string | null
          created_at: string
          device_type: string | null
          event_type: string
          id: string
          location_country: string | null
          metadata: Json | null
          page_url: string | null
          scroll_depth: number | null
          session_id: string | null
          time_spent: number | null
          user_id: string | null
        }
        Insert: {
          article_id?: string | null
          browser?: string | null
          click_target?: string | null
          created_at?: string
          device_type?: string | null
          event_type: string
          id?: string
          location_country?: string | null
          metadata?: Json | null
          page_url?: string | null
          scroll_depth?: number | null
          session_id?: string | null
          time_spent?: number | null
          user_id?: string | null
        }
        Update: {
          article_id?: string | null
          browser?: string | null
          click_target?: string | null
          created_at?: string
          device_type?: string | null
          event_type?: string
          id?: string
          location_country?: string | null
          metadata?: Json | null
          page_url?: string | null
          scroll_depth?: number | null
          session_id?: string | null
          time_spent?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_analytics_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          id: string
          ip_address: string | null
          last_updated: string
          preferred_categories: string[] | null
          preferred_tags: string[] | null
          reading_frequency: Json | null
          user_id: string | null
        }
        Insert: {
          id?: string
          ip_address?: string | null
          last_updated?: string
          preferred_categories?: string[] | null
          preferred_tags?: string[] | null
          reading_frequency?: Json | null
          user_id?: string | null
        }
        Update: {
          id?: string
          ip_address?: string | null
          last_updated?: string
          preferred_categories?: string[] | null
          preferred_tags?: string[] | null
          reading_frequency?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_reading_history: {
        Row: {
          article_id: string
          id: string
          ip_address: string | null
          read_at: string
          read_percentage: number | null
          reading_duration: number | null
          user_id: string | null
        }
        Insert: {
          article_id: string
          id?: string
          ip_address?: string | null
          read_at?: string
          read_percentage?: number | null
          reading_duration?: number | null
          user_id?: string | null
        }
        Update: {
          article_id?: string
          id?: string
          ip_address?: string | null
          read_at?: string
          read_percentage?: number | null
          reading_duration?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_reading_history_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      vapid_config: {
        Row: {
          created_at: string
          id: string
          private_key: string
          public_key: string
        }
        Insert: {
          created_at?: string
          id?: string
          private_key: string
          public_key: string
        }
        Update: {
          created_at?: string
          id?: string
          private_key?: string
          public_key?: string
        }
        Relationships: []
      }
      visual_stories: {
        Row: {
          author_id: string | null
          cover_image_url: string
          created_at: string
          excerpt: string | null
          id: string
          publish_at: string | null
          slug: string
          status: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          cover_image_url: string
          created_at?: string
          excerpt?: string | null
          id?: string
          publish_at?: string | null
          slug: string
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          cover_image_url?: string
          created_at?: string
          excerpt?: string | null
          id?: string
          publish_at?: string | null
          slug?: string
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      visual_story_slides: {
        Row: {
          alt_text: string
          animation: string | null
          caption: string | null
          created_at: string
          duration_seconds: number | null
          id: string
          media_url: string
          position: number
          story_id: string
          type: string
        }
        Insert: {
          alt_text: string
          animation?: string | null
          caption?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          media_url: string
          position: number
          story_id: string
          type?: string
        }
        Update: {
          alt_text?: string
          animation?: string | null
          caption?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          media_url?: string
          position?: number
          story_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "visual_story_slides_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "visual_stories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_profiles: {
        Row: {
          author_bio: string | null
          author_image_url: string | null
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string | null
          job_title: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          author_bio?: string | null
          author_image_url?: string | null
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          job_title?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          author_bio?: string | null
          author_image_url?: string | null
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          job_title?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_seo_score: {
        Args: {
          article_content: string
          article_keywords: string[]
          article_meta_description: string
          article_meta_title: string
          article_title: string
        }
        Returns: number
      }
      can_manage_push_notifications: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      generate_unique_username: {
        Args: { user_full_name: string; user_id: string }
        Returns: string
      }
      get_article_engagement: {
        Args: { article_uuid: string }
        Returns: {
          comments_count: number
          likes_count: number
          shares_count: number
        }[]
      }
      get_author_profile: {
        Args: { author_uuid: string }
        Returns: {
          author_bio: string
          author_image_url: string
          avatar_url: string
          full_name: string
          id: string
          job_title: string
          username: string
        }[]
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_public_comments: {
        Args: { article_uuid: string }
        Returns: {
          article_id: string
          author_name: string
          content: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }[]
      }
      get_safe_author_profile: {
        Args: { author_uuid: string }
        Returns: {
          author_bio: string
          author_image_url: string
          avatar_url: string
          full_name: string
          id: string
          job_title: string
          username: string
        }[]
      }
      get_safe_comments: {
        Args: { article_uuid: string }
        Returns: {
          article_id: string
          author_name: string
          content: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }[]
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_security_event: {
        Args: { action_type: string; resource_name?: string }
        Returns: undefined
      }
      security_check_status: {
        Args: Record<PropertyKey, never>
        Returns: {
          description: string
          issue: string
          requires_manual_action: boolean
          status: string
        }[]
      }
      validate_security_policies: {
        Args: Record<PropertyKey, never>
        Returns: {
          has_rls: boolean
          policy_count: number
          public_access: boolean
          table_name: string
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
