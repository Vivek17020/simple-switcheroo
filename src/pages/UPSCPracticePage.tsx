import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { CheckSquare, Clock, Target, BookMarked, FileText, Play, Trophy, Loader2, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UPSCBreadcrumb } from "@/components/upsc/UPSCBreadcrumb";
import { UPSCQuizCard } from "@/components/upsc/UPSCQuizCard";
import { useUPSCQuizzes, useDailyQuiz } from "@/hooks/use-upsc-quizzes";
import { useUPSCFlashcards } from "@/hooks/use-upsc-flashcards";

const practiceSections = [
  {
    name: "Topic-wise Test",
    slug: "upsc-topic-test",
    icon: Target,
    color: "#06B6D4",
    description: "Subject and topic specific practice tests",
    duration: "Variable",
    questions: 25,
    comingSoon: true
  },
  {
    name: "Revision Notes",
    slug: "upsc-revision-notes",
    icon: FileText,
    color: "#F59E0B",
    description: "Concise notes for last-minute revision",
    duration: "Self-paced",
    questions: 0,
    comingSoon: true
  }
];

const UPSCPracticePage = () => {
  const { data: quizzes, isLoading: quizzesLoading } = useUPSCQuizzes();
  const { data: dailyQuiz, isLoading: dailyLoading } = useDailyQuiz();
  const { data: flashcards } = useUPSCFlashcards();

  return (
    <>
      <Helmet>
        <title>UPSC Practice | Daily Quiz, Weekly Test, Flashcards</title>
        <meta name="description" content="Practice for UPSC with daily quizzes, weekly tests, topic-wise MCQs, flashcards, and revision notes. Test your preparation regularly." />
        <link rel="canonical" href="https://www.thebulletinbriefs.in/upscbriefs/practice" />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-green-900 to-green-700 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <UPSCBreadcrumb items={[{ label: "Practice", href: "/upscbriefs/practice" }]} />
            <div className="mt-6">
              <Badge className="bg-white/20 text-white mb-4">Practice & Test</Badge>
              <h1 className="text-3xl lg:text-4xl font-bold mb-4">
                UPSC Practice Zone
              </h1>
              <p className="text-green-100 text-lg max-w-2xl">
                Regular practice is key to cracking UPSC. Test yourself with daily quizzes, mock tests, and quick revision tools.
              </p>
            </div>
          </div>
        </section>

        {/* Quick Start Section */}
        <section className="py-8 bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-6">
              {dailyLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : dailyQuiz ? (
                <Link to={`/upscbriefs/quiz/${dailyQuiz.id}`}>
                  <Card className="bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-xl transition-shadow h-full">
                    <CardContent className="p-6 flex items-center gap-4">
                      <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                        <Play className="w-8 h-8" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-white/80">Today's Challenge</div>
                        <div className="text-xl font-bold">{dailyQuiz.title}</div>
                        <div className="text-sm mt-1">{dailyQuiz.questions.length} Questions • {dailyQuiz.duration_minutes} Minutes</div>
                      </div>
                      <Button className="bg-white text-green-600 hover:bg-green-50">
                        Start
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              ) : (
                <Card className="bg-gradient-to-r from-green-500 to-emerald-500 text-white h-full">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                      <Trophy className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-white/80">Coming Soon</div>
                      <div className="text-xl font-bold">Daily Quiz</div>
                      <div className="text-sm mt-1">New quiz every day!</div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <Card className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:shadow-xl transition-shadow h-full">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                    <Clock className="w-8 h-8" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-white/80">This Week</div>
                    <div className="text-xl font-bold">Weekly Test</div>
                    <div className="text-sm mt-1">30 Questions • 30 Minutes</div>
                  </div>
                  <Button className="bg-white text-purple-600 hover:bg-purple-50" disabled>
                    Coming Soon
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Available Quizzes */}
        <section className="py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Quizzes</h2>
            
            {quizzesLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-64 w-full" />
                ))}
              </div>
            ) : quizzes && quizzes.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quizzes.map((quiz) => (
                  <UPSCQuizCard key={quiz.id} quiz={quiz} />
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Quizzes Available</h3>
                <p className="text-gray-600">Check back soon for new quizzes!</p>
              </Card>
            )}
          </div>
        </section>

        {/* Flashcards Section */}
        <section className="py-10 bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Flashcards</h2>
              <Link to="/upscbriefs/flashcards">
                <Button variant="outline" className="gap-2">
                  Start Practice <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            
            <Link to="/upscbriefs/flashcards">
              <Card className="bg-gradient-to-r from-lime-500 to-green-500 text-white hover:shadow-xl transition-shadow">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                    <BookMarked className="w-8 h-8" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-white/80">Interactive Learning</div>
                    <div className="text-xl font-bold">UPSC Flashcards</div>
                    <div className="text-sm mt-1">
                      {flashcards?.length || 0} Cards • Swipe to learn • Track mastery
                    </div>
                  </div>
                  <Button className="bg-white text-green-600 hover:bg-green-50">
                    Start
                  </Button>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>

        {/* Practice Resources */}
        <section className="py-10 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">More Practice Resources</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {practiceSections.map((section) => (
                <Card key={section.slug} className="h-full hover:shadow-lg transition-shadow group opacity-75">
                  <CardContent className="p-6">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                      style={{ backgroundColor: `${section.color}15` }}
                    >
                      <section.icon className="w-6 h-6" style={{ color: section.color }} />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg text-gray-900 group-hover:text-green-600 transition-colors">
                        {section.name}
                      </h3>
                      {section.comingSoon && (
                        <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-4">{section.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {section.duration}
                      </span>
                      {section.questions > 0 && (
                        <span>{section.questions} questions</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Stats Section */}
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
              { label: "Total Quizzes", value: quizzes?.length || 0, color: "text-green-600" },
                { label: "Questions", value: quizzes?.reduce((acc, q) => acc + q.questions.length, 0) || 0, color: "text-blue-600" },
                { label: "Flashcards", value: flashcards?.length || 0, color: "text-purple-600" },
                { label: "Practice Tests", value: "Coming", color: "text-orange-600" }
              ].map((stat) => (
                <Card key={stat.label}>
                  <CardContent className="p-6 text-center">
                    <div className={`text-3xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default UPSCPracticePage;
