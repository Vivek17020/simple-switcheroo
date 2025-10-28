import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, ExternalLink } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";
import { BreadcrumbSchema } from "@/components/seo/breadcrumb-schema";

export default function PreviousYearPapers() {
  const { data: exams, isLoading } = useQuery({
    queryKey: ["exam-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_list")
        .select("*")
        .order("exam_name");
      
      if (error) throw error;
      return data;
    },
  });

  const breadcrumbs = [
    { name: "Home", url: window.location.origin },
    { name: "Jobs", url: `${window.location.origin}/jobs` },
    { name: "Previous Year Papers", url: window.location.href }
  ];

  return (
    <>
      <Helmet>
        <title>Previous Year Papers 2025 - Government Exam Question Papers</title>
        <meta 
          name="description" 
          content="Download previous year question papers for SSC, UPSC, Railway, Banking, Defence and all major government exams. Free PDF downloads with solutions." 
        />
        <meta name="keywords" content="previous year papers, government exam papers, SSC papers, UPSC papers, railway papers, banking papers, question papers with solutions" />
        <link rel="canonical" href={`${window.location.origin}/jobs/previous-year-papers`} />
      </Helmet>
      
      <BreadcrumbSchema items={breadcrumbs} />

      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <header className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-4 text-foreground">
                Government Exam Previous Year Papers 2025
              </h1>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Download previous year question papers for all major government competitive exams. Access SSC, UPSC, Banking, Railway, Defence, and state exam papers with detailed solutions.
              </p>
            </header>

            {isLoading ? (
              <div className="space-y-3 mb-12">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : exams && exams.length > 0 ? (
              <div className="bg-card rounded-lg border overflow-hidden mb-12">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16"></TableHead>
                      <TableHead>Exam Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="hidden md:table-cell">Description</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exams.map((exam) => (
                      <TableRow key={exam.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell>
                          {exam.logo_url ? (
                            <img 
                              src={exam.logo_url} 
                              alt={exam.exam_name} 
                              className="h-10 w-10 object-contain rounded"
                            />
                          ) : (
                            <div className="h-10 w-10 bg-primary/10 rounded flex items-center justify-center">
                              <FileText className="h-5 w-5 text-primary" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{exam.exam_name}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {exam.category}
                          </span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell max-w-md truncate text-muted-foreground">
                          {exam.short_description || "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button asChild size="sm" variant="default">
                            <Link to={`/jobs/previous-year-papers/${exam.slug}`}>
                              View Papers
                              <ExternalLink className="ml-2 h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 bg-muted/30 rounded-lg mb-12">
                <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No exams available yet</h3>
                <p className="text-muted-foreground">Check back later for updates</p>
              </div>
            )}

            {/* Permanent Static Article Content */}
            <article className="prose prose-lg dark:prose-invert max-w-none mt-12 [&>*]:mb-4 [&_p]:leading-relaxed">
              <div className="bg-card border rounded-lg p-8 mb-8">
                <h2 className="text-3xl font-bold mb-4">About Previous Year Question Papers</h2>
                <p className="text-base leading-relaxed">
                  Previous year question papers are invaluable resources for candidates preparing for government competitive 
                  examinations. These papers provide authentic insight into the exam pattern, question types, difficulty level, 
                  and marking scheme used by various recruiting bodies such as SSC, UPSC, IBPS, RRB, and state public service commissions.
                </p>
                <p className="text-base leading-relaxed mt-4">
                  Practicing with previous year papers helps candidates understand the actual examination environment and develop 
                  effective time management strategies. Regular practice with these authentic question papers significantly improves 
                  exam performance and builds confidence for the actual test day.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-card border rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Benefits of Solving Papers
                  </h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Understand actual exam pattern and format</li>
                    <li>• Identify frequently asked topics and questions</li>
                    <li>• Improve speed and time management skills</li>
                    <li>• Analyze your preparation level and weak areas</li>
                    <li>• Build confidence for the actual examination</li>
                    <li>• Get familiar with marking scheme</li>
                  </ul>
                </div>

                <div className="bg-card border rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Available Exam Papers
                  </h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• SSC (CGL, CHSL, MTS, GD, CPO)</li>
                    <li>• UPSC (Civil Services, NDA, CDS)</li>
                    <li>• Railway (RRB NTPC, Group D, ALP)</li>
                    <li>• Banking (IBPS PO, Clerk, SBI, RBI)</li>
                    <li>• Defence (NDA, CDS, AFCAT, Navy)</li>
                    <li>• State PSC Examinations</li>
                  </ul>
                </div>
              </div>

              <div className="bg-primary/10 border-l-4 border-primary rounded-r-lg p-8 mb-8">
                <h3 className="text-2xl font-bold mb-4">How to Practice Effectively with Previous Year Papers</h3>
                <div className="space-y-4">
                  <p className="text-base leading-relaxed">
                    <strong>Step 1: Start with Analysis</strong> - Before attempting, analyze the paper structure, sections, and marking scheme to understand what you're dealing with.
                  </p>
                  <p className="text-base leading-relaxed">
                    <strong>Step 2: Create Exam Conditions</strong> - Solve papers in a quiet environment with proper timing to simulate the actual exam experience.
                  </p>
                  <p className="text-base leading-relaxed">
                    <strong>Step 3: Time Management</strong> - Strictly follow the time limit and allocate time for each section based on marks and difficulty.
                  </p>
                  <p className="text-base leading-relaxed">
                    <strong>Step 4: Thorough Evaluation</strong> - After completion, carefully check all answers, understand mistakes, and note important concepts.
                  </p>
                  <p className="text-base leading-relaxed">
                    <strong>Step 5: Track Your Progress</strong> - Maintain a scorecard to track improvement and identify areas needing more attention.
                  </p>
                  <p className="text-base leading-relaxed">
                    <strong>Step 6: Revise and Repeat</strong> - Focus on weak topics, revise concepts, and attempt more papers to build consistency.
                  </p>
                </div>
              </div>

              <div className="bg-card border rounded-lg p-8 mb-8">
                <h3 className="text-2xl font-bold mb-4">Important Preparation Tips</h3>
                <div className="space-y-3 text-base">
                  <p className="flex items-start gap-3">
                    <span className="text-primary font-bold">✓</span>
                    <span>Start practicing from at least 5-10 years of previous papers to understand the trend and pattern evolution</span>
                  </p>
                  <p className="flex items-start gap-3">
                    <span className="text-primary font-bold">✓</span>
                    <span>Focus on topics that appear repeatedly across multiple years as they are likely to appear again</span>
                  </p>
                  <p className="flex items-start gap-3">
                    <span className="text-primary font-bold">✓</span>
                    <span>Don't just solve papers; thoroughly analyze solutions to understand the correct approach and shortcuts</span>
                  </p>
                  <p className="flex items-start gap-3">
                    <span className="text-primary font-bold">✓</span>
                    <span>Make notes of important formulas, facts, and concepts that appear frequently in previous papers</span>
                  </p>
                  <p className="flex items-start gap-3">
                    <span className="text-primary font-bold">✓</span>
                    <span>Practice negative marking awareness by understanding which questions to attempt and which to skip</span>
                  </p>
                  <p className="flex items-start gap-3">
                    <span className="text-primary font-bold">✓</span>
                    <span>Use papers as mock tests in the final preparation phase to assess your exam readiness</span>
                  </p>
                </div>
              </div>

              <div className="bg-card border rounded-lg p-8">
                <h3 className="text-2xl font-bold mb-4">Exam Categories Available</h3>
                <p className="text-base leading-relaxed mb-4">
                  We provide comprehensive collection of previous year papers for all major government recruitment examinations across different categories:
                </p>
                <div className="grid md:grid-cols-2 gap-4 text-base">
                  <div>
                    <h4 className="font-semibold mb-2 text-primary">Central Government Exams:</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Staff Selection Commission (SSC) - All Posts</li>
                      <li>• Union Public Service Commission (UPSC)</li>
                      <li>• Railway Recruitment Board (RRB)</li>
                      <li>• Banking - IBPS, SBI, RBI, NABARD</li>
                      <li>• Defence Services - NDA, CDS, AFCAT</li>
                      <li>• Insurance - LIC, NIACL, GIC</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-primary">State & Other Exams:</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• State Public Service Commissions</li>
                      <li>• State Police and Forest Department</li>
                      <li>• Teaching Eligibility Tests (TET, CTET)</li>
                      <li>• State Board and University Exams</li>
                      <li>• Public Sector Undertakings (PSUs)</li>
                      <li>• Postal and Court Recruitment Exams</li>
                    </ul>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
