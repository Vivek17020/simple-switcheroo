import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/utils/seo";
import { Helmet } from "react-helmet-async";
import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, FileText } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function AuthorPage() {
  const { username } = useParams<{ username: string }>();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["author-profile", username],
    queryFn: async () => {
      // Only select public author fields to prevent data leakage
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, author_image_url, author_bio, bio, job_title, created_at")
        .eq("username", username)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!username,
  });

  const { data: articles, isLoading: articlesLoading } = useQuery({
    queryKey: ["author-articles", profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select(`
          id,
          title,
          slug,
          excerpt,
          image_url,
          published_at,
          reading_time,
          category_id,
          categories (name, slug)
        `)
        .eq("author_id", profile?.id)
        .eq("published", true)
        .order("published_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  if (profileLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-32 w-full mb-8" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Author Not Found</CardTitle>
              <CardDescription>
                The author you're looking for doesn't exist.
              </CardDescription>
            </CardHeader>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const authorName = profile.full_name || profile.username;
  const authorBio = profile.author_bio || profile.bio || `Articles by ${authorName}`;
  const articleCount = articles?.length || 0;

  const authorSchema = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "mainEntity": {
      "@type": "Person",
      "name": authorName,
      "alternateName": profile.username,
      "description": authorBio,
      "image": profile.author_image_url || profile.avatar_url,
      "jobTitle": profile.job_title || "Writer",
      "url": `${window.location.origin}/author/${profile.username}`,
      "sameAs": [],
      "affiliation": {
        "@type": "NewsMediaOrganization",
        "name": "TheBulletinBriefs"
      }
    },
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": window.location.origin
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Authors",
          "item": `${window.location.origin}/authors`
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": authorName,
          "item": `${window.location.origin}/author/${profile.username}`
        }
      ]
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title={`${authorName} - Author at TheBulletinBriefs`}
        description={authorBio}
        canonicalUrl={`https://www.thebulletinbriefs.in/author/${profile.username}`}
        image={profile.author_image_url || profile.avatar_url}
        type="website"
      />
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(authorSchema)}
        </script>
      </Helmet>

      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Author Header */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <Avatar className="h-24 w-24">
                <AvatarImage 
                  src={profile.author_image_url || profile.avatar_url || undefined} 
                  alt={authorName}
                />
                <AvatarFallback className="text-2xl">
                  {authorName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{authorName}</h1>
                {profile.job_title && (
                  <p className="text-muted-foreground mb-3">{profile.job_title}</p>
                )}
                <p className="text-foreground mb-4">{authorBio}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    <span>{articleCount} {articleCount === 1 ? 'Article' : 'Articles'}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Articles Grid */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Articles by {authorName}</h2>
          {articlesLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          ) : articles && articles.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <Link 
                  key={article.id} 
                  to={`/article/${article.slug}`}
                  className="group"
                >
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    {article.image_url && (
                      <div className="aspect-video overflow-hidden rounded-t-lg">
                        <img
                          src={article.image_url}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        {article.categories && (
                          <span className="font-medium text-primary">
                            {article.categories.name}
                          </span>
                        )}
                        {article.published_at && (
                          <>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(article.published_at), "MMM d, yyyy")}
                            </div>
                          </>
                        )}
                      </div>
                      <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                        {article.title}
                      </CardTitle>
                      {article.excerpt && (
                        <CardDescription className="line-clamp-3">
                          {article.excerpt}
                        </CardDescription>
                      )}
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No articles published yet.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
