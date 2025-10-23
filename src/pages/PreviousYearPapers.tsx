import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, ExternalLink, Home, ChevronRight } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";

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

  return (
    <>
      <Helmet>
        <title>Previous Year Papers - Government Exam Papers | TheBulletinBriefs</title>
        <meta 
          name="description" 
          content="Download previous year question papers for government exams including SSC, Railway, Banking, Defence and more. Free PDF downloads." 
        />
        <meta name="keywords" content="previous year papers, government exam papers, SSC papers, railway papers, banking papers" />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        
        <div className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
            <Link to="/" className="hover:text-foreground transition-colors">
              <Home className="h-4 w-4" />
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link to="/jobs/previous-year-papers" className="hover:text-foreground transition-colors">
              Jobs
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">Previous Year Papers</span>
          </nav>

          {/* SSC CGL 2025 Article Section */}
          <article className="prose prose-lg dark:prose-invert max-w-none mb-12 [&>*]:mb-4 [&_p]:leading-relaxed">
            <h1 className="text-4xl font-bold mb-6">SSC CGL 2025: Complete Guide & Previous Year Papers</h1>
            
            <div className="bg-card border rounded-lg p-8 mb-8">
              <h2 className="text-3xl font-bold mb-4">About SSC CGL 2025</h2>
              <p className="text-base leading-relaxed">
                The Staff Selection Commission Combined Graduate Level (SSC CGL) examination is one of the most prestigious 
                competitive exams in India. It is conducted to recruit candidates for various Group B and Group C posts in 
                different government ministries, departments, and organizations.
              </p>
              <p className="text-base leading-relaxed mt-4">
                SSC CGL offers lucrative job opportunities in various government departments such as Income Tax, Central Excise, 
                Customs, Ministry of External Affairs, and many more. The exam tests candidates on their general awareness, 
                quantitative aptitude, English language, and reasoning abilities.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Exam Pattern
                </h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• <strong>Tier 1:</strong> Computer Based Examination</li>
                  <li>• <strong>Tier 2:</strong> Computer Based Examination</li>
                  <li>• <strong>Tier 3:</strong> Descriptive Paper (Pen & Paper)</li>
                  <li>• <strong>Tier 4:</strong> Skill Test/Computer Proficiency Test</li>
                </ul>
              </div>

              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Important Dates 2025
                </h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• <strong>Notification:</strong> To be announced</li>
                  <li>• <strong>Application:</strong> Check official website</li>
                  <li>• <strong>Tier 1 Exam:</strong> Expected in 2025</li>
                  <li>• <strong>Result:</strong> As per schedule</li>
                </ul>
              </div>
            </div>

            <div className="bg-primary/10 border-l-4 border-primary rounded-r-lg p-8 mb-8">
              <h3 className="text-2xl font-bold mb-4">Why Practice with Previous Year Papers?</h3>
              <p className="text-base leading-relaxed mb-4">
                Solving previous year question papers is an essential part of exam preparation. It helps you understand the 
                actual exam environment and prepares you better for the competition.
              </p>
              <ul className="space-y-3 text-base">
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold">✓</span>
                  <span>Understand the exam pattern and difficulty level of questions asked in previous years</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold">✓</span>
                  <span>Identify important topics and recurring questions that appear frequently</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold">✓</span>
                  <span>Improve time management and speed by practicing under exam conditions</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold">✓</span>
                  <span>Build confidence before the actual exam and reduce exam anxiety</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold">✓</span>
                  <span>Get familiar with the question paper format and marking scheme</span>
                </li>
              </ul>
            </div>

            <div className="bg-card border rounded-lg p-8 mb-8">
              <h3 className="text-2xl font-bold mb-4">How to Use Previous Year Papers Effectively</h3>
              <div className="space-y-4">
                <p className="text-base leading-relaxed">
                  <strong>1. Start with Analysis:</strong> Before solving, go through the paper to understand the topics covered and difficulty level.
                </p>
                <p className="text-base leading-relaxed">
                  <strong>2. Time Yourself:</strong> Solve papers under timed conditions to simulate the actual exam environment.
                </p>
                <p className="text-base leading-relaxed">
                  <strong>3. Review Mistakes:</strong> After solving, thoroughly review all incorrect answers and understand where you went wrong.
                </p>
                <p className="text-base leading-relaxed">
                  <strong>4. Track Progress:</strong> Maintain a record of your scores to track improvement over time.
                </p>
                <p className="text-base leading-relaxed">
                  <strong>5. Focus on Weak Areas:</strong> Identify topics where you consistently make mistakes and work on strengthening them.
                </p>
              </div>
            </div>
          </article>

          {/* All Exams Section */}
          <div className="border-t pt-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2">Browse All Government Exam Papers</h2>
              <p className="text-muted-foreground">
                Select an exam to view and download previous year question papers
              </p>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : exams && exams.length > 0 ? (
              <div className="bg-card rounded-lg border overflow-hidden">
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
              <div className="text-center py-12 bg-muted/30 rounded-lg">
                <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No exams available yet</h3>
                <p className="text-muted-foreground">Check back later for updates</p>
              </div>
            )}
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}
