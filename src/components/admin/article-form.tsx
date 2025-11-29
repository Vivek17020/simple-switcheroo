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
import { KeywordCoverageAnalyzer } from './keyword-coverage-analyzer';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Upload, Eye, Save, Send, X, Clock, CheckCircle, Youtube, Sparkles, ClipboardCheck, Link, Bug, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import slugify from 'slugify';
import { z } from 'zod';
import { validateAndRepairHtml, quickValidateHtml } from '@/lib/html-validator';
import { sanitizeWithLogging } from '@/lib/sanitize';
import { Alert, AlertDescription } from '@/components/ui/alert';


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
  const [isFormattingNews, setIsFormattingNews] = useState(false);
  const [isFormattingScheme, setIsFormattingScheme] = useState(false);
  const [isFormattingSports, setIsFormattingSports] = useState(false);
  const [isSuggestingLinks, setIsSuggestingLinks] = useState(false);
  const [linkSuggestions, setLinkSuggestions] = useState<{
    internal: Array<{ slug: string; title: string; suggestedAnchors: string[]; relevanceScore: number }>;
    external: Array<{ title: string; url: string; source: string; reason: string }>;
  } | null>(null);
  const [showLinkPreview, setShowLinkPreview] = useState(false);
  const [isFormattingGovJob, setIsFormattingGovJob] = useState(false);
  const [isFormattingExam, setIsFormattingExam] = useState(false);
  const [isFormattingGadget, setIsFormattingGadget] = useState(false);
  const [isInjectingLinks, setIsInjectingLinks] = useState(false);
  const [isAnalyzingWeb3Content, setIsAnalyzingWeb3Content] = useState(false);
  
  // Category type state
  const [articleType, setArticleType] = useState<'regular' | 'web3'>('regular');
  
  // Content debugging states
  const [showContentDebugger, setShowContentDebugger] = useState(false);
  const [contentValidation, setContentValidation] = useState<any>(null);
  const [isValidatingContent, setIsValidatingContent] = useState(false);
  
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
    
    if (data) {
      setCategories(data);
      
      // Auto-detect article type based on current category
      if (article?.category_id) {
        const currentCategory = data.find(cat => cat.id === article.category_id);
        if (currentCategory) {
          // Check if category has web3forindia parent
          const parentCategory = data.find(cat => cat.id === currentCategory.parent_id);
          if (parentCategory?.slug === 'web3forindia') {
            setArticleType('web3');
          }
        }
      }
    }
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
    try {
      // Show optimization message
      toast({
        title: "Optimizing image...",
        description: "Compressing feature image for better performance",
      });

      // Optimize the image
      const { optimizeImage, formatFileSize } = await import('@/lib/image-optimizer');
      const optimized = await optimizeImage(file, (progress) => {
        console.log(`Feature image optimization: ${progress}%`);
      });

      const fileExt = optimized.optimizedFile.type.split('/')[1];
      const fileName = `${Date.now()}-optimized.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('article-images')
        .upload(filePath, optimized.optimizedFile);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('article-images')
        .getPublicUrl(filePath);

      // Show compression results
      toast({
        title: "Feature image optimized!",
        description: `Reduced by ${optimized.compressionRatio}% (${formatFileSize(optimized.originalSize)} → ${formatFileSize(optimized.optimizedSize)})`,
      });

      return data.publicUrl;
    } catch (error) {
      console.error('Feature image upload error:', error);
      throw error;
    }
  };

  const handleValidateContent = useCallback(async () => {
    setIsValidatingContent(true);
    try {
      const validation = validateAndRepairHtml(formData.content);
      setContentValidation(validation);
      setShowContentDebugger(true);
      
      // Apply fixes if any changes were made
      if (validation.stats.changesApplied > 0) {
        setFormData(prev => ({ ...prev, content: validation.repaired }));
        
        if (!validation.isValid) {
          toast({
            title: "Content Partially Fixed",
            description: `Applied ${validation.stats.changesApplied} fix(es). ${validation.issues.length} issue(s) still remain.`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Content Auto-Fixed",
            description: `Successfully fixed ${validation.stats.changesApplied} issue(s).`,
          });
        }
      } else if (!validation.isValid) {
        toast({
          title: "Content Issues Detected",
          description: `Found ${validation.issues.length} issue(s) that require manual attention.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Content Valid",
          description: "No issues detected. Content looks good!",
        });
      }
    } catch (error) {
      console.error('Content validation error:', error);
      toast({
        title: "Validation Error",
        description: "Failed to validate content",
        variant: "destructive",
      });
    } finally {
      setIsValidatingContent(false);
    }
  }, [formData.content]);

  const handleDebugSanitization = useCallback(() => {
    const result = sanitizeWithLogging(formData.content);
    console.group('🔍 Content Sanitization Debug');
    console.log('Original length:', result.originalLength);
    console.log('Sanitized length:', result.sanitizedLength);
    console.log('Removed elements:', result.removed);
    console.log('Sanitized HTML:', result.sanitized);
    console.groupEnd();
    
    toast({
      title: "Debug Info Logged",
      description: "Check browser console for detailed sanitization report",
    });
  }, [formData.content]);

  const handleSubmit = async (isDraft: boolean = false) => {
    setLoading(true);
    setIsPublishing(true);
    
    try {
      // Stop any pending autosave timer to avoid race conditions
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
      
      // Validate and repair content before saving
      if (!isDraft) {
        const validation = validateAndRepairHtml(formData.content);
        if (!validation.isValid) {
          toast({
            title: "Content Validation Failed",
            description: "Please fix content issues before publishing",
            variant: "destructive",
          });
          setContentValidation(validation);
          setShowContentDebugger(true);
          return;
        }
        // Use repaired content
        formData.content = validation.repaired;
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

      // Pre-publish SEO validation
      if (!isDraft) {
        const contentLength = formData.content.replace(/<[^>]*>/g, '').length;
        
        if (!formData.meta_title || formData.meta_title.length > 60) {
          toast({ title: 'SEO Error', description: 'Meta title required (≤60 chars)', variant: 'destructive' });
          return;
        }
        if (!formData.meta_description || formData.meta_description.length > 160) {
          toast({ title: 'SEO Error', description: 'Meta description required (≤160 chars)', variant: 'destructive' });
          return;
        }
        if (contentLength < 300) {
          toast({ title: 'SEO Error', description: 'Content must be at least 300 characters', variant: 'destructive' });
          return;
        }
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

        // Send OneSignal push notification to subscribers
        supabase.functions.invoke('send-onesignal-notification', {
          body: { articleId: savedArticleId }
        }).then(({ data, error }) => {
          if (!error && data) {
            console.log(`Push notification sent to ${data.recipients || 0} subscribers`);
            toast({
              title: "Notification sent! 🔔",
              description: `Push notification delivered to ${data.recipients || 0} subscribers.`,
            });
          }
        }).catch(err => {
          console.error('Push notification failed (non-critical):', err);
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
          let cleaned = data.formatted_content
            .replace(/^```(?:html)?\n?/i, '')
            .replace(/```$/i, '')
            .trim();
          
          // Additional client-side cleaning to ensure proper spacing
          // Fix merged words after HTML tags
          cleaned = cleaned.replace(/<\/(p|h[1-6]|li|strong|em|a)>(?=[A-Z])/g, '</$1> ');
          
          // Fix duplicate consecutive words
          cleaned = cleaned.replace(/\b(\w+)\s+\1\b/gi, '$1');
          
          // Ensure space after punctuation
          cleaned = cleaned.replace(/([.!?,;])(?=[A-Za-z])/g, '$1 ');
          
          // Remove multiple consecutive spaces
          cleaned = cleaned.replace(/\s{2,}/g, ' ');
          
          // Limit bold highlights to at most 15 key phrases
          const limited = cleaned.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, ((() => { 
            let i=0; 
            return (_m: string, p1: string) => (++i <= 15) ? `<strong>${p1}</strong>` : p1; 
          })()));
          
          updates.content = limited;
        }
        
        if (data.title) updates.title = data.title;
        if (data.excerpt) updates.excerpt = data.excerpt;
        if (data.meta_title) updates.meta_title = data.meta_title;
        if (data.meta_description) updates.meta_description = data.meta_description;
        if (data.tags && Array.isArray(data.tags)) {
          updates.tags = data.tags.slice(0, 20);
        }
        
        // Auto-suggest category if provided
        if (data.category) {
          const matchingCategory = categories.find(cat => 
            cat.name.toLowerCase().includes(data.category.toLowerCase()) ||
            data.category.toLowerCase().includes(cat.name.toLowerCase())
          );
          if (matchingCategory) {
            updates.category_id = matchingCategory.id;
          }
        }

        updateFormData(updates);
        
        toast({
          title: "✨ Content Formatted Successfully",
          description: "Title, excerpt, meta tags, category, and SEO-optimized content have been auto-generated and filled.",
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
      // Get original word count for validation
      const originalText = formData.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      const originalWordCount = originalText.split(' ').length;
      
      console.log('Bold keywords - Original content length:', formData.content.length);
      console.log('Bold keywords - Original word count:', originalWordCount);

      const { data, error } = await supabase.functions.invoke('ai-proxy', {
        body: {
          task: 'bold-keywords',
          content: formData.content,
        }
      });

      if (error) {
        console.error('Bold keywords API error:', error);
        throw error;
      }

      if (data?.result) {
        const raw: string = data.result as string;
        let cleaned = raw
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

        // Validate content integrity
        const newText = cleaned.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        const newWordCount = newText.split(' ').length;
        const wordDifference = Math.abs(originalWordCount - newWordCount);
        const percentageDiff = (wordDifference / originalWordCount) * 100;
        
        console.log('Bold keywords - New content length:', cleaned.length);
        console.log('Bold keywords - New word count:', newWordCount);
        console.log('Bold keywords - Word difference:', wordDifference, `(${percentageDiff.toFixed(1)}%)`);

        // If more than 5% of words are missing, reject the change
        if (percentageDiff > 5) {
          console.error('Content integrity check failed! Too many words changed.');
          toast({
            title: "Content Validation Failed",
            description: `${wordDifference} words changed (${percentageDiff.toFixed(1)}%). Original content preserved for safety.`,
            variant: "destructive",
          });
          return;
        }

        updateFormData({ content: cleaned });
        toast({
          title: "Keywords Bolded ✓",
          description: `Successfully bolded keywords. Content validated: ${newWordCount} words preserved.`,
        });
      } else {
        toast({
          title: "No Response",
          description: "AI didn't return any content. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Bold keywords error:', error);
      toast({
        title: "Bolding Failed",
        description: error?.message || "Failed to bold keywords. Original content preserved.",
        variant: "destructive",
      });
    } finally {
      setIsBoldingKeywords(false);
    }
  };

  const handleFormatGovJob = async () => {
    if (!formData.content?.trim()) {
      toast({
        title: "No Content",
        description: "Please add some raw content first to format as a government job article.",
        variant: "destructive",
      });
      return;
    }

    setIsFormattingGovJob(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('format-government-job-article', {
        body: {
          title: formData.title || 'Government Job Recruitment',
          content: formData.content,
        }
      });

      if (error) {
        if (error.message?.includes('Rate limit')) {
          toast({
            title: "Rate Limit Exceeded",
            description: "Please wait a moment and try again.",
            variant: "destructive",
          });
          return;
        }
        if (error.message?.includes('Payment required')) {
          toast({
            title: "Credits Required",
            description: "Please add credits to your Lovable AI workspace in Settings.",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      if (data) {
        // Update all form fields with AI-generated content
        updateFormData({
          title: data.seo_title || formData.title,
          meta_title: data.seo_title || formData.meta_title,
          meta_description: data.meta_description || formData.meta_description,
          excerpt: data.excerpt || formData.excerpt,
          content: data.formatted_content || formData.content,
          tags: data.tags || formData.tags,
          slug: data.slug || formData.slug,
        });
        
        toast({
          title: "Government Job Article Formatted!",
          description: "Your article has been professionally formatted with SEO optimization, tables, and proper structure.",
        });
      }
    } catch (error: any) {
      console.error('Government job format error:', error);
      toast({
        title: "Formatting Failed",
        description: error?.message || "Failed to format as government job article.",
        variant: "destructive",
      });
    } finally {
      setIsFormattingGovJob(false);
    }
  };

  const handleFormatExamNotification = async () => {
    if (!formData.content?.trim()) {
      toast({
        title: "No Content",
        description: "Please add exam notification content first to format.",
        variant: "destructive",
      });
      return;
    }

    setIsFormattingExam(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('format-exam-notification', {
        body: {
          title: formData.title || 'Exam Notification',
          content: formData.content,
        }
      });

      if (error) {
        if (error.message?.includes('Rate limit')) {
          toast({
            title: "Rate Limit Exceeded",
            description: "Please wait a moment and try again.",
            variant: "destructive",
          });
          return;
        }
        if (error.message?.includes('Payment required')) {
          toast({
            title: "Credits Required",
            description: "Please add credits to your Lovable AI workspace in Settings.",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      if (data?.formattedContent) {
        // The formatted content includes all metadata in the HTML
        // Update the content directly
        updateFormData({
          content: data.formattedContent
        });
        
        toast({
          title: "Exam Notification Formatted!",
          description: "Your exam notification has been formatted with auto-generated SEO fields and proper structure.",
        });
      }
    } catch (error: any) {
      console.error('Exam notification format error:', error);
      toast({
        title: "Formatting Failed",
        description: error?.message || "Failed to format exam notification.",
        variant: "destructive",
      });
    } finally {
      setIsFormattingExam(false);
    }
  };

  const handleFormatGadgetReview = async () => {
    if (!formData.content?.trim()) {
      toast({
        title: "No Content",
        description: "Please add gadget details first to format as a review.",
        variant: "destructive",
      });
      return;
    }

    setIsFormattingGadget(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('format-gadget-review', {
        body: {
          title: formData.title || 'Gadget Review',
          content: formData.content,
        }
      });

      if (error) {
        if (error.message?.includes('Rate limit')) {
          toast({
            title: "Rate Limit Exceeded",
            description: "Please wait a moment and try again.",
            variant: "destructive",
          });
          return;
        }
        if (error.message?.includes('Payment required')) {
          toast({
            title: "Credits Required",
            description: "Please add credits to your Lovable AI workspace in Settings.",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      if (data?.formattedContent) {
        updateFormData({
          content: data.formattedContent
        });
        
        toast({
          title: "Gadget Review Formatted!",
          description: "Your review has been formatted in TechRadar/GSMArena style with SEO optimization.",
        });
      }
    } catch (error: any) {
      console.error('Gadget review format error:', error);
      toast({
        title: "Formatting Failed",
        description: error?.message || "Failed to format gadget review.",
        variant: "destructive",
      });
    } finally {
      setIsFormattingGadget(false);
    }
  };

  const handleAnalyzeWeb3Content = async () => {
    if (!formData.content?.trim()) {
      toast({
        title: "No Content",
        description: "Please add article content first to analyze for code examples.",
        variant: "destructive",
      });
      return;
    }

    if (articleType !== 'web3') {
      toast({
        title: "Not a Web3 Article",
        description: "This feature is only available for Web3ForIndia articles.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzingWeb3Content(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-web3-content', {
        body: {
          title: formData.title,
          content: formData.content,
        }
      });

      if (error) {
        if (error.message?.includes('Rate limit')) {
          toast({
            title: "Rate Limit Exceeded",
            description: "Please wait a moment and try again.",
            variant: "destructive",
          });
          return;
        }
        if (error.message?.includes('Payment required')) {
          toast({
            title: "Credits Required",
            description: "Please add credits to your Lovable AI workspace in Settings.",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      if (data?.codeInsertions && data.codeInsertions.length > 0) {
        let updatedContent = formData.content;
        let insertCount = 0;

        // Process each code insertion
        for (const insertion of data.codeInsertions) {
          const { searchText, language, code, explanation } = insertion;
          
          // Find the paragraph containing the search text
          const searchRegex = new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
          
          if (searchRegex.test(updatedContent)) {
            // Create a code block with explanation
            const codeBlock = `\n\n<div class="my-6 p-4 bg-secondary/50 rounded-lg border border-border">
<p class="text-sm text-muted-foreground mb-2">${explanation}</p>
<pre><code class="language-${language}">${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
</div>\n\n`;
            
            // Insert code block after the paragraph
            updatedContent = updatedContent.replace(
              new RegExp(`(<p[^>]*>[^<]*${searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^<]*</p>)`, 'i'),
              `$1${codeBlock}`
            );
            insertCount++;
          }
        }

        if (insertCount > 0) {
          updateFormData({
            content: updatedContent
          });
          
          toast({
            title: "Code Examples Added!",
            description: `Successfully inserted ${insertCount} code example(s) to enhance your Web3 article.`,
          });
        } else {
          toast({
            title: "No Insertions Made",
            description: "Couldn't find matching locations for suggested code examples.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "No Code Examples Needed",
          description: "AI analysis found that your article doesn't require additional code examples.",
        });
      }
    } catch (error: any) {
      console.error('Web3 content analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: error?.message || "Failed to analyze content for code examples.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzingWeb3Content(false);
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
        // Limit bold highlights to at most 10 key phrases
        const limited = cleaned.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, ((() => { let i=0; return (_m, p1) => (++i <= 10) ? `<strong>${p1}</strong>` : p1; })()));
        updateFormData({ content: limited });
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

  const handleFormatNews = async () => {
    if (!formData.content?.trim()) {
      toast({
        title: "No Content",
        description: "Please add some content first to format as news.",
        variant: "destructive",
      });
      return;
    }

    setIsFormattingNews(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-proxy', {
        body: {
          task: 'format-as-news',
          content: formData.content,
        }
      });

      if (error) throw error;

      if (data?.result) {
        let cleaned = data.result.trim();
        
        // Remove code fences if present
        cleaned = cleaned.replace(/^```(?:html)?\n?/i, '').replace(/```$/i, '');
        
        const updates: any = { content: cleaned };
        
        // Auto-fill title and generate slug
        if (data.title) {
          updates.title = data.title;
          updates.slug = slugify(data.title, { 
            lower: true, 
            strict: true,
            remove: /[*+~.()'"!:@]/g 
          });
        }
        
        // Auto-fill excerpt
        if (data.excerpt) {
          updates.excerpt = data.excerpt;
        }
        
        // Auto-fill meta information
        if (data.meta_title) {
          updates.meta_title = data.meta_title;
        }
        if (data.meta_description) {
          updates.meta_description = data.meta_description;
        }
        
        // Auto-fill and merge tags
        if (data.tags && Array.isArray(data.tags)) {
          const newTags = data.tags.map(t => t.toLowerCase().trim());
          const existingTags = formData.tags || [];
          const mergedTags = [...new Set([...existingTags, ...newTags])].slice(0, 15);
          updates.tags = mergedTags;
        }
        
        updateFormData(updates);
        toast({
          title: "📰 News Article Formatted",
          description: "Title, excerpt, tags, meta fields, and content auto-filled successfully!",
        });
      }
    } catch (error: any) {
      console.error('Format as news error:', error);
      toast({
        title: "Formatting Failed",
        description: error?.message || "Failed to format as news article.",
        variant: "destructive",
      });
    } finally {
      setIsFormattingNews(false);
    }
  };

  const handleInjectLinks = async () => {
    if (!formData.content?.trim() || !formData.title?.trim()) {
      toast({
        title: "Missing Content",
        description: "Please add title and content first.",
        variant: "destructive",
      });
      return;
    }

    setIsInjectingLinks(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('auto-insert-internal-links', {
        body: {
          content: formData.content,
          title: formData.title,
          currentArticleId: article?.id,
        }
      });

      if (error) throw error;

      if (data?.content) {
        updateFormData({ content: data.content });
        toast({
          title: "Internal Links Auto-Inserted! ✨",
          description: `Added ${data.linksInserted} internal links (max 1 per 100 words) and a Related Articles section with ${data.relatedArticlesFound} suggestions. Links follow SEO best practices.`,
        });
      } else {
        toast({
          title: "No Changes Made",
          description: "No suitable internal links found for this content.",
        });
      }
    } catch (error: any) {
      console.error('Auto-insert internal links error:', error);
      toast({
        title: "Link Insertion Failed",
        description: error?.message || "Failed to auto-insert internal links.",
        variant: "destructive",
      });
    } finally {
      setIsInjectingLinks(false);
    }
  };

  const handleFormatScheme = async () => {
    if (!formData.content?.trim()) {
      toast({
        title: "No Content",
        description: "Please add some content first to format as government scheme.",
        variant: "destructive",
      });
      return;
    }

    setIsFormattingScheme(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-proxy', {
        body: {
          task: 'format-as-scheme',
          content: formData.content,
        }
      });

      if (error) throw error;

      if (data?.result) {
        let cleaned = data.result.trim();
        
        // Remove code fences if present
        cleaned = cleaned.replace(/^```(?:html)?\n?/i, '').replace(/```$/i, '');
        
        const updates: any = { content: cleaned };
        
        // Auto-fill title and generate slug
        if (data.title) {
          updates.title = data.title;
          updates.slug = slugify(data.title, { 
            lower: true, 
            strict: true,
            remove: /[*+~.()'"!:@]/g 
          });
        }
        
        // Auto-fill excerpt
        if (data.excerpt) {
          updates.excerpt = data.excerpt;
        }
        
        // Auto-fill meta information
        if (data.meta_title) {
          updates.meta_title = data.meta_title;
        }
        if (data.meta_description) {
          updates.meta_description = data.meta_description;
        }
        
        // Auto-fill tags
        if (data.tags && Array.isArray(data.tags)) {
          updates.tags = data.tags;
        }
        
        updateFormData(updates);
        toast({
          title: "🏛️ Government Scheme Formatted",
          description: "Title, excerpt, tags, meta fields, and content auto-filled successfully!",
        });
      }
    } catch (error: any) {
      console.error('Format as scheme error:', error);
      toast({
        title: "Formatting Failed",
        description: error?.message || "Failed to format as government scheme.",
        variant: "destructive",
      });
    } finally {
      setIsFormattingScheme(false);
    }
  };

  const handleFormatSports = async () => {
    if (!formData.content?.trim()) {
      toast({
        title: "No Content",
        description: "Please add some content first to format as sports article.",
        variant: "destructive",
      });
      return;
    }

    setIsFormattingSports(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-proxy', {
        body: {
          task: 'format-as-sports',
          content: formData.content,
        }
      });

      if (error) throw error;

      if (data?.result) {
        let cleaned = data.result.trim();
        
        // Remove code fences if present
        cleaned = cleaned.replace(/^```(?:html)?\n?/i, '').replace(/```$/i, '');
        
        const updates: any = { content: cleaned };
        
        // Auto-fill title and generate slug
        if (data.title) {
          updates.title = data.title;
          updates.slug = slugify(data.title, { 
            lower: true, 
            strict: true,
            remove: /[*+~.()'"!:@]/g 
          });
        }
        
        // Auto-fill excerpt
        if (data.excerpt) {
          updates.excerpt = data.excerpt;
        }
        
        // Auto-fill meta information
        if (data.meta_title) {
          updates.meta_title = data.meta_title;
        }
        if (data.meta_description) {
          updates.meta_description = data.meta_description;
        }
        
        // Auto-fill tags
        if (data.tags && Array.isArray(data.tags)) {
          updates.tags = data.tags;
        }
        
        updateFormData(updates);
        toast({
          title: "⚽ Sports Article Formatted",
          description: "Title, excerpt, tags, meta fields, and content auto-filled successfully!",
        });
      }
    } catch (error: any) {
      console.error('Format as sports error:', error);
      toast({
        title: "Formatting Failed",
        description: error?.message || "Failed to format as sports article.",
        variant: "destructive",
      });
    } finally {
      setIsFormattingSports(false);
    }
  };

  const handleSuggestLinks = async () => {
    const currentTitle = formData.title;
    const currentContent = formData.content;
    
    if (!currentTitle?.trim() || !currentContent?.trim()) {
      toast({
        title: "Missing Content",
        description: "Please enter a title and content first",
        variant: "destructive",
      });
      return;
    }

    setIsSuggestingLinks(true);
    try {
      // Call both internal and external link functions in parallel
      const [internalRes, externalRes] = await Promise.all([
        supabase.functions.invoke('suggest-internal-links', {
          body: { 
            title: currentTitle,
            content: currentContent,
            currentArticleId: article?.id 
          }
        }),
        supabase.functions.invoke('ai-proxy', {
          body: { 
            task: 'suggest-external-links', 
            content: currentContent,
            title: currentTitle
          }
        })
      ]);

      if (internalRes.error) throw internalRes.error;
      if (externalRes.error) throw externalRes.error;

      const externalResult = externalRes.data.result;

      setLinkSuggestions({
        internal: internalRes.data.suggestions || [],
        external: externalResult.suggestions || []
      });
      setShowLinkPreview(true);
      toast({
        title: "Link Suggestions Generated",
        description: `Found ${internalRes.data.suggestions?.length || 0} internal + ${externalResult.suggestions?.length || 0} external links`,
      });
    } catch (error: any) {
      console.error('Suggest links error:', error);
      toast({
        title: "Suggestion Failed",
        description: error?.message || "Failed to generate link suggestions",
        variant: "destructive",
      });
    } finally {
      setIsSuggestingLinks(false);
    }
  };

  const handleInsertLinks = () => {
    if (!linkSuggestions) return;

    let currentContent = formData.content;
    
    // Insert internal links into natural points
    linkSuggestions.internal.slice(0, 5).forEach((link, index) => {
      const anchor = link.suggestedAnchors[0] || link.title;
      const linkHtml = `<a href="/article/${link.slug}">${anchor}</a>`;
      
      const paragraphs = currentContent.split('</p>');
      if (paragraphs.length > index + 2) {
        paragraphs[index + 2] = paragraphs[index + 2].replace(
          /(<p[^>]*>)/,
          `$1See also: ${linkHtml}. `
        );
      }
      currentContent = paragraphs.join('</p>');
    });

    // Add external sources section at the end
    if (linkSuggestions.external.length > 0) {
      currentContent += '\n\n<h2>Sources & References</h2>\n<ul>\n';
      linkSuggestions.external.forEach(link => {
        currentContent += `<li><a href="${link.url}" target="_blank" rel="noopener noreferrer">${link.title}</a> - ${link.source}</li>\n`;
      });
      currentContent += '</ul>';
    }

    updateFormData({ content: currentContent });
    setShowLinkPreview(false);
    setLinkSuggestions(null);
    toast({
      title: "Links Inserted",
      description: "Internal and external links have been added to your article!",
    });
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
                  {/* Primary Format Button - Most Prominent */}
                  <Button
                    size="default"
                    onClick={handleFormatContent}
                    disabled={isFormattingContent || !formData.content?.trim()}
                    className="bg-gradient-primary hover:bg-gradient-secondary transition-all duration-300 shadow-lg"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {isFormattingContent ? 'Formatting & Extracting All...' : '✨ Format with AI (Auto-Fill All)'}
                  </Button>
                  
                  {/* Government Job Formatter */}
                  <Button
                    size="default"
                    onClick={handleFormatGovJob}
                    disabled={isFormattingGovJob || !formData.content?.trim()}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all duration-300 shadow-lg"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {isFormattingGovJob ? 'Formatting Job Article...' : '🎯 Format Government Job'}
                  </Button>
                  
                  {/* Exam Notification Formatter */}
                  <Button
                    size="default"
                    onClick={handleFormatExamNotification}
                    disabled={isFormattingExam || !formData.content?.trim()}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transition-all duration-300 shadow-lg"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {isFormattingExam ? 'Formatting Exam...' : '📚 Format Exam Notification'}
                  </Button>
                  
                  {/* Gadget Review Formatter */}
                  <Button
                    size="default"
                    onClick={handleFormatGadgetReview}
                    disabled={isFormattingGadget || !formData.content?.trim()}
                    className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white transition-all duration-300 shadow-lg"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {isFormattingGadget ? 'Formatting Review...' : '📱 Format Gadget Review'}
                  </Button>
                  
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
                  size="sm"
                >
                  <ClipboardCheck className="mr-2 h-4 w-4" />
                  {isCheckingReadiness ? 'Checking...' : 'Check Readiness'}
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
                
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleFormatNews}
                    disabled={isFormattingNews || !formData.content?.trim()}
                    className="bg-gradient-to-r from-orange-500/10 to-red-500/10 hover:from-orange-500/20 hover:to-red-500/20"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {isFormattingNews ? 'Formatting...' : '📰 Format as News'}
                  </Button>
                  
                  {/* Auto Insert Internal Links - Prominent */}
                  <Button
                    size="default"
                    onClick={handleInjectLinks}
                    disabled={isInjectingLinks || !formData.content?.trim() || !formData.title?.trim()}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white transition-all duration-300 shadow-lg"
                  >
                    <Link className="w-4 h-4 mr-2" />
                    {isInjectingLinks ? 'Auto-Linking...' : '🔗 Auto Insert Internal Links'}
                  </Button>
                  
                  {/* Web3 Code Analysis - Only for Web3 Articles */}
                  {articleType === 'web3' && (
                    <Button
                      size="default"
                      onClick={handleAnalyzeWeb3Content}
                      disabled={isAnalyzingWeb3Content || !formData.content?.trim()}
                      className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white transition-all duration-300 shadow-lg"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      {isAnalyzingWeb3Content ? 'Analyzing Content...' : '🔮 Add Code Examples'}
                    </Button>
                  )}
                  
                  <Button
                  variant="outline"
                  size="sm"
                  onClick={handleFormatScheme}
                  disabled={isFormattingScheme || !formData.content?.trim()}
                  className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 hover:from-purple-500/20 hover:to-indigo-500/20"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {isFormattingScheme ? 'Formatting...' : '🏛️ Format as Scheme'}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleFormatSports}
                  disabled={isFormattingSports || !formData.content?.trim()}
                  className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 hover:from-blue-500/20 hover:to-cyan-500/20"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {isFormattingSports ? 'Formatting...' : '⚽ Format as Sports'}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSuggestLinks}
                  disabled={isSuggestingLinks || !formData.title?.trim() || !formData.content?.trim()}
                  className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 hover:from-green-500/20 hover:to-emerald-500/20"
                >
                  <Link className="w-4 h-4 mr-2" />
                  {isSuggestingLinks ? 'Analyzing...' : '🔗 Suggest Links (AI)'}
                </Button>
              </div>
                
                <p className="text-xs text-primary/80 font-medium">
                  ✨ <strong>Format with AI</strong> — Paste your article and click to auto-generate title, excerpt, meta tags, category, tags, and SEO-optimized content with important names and numbers bolded!
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

          {/* Content Debugging Tools */}
          <Card className="border-orange-500/20 bg-orange-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bug className="h-5 w-5 text-orange-500" />
                Content Debugging Tools
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleValidateContent}
                  disabled={isValidatingContent || !formData.content?.trim()}
                  className="flex-1"
                >
                  <ClipboardCheck className="w-4 h-4 mr-2" />
                  {isValidatingContent ? 'Validating...' : 'Validate & Fix Content'}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDebugSanitization}
                  disabled={!formData.content?.trim()}
                  className="flex-1"
                >
                  <Bug className="w-4 h-4 mr-2" />
                  Debug Sanitization
                </Button>
              </div>
              
              {contentValidation && showContentDebugger && (
                <Alert className={contentValidation.isValid ? 'border-green-500/50' : 'border-red-500/50'}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="font-semibold">
                        {contentValidation.isValid ? '✓ Content Valid' : '✗ Content Issues Found'}
                      </div>
                      <div className="text-xs space-y-1">
                        <div>Original: {contentValidation.stats.originalLength} chars</div>
                        <div>Repaired: {contentValidation.stats.repairedLength} chars</div>
                        <div>Changes: {contentValidation.stats.changesApplied}</div>
                      </div>
                      {contentValidation.issues.length > 0 && (
                        <div className="space-y-1 mt-2">
                          {contentValidation.issues.map((issue: any, idx: number) => (
                            <div key={idx} className="text-xs flex items-start gap-1">
                              <span className={
                                issue.type === 'error' ? 'text-red-500' :
                                issue.type === 'warning' ? 'text-orange-500' :
                                'text-blue-500'
                              }>
                                {issue.fixed ? '✓' : '✗'}
                              </span>
                              <span>{issue.message}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowContentDebugger(false)}
                        className="mt-2"
                      >
                        Close
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
              
              <p className="text-xs text-muted-foreground">
                Use these tools to check for issues that cause bold text and links to break.
              </p>
            </CardContent>
          </Card>

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

          {/* Keyword Coverage Analyzer */}
          {formData.content && formData.title && (
            <KeywordCoverageAnalyzer
              content={formData.content}
              title={formData.title}
              metaDescription={formData.meta_description}
              tags={formData.tags}
            />
          )}

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

          {/* Article Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Article Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={articleType === 'regular' ? 'default' : 'outline'}
                  onClick={() => {
                    setArticleType('regular');
                    updateFormData({ category_id: '' });
                  }}
                  className="flex-1"
                >
                  Regular Article
                </Button>
                <Button
                  type="button"
                  variant={articleType === 'web3' ? 'default' : 'outline'}
                  onClick={() => {
                    setArticleType('web3');
                    updateFormData({ category_id: '' });
                  }}
                  className="flex-1"
                >
                  Web3 for India
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Category */}
          <Card>
            <CardHeader>
              <CardTitle>
                {articleType === 'web3' ? 'Web3ForIndia Category' : 'Category'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={formData.category_id}
                onValueChange={(value) => updateFormData({ category_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Select ${articleType === 'web3' ? 'Web3ForIndia' : 'a'} category`} />
                </SelectTrigger>
                <SelectContent>
                  {categories
                    .filter((category) => {
                      if (articleType === 'web3') {
                        // Show only Web3ForIndia subcategories
                        const parentCategory = categories.find(cat => cat.id === category.parent_id);
                        return parentCategory?.slug === 'web3forindia';
                      } else {
                        // Show only non-Web3 categories (no parent or parent is not web3forindia)
                        if (!category.parent_id) {
                          return category.slug !== 'web3forindia';
                        }
                        const parentCategory = categories.find(cat => cat.id === category.parent_id);
                        return parentCategory?.slug !== 'web3forindia';
                      }
                    })
                    .map((category) => (
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

      {/* Link Suggestions Preview Dialog */}
      {showLinkPreview && linkSuggestions && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background border rounded-lg max-w-3xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">🔗 Link Suggestions</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowLinkPreview(false)}>
                ✕
              </Button>
            </div>

            {linkSuggestions.internal.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-3 text-primary">Internal Links ({linkSuggestions.internal.length})</h4>
                <div className="space-y-3">
                  {linkSuggestions.internal.slice(0, 7).map((link, index) => (
                    <div key={index} className="p-3 border rounded bg-muted/30">
                      <p className="font-medium">{link.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        URL: /article/{link.slug}
                      </p>
                      <p className="text-sm mt-1">
                        <span className="font-medium">Suggested Anchor:</span> "{link.suggestedAnchors[0]}"
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Relevance: {link.relevanceScore}/100
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {linkSuggestions.external.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-3 text-primary">🌐 External References ({linkSuggestions.external.length})</h4>
                <div className="space-y-3">
                  {linkSuggestions.external.map((link, index) => (
                    <div key={index} className="p-3 border rounded bg-muted/30">
                      <p className="font-medium">{link.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        URL: {link.url}
                      </p>
                      <p className="text-sm mt-1">
                        <span className="font-medium">Source:</span> {link.source}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {link.reason}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {linkSuggestions.internal.length === 0 && linkSuggestions.external.length === 0 && (
              <p className="text-muted-foreground text-center py-8">
                No relevant links found for this article.
              </p>
            )}

            <div className="flex gap-3 mt-6">
              <Button 
                onClick={handleInsertLinks}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                disabled={linkSuggestions.internal.length === 0 && linkSuggestions.external.length === 0}
              >
                ✔ Insert Automatically
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowLinkPreview(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}