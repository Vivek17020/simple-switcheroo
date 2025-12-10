import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Helmet } from "react-helmet-async";
import { Web3Breadcrumb } from "@/components/web3/Web3Breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Code, Copy, Eye, GitFork, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useState } from "react";

type CodeSnippet = Database['public']['Tables']['web3_code_snippets']['Row'];

export default function Web3SnippetPage() {
  const { slug } = useParams<{ slug: string }>();
  const [copied, setCopied] = useState(false);

  const { data: snippet, isLoading } = useQuery<CodeSnippet | null>({
    queryKey: ["web3-snippet", slug],
    queryFn: async (): Promise<CodeSnippet | null> => {
      if (!slug) return null;
      
      const { data, error } = await supabase
        .from("web3_code_snippets")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (error) throw error;
      
      // Increment view count if snippet exists
      if (data?.id) {
        await supabase.rpc("increment_snippet_view_count", {
          snippet_uuid: data.id
        });
      }
      
      return data;
    },
    enabled: !!slug,
  });

  const handleCopy = () => {
    if (snippet?.code) {
      navigator.clipboard.writeText(snippet.code);
      setCopied(true);
      toast.success("Code copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F8F9FF] to-white pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-6">
          <Skeleton className="h-8 w-64 mb-8" />
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!snippet) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F8F9FF] to-white pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Code Snippet Not Found
          </h1>
          <p className="text-gray-600 mb-8">
            The code snippet you're looking for doesn't exist.
          </p>
          <Link to="/web3forindia/playground">
            <Button>Back to Playground</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{snippet.title} - Web3 Code Snippet | TheBulletinBriefs</title>
        <meta
          name="description"
          content={snippet.description || `${snippet.title} code snippet for Web3 development`}
        />
        <meta
          name="keywords"
          content={`web3, code snippet, ${snippet.language}, blockchain, smart contracts`}
        />
        <link rel="canonical" href={`https://www.thebulletinbriefs.in/web3forindia/snippet/${slug}`} />
        <meta property="og:title" content={`${snippet.title} - Web3 Code Snippet`} />
        <meta property="og:description" content={snippet.description || `${snippet.title} code snippet for Web3 development`} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://www.thebulletinbriefs.in/web3forindia/snippet/${slug}`} />
        
        {/* Code Snippet Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareSourceCode",
            "name": snippet.title,
            "description": snippet.description,
            "programmingLanguage": snippet.language,
            "codeRepository": `https://www.thebulletinbriefs.in/web3forindia/snippet/${slug}`,
            "codeSampleType": "code snippet",
            "author": {
              "@type": "Organization",
              "name": "TheBulletinBriefs"
            }
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-[#F8F9FF] to-white pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-6">
          <Button variant="ghost" asChild className="mb-6">
            <Link to="/web3forindia/playground">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Playground
            </Link>
          </Button>

          <Web3Breadcrumb
            items={[
              { label: "Playground", href: "/web3forindia/playground" },
              { label: snippet.title },
            ]}
          />

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Badge className="bg-gradient-to-r from-[#6A5BFF] to-[#4AC4FF] text-white">
                {snippet.language}
              </Badge>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {snippet.title}
            </h1>
            
            {snippet.description && (
              <p className="text-lg text-gray-600 mb-6">
                {snippet.description}
              </p>
            )}

            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                <span>{snippet.view_count || 0} views</span>
              </div>
              <div className="flex items-center gap-2">
                <GitFork className="w-4 h-4" />
                <span>{snippet.fork_count || 0} forks</span>
              </div>
            </div>
          </div>

          {/* Code Display */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  Code
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="gap-2"
                >
                  <Copy className="w-4 h-4" />
                  {copied ? "Copied!" : "Copy Code"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative bg-gray-900 rounded-b-lg overflow-hidden">
                <pre className="p-6 text-sm text-gray-100 overflow-x-auto">
                  <code>{snippet.code}</code>
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
