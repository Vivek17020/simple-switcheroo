import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Upload, X, Plus, Eye, Smartphone } from 'lucide-react';
import slugify from 'slugify';
import { WebStorySlide } from '@/hooks/use-web-stories';

interface WebStoryFormProps {
  initialData?: {
    id?: string;
    title: string;
    category: string;
    description: string;
    slides: WebStorySlide[];
    status: string;
    canonical_url: string;
  };
  onSave: () => void;
}

const categories = ['Defence', 'Jobs', 'Tech', 'Global', 'Business'];

export function WebStoryForm({ initialData, onSave }: WebStoryFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [category, setCategory] = useState(initialData?.category || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [slides, setSlides] = useState<WebStorySlide[]>(initialData?.slides || [{ image: '', text: '' }]);
  const [canonicalUrl, setCanonicalUrl] = useState(initialData?.canonical_url || '');
  const [isPublished, setIsPublished] = useState(initialData ? initialData.status === 'published' : true);
  const [uploading, setUploading] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleImageUpload = async (index: number, file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File',
        description: 'Please upload an image file (JPG/PNG)',
        variant: 'destructive',
      });
      return;
    }

    setUploading(index);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `web-stories/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('article-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('article-images')
        .getPublicUrl(filePath);

      const newSlides = [...slides];
      newSlides[index].image = publicUrl;
      setSlides(newSlides);

      toast({
        title: 'Image Uploaded',
        description: 'Slide image uploaded successfully',
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload image',
        variant: 'destructive',
      });
    } finally {
      setUploading(null);
    }
  };

const addSlide = () => {
    setSlides([...slides, { image: '', text: '', subtext: '', slideType: 'content' }]);
  };

  const removeSlide = (index: number) => {
    if (slides.length > 1) {
      setSlides(slides.filter((_, i) => i !== index));
    }
  };

  const updateSlideText = (index: number, text: string) => {
    const newSlides = [...slides];
    newSlides[index].text = text;
    setSlides(newSlides);
  };

  const handleSave = async () => {
    // Enhanced validation
    if (!title?.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a title for your web story',
        variant: 'destructive',
      });
      return;
    }

    if (!category) {
      toast({
        title: 'Validation Error',
        description: 'Please select a category',
        variant: 'destructive',
      });
      return;
    }

    if (slides.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please add at least one slide with an image',
        variant: 'destructive',
      });
      return;
    }

    const invalidSlideIndex = slides.findIndex(s => !s.image);
    if (invalidSlideIndex !== -1) {
      toast({
        title: 'Validation Error',
        description: `Slide ${invalidSlideIndex + 1} is missing an image. All slides must have images.`,
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    console.log('🚀 Starting web story save process...');

    try {
      // Verify authentication with detailed error handling
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('❌ Authentication error:', authError);
        throw new Error('Authentication failed. Please refresh the page and log in again.');
      }

      if (!user) {
        console.error('❌ No user found');
        throw new Error('You must be logged in to save web stories. Please log in and try again.');
      }

      console.log('✅ User authenticated:', user.id);

      const slug = slugify(title, { lower: true, strict: true });
      const computedStatus = isPublished ? 'published' : 'draft';
      const now = new Date().toISOString();
      
      const storyData = {
        title: title.trim(),
        category,
        description: description?.trim() || null,
        slug,
        slides,
        status: computedStatus,
        published_at: computedStatus === 'published' ? now : null,
        canonical_url: canonicalUrl?.trim() || null,
        featured_image: slides[0]?.image || null,
        user_id: user.id,
        updated_at: now,
      };

      console.log('📊 Story data prepared:', { 
        slug, 
        status: computedStatus, 
        slidesCount: slides.length,
        userId: user.id,
        isUpdate: !!initialData?.id
      });

      if (initialData?.id) {
        console.log('📝 Updating existing story:', initialData.id);
        
        const { error, data } = await supabase
          .from('web_stories' as any)
          .update(storyData)
          .eq('id', initialData.id)
          .select();

        if (error) {
          console.error('❌ Update error:', error);
          throw new Error(`Failed to update web story: ${error.message}`);
        }

        console.log('✅ Story updated successfully:', data);

        toast({
          title: computedStatus === 'published' ? '✓ Web Story Published' : '✓ Web Story Updated',
          description: `"${title}" has been ${computedStatus === 'published' ? 'published' : 'saved as draft'} successfully`,
        });
      } else {
        console.log('➕ Creating new story...');
        
        const { error, data } = await supabase
          .from('web_stories' as any)
          .insert([{
            ...storyData,
            created_at: now,
          }])
          .select();

        if (error) {
          console.error('❌ Insert error:', error);
          throw new Error(`Failed to create web story: ${error.message}`);
        }

        console.log('✅ Story created successfully:', data);

        toast({
          title: computedStatus === 'published' ? '✓ Web Story Published' : '✓ Web Story Created',
          description: `"${title}" has been ${computedStatus === 'published' ? 'published' : 'created'} successfully`,
        });
      }

      onSave();
    } catch (error: any) {
      console.error('❌ Error saving web story:', error);
      
      let errorMessage = 'Failed to save web story. Please try again.';
      
      // Provide specific, actionable error messages
      if (error.message?.includes('user_id') || error.message?.includes('violates row-level security')) {
        errorMessage = 'Authentication error. Please refresh the page and log in again.';
      } else if (error.message?.includes('unique constraint') || error.message?.includes('duplicate')) {
        errorMessage = 'A web story with this title already exists. Please use a different title.';
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: '❌ Error Saving Web Story',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
      console.log('🏁 Save process completed');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Story Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Story Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter story title"
            />
          </div>

          <div>
            <Label htmlFor="category">Category *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Story Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of the story"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="canonical">Canonical URL (Optional)</Label>
            <Input
              id="canonical"
              value={canonicalUrl}
              onChange={(e) => setCanonicalUrl(e.target.value)}
              placeholder="https://example.com/article"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Story Slides</span>
            <Button variant="outline" size="sm" onClick={addSlide}>
              <Plus className="w-4 h-4 mr-2" />
              Add Slide
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {slides.map((slide, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-sm flex items-center justify-between">
                  Slide {index + 1}
                  {slides.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSlide(index)}
                      className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Image * (min 720x1280px)</Label>
                  <div className="mt-2">
                    {slide.image ? (
                      <div className="relative w-full aspect-[9/16] max-w-xs bg-muted rounded-lg overflow-hidden">
                        <img
                          src={slide.image}
                          alt={`Slide ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            const newSlides = [...slides];
                            newSlides[index].image = '';
                            setSlides(newSlides);
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full aspect-[9/16] max-w-xs border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                        <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">
                          {uploading === index ? 'Uploading...' : 'Click to upload'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(index, file);
                          }}
                          disabled={uploading === index}
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Label htmlFor={`type-${index}`}>Slide Type</Label>
                      <Select 
                        value={slide.slideType || 'content'} 
                        onValueChange={(value: 'cover' | 'content' | 'cta' | 'summary') => {
                          const newSlides = [...slides];
                          newSlides[index].slideType = value;
                          setSlides(newSlides);
                        }}
                      >
                        <SelectTrigger id={`type-${index}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cover">Cover</SelectItem>
                          <SelectItem value="content">Content</SelectItem>
                          <SelectItem value="summary">Summary</SelectItem>
                          <SelectItem value="cta">CTA</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`text-${index}`}>Headline (max 8 words)</Label>
                    <Input
                      id={`text-${index}`}
                      value={slide.text}
                      onChange={(e) => updateSlideText(index, e.target.value)}
                      placeholder="Punchy headline..."
                      maxLength={60}
                    />
                  </div>

                  <div>
                    <Label htmlFor={`subtext-${index}`}>Subtext (supporting detail)</Label>
                    <Textarea
                      id={`subtext-${index}`}
                      value={slide.subtext || ''}
                      onChange={(e) => {
                        const newSlides = [...slides];
                        newSlides[index].subtext = e.target.value;
                        setSlides(newSlides);
                      }}
                      placeholder="Add context, facts, or details..."
                      rows={2}
                      maxLength={150}
                    />
                  </div>

                  {slide.slideType === 'cta' && (
                    <div className="grid gap-4 p-3 bg-muted/50 rounded-lg">
                      <div>
                        <Label htmlFor={`cta-text-${index}`}>CTA Button Text</Label>
                        <Input
                          id={`cta-text-${index}`}
                          value={slide.ctaText || ''}
                          onChange={(e) => {
                            const newSlides = [...slides];
                            newSlides[index].ctaText = e.target.value;
                            setSlides(newSlides);
                          }}
                          placeholder="Read Full Article"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`cta-url-${index}`}>CTA URL</Label>
                        <Input
                          id={`cta-url-${index}`}
                          value={slide.ctaUrl || ''}
                          onChange={(e) => {
                            const newSlides = [...slides];
                            newSlides[index].ctaUrl = e.target.value;
                            setSlides(newSlides);
                          }}
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="publish" className="text-base">Publish Status</Label>
              <p className="text-sm text-muted-foreground">
                {isPublished ? 'Story will be visible to the public' : 'Story will be saved as draft'}
              </p>
            </div>
            <Switch
              id="publish"
              checked={isPublished}
              onCheckedChange={setIsPublished}
            />
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-gradient-primary hover:bg-gradient-secondary"
            >
              {saving ? 'Saving...' : initialData?.id ? 'Update Story' : 'Create Story'}
            </Button>
            {initialData?.id && (
              <Button
                variant="outline"
                onClick={() => {
                  const slug = slugify(title, { lower: true, strict: true });
                  window.open(`/admin/web-stories/preview/${slug}`, '_blank');
                }}
                disabled={!slides[0]?.image}
              >
                <Smartphone className="w-4 h-4 mr-2" />
                Preview
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
              disabled={!slides[0]?.image}
            >
              <Eye className="w-4 h-4 mr-2" />
              Quick View
            </Button>
          </div>
        </CardContent>
      </Card>

      {showPreview && slides[0]?.image && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Mobile Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {slides.map((slide, index) => (
                slide.image && (
                  <div key={index} className="relative flex-shrink-0 w-48 aspect-[9/16] bg-card rounded-lg overflow-hidden border-2 border-border shadow-lg">
                    <img
                      src={slide.image}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
                      {slide.slideType && (
                        <span className="inline-block px-2 py-0.5 bg-primary/80 text-white text-[10px] font-medium rounded mb-1">
                          {slide.slideType.toUpperCase()}
                        </span>
                      )}
                      {slide.text && (
                        <p className="text-white text-sm font-bold mb-1">{slide.text}</p>
                      )}
                      {slide.subtext && (
                        <p className="text-white/80 text-xs">{slide.subtext}</p>
                      )}
                    </div>
                    <div className="absolute top-2 left-2 bg-black/50 px-2 py-1 rounded text-white text-xs">
                      {index + 1}/{slides.length}
                    </div>
                  </div>
                )
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
