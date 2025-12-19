import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, ChevronRight, FileText, Calendar } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";

export default function ExamPaperDetail() {
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
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!exam?.id,
  });

  const handleDownload = async (paperId: string, fileUrl: string) => {
    try {
      // Increment download count
      await supabase
        .from("exam_papers")
        .update({ download_count: (papers?.find(p => p.id === paperId)?.download_count || 0) + 1 })
        .eq("id", paperId);

      // Open PDF in new tab
      window.open(fileUrl, '_blank');
      toast.success("Download started");
    } catch (error) {
      toast.error("Failed to download paper");
    }
  };

  if (examLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
        <Footer />
      </>
    );
  }

  if (!exam) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Exam not found</h2>
            <Button asChild>
              <Link to="/jobs/previous-year-papers">Back to Exams</Link>
            </Button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{exam.exam_name} Previous Year Papers - Download PDF | TheBulletinBriefs</title>
        <meta 
          name="description" 
          content={`Download ${exam.exam_name} previous year question papers PDF. ${exam.short_description || 'Free downloads for all years and tiers.'}`}
        />
        <meta name="keywords" content={`${exam.exam_name}, ${exam.category}, previous year papers, question papers, PDF download`} />
        <link rel="canonical" href={`${window.location.origin}/jobs/previous-year-papers/${exam.slug}`} />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        
        <div className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <Link to="/jobs/previous-year-papers" className="hover:text-foreground transition-colors">Previous Year Papers</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">{exam.exam_name}</span>
          </nav>

          {/* Exam Header */}
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background rounded-lg p-8 mb-8 border">
            <div className="flex items-start gap-6">
              {exam.logo_url && (
                <img 
                  src={exam.logo_url} 
                  alt={exam.exam_name}
                  className="h-20 w-20 object-contain rounded-lg bg-white p-2"
                />
              )}
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-3">{exam.exam_name}</h1>
                <div className="flex items-center gap-4 mb-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/20 text-primary">
                    {exam.category}
                  </span>
                  <span className="text-muted-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {papers?.length || 0} Papers Available
                  </span>
                </div>
                {exam.short_description && (
                  <p className="text-muted-foreground text-lg">{exam.short_description}</p>
                )}
              </div>
            </div>
          </div>

          {/* Papers Table */}
          <div className="bg-card rounded-lg border">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold">Previous Year Question Papers</h2>
              <p className="text-muted-foreground mt-1">
                Click on download to get the PDF files
              </p>
            </div>

            {papersLoading ? (
              <div className="p-6 space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : papers && papers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Year
                      </div>
                    </TableHead>
                    <TableHead>Tier/Level</TableHead>
                    <TableHead className="text-center">Downloads</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {papers.map((paper) => (
                    <TableRow key={paper.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-bold text-lg">{paper.year}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {paper.tier || "General"}
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {paper.download_count || 0}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          onClick={() => handleDownload(paper.id, paper.file_url)}
                          size="sm"
                          className="gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Download PDF
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No papers available yet</h3>
                <p className="text-muted-foreground mb-6">
                  Papers for {exam.exam_name} will be added soon
                </p>
                <Button asChild variant="outline">
                  <Link to="/jobs/previous-year-papers">Browse Other Exams</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Tips Section */}
          <div className="mt-8 bg-muted/30 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">📚 Preparation Tips</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>✓ Practice with previous year papers to understand the exam pattern</li>
              <li>✓ Time yourself while solving papers to improve speed</li>
              <li>✓ Analyze your mistakes and focus on weak areas</li>
              <li>✓ Solve papers in exam-like conditions for best results</li>
              <li>✓ Refer to answer keys and solutions for better understanding</li>
            </ul>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}
