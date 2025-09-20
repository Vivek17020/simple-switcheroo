import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/public/navbar";
import { ArticleGrid } from "@/components/public/article-grid";
import { useCategories, useArticles } from "@/hooks/use-articles";
import { SEOHead } from "@/utils/seo";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: categories } = useCategories();
  const { data: articlesData } = useArticles(slug, 1, 1); // Get first article to check if any exist
  
  const category = categories?.find(cat => cat.slug === slug);

  if (!category) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Category Not Found</h1>
            <p className="text-muted-foreground mb-8">
              The category you're looking for doesn't exist.
            </p>
            <Button asChild>
              <Link to="/">Return to Homepage</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title={`${category.name} News - TheBulletinBriefs`}
        description={category.description || `Latest ${category.name.toLowerCase()} news and articles from TheBulletinBriefs.`}
        type="website"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `${category.name} News`,
          description: category.description,
          url: `${window.location.origin}/category/${category.slug}`,
          mainEntity: {
            "@type": "ItemList",
            name: `${category.name} Articles`,
            description: `Latest articles in ${category.name}`
          }
        }}
      />

      <div className="min-h-screen bg-background">
        <Navbar />
        
        <main className="container mx-auto px-4 py-8">
          {/* Back button */}
          <Button variant="ghost" asChild className="mb-6">
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to News
            </Link>
          </Button>

          {/* Category Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <FileText className="h-8 w-8 text-primary" />
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                {category.name} News
              </h1>
            </div>
            {category.description && (
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-4">
                {category.description}
              </p>
            )}
            {articlesData && (
              <p className="text-sm text-muted-foreground">
                {articlesData.totalCount > 0 
                  ? `${articlesData.totalCount} article${articlesData.totalCount === 1 ? '' : 's'} available`
                  : 'No articles in this category yet'
                }
              </p>
            )}
          </div>

          {/* Articles Grid */}
          <ArticleGrid categorySlug={slug} />
        </main>
      </div>
    </>
  );
}