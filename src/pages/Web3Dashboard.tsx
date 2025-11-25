import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useWeb3Progress } from "@/hooks/use-web3-progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Web3BadgeCard } from "@/components/web3/Web3BadgeCard";
import { CertificateCard } from "@/components/web3/CertificateCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Trophy,
  BookOpen,
  Award,
  Flame,
  ArrowRight,
  Target,
  GraduationCap,
} from "lucide-react";
import { Helmet } from "react-helmet-async";

export default function Web3Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    userStats,
    statsLoading,
    userBadges,
    badgesLoading,
    availableBadges,
    completedArticles,
    userCertificates,
    certificatesLoading,
  } = useWeb3Progress();

  // Redirect if not logged in
  if (!user) {
    navigate("/auth?redirect=/web3forindia/dashboard");
    return null;
  }

  if (statsLoading || badgesLoading) {
    return (
      <div className="min-h-screen bg-white py-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const earnedBadgeIds = new Set(
    userBadges?.map((ub: any) => ub.badge_id) || []
  );

  return (
    <>
      <Helmet>
        <title>My Web3 Dashboard - Track Your Learning Progress</title>
        <meta
          name="description"
          content="Track your Web3 learning progress, earn badges, and see personalized recommendations"
        />
      </Helmet>

      <div className="min-h-screen bg-white py-16">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-[#6A5BFF] to-[#4AC4FF] bg-clip-text text-transparent">
              My Web3 Learning Dashboard
            </h1>
            <p className="text-gray-600 text-lg">
              Track your progress and earn badges as you master Web3
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Completed</p>
                    <p className="text-3xl font-bold text-blue-700">
                      {userStats?.total_completed || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Badges Earned</p>
                    <p className="text-3xl font-bold text-purple-700">
                      {userStats?.total_badges || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Points</p>
                    <p className="text-3xl font-bold text-green-700">
                      {userStats?.total_points || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center">
                    <Flame className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Learning Paths</p>
                    <p className="text-3xl font-bold text-orange-700">
                      {userStats?.learning_paths_started || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Badges */}
          <Card className="mb-12">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-[#6A5BFF]" />
                  Your Badges
                </CardTitle>
                {userBadges && userBadges.length > 0 && (
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {userBadges && userBadges.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {availableBadges?.map((badge: any) => {
                    const userBadge = userBadges.find(
                      (ub: any) => ub.badge_id === badge.id
                    );
                    return (
                      <Web3BadgeCard
                        key={badge.id}
                        name={badge.name}
                        description={badge.description}
                        icon={badge.icon}
                        points={badge.points}
                        category={badge.category}
                        color={badge.color}
                        earned={!!userBadge}
                        earnedAt={userBadge?.earned_at}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">No badges earned yet</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Complete articles to start earning badges!
                  </p>
                  <Button
                    onClick={() => navigate("/web3forindia")}
                    className="bg-gradient-to-r from-[#6A5BFF] to-[#4AC4FF] text-white"
                  >
                    Start Learning
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Certificates Section */}
          {userCertificates && userCertificates.length > 0 && (
            <Card className="mb-12">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-[#6A5BFF]" />
                  My Certificates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {userCertificates.map((cert: any) => (
                    <CertificateCard key={cert.id} certificate={cert} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recently Completed Articles */}
          {completedArticles && completedArticles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-[#6A5BFF]" />
                  Recently Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {completedArticles.slice(0, 5).map((progress: any) => (
                    <div
                      key={progress.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() =>
                        navigate(
                          `/web3forindia/article/${progress.article.slug}`
                        )
                      }
                    >
                      <div className="flex items-center gap-4 flex-1">
                        {progress.article.image_url && (
                          <img
                            src={progress.article.image_url}
                            alt={progress.article.title}
                            className="w-16 h-16 rounded object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">
                            {progress.article.title}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Completed on{" "}
                            {new Date(progress.completed_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {(!completedArticles || completedArticles.length === 0) && (
            <Card>
              <CardContent className="pt-12 pb-12">
                <div className="text-center">
                  <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">
                    Start Your Web3 Journey
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Complete your first tutorial to track your progress and earn
                    badges
                  </p>
                  <Button
                    onClick={() => navigate("/web3forindia")}
                    className="bg-gradient-to-r from-[#6A5BFF] to-[#4AC4FF] text-white"
                  >
                    Browse Tutorials
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
