import { useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, FileText, Download, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { BreadcrumbSchema } from "@/components/seo/breadcrumb-schema";
import { format } from "date-fns";

export default function AdmitCards() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 12;

  const { data: admitCards, isLoading } = useQuery({
    queryKey: ["admit-cards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admit_cards")
        .select("*")
        .eq("published", true)
        .order("published_date", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });


  const filteredAdmitCards = useMemo(() => {
    if (!admitCards) return [];
    return admitCards.filter((card) =>
      card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.exam_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [admitCards, searchQuery]);

  const paginatedCards = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    return filteredAdmitCards.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAdmitCards, page]);

  const totalPages = Math.ceil(filteredAdmitCards.length / itemsPerPage);

  const breadcrumbs = [
    { name: "Home", url: window.location.origin },
    { name: "Admit Cards", url: window.location.href }
  ];

  return (
    <>
      <Helmet>
        <title>Government Exam Admit Cards 2025 - Download Hall Tickets</title>
        <meta name="description" content="Download latest admit cards for SSC, UPSC, Banking, Railway, and other government exams 2025. Get direct download links for hall tickets." />
        <meta name="keywords" content="admit cards, hall tickets, government exams, SSC admit card, UPSC admit card, banking exam admit card, railway admit card" />
        <link rel="canonical" href={`${window.location.origin}/admit-cards`} />
      </Helmet>
      
      <BreadcrumbSchema items={breadcrumbs} />
      
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <header className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-4 text-foreground">
                Government Exam Admit Cards 2025
              </h1>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Download admit cards for all major government exams. Get direct download links and important instructions for SSC, UPSC, Banking, Railway, Defence, and other competitive exams.
              </p>
            </header>

            <div className="mb-8">
              <div className="relative max-w-xl mx-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search admit cards (SSC, UPSC, Banking, etc.)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                      <div className="h-4 bg-muted rounded w-full" />
                    </CardHeader>
                    <CardContent>
                      <div className="h-10 bg-muted rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : paginatedCards && paginatedCards.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                  {paginatedCards.map((card) => (
                    <Card key={card.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle className="flex items-start gap-2 text-lg">
                          <FileText className="h-5 w-5 flex-shrink-0 mt-0.5 text-primary" />
                          <span>{card.title}</span>
                        </CardTitle>
                        <CardDescription className="space-y-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {card.exam_name}
                          </span>
                          {card.published_date && (
                            <p className="text-sm mt-2">
                              Published: {format(new Date(card.published_date), "MMMM d, yyyy")}
                            </p>
                          )}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {card.download_link ? (
                          <Button asChild className="w-full">
                            <a href={card.download_link} target="_blank" rel="noopener noreferrer">
                              <Download className="mr-2 h-4 w-4" />
                              Download Admit Card
                              <ExternalLink className="ml-2 h-3 w-3" />
                            </a>
                          </Button>
                        ) : (
                          <Button asChild className="w-full" variant="outline">
                            <Link to={`/admit-cards/${card.slug}`}>
                              View Details
                            </Link>
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mb-12">
                    {[...Array(totalPages)].map((_, i) => (
                      <Button
                        key={i}
                        variant={page === i + 1 ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPage(i + 1)}
                        className="min-w-[40px]"
                      >
                        {i + 1}
                      </Button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 mb-12">
                <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No admit cards found</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? "Try adjusting your search query" : "Check back soon for updates"}
                </p>
              </div>
            )}

            {/* Permanent Article Content */}
            <article className="prose prose-lg dark:prose-invert max-w-none mt-12 [&>*]:mb-4 [&_p]:leading-relaxed">
              <div className="bg-card border rounded-lg p-8 mb-8">
                <h2 className="text-3xl font-bold mb-4">About Government Exam Admit Cards 2025</h2>
                <p className="text-base leading-relaxed">
                  An admit card, also known as a hall ticket or call letter, is an essential document that candidates must carry 
                  to the examination center. It serves as proof of registration and contains crucial information about the exam 
                  venue, timing, and candidate details. Without a valid admit card, candidates are not allowed to appear for the examination.
                </p>
                <p className="text-base leading-relaxed mt-4">
                  Government exam admit cards are issued by various recruiting bodies such as SSC, UPSC, IBPS, RRB, and state public 
                  service commissions. These admit cards typically become available 10-15 days before the examination date and can be 
                  downloaded from the official websites of respective organizations.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-card border rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Information on Admit Card
                  </h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Candidate Name and Photo</li>
                    <li>• Roll Number and Registration Number</li>
                    <li>• Exam Name, Date, and Time</li>
                    <li>• Exam Center Address and Code</li>
                    <li>• Important Instructions</li>
                    <li>• Candidate's Signature</li>
                  </ul>
                </div>

                <div className="bg-card border rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Documents Required
                  </h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Original Admit Card (printed copy)</li>
                    <li>• Valid Photo ID (Aadhaar/PAN/Driving License)</li>
                    <li>• Recent Passport Size Photograph</li>
                    <li>• Additional documents as per exam notification</li>
                  </ul>
                </div>
              </div>

              <div className="bg-primary/10 border-l-4 border-primary rounded-r-lg p-8 mb-8">
                <h3 className="text-2xl font-bold mb-4">How to Download Admit Card?</h3>
                <div className="space-y-4">
                  <p className="text-base leading-relaxed">
                    <strong>Step 1:</strong> Visit the official website of the exam conducting body (SSC, UPSC, IBPS, RRB, etc.)
                  </p>
                  <p className="text-base leading-relaxed">
                    <strong>Step 2:</strong> Look for the "Admit Card" or "Hall Ticket" link on the homepage
                  </p>
                  <p className="text-base leading-relaxed">
                    <strong>Step 3:</strong> Enter your registration number, date of birth, or other required credentials
                  </p>
                  <p className="text-base leading-relaxed">
                    <strong>Step 4:</strong> Click on "Download" or "Submit" button to view your admit card
                  </p>
                  <p className="text-base leading-relaxed">
                    <strong>Step 5:</strong> Verify all details carefully and take multiple printouts
                  </p>
                </div>
              </div>

              <div className="bg-card border rounded-lg p-8 mb-8">
                <h3 className="text-2xl font-bold mb-4">Important Instructions</h3>
                <div className="space-y-3 text-base">
                  <p className="flex items-start gap-3">
                    <span className="text-primary font-bold">✓</span>
                    <span>Carry the admit card along with a valid photo ID to the examination center</span>
                  </p>
                  <p className="flex items-start gap-3">
                    <span className="text-primary font-bold">✓</span>
                    <span>Verify all details on the admit card immediately after downloading</span>
                  </p>
                  <p className="flex items-start gap-3">
                    <span className="text-primary font-bold">✓</span>
                    <span>Report any discrepancies to the exam conducting authority immediately</span>
                  </p>
                  <p className="flex items-start gap-3">
                    <span className="text-primary font-bold">✓</span>
                    <span>Reach the exam center at least 30 minutes before the reporting time</span>
                  </p>
                  <p className="flex items-start gap-3">
                    <span className="text-primary font-bold">✓</span>
                    <span>Do not carry any prohibited items like mobile phones, calculators, or electronic devices</span>
                  </p>
                  <p className="flex items-start gap-3">
                    <span className="text-primary font-bold">✓</span>
                    <span>Keep multiple photocopies of the admit card as backup</span>
                  </p>
                </div>
              </div>

              <div className="bg-card border rounded-lg p-8">
                <h3 className="text-2xl font-bold mb-4">Major Government Exam Admit Cards</h3>
                <p className="text-base leading-relaxed mb-4">
                  We provide direct download links and notifications for admit cards of all major government examinations including:
                </p>
                <div className="grid md:grid-cols-2 gap-4 text-base">
                  <div>
                    <h4 className="font-semibold mb-2 text-primary">Central Government Exams:</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• SSC CGL, CHSL, MTS, GD</li>
                      <li>• UPSC Civil Services, NDA, CDS</li>
                      <li>• Railway RRB NTPC, Group D</li>
                      <li>• Banking IBPS PO, Clerk, RRB</li>
                      <li>• Defence NDA, CDS, AFCAT</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-primary">State Government Exams:</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• State PSC Exams (All States)</li>
                      <li>• State Police Recruitment</li>
                      <li>• State Teacher Eligibility Tests</li>
                      <li>• State Forest Department Exams</li>
                      <li>• State Board Exams and Results</li>
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
