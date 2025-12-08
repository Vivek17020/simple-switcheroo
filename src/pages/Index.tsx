import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, Eye, ArrowRight, Shield } from 'lucide-react';
import { AdvancedSEOHead } from '@/components/seo/advanced-seo-head';
import { FloatingTranslationButton } from '@/components/public/floating-translation-button';
const Index = () => {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "NewsMediaOrganization",
    "name": "TheBulletinBriefs",
    "url": "https://www.thebulletinbriefs.in",
    "logo": "https://www.thebulletinbriefs.in/logo.png",
    "description": "Professional news and content management platform delivering breaking news, current affairs, and educational content",
    "sameAs": [
      "https://twitter.com/thebulletinbriefs",
      "https://facebook.com/thebulletinbriefs"
    ]
  };

  return (
    <>
      <AdvancedSEOHead
        title="TheBulletinBriefs - Latest News, Current Affairs & Educational Content"
        description="Stay updated with breaking news, current affairs, government exam updates, and educational resources. Your trusted source for quality journalism and information."
        canonical="https://www.thebulletinbriefs.in"
        image="https://www.thebulletinbriefs.in/og-image.jpg"
        type="website"
        schemas={[organizationSchema]}
      />
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <FileText className="h-4 w-4 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Article Hub
              </h1>
            </div>
            <Button asChild variant="outline" className="border-primary/20 hover:bg-primary/10">
              <Link to="/admin/login">
                <Shield className="w-4 h-4 mr-2" />
                Admin Login
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-hero opacity-10" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-6">
            Professional Content Management
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            A powerful admin dashboard for creating, editing, and publishing articles with rich text editing and media management.
          </p>
          <Button asChild size="lg" className="bg-gradient-primary hover:bg-gradient-secondary transition-all duration-300 shadow-glow">
            <Link to="/admin/login">
              Get Started
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-card/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Everything you need to manage content
            </h2>
            <p className="text-lg text-muted-foreground">
              Built with modern technologies for a seamless experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-border/50 hover:shadow-accent transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-primary-foreground" />
                </div>
                <CardTitle>Rich Text Editor</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Professional WYSIWYG editor with support for headings, formatting, links, images, and code blocks.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 hover:shadow-accent transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-secondary rounded-lg flex items-center justify-center mb-4">
                  <Eye className="h-6 w-6 text-primary-foreground" />
                </div>
                <CardTitle>Live Publishing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Publish articles instantly without redeploy. Changes go live immediately with real-time updates.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 hover:shadow-accent transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-hero rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-primary-foreground" />
                </div>
                <CardTitle>Admin Security</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Secure admin-only access with Supabase authentication and role-based permissions.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-muted-foreground">
            Built with React, TypeScript, Tailwind CSS, and Supabase
          </p>
        </div>
      </footer>
      <FloatingTranslationButton />
    </div>
    </>
  );
};

export default Index;
