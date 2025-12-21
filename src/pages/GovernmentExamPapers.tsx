import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, FileText, Home, ChevronRight } from "lucide-react";
import { BreadcrumbSchema } from "@/components/seo/breadcrumb-schema";

export default function GovernmentExamPapers() {
  const { slug } = useParams();

  const { data: exam, isLoading: examLoading } = useQuery({
    queryKey: ["exam", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_list")
        .select("*")
        .eq("slug", slug)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const { data: papers, isLoading: papersLoading } = useQuery({
    queryKey: ["exam-papers", exam?.id],
    queryFn: async () => {
      if (!exam?.id) return [];
      
      const { data, error } = await supabase
        .from("exam_papers")
        .select("*")
        .eq("exam_id", exam.id)
        .order("year", { ascending: false })
        .order("created_at", { ascending: false});
      
      if (error) throw error;
      return data;
    },
    enabled: !!exam?.id,
  });

  const groupedPapers = papers?.reduce((acc, paper) => {
    if (!acc[paper.year]) {
      acc[paper.year] = [];
    }
    acc[paper.year].push(paper);
    return acc;
  }, {} as Record<number, typeof papers>);

  const years = Object.keys(groupedPapers || {}).map(Number).sort((a, b) => b - a);
  const minYear = years.length > 0 ? Math.min(...years) : new Date().getFullYear();
  const maxYear = years.length > 0 ? Math.max(...years) : new Date().getFullYear();

  const breadcrumbs = [
    { name: "Home", url: window.location.origin },
    { name: "Government Exams", url: `${window.location.origin}/government-exams` },
    { name: exam?.exam_name || "", url: window.location.href }
  ];

  if (examLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </>
    );
  }

  if (!exam || !papers || papers.length === 0) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">No papers found</h2>
            <Button asChild className="mt-4">
              <Link to="/government-exams">Back to Exams</Link>
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{`${exam.exam_name} Previous Year Question Papers PDF (${minYear}–${maxYear}) - Download Free`}</title>
        <meta 
          name="description" 
          content={`Download ${exam.exam_name} previous year question papers PDF from ${minYear} to ${maxYear}. Free download for competitive exam preparation.`} 
        />
        <meta 
          name="keywords" 
          content={`${exam.exam_name}, ${exam.exam_name} previous year papers, ${exam.exam_name} PDF download, ${exam.exam_name} question papers`} 
        />
        <link rel="canonical" href={window.location.href} />
        
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "EducationalOccupationalCredential",
            "name": `${exam.exam_name} Previous Year Question Papers`,
            "educationalLevel": "Competitive Exam",
            "about": {
              "@type": "Thing",
              "name": exam.exam_name
            }
          })}
        </script>
      </Helmet>

      <BreadcrumbSchema items={breadcrumbs} />

      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />

        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-5xl mx-auto">
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
              <Link to="/" className="hover:text-foreground transition-colors">
                <Home className="h-4 w-4" />
              </Link>
              <ChevronRight className="h-4 w-4" />
              <Link to="/government-exams" className="hover:text-foreground transition-colors">
                Government Exams
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground font-medium">{exam.exam_name}</span>
            </nav>

            <header className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold mb-3 text-foreground">
                {exam.exam_name} Previous Year Question Papers PDF ({minYear}–{maxYear})
              </h1>
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mt-4">
                <p className="text-sm">
                  <strong>📚 Available:</strong> {years.length} years • 
                  <strong className="ml-2">📝 Total Papers:</strong> {papers.length}
                </p>
              </div>
            </header>

            {papersLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : (
              <Accordion type="multiple" className="space-y-4">
                {years.map((year) => {
                  const yearPapers = groupedPapers[year];
                  
                  return (
                    <AccordionItem 
                      key={year} 
                      value={`year-${year}`}
                      className="border rounded-lg px-4 bg-card"
                    >
                      <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex items-center gap-3 text-left">
                          <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                          <span className="font-semibold text-lg">{year}</span>
                          <span className="text-sm text-muted-foreground ml-auto mr-4">
                            {yearPapers.length} {yearPapers.length === 1 ? 'Paper' : 'Papers'}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Tier/Level</TableHead>
                                <TableHead className="text-center">Downloads</TableHead>
                                <TableHead className="text-center">Action</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {yearPapers.map((paper) => (
                                <TableRow key={paper.id}>
                                  <TableCell className="font-medium">{paper.tier || "General"}</TableCell>
                                  <TableCell className="text-center">{paper.download_count || 0}</TableCell>
                                  <TableCell className="text-center">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      asChild
                                    >
                                      <a
                                        href={paper.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        <Download className="mr-2 h-4 w-4" />
                                        Download PDF
                                      </a>
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
