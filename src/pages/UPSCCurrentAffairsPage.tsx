import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Calendar, BookMarked, FileText, PenTool, Clock, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UPSCBreadcrumb } from "@/components/upsc/UPSCBreadcrumb";

const caSections = [
  {
    name: "Daily Current Affairs",
    slug: "upsc-daily-ca",
    icon: Calendar,
    color: "#EF4444",
    description: "Day-by-day coverage of important news for UPSC",
    updated: "Daily at 8 AM"
  },
  {
    name: "Monthly Current Affairs",
    slug: "upsc-monthly-ca",
    icon: BookMarked,
    color: "#8B5CF6",
    description: "Comprehensive monthly compilations",
    updated: "1st of every month"
  },
  {
    name: "PIB Summary",
    slug: "upsc-pib-summary",
    icon: FileText,
    color: "#06B6D4",
    description: "Press Information Bureau updates simplified",
    updated: "Daily"
  },
  {
    name: "Yojana Summary",
    slug: "upsc-yojana-summary",
    icon: BookMarked,
    color: "#84CC16",
    description: "Monthly Yojana magazine key takeaways",
    updated: "Monthly"
  },
  {
    name: "Kurukshetra Summary",
    slug: "upsc-kurukshetra-summary",
    icon: BookMarked,
    color: "#F59E0B",
    description: "Monthly Kurukshetra magazine summaries",
    updated: "Monthly"
  },
  {
    name: "Editorial Notes",
    slug: "upsc-editorial-notes",
    icon: PenTool,
    color: "#6366F1",
    description: "Important newspaper editorials analysis",
    updated: "Daily"
  }
];

const UPSCCurrentAffairsPage = () => {
  const today = new Date().toLocaleDateString('en-IN', { 
    weekday: 'long',
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <>
      <Helmet>
        <title>UPSC Current Affairs | Daily CA, PIB, Yojana, Editorial Notes</title>
        <meta name="description" content="Daily UPSC current affairs updates. Get PIB summaries, Yojana, Kurukshetra magazine notes, and editorial analysis for Civil Services exam." />
        <link rel="canonical" href="https://www.thebulletinbriefs.in/upscbriefs/current-affairs" />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-red-900 to-red-700 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <UPSCBreadcrumb items={[{ label: "Current Affairs", href: "/upscbriefs/current-affairs" }]} />
            <div className="mt-6">
              <Badge className="bg-white/20 text-white mb-4">Current Affairs</Badge>
              <h1 className="text-3xl lg:text-4xl font-bold mb-4">
                UPSC Current Affairs
              </h1>
              <p className="text-red-100 text-lg max-w-2xl">
                Stay updated with daily current affairs, government schemes, and important editorials for UPSC preparation.
              </p>
            </div>
          </div>
        </section>

        {/* Today's Highlight */}
        <section className="py-8 bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link to="/upscbriefs/upsc-daily-ca">
              <Card className="bg-gradient-to-r from-red-500 to-orange-500 text-white hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                        <Calendar className="w-8 h-8" />
                      </div>
                      <div>
                        <div className="text-sm text-white/80">Today's Current Affairs</div>
                        <div className="text-2xl font-bold">{today}</div>
                        <div className="flex items-center gap-2 text-sm mt-1">
                          <Clock className="w-4 h-4" />
                          <span>Updated at 8:00 AM IST</span>
                        </div>
                      </div>
                    </div>
                    <Button className="bg-white text-red-600 hover:bg-red-50">
                      Read Now <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>

        {/* CA Sections Grid */}
        <section className="py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Current Affairs Resources</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {caSections.map((section) => (
                <Link key={section.slug} to={`/upscbriefs/${section.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow group">
                    <CardContent className="p-6">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                        style={{ backgroundColor: `${section.color}15` }}
                      >
                        <section.icon className="w-6 h-6" style={{ color: section.color }} />
                      </div>
                      <h3 className="font-semibold text-lg text-gray-900 mb-2 group-hover:text-red-600 transition-colors">
                        {section.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">{section.description}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>Updated: {section.updated}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Monthly Compilation Banner */}
            <div className="mt-12">
              <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                <CardContent className="p-8">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                      <Badge className="bg-white/20 text-white mb-2">Latest</Badge>
                      <h3 className="text-2xl font-bold mb-2">
                        Monthly Current Affairs - {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                      </h3>
                      <p className="text-orange-100">
                        Complete compilation of important news, government schemes, and appointments
                      </p>
                    </div>
                    <Button asChild size="lg" className="bg-white text-orange-600 hover:bg-orange-50">
                      <Link to="/upscbriefs/upsc-monthly-ca">
                        Download PDF <ArrowRight className="w-5 h-5 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default UPSCCurrentAffairsPage;
