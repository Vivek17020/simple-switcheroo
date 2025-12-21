import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Mail, Settings, Bell, Save } from 'lucide-react';

interface NewsletterPreferences {
  frequency: 'breaking' | 'daily' | 'weekly';
  categories: string[];
  active: boolean;
}

export function NewsletterPreferences() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(user?.email || '');
  const [preferences, setPreferences] = useState<NewsletterPreferences>({
    frequency: 'daily',
    categories: [],
    active: true
  });

  const categories = [
    { id: 'politics', name: 'Politics' },
    { id: 'technology', name: 'Technology' },
    { id: 'business', name: 'Business' },
    { id: 'sports', name: 'Sports' },
    { id: 'entertainment', name: 'Entertainment' },
    { id: 'science', name: 'Science' },
    { id: 'world', name: 'World News' }
  ];

  const handleSavePreferences = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('newsletter_preferences')
        .upsert({
          user_id: user?.id || null,
          email: email,
          frequency: preferences.frequency,
          categories: preferences.categories,
          active: preferences.active,
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'email',
          ignoreDuplicates: false 
        });

      if (error) throw error;

      toast({
        title: "Preferences saved!",
        description: "Your newsletter preferences have been updated.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to save preferences",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
    setPreferences(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter(c => c !== categoryId)
        : [...prev.categories, categoryId]
    }));
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Newsletter Preferences
            </CardTitle>
            <CardDescription>
              Customize how you want to receive our news updates
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />
        </div>

        {/* Active Toggle */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="active"
            checked={preferences.active}
            onCheckedChange={(checked) => 
              setPreferences(prev => ({ ...prev, active: !!checked }))
            }
          />
          <Label htmlFor="active" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Enable newsletter notifications
          </Label>
        </div>

        {/* Frequency */}
        <div className="space-y-2">
          <Label>Frequency</Label>
          <Select
            value={preferences.frequency}
            onValueChange={(value: 'breaking' | 'daily' | 'weekly') => 
              setPreferences(prev => ({ ...prev, frequency: value }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="breaking">Breaking News Only</SelectItem>
              <SelectItem value="daily">Daily Digest</SelectItem>
              <SelectItem value="weekly">Weekly Summary</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            {preferences.frequency === 'breaking' && "Get notified immediately for urgent news"}
            {preferences.frequency === 'daily' && "Receive a daily summary of top stories"}
            {preferences.frequency === 'weekly' && "Get a weekly roundup of the most important news"}
          </p>
        </div>

        {/* Categories */}
        <div className="space-y-3">
          <Label>Preferred Categories</Label>
          <div className="grid grid-cols-2 gap-3">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center space-x-2">
                <Checkbox
                  id={category.id}
                  checked={preferences.categories.includes(category.id)}
                  onCheckedChange={() => handleCategoryToggle(category.id)}
                />
                <Label 
                  htmlFor={category.id}
                  className="text-sm font-normal cursor-pointer"
                >
                  {category.name}
                </Label>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Leave empty to receive news from all categories
          </p>
        </div>

        {/* Save Button */}
        <Button 
          onClick={handleSavePreferences} 
          disabled={loading || !email}
          className="w-full"
        >
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Saving...' : 'Save Preferences'}
        </Button>

        {/* Info */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            ✉️ Your email preferences are secure and private. 
            You can update or unsubscribe at any time.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}