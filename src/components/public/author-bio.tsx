import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import { getFirstName } from '@/lib/utils';

interface AuthorBioProps {
  authorId?: string;
  authorName: string;
  authorUsername?: string;
}

export function AuthorBio({ authorId, authorName, authorUsername }: AuthorBioProps) {
  const { data: authorProfile } = useQuery({
    queryKey: ['author-profile', authorId],
    queryFn: async () => {
      if (!authorId) return null;
      
      const { data, error } = await supabase
        .rpc('get_safe_author_profile', { author_uuid: authorId });

      if (error) throw error;
      return data?.[0] || null;
    },
    enabled: !!authorId,
  });

  const displayName = authorUsername || authorProfile?.username || getFirstName(authorName);
  const jobTitle = authorProfile?.job_title || 'Journalist';
  const bio = authorProfile?.author_bio || 'Contributing writer at TheBulletinBriefs, covering news and current events.';
  const avatarUrl = authorProfile?.author_image_url || authorProfile?.avatar_url;

  return (
    <Card className="mt-8">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback>
              <User className="h-8 w-8" />
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-2">
            <div>
              <h3 className="font-semibold text-lg">
                @{displayName}
              </h3>
              <p className="text-sm text-muted-foreground">{jobTitle}</p>
            </div>
            
            <p className="text-sm leading-relaxed">{bio}</p>
            
            <div className="text-xs text-muted-foreground space-y-1">
              <div><span className="font-medium">Published by:</span> TheBulletinBriefs</div>
              <div><span className="font-medium">Author credentials:</span> Verified journalist</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}