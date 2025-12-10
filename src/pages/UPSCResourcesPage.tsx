import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { FileText, BookOpen, BookMarked, History, Map, Calendar, Download, ArrowRight, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UPSCBreadcrumb } from "@/components/upsc/UPSCBreadcrumb";

const resourceSections = [
  {
    name: "UPSC Syllabus",
    slug: "upsc-syllabus",
    icon: FileText,
    color: "#2563EB",
    description: "Complete Prelims and Mains syllabus breakdown",
    type: "Guide"
  },
  {
    name: "NCERT Notes",
    slug: "upsc-ncert-notes",
    icon: BookOpen,
    color: "#059669",
    description: "Class 6-12 NCERT summaries for UPSC",
    type: "Notes"
  },
  {
    name: "Standard Booklist",
    slug: "upsc-booklist",
    icon: BookMarked,
    color: "#DC2626",
    description: "Subject-wise recommended books by toppers",
    type: "Guide"
  },
  {
    name: "Previous Year Papers",
    slug: "upsc-pyp",
    icon: History,
    color: "#7C3AED",
    description: "Prelims and Mains PYQs with solutions",
    type: "Papers"
  },
  {
    name: "Maps & Infographics",
    slug: "upsc-maps-infographics",
    icon: Map,
    color: "#D97706",
    description: "Visual learning resources for geography",
    type: "Visual"
  },
  {
    name: "UPSC Calendar",
    slug: "upsc-calendar",
    icon: Calendar,
    color: "#0EA5E9",
    description: "Important dates, deadlines, and exam schedule",
    type: "Calendar"
  },
  {
    name: "PDF Downloads",
    slug: "upsc-pdf-downloads",
    icon: Download,
    color: "#DB2777",
    description: "Downloadable study materials and notes",
    type: "Downloads"
  }
];

const quickLinks = [
  { name: "UPSC Official Website", url: "https://upsc.gov.in", icon: ExternalLink },
  { name: "Notification PDF", url: "#", icon: Download },
  { name: "Exam Pattern", url: "/upscbriefs/upsc-syllabus", icon: FileText },
  { name: "Previous Results", url: "#", icon: History }
];

const UPSCResourcesPage = () => {
  return (
    <>
      <Helmet>
        <title>UPSC Resources | Syllabus, NCERT Notes, Booklist, PYQ Papers</title>
        <meta name="description" content="Free UPSC study resources. Download syllabus, NCERT notes, recommended booklist, previous year papers, maps, and study materials." />
        <link rel="canonical" href="https://www.thebulletinbriefs.in/upscbriefs/resources" />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-indigo-900 to-indigo-700 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <UPSCBreadcrumb items={[{ label: "Resources", href: "/upscbriefs/resources" }]} />
            <div className="mt-6">
              <Badge className="bg-white/20 text-white mb-4">Study Resources</Badge>
              <h1 className="text-3xl lg:text-4xl font-bold mb-4">
                UPSC Study Resources
              </h1>
              <p className="text-indigo-100 text-lg max-w-2xl">
                Everything you need for UPSC preparation - syllabus, booklist, NCERT notes, previous papers, and more.
              </p>
            </div>
          </div>
        </section>

        {/* Quick Links */}
        <section className="py-6 bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-sm font-medium text-gray-600">Quick Links:</span>
              {quickLinks.map((link) => (
                link.url.startsWith('http') ? (
                  <a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-sm text-gray-700 transition-colors"
                  >
                    <link.icon className="w-3 h-3" />
                    {link.name}
                  </a>
                ) : (
                  <Link
                    key={link.name}
                    to={link.url}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-sm text-gray-700 transition-colors"
                  >
                    <link.icon className="w-3 h-3" />
                    {link.name}
                  </Link>
                )
              ))}
            </div>
          </div>
        </section>

        {/* Resources Grid */}
        <section className="py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">All Resources</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resourceSections.map((section) => (
                <Link key={section.slug} to={`/upscbriefs/${section.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow group">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                          style={{ backgroundColor: `${section.color}15` }}
                        >
                          <section.icon className="w-6 h-6" style={{ color: section.color }} />
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {section.type}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-lg text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                        {section.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">{section.description}</p>
                      <div className="flex items-center text-sm font-medium text-indigo-600">
                        Explore <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Featured Resource */}
            <div className="mt-12">
              <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white overflow-hidden">
                <CardContent className="p-8">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                      <Badge className="bg-white/20 text-white mb-2">Most Downloaded</Badge>
                      <h3 className="text-2xl font-bold mb-2">UPSC 2025 Complete Study Kit</h3>
                      <p className="text-indigo-100">
                        All-in-one PDF containing syllabus, booklist, study plan, and subject-wise notes
                      </p>
                    </div>
                    <Button asChild size="lg" className="bg-white text-indigo-600 hover:bg-indigo-50">
                      <Link to="/upscbriefs/upsc-pdf-downloads">
                        <Download className="w-5 h-5 mr-2" />
                        Download Free
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* NCERT Importance */}
            <div className="mt-12 grid md:grid-cols-2 gap-6">
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg text-green-900 mb-3">Why NCERT is Important?</h3>
                  <ul className="space-y-2 text-sm text-green-800">
                    <li>• Foundation for all UPSC subjects</li>
                    <li>• Direct questions in Prelims</li>
                    <li>• Authentic and concise content</li>
                    <li>• Covers basics for advanced books</li>
                  </ul>
                  <Button asChild variant="outline" className="mt-4 border-green-600 text-green-600 hover:bg-green-100">
                    <Link to="/upscbriefs/upsc-ncert-notes">
                      View NCERT Notes <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg text-blue-900 mb-3">Previous Year Questions</h3>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li>• Understand exam pattern</li>
                    <li>• Identify important topics</li>
                    <li>• Practice time management</li>
                    <li>• Boost confidence before exam</li>
                  </ul>
                  <Button asChild variant="outline" className="mt-4 border-blue-600 text-blue-600 hover:bg-blue-100">
                    <Link to="/upscbriefs/upsc-pyp">
                      View PYQ Papers <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default UPSCResourcesPage;
