import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CodePlayground } from "@/components/web3/CodePlayground";
import { CodeSnippetCard } from "@/components/web3/CodeSnippetCard";
import { useCodeSnippets, useMyCodeSnippets, CodeSnippet } from "@/hooks/use-code-snippets";
import { Code2, Plus, BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Web3CodePlayground() {
  const [selectedSnippet, setSelectedSnippet] = useState<CodeSnippet | null>(null);
  const [activeTab, setActiveTab] = useState<string>("playground");

  const { data: publicSnippets, isLoading: loadingPublic } = useCodeSnippets(true);
  const { data: mySnippets, isLoading: loadingMy } = useMyCodeSnippets();

  const handleViewSnippet = (snippet: CodeSnippet) => {
    setSelectedSnippet(snippet);
    setActiveTab("playground");
  };

  const handleNewPlayground = () => {
    setSelectedSnippet(null);
    setActiveTab("playground");
  };

  return (
    <>
      <Helmet>
        <title>Code Playground - Web3 For India</title>
        <meta
          name="description"
          content="Practice Solidity smart contract development with our interactive code playground. Write, test, and deploy contracts using Remix IDE."
        />
        <link rel="canonical" href="https://www.thebulletinbriefs.in/web3forindia/playground" />
        <meta property="og:title" content="Web3 Code Playground - Practice Solidity & Smart Contracts" />
        <meta property="og:description" content="Interactive coding environment for learning Solidity and smart contract development" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.thebulletinbriefs.in/web3forindia/playground" />
        <meta property="og:image" content="https://www.thebulletinbriefs.in/og-images/web3-playground.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
      </Helmet>

      <div className="min-h-screen bg-background py-8">
        <div className="container max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                  <Code2 className="h-10 w-10 text-primary" />
                  Code Playground
                </h1>
                <p className="text-lg text-muted-foreground">
                  Write, test, and deploy smart contracts using Remix IDE
                </p>
              </div>
              <Button onClick={handleNewPlayground}>
                <Plus className="h-4 w-4 mr-2" />
                New Playground
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 max-w-[600px]">
              <TabsTrigger value="playground">
                <Code2 className="h-4 w-4 mr-2" />
                Playground
              </TabsTrigger>
              <TabsTrigger value="examples">
                <BookOpen className="h-4 w-4 mr-2" />
                Examples
              </TabsTrigger>
              <TabsTrigger value="my-snippets">
                <Code2 className="h-4 w-4 mr-2" />
                My Snippets
              </TabsTrigger>
            </TabsList>

            {/* Playground Tab */}
            <TabsContent value="playground" className="mt-6">
              <CodePlayground
                initialSnippet={selectedSnippet}
                initialCode={selectedSnippet?.code || ""}
                onFork={handleViewSnippet}
              />
            </TabsContent>

            {/* Examples Tab */}
            <TabsContent value="examples" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loadingPublic ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i}>
                      <CardHeader>
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-full mt-2" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-10 w-full" />
                      </CardContent>
                    </Card>
                  ))
                ) : publicSnippets && publicSnippets.length > 0 ? (
                  publicSnippets.map((snippet) => (
                    <CodeSnippetCard
                      key={snippet.id}
                      snippet={snippet}
                      onView={handleViewSnippet}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No examples yet</h3>
                    <p className="text-muted-foreground">
                      Check back later for community examples!
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* My Snippets Tab */}
            <TabsContent value="my-snippets" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loadingMy ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i}>
                      <CardHeader>
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-full mt-2" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-10 w-full" />
                      </CardContent>
                    </Card>
                  ))
                ) : mySnippets && mySnippets.length > 0 ? (
                  mySnippets.map((snippet) => (
                    <CodeSnippetCard
                      key={snippet.id}
                      snippet={snippet}
                      onView={handleViewSnippet}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <Code2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No saved snippets</h3>
                    <p className="text-muted-foreground mb-4">
                      Start coding in the playground and save your work!
                    </p>
                    <Button onClick={handleNewPlayground}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Snippet
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
