import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Calendar, CheckCircle2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface WebStoryGeneratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  articleId: string;
  articleTitle: string;
  onSuccess?: () => void;
}

export function WebStoryGeneratorDialog({
  open,
  onOpenChange,
  articleId,
  articleTitle,
  onSuccess
}: WebStoryGeneratorDialogProps) {
  const [generating, setGenerating] = useState(false);
  const [autoPublish, setAutoPublish] = useState(false);
  const [schedulePublish, setSchedulePublish] = useState(false);
  const [scheduledTime, setScheduledTime] = useState('');

  const handleGenerate = async () => {
    setGenerating(true);
    
    try {
      console.log('🎬 Generating web story for article:', articleId);
      
      const { data, error } = await supabase.functions.invoke('generate-web-story', {
        body: {
          articleId,
          autoPublish: autoPublish && !schedulePublish
        }
      });

      if (error) throw error;

      console.log('✅ Web story generated:', data);

      // If scheduling, add to queue
      if (schedulePublish && scheduledTime && data.story) {
        const { error: queueError } = await supabase
          .from('web_stories_queue')
          .insert({
            story_id: data.story.id,
            scheduled_at: scheduledTime,
            auto_publish: true,
            review_status: 'approved',
            priority: 1
          });

        if (queueError) {
          console.error('⚠️ Failed to schedule story:', queueError);
          toast({
            title: 'Story created but not scheduled',
            description: 'The story was created but could not be added to the publishing queue.',
            variant: 'destructive'
          });
        } else {
          toast({
            title: '✅ Web story scheduled!',
            description: `Story will be published on ${new Date(scheduledTime).toLocaleString()}`,
          });
        }
      } else {
        toast({
          title: autoPublish ? '✅ Web story published!' : '✅ Web story created!',
          description: autoPublish 
            ? 'The story has been published and indexed.' 
            : 'Review and publish the story when ready.',
        });
      }

      onOpenChange(false);
      onSuccess?.();
      
    } catch (error: any) {
      console.error('❌ Error generating web story:', error);
      toast({
        title: 'Generation failed',
        description: error.message || 'Failed to generate web story. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Generate Web Story
          </DialogTitle>
          <DialogDescription>
            AI will automatically create a visual web story from this article with optimized images and text.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <h4 className="font-medium text-sm mb-1">Source Article</h4>
            <p className="text-sm text-muted-foreground">{articleTitle}</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-publish" className="text-sm font-medium">
                Auto-publish immediately
              </Label>
              <Switch
                id="auto-publish"
                checked={autoPublish}
                onCheckedChange={setAutoPublish}
                disabled={schedulePublish}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="schedule-publish" className="text-sm font-medium">
                Schedule for later
              </Label>
              <Switch
                id="schedule-publish"
                checked={schedulePublish}
                onCheckedChange={(checked) => {
                  setSchedulePublish(checked);
                  if (checked) setAutoPublish(false);
                }}
              />
            </div>

            {schedulePublish && (
              <div className="space-y-2 pl-4 border-l-2 border-primary">
                <Label htmlFor="scheduled-time" className="text-sm">
                  Publish Date & Time
                </Label>
                <input
                  id="scheduled-time"
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                />
              </div>
            )}
          </div>

          <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3">
            <div className="flex gap-2 text-sm text-blue-600 dark:text-blue-400">
              <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">AI will create:</p>
                <ul className="mt-1 space-y-1 text-xs">
                  <li>• 5-8 visual slides with headlines</li>
                  <li>• Custom AI-generated images (9:16)</li>
                  <li>• SEO-optimized title & description</li>
                  <li>• AMP-compatible web story</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
            disabled={generating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={generating || (schedulePublish && !scheduledTime)}
            className="flex-1"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : schedulePublish ? (
              <>
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Story
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Now
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
