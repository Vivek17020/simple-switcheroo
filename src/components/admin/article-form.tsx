import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { AIAssistantPanel } from './ai-assistant-panel';
import { ArticlePremiumControls } from './article-premium-controls';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Upload, Eye, Save, Send, X, Clock, CheckCircle, Youtube, Sparkles, ClipboardCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import slugify from 'slugify';
import { z } from 'zod';

interface Article {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image_url?: string;
  category_id?: string;
  tags: string[];
  published: boolean;
  meta_title?: string;
  meta_description?: string;
  is_premium?: boolean;
  premium_preview_length?: number;
  ads_enabled?: boolean;
  affiliate_products_enabled?: boolean;
}

interface ArticleFormProps {
  article?: Article;
  onSave?: () => void;
}

// Validation schema for publishing
const articleValidationSchema = z.object({
  title: z.string().trim().min(3, "Title is required"),
  slug: z
    .string()
    .trim()
    .min(3, "Slug is required")
    .max(120, "Slug too long")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  content: z.string().trim().min(20, "Content is too short"),
  excerpt: z.string().trim().max(300).optional(),
  meta_title: z.string().trim().max(60, "Meta title must be ≤ 60 characters").optional().nullable(),
  meta_description: z
    .string()
    .trim()
    .max(160, "Meta description must be ≤ 160 characters")
    .optional()
    .nullable(),
  category_id: z.string().min(1, "Category is required"),
  tags: z.array(z.string().trim()).max(20, "Too many tags").optional(),
  is_premium: z.boolean().optional(),
  premium_preview_length: z.number().int().min(0).max(5000).optional(),
});

export function ArticleForm({ article, onSave }: ArticleFormProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [newTag, setNewTag] = useState('');
  const [isFormattingContent, setIsFormattingContent] = useState(false);
  const [isHumanizing, setIsHumanizing] = useState(false);
  const [isSeoOptimizing, setIsSeoOptimizing] = useState(false);
  const [isBoldingKeywords, setIsBoldingKeywords] = useState(false);
  const [isCheckingReadiness, setIsCheckingReadiness] = useState(false);
  const [readinessReport, setReadinessReport] = useState<any>(null);
  const [isExtractingTags, setIsExtractingTags] = useState(false);
  const [isFormattingCricket, setIsFormattingCricket] = useState(false);
  
  // Auto-save states
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const autoSaveInterval = 30 * 1000; // 30 seconds
  
  const [formData, setFormData] = useState<Article>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    image_url: '',
    category_id: '',
    tags: [],
    published: false,
    meta_title: '',
    meta_description: '',
    ...article,
  });

  useEffect(() => {
    fetchCategories();
    if (article?.image_url) {
      setImagePreview(article.image_url);
    }
    
    // Load draft if creating new article
    if (!article) {
      loadDraft();
    }
  }, [article]);

  useEffect(() => {
    // Auto-generate slug from title
    if (formData.title && (!article || !article.slug)) {
      const slug = slugify(formData.title, { 
        lower: true, 
        strict: true,
        remove: /[*+~.()'"!:@]/g 
      });
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.title, article]);

  // Auto-save effect
  useEffect(() => {
    // Do not schedule autosave during publishing to avoid race conditions
    if (isPublishing) {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
      return;
    }

    if (hasUnsavedChanges && (formData.title.trim() || formData.content.trim())) {
      // Clear existing timer
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
      
      // Set new timer for auto-save
      autoSaveTimer.current = setTimeout(() => {
        autoSave();
      }, autoSaveInterval);
    }

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [formData, hasUnsavedChanges, isPublishing]);

  // Track changes to form data
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [formData.title, formData.content, formData.excerpt, formData.tags, formData.category_id]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (data) setCategories(data);
  };

  const getDraftKey = () => {
    return article?.id ? `article-draft-${article.id}` : 'article-draft-new';
  };

  const loadDraft = useCallback(async () => {
    try {
      const draftKey = getDraftKey();
      const savedDraft = localStorage.getItem(draftKey);
      
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        const draftAge = Date.now() - draft.timestamp;
        
        // Only load drafts that are less than 24 hours old
        if (draftAge < 24 * 60 * 60 * 1000) {
          setFormData(prev => ({ ...prev, ...draft.data }));
          setLastSavedAt(new Date(draft.timestamp));
          setAutoSaveStatus('saved');
          
          toast({
            title: "Draft restored",
            description: `Draft from ${formatDistanceToNow(new Date(draft.timestamp), { addSuffix: true })} has been restored.`,
          });
        } else {
          // Remove old draft
          localStorage.removeItem(draftKey);
        }
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    }
  }, [article?.id]);

  const autoSave = useCallback(async () => {
    if (isPublishing) return; // skip autosave during publish
    if (!formData.title.trim() && !formData.content.trim()) {
      return;
    }

    setAutoSaveStatus('saving');
    
    try {
      const draftKey = getDraftKey();
      const draftData = {
        data: formData,
        timestamp: Date.now()
      };
      
      // Save to localStorage as backup
      localStorage.setItem(draftKey, JSON.stringify(draftData));
      
      // Save to Supabase if editing existing article
      if (article?.id) {
        const sanitizedTags = Array.from(new Set((formData.tags || []).map(t => t.trim()).filter(Boolean)));
        const categoryId = formData.category_id && formData.category_id !== '' ? formData.category_id : (categories[0]?.id || null);
        const updatePayload = {
          title: formData.title,
          slug: formData.slug,
          excerpt: formData.excerpt?.trim() ? formData.excerpt : null,
          content: formData.content,
          image_url: (formData.image_url && formData.image_url.trim() !== '') ? formData.image_url : null,
          category_id: categoryId,
          tags: sanitizedTags.length ? sanitizedTags : null,
          seo_keywords: sanitizedTags.length ? sanitizedTags : null,
          meta_title: formData.meta_title?.trim() ? formData.meta_title : null,
          meta_description: formData.meta_description?.trim() ? formData.meta_description : null,
          updated_at: new Date().toISOString(),
        } as any;
        
        const { error } = await supabase
          .from('articles')
          .update(updatePayload)
          .eq('id', article.id);
        
        if (error) throw error;
      }
      
      setLastSavedAt(new Date());
      setAutoSaveStatus('saved');
      setHasUnsavedChanges(false);
      
    } catch (error) {
      console.error('Auto-save error:', error);
      setAutoSaveStatus('error');
    }
  }, [formData, article?.id]);

  const handleImageUpload = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = fileName;

    const { error: uploadError } = await supabase.storage
      .from('article-images')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('article-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSubmit = async (isDraft: boolean = false) => {
    setLoading(true);
    setIsPublishing(true);
    
    try {
      // Stop any pending autosave timer to avoid race conditions
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }

      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to publish articles.",
          variant: "destructive",
        });
        navigate('/auth');
        return;
      }

      let imageUrl = formData.image_url;
      if (imageFile) {
        imageUrl = await handleImageUpload(imageFile);
      }

      // Sanitize inputs
      const sanitizedTags = Array.from(new Set((formData.tags || []).map(t => t.trim()).filter(Boolean)));
      const categoryId = formData.category_id && formData.category_id !== '' ? formData.category_id : (categories[0]?.id || '');
      const safeSlug = slugify(formData.slug || formData.title, { 
        lower: true, 
        strict: true,
        remove: /[*+~.()'"!:@]/g
      });

      // Validate required fields
      const validation = articleValidationSchema.safeParse({
        title: formData.title,
        slug: safeSlug,
        content: formData.content,
        excerpt: formData.excerpt,
        meta_title: formData.meta_title || null,
        meta_description: formData.meta_description || null,
        category_id: categoryId,
        tags: sanitizedTags,
        is_premium: formData.is_premium,
        premium_preview_length: formData.premium_preview_length,
      });

      if (!validation.success) {
        const msg = validation.error.issues[0]?.message || 'Validation failed';
        toast({ title: 'Validation Error', description: msg, variant: 'destructive' });
        return;
      }

      // Ensure slug is unique
      let slugQuery = supabase
        .from('articles')
        .select('id')
        .eq('slug', safeSlug)
        .limit(1);
      if (article?.id) slugQuery = slugQuery.neq('id', article.id);
      const { data: slugExisting } = await slugQuery.maybeSingle();
      if (slugExisting?.id) {
        toast({
          title: 'Duplicate Slug',
          description: 'This slug is already in use. Please choose another.',
          variant: 'destructive',
        });
        return;
      }

      if (!categoryId) {
        toast({
          title: 'Missing category',
          description: 'Please select or create a category before publishing.',
          variant: 'destructive',
        });
        return;
      }

      const now = new Date().toISOString();

      const articleData = {
        title: formData.title,
        slug: safeSlug,
        excerpt: formData.excerpt?.trim() ? formData.excerpt : null,
        content: formData.content,
        image_url: (imageUrl && imageUrl.trim() !== '') ? imageUrl : null,
        category_id: categoryId,
        tags: sanitizedTags.length ? sanitizedTags : null,
        seo_keywords: sanitizedTags.length ? sanitizedTags : null,
        meta_title: formData.meta_title?.trim() ? formData.meta_title : null,
        meta_description: formData.meta_description?.trim() ? formData.meta_description : null,
        author_id: user.id,
        published: !isDraft,
        published_at: !isDraft ? now : null,
        updated_at: now,
        is_premium: formData.is_premium ?? false,
        premium_preview_length: formData.premium_preview_length ?? 300,
        ads_enabled: formData.ads_enabled !== false,
        affiliate_products_enabled: formData.affiliate_products_enabled !== false,
      } as any;

      let savedArticleId = article?.id;

      if (article?.id) {
        const { error } = await supabase
          .from('articles')
          .update(articleData)
          .eq('id', article.id);
        if (error) throw error;
        toast({
          title: isDraft ? 'Draft updated' : 'Article Published',
          description: `Article ${isDraft ? 'saved as draft' : 'published'} successfully.`,
        });
      } else {
        const { data: newArticle, error } = await supabase
          .from('articles')
          .insert({
            ...articleData,
            created_at: now,
          })
          .select('id')
          .single();
        if (error) throw error;
        savedArticleId = newArticle?.id;
        toast({
          title: isDraft ? 'Draft created' : 'Article Published',
          description: `Article ${isDraft ? 'saved as draft' : 'published'} successfully.`,
        });
      }

      // Auto-ping search engines if publishing (not draft) - non-blocking
      if (!isDraft && savedArticleId) {
        // Fire-and-forget background notification
        supabase.functions.invoke('notify-search-engines', {
          body: { articleId: savedArticleId }
        }).then(({ error }) => {
          if (!error) {
            console.log('Search engines notified successfully');
          }
        }).catch(err => {
          console.error('Search engine notification failed (non-critical):', err);
        });
      }

      // Clear draft from localStorage after successful save
      const draftKey = getDraftKey();
      localStorage.removeItem(draftKey);
      setHasUnsavedChanges(false);
      setAutoSaveStatus('idle');

      // Invalidate React Query cache to refresh article lists everywhere
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['articles-paginated'] });

      onSave?.();
      navigate('/admin/articles');
    } catch (error: any) {
      console.error('Article save error:', error);
      const details = error?.details || error?.hint || '';
      toast({
        title: 'Error',
        description: (error?.message || 'Failed to save article') + (details ? ` — ${details}` : ''),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setIsPublishing(false);
    }
  };

  const updateFormData = useCallback((updates: Partial<Article>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setHasUnsavedChanges(true);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      updateFormData({ tags: [...formData.tags, newTag.trim()] });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    updateFormData({ tags: formData.tags.filter(tag => tag !== tagToRemove) });
  };

  const handleExtractTags = async () => {
    if (!formData.content?.trim() && !formData.title?.trim()) {
      toast({
        title: "No Content",
        description: "Please add title and content before extracting tags.",
        variant: "destructive",
      });
      return;
    }

    setIsExtractingTags(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-proxy', {
        body: {
          task: 'extract-tags',
          title: formData.title,
          content: formData.content,
        }
      });

      if (error) throw error;

      if (data?.result) {
        const extractedTags = Array.isArray(data.result) 
          ? data.result 
          : data.result.split(',').map((t: string) => t.trim());
        
        const validTags = extractedTags
          .filter((tag: string) => tag && tag.length > 0)
          .slice(0, 20);
        
        if (validTags.length === 0) {
          toast({
            title: "No Tags Found",
            description: "AI couldn't extract relevant tags from the content.",
          });
          return;
        }

        updateFormData({ tags: validTags });
        toast({
          title: "Tags Extracted",
          description: `Successfully extracted ${validTags.length} relevant tags.`,
        });
      } else {
        toast({
          title: "Extraction Failed",
          description: "AI response was empty. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Tag extraction error:', error);
      toast({
        title: "Extraction Failed",
        description: error?.message || "Failed to extract tags. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExtractingTags(false);
    }
  };

  const handleFormatContent = async () => {
    if (!formData.content?.trim()) {
      toast({
        title: "No Content",
        description: "Please add some content first before formatting.",
        variant: "destructive",
      });
      return;
    }

    setIsFormattingContent(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-proxy', {
        body: {
          task: 'format-and-extract-all',
          content: formData.content,
          title: formData.title
        }
      });

      if (error) throw error;

      if (data) {
        // Update all fields at once
        const updates: any = {};
        
        if (data.formatted_content) {
          const cleaned = data.formatted_content
            .replace(/^```(?:html)?\n?/i, '')
            .replace(/```$/i, '')
            .trim();
          updates.content = cleaned;
        }
        
        if (data.title) updates.title = data.title;
        if (data.excerpt) updates.excerpt = data.excerpt;
        if (data.meta_title) updates.meta_title = data.meta_title;
        if (data.meta_description) updates.meta_description = data.meta_description;
        if (data.tags && Array.isArray(data.tags)) {
          updates.tags = data.tags.slice(0, 20);
        }

        updateFormData(updates);
        
        toast({
          title: "Content Formatted & Extracted",
          description: "Content formatted with SEO optimization, and all metadata fields extracted successfully.",
        });
      } else {
        toast({
          title: "Formatting Failed",
          description: "The AI didn't return any data.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Format content error:', error);
      toast({
        title: "Formatting Failed",
        description: error?.message || "Failed to format content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsFormattingContent(false);
    }
  };

  const handleHumanizeContent = async () => {
    if (!formData.content?.trim()) {
      toast({
        title: "No Content",
        description: "Please add some content first.",
        variant: "destructive",
      });
      return;
    }

    setIsHumanizing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-proxy', {
        body: {
          task: 'humanize-content',
          content: formData.content,
        }
      });

      if (error) throw error;

      if (data?.result) {
        const raw: string = data.result as string;
        const cleaned = raw
          .replace(/^```(?:html)?\n?/i, '')
          .replace(/```$/i, '')
          .trim();
        
        if (!cleaned) {
          toast({
            title: "No Changes",
            description: "Content appears already humanized.",
          });
          return;
        }

        updateFormData({ content: cleaned });
        toast({
          title: "Content Humanized",
          description: "Your content has been rewritten to sound more natural and engaging.",
        });
      }
    } catch (error: any) {
      console.error('Humanize error:', error);
      toast({
        title: "Humanization Failed",
        description: error?.message || "Failed to humanize content.",
        variant: "destructive",
      });
    } finally {
      setIsHumanizing(false);
    }
  };

  const handleSeoOptimize = async () => {
    if (!formData.content?.trim()) {
      toast({
        title: "No Content",
        description: "Please add some content first.",
        variant: "destructive",
      });
      return;
    }

    setIsSeoOptimizing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-proxy', {
        body: {
          task: 'seo-optimize',
          content: formData.content,
        }
      });

      if (error) throw error;

      if (data?.result) {
        const raw: string = data.result as string;
        const cleaned = raw
          .replace(/^```(?:html)?\n?/i, '')
          .replace(/```$/i, '')
          .trim();
        
        if (!cleaned) {
          toast({
            title: "No Changes",
            description: "Content is already SEO optimized.",
          });
          return;
        }

        updateFormData({ content: cleaned });
        toast({
          title: "SEO Optimized",
          description: "Keywords and phrases have been replaced to improve SEO score.",
        });
      }
    } catch (error: any) {
      console.error('SEO optimize error:', error);
      toast({
        title: "Optimization Failed",
        description: error?.message || "Failed to optimize content for SEO.",
        variant: "destructive",
      });
    } finally {
      setIsSeoOptimizing(false);
    }
  };

  const handleBoldKeywords = async () => {
    if (!formData.content?.trim()) {
      toast({
        title: "No Content",
        description: "Please add some content first.",
        variant: "destructive",
      });
      return;
    }

    setIsBoldingKeywords(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-proxy', {
        body: {
          task: 'bold-keywords',
          content: formData.content,
        }
      });

      if (error) throw error;

      if (data?.result) {
        const raw: string = data.result as string;
        const cleaned = raw
          .replace(/^```(?:html)?\n?/i, '')
          .replace(/```$/i, '')
          .trim();
        
        if (!cleaned) {
          toast({
            title: "No Changes",
            description: "Keywords already appear to be highlighted.",
          });
          return;
        }

        updateFormData({ content: cleaned });
        toast({
          title: "Keywords Bolded",
          description: "Important keywords have been automatically bolded in your content.",
        });
      }
    } catch (error: any) {
      console.error('Bold keywords error:', error);
      toast({
        title: "Bolding Failed",
        description: error?.message || "Failed to bold keywords.",
        variant: "destructive",
      });
    } finally {
      setIsBoldingKeywords(false);
    }
  };

  const handleCheckReadiness = async () => {
    if (!formData.title?.trim() || !formData.content?.trim()) {
      toast({
        title: "Incomplete Article",
        description: "Please add title and content before checking readiness.",
        variant: "destructive",
      });
      return;
    }

    setIsCheckingReadiness(true);
    setReadinessReport(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('check-article-readiness', {
        body: {
          title: formData.title,
          content: formData.content,
          excerpt: formData.excerpt,
          meta_title: formData.meta_title,
          meta_description: formData.meta_description,
          tags: formData.tags,
          category_id: formData.category_id,
          image_url: formData.image_url,
        }
      });

      if (error) throw error;

      if (data) {
        setReadinessReport(data);
        toast({
          title: "Readiness Check Complete",
          description: data.readinessMessage,
        });
      }
    } catch (error: any) {
      console.error('Readiness check error:', error);
      toast({
        title: "Check Failed",
        description: error?.message || "Failed to check article readiness.",
        variant: "destructive",
      });
    } finally {
      setIsCheckingReadiness(false);
    }
  };

  const handleFormatCricket = async () => {
    if (!formData.content?.trim()) {
      toast({
        title: "No Content",
        description: "Please add cricket match notes/content first.",
        variant: "destructive",
      });
      return;
    }

    setIsFormattingCricket(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-proxy', {
        body: {
          task: 'format-cricket',
          content: formData.content,
        }
      });

      if (error) throw error;

      if (data?.result) {
        const cleaned = data.result.trim();
        
        updateFormData({ content: cleaned });
        toast({
          title: "Cricket Report Formatted",
          description: "Your cricket match notes have been formatted into a professional match report.",
        });
      }
    } catch (error: any) {
      console.error('Cricket format error:', error);
      toast({
        title: "Formatting Failed",
        description: error?.message || "Failed to format cricket report.",
        variant: "destructive",
      });
    } finally {
      setIsFormattingCricket(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          {article ? 'Edit Article' : 'Create New Article'}
        </h1>
        <div className="flex items-center gap-4">
          {/* Auto-save status */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {autoSaveStatus === 'saving' && (
              <>
                <Clock className="w-4 h-4 animate-spin" />
                <span>Saving draft...</span>
              </>
            )}
            {autoSaveStatus === 'saved' && lastSavedAt && (
              <>
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Draft saved {formatDistanceToNow(lastSavedAt, { addSuffix: true })}</span>
              </>
            )}
            {autoSaveStatus === 'error' && (
              <>
                <X className="w-4 h-4 text-red-600" />
                <span>Auto-save failed</span>
              </>
            )}
            {hasUnsavedChanges && autoSaveStatus === 'idle' && (
              <>
                <Clock className="w-4 h-4 text-yellow-600" />
                <span>Unsaved changes</span>
              </>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleSubmit(true)}
              disabled={loading || isPublishing}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
            <Button
              onClick={() => handleSubmit(false)}
              disabled={loading || isPublishing}
              className="bg-gradient-primary hover:bg-gradient-secondary transition-all duration-300"
            >
              <Send className="w-4 h-4 mr-2" />
              Publish
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Article Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => updateFormData({ title: e.target.value })}
                  placeholder="Enter article title..."
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => updateFormData({ slug: e.target.value })}
                  placeholder="article-slug"
                  className="mt-1 font-mono text-sm"
                />
              </div>

              <div>
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => updateFormData({ excerpt: e.target.value })}
                  placeholder="Brief description of the article..."
                  className="mt-1"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Content Editor */}
          <Card>
            <CardHeader>
              <div className="space-y-4">
                <div>
                  <CardTitle>Content</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Use the rich text editor below. Click the <Youtube className="inline h-3 w-3" /> video button in the toolbar to embed YouTube videos.
                  </p>
                </div>
                
                {/* AI Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleHumanizeContent}
                    disabled={isHumanizing || !formData.content?.trim()}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {isHumanizing ? 'Humanizing...' : 'Humanize Content'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSeoOptimize}
                    disabled={isSeoOptimizing || !formData.content?.trim()}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {isSeoOptimizing ? 'Optimizing...' : 'SEO Optimize'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBoldKeywords}
                    disabled={isBoldingKeywords || !formData.content?.trim()}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                  {isBoldingKeywords ? 'Bolding...' : 'Bold Keywords'}
                </Button>
                
                <Button
                  onClick={handleCheckReadiness}
                  disabled={isCheckingReadiness || !formData.title?.trim() || !formData.content?.trim()}
                  variant="outline"
                  className="flex-1"
                >
                  <ClipboardCheck className="mr-2 h-4 w-4" />
                  {isCheckingReadiness ? 'Checking...' : 'Check Readiness'}
                </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleFormatContent}
                    disabled={isFormattingContent || !formData.content?.trim()}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {isFormattingContent ? 'Formatting...' : 'Format with AI'}
                  </Button>
                  
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExtractTags}
                  disabled={isExtractingTags || (!formData.content?.trim() && !formData.title?.trim())}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {isExtractingTags ? 'Extracting...' : 'Extract Tags'}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleFormatCricket}
                  disabled={isFormattingCricket || !formData.content?.trim()}
                  className="bg-gradient-to-r from-green-500/10 to-blue-500/10 hover:from-green-500/20 hover:to-blue-500/20"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {isFormattingCricket ? 'Formatting...' : '🏏 Cricket Report'}
                </Button>
              </div>
                
                <p className="text-xs text-primary/80">
                  💡 Tip: Use these AI tools to humanize your text, improve SEO, highlight keywords, or fully format your content!
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <RichTextEditor
                content={formData.content}
                onChange={(content) => updateFormData({ content })}
                placeholder="Start writing your article..."
              />
            </CardContent>
          </Card>

          {/* Article Readiness Report */}
          {readinessReport && (
            <Card className={`border-2 ${
              readinessReport.readinessColor === 'green' ? 'border-green-500 bg-green-50 dark:bg-green-950' :
              readinessReport.readinessColor === 'blue' ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' :
              readinessReport.readinessColor === 'yellow' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950' :
              'border-red-500 bg-red-50 dark:bg-red-950'
            }`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardCheck className="h-5 w-5" />
                    Article Readiness Report
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReadinessReport(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold">{readinessReport.overallScore}%</span>
                    <Badge className={
                      readinessReport.readinessColor === 'green' ? 'bg-green-500' :
                      readinessReport.readinessColor === 'blue' ? 'bg-blue-500' :
                      readinessReport.readinessColor === 'yellow' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }>
                      {readinessReport.readinessLevel}
                    </Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div
                      className={`h-2.5 rounded-full ${
                        readinessReport.readinessColor === 'green' ? 'bg-green-500' :
                        readinessReport.readinessColor === 'blue' ? 'bg-blue-500' :
                        readinessReport.readinessColor === 'yellow' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${readinessReport.overallScore}%` }}
                    ></div>
                  </div>
                  <p className="text-sm mt-2">{readinessReport.readinessMessage}</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {readinessReport.checks.map((check: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{check.category}</h4>
                      <Badge variant="outline">
                        {check.score}/{check.maxScore}
                      </Badge>
                    </div>
                    
                    {check.issues.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">Issues:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {check.issues.map((issue: string, i: number) => (
                            <li key={i} className="text-sm text-muted-foreground">{issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {check.suggestions.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">Suggestions:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {check.suggestions.map((suggestion: string, i: number) => (
                            <li key={i} className="text-sm text-muted-foreground">{suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* E-E-A-T Guidelines */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                E-E-A-T Guidelines for Quality Content
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <strong className="text-primary">Experience:</strong> Share personal insights and first-hand knowledge in your writing.
              </div>
              <div>
                <strong className="text-primary">Expertise:</strong> Demonstrate subject matter knowledge with accurate, well-researched content.
              </div>
              <div>
                <strong className="text-primary">Authoritativeness:</strong> Cite credible sources and link to authoritative references.
              </div>
              <div>
                <strong className="text-primary">Trustworthiness:</strong> Be transparent, fact-check thoroughly, and maintain editorial integrity.
              </div>
              <div className="pt-2 border-t">
                <strong>Tips:</strong> Use the video embed feature to add multimedia content. Include your unique author perspective. Update your profile with credentials.
              </div>
            </CardContent>
          </Card>

          {/* SEO */}
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="meta_title">Meta Title</Label>
                <Input
                  id="meta_title"
                  value={formData.meta_title}
                  onChange={(e) => updateFormData({ meta_title: e.target.value })}
                  placeholder="SEO title (defaults to article title)"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="meta_description">Meta Description</Label>
                <Textarea
                  id="meta_description"
                  value={formData.meta_description}
                  onChange={(e) => updateFormData({ meta_description: e.target.value })}
                  placeholder="SEO description (defaults to excerpt)"
                  className="mt-1"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* AI Assistant Panel */}
          <AIAssistantPanel
            content={formData.content}
            onInsertSummary={(summary) => {
              updateFormData({ excerpt: summary });
              toast({
                title: "Summary Inserted",
                description: "AI-generated summary has been added as excerpt."
              });
            }}
            onInsertTitle={(title) => {
              updateFormData({ title });
              toast({
                title: "Title Updated",
                description: "AI-generated title has been applied."
              });
            }}
            onInsertKeywords={(keywords) => {
              updateFormData({ tags: [...formData.tags, ...keywords.filter(k => !formData.tags.includes(k))] });
              toast({
                title: "Keywords Added",
                description: "AI-extracted keywords have been added as tags."
              });
            }}
            onTranslationGenerated={(translation) => {
              toast({
                title: "Translation Ready",
                description: "Hindi translation has been generated. You can copy it to create a new Hindi article."
              });
            }}
          />
          {/* Featured Image */}
          <Card>
            <CardHeader>
              <CardTitle>Featured Image</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => document.getElementById('image-upload')?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Image
                </Button>
                
                {imagePreview && (
                  <div className="space-y-2">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg border border-border"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setImagePreview('');
                        setImageFile(null);
                        updateFormData({ image_url: '' });
                      }}
                    >
                      Remove Image
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Category */}
          <Card>
            <CardHeader>
              <CardTitle>Category</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={formData.category_id}
                onValueChange={(value) => updateFormData({ category_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag..."
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  />
                  <Button onClick={addTag} size="sm">
                    Add
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, idx) => (
                    <Badge key={`${tag}-${idx}`} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <X 
                        className="w-3 h-3 cursor-pointer hover:text-destructive" 
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                <Eye className="w-4 h-4 mr-2" />
                Preview Article
              </Button>
            </CardContent>
          </Card>

          {/* Monetization Settings */}
          {article?.id && (
            <ArticlePremiumControls
              articleId={article.id}
              isPremium={article.is_premium || false}
              premiumPreviewLength={article.premium_preview_length || 300}
              adsEnabled={article.ads_enabled !== false}
              affiliateProductsEnabled={article.affiliate_products_enabled !== false}
              onUpdate={onSave || (() => {})}
            />
          )}
        </div>
      </div>
    </div>
  );
}