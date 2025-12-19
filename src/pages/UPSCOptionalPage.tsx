import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { BookOpen, ArrowRight, Users, TrendingUp, BarChart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UPSCBreadcrumb } from "@/components/upsc/UPSCBreadcrumb";

const optionalSubjects = [
  {
    name: "PSIR",
    fullName: "Political Science & IR",
    slug: "upsc-psir",
    color: "#2563EB",
    popularity: "High",
    description: "Most popular optional with overlap in GS Paper 2"
  },
  {
    name: "Sociology",
    fullName: "Sociology",
    slug: "upsc-sociology-optional",
    color: "#7C3AED",
    popularity: "High",
    description: "Short syllabus, good for working professionals"
  },
  {
    name: "Geography",
    fullName: "Geography",
    slug: "upsc-geography-optional",
    color: "#D97706",
    popularity: "High",
    description: "Overlap with GS1, scoring with maps"
  },
  {
    name: "Anthropology",
    fullName: "Anthropology",
    slug: "upsc-anthropology",
    color: "#059669",
    popularity: "Medium",
    description: "Concise syllabus, static nature"
  },
  {
    name: "Public Admin",
    fullName: "Public Administration",
    slug: "upsc-public-admin",
    color: "#DC2626",
    popularity: "Medium",
    description: "Overlap with GS2, essay, and ethics"
  },
  {
    name: "History",
    fullName: "History",
    slug: "upsc-history-optional",
    color: "#B91C1C",
    popularity: "Medium",
    description: "Extensive syllabus but high scoring potential"
  },
  {
    name: "Philosophy",
    fullName: "Philosophy",
    slug: "upsc-philosophy",
    color: "#4F46E5",
    popularity: "Medium",
    description: "Short syllabus, helps in GS4 ethics"
  },
  {
    name: "Economics",
    fullName: "Economics",
    slug: "upsc-economics-optional",
    color: "#059669",
    popularity: "Low",
    description: "Technical but scoring for economics background"
  },
  {
    name: "Literature",
    fullName: "Literature Optionals",
    slug: "upsc-literature-optional",
    color: "#DB2777",
    popularity: "Varies",
    description: "English, Hindi, and regional language literatures"
  }
];

const UPSCOptionalPage = () => {
  return (
    <>
      <Helmet>
        <title>UPSC Optional Subjects | PSIR, Sociology, Geography, Anthropology</title>
        <meta name="description" content="Choose the best UPSC optional subject. Get notes for PSIR, Sociology, Geography, Anthropology, Public Administration, History, Philosophy, Economics." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://www.thebulletinbriefs.in/upscbriefs/optional" />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-amber-900 to-amber-700 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <UPSCBreadcrumb items={[{ label: "Optional Subjects", href: "/upscbriefs/optional" }]} />
            <div className="mt-6">
              <Badge className="bg-white/20 text-white mb-4">Optional Subjects</Badge>
              <h1 className="text-3xl lg:text-4xl font-bold mb-4">
                UPSC Optional Subjects
              </h1>
              <p className="text-amber-100 text-lg max-w-2xl">
                Choose the right optional subject based on your background, interest, and scoring potential. Get comprehensive notes and strategies.
              </p>
            </div>
          </div>
        </section>

        {/* Optional Info */}
        <section className="py-8 bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                    <BarChart className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-amber-900">500</div>
                    <div className="text-sm text-amber-700">Total Marks</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-amber-900">2</div>
                    <div className="text-sm text-amber-700">Papers (250 each)</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-amber-900">28%</div>
                    <div className="text-sm text-amber-700">of Total Mains Marks</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Optional Subjects Grid */}
        <section className="py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">All Optional Subjects</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {optionalSubjects.map((subject) => (
                <Link key={subject.slug} to={`/upscbriefs/${subject.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow group">
                    <div className="h-1" style={{ backgroundColor: subject.color }}></div>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-lg text-gray-900 group-hover:text-amber-600 transition-colors">
                          {subject.fullName}
                        </h3>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${
                            subject.popularity === 'High' ? 'bg-green-100 text-green-700' :
                            subject.popularity === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {subject.popularity} Popularity
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">{subject.description}</p>
                      <div className="flex items-center text-sm font-medium text-amber-600">
                        View Notes <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* How to Choose Optional */}
            <div className="mt-12">
              <Card className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold mb-4">How to Choose Optional Subject?</h3>
                  <div className="grid md:grid-cols-3 gap-6 mt-6">
                    <div className="bg-white/10 rounded-lg p-4">
                      <div className="text-lg font-semibold mb-2">1. Interest & Background</div>
                      <p className="text-amber-100 text-sm">Choose a subject you're genuinely interested in or have academic background</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4">
                      <div className="text-lg font-semibold mb-2">2. Syllabus Overlap</div>
                      <p className="text-amber-100 text-sm">Consider subjects that overlap with GS papers for efficient preparation</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4">
                      <div className="text-lg font-semibold mb-2">3. Scoring Trend</div>
                      <p className="text-amber-100 text-sm">Check past year scoring trends and availability of study material</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Popular Optionals */}
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Most Popular Optionals</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {optionalSubjects.filter(s => s.popularity === 'High').map((subject) => (
                  <Link key={subject.slug} to={`/upscbriefs/${subject.slug}`}>
                    <Card className="bg-gradient-to-br from-gray-50 to-white hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <div 
                            className="w-14 h-14 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: `${subject.color}15` }}
                          >
                            <BookOpen className="w-7 h-7" style={{ color: subject.color }} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{subject.fullName}</h3>
                            <div className="flex items-center gap-1 text-sm text-green-600">
                              <Users className="w-4 h-4" />
                              High Popularity
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default UPSCOptionalPage;
