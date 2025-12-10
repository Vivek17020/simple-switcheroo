import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { 
  BookOpen, CheckCircle2, Bookmark, Trophy, 
  TrendingUp, Clock, ArrowRight, AlertCircle 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { UPSCStreakWidget } from "@/components/upsc/UPSCStreakWidget";
import { useUPSCStats } from "@/hooks/use-upsc-streaks";
import { useBookmarks, useUserProgress } from "@/hooks/use-upsc-progress";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const UPSCDashboardPage = () => {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = useUPSCStats();
  const { data: bookmarks, isLoading: bookmarksLoading } = useBookmarks();
  const { data: progress, isLoading: progressLoading } = useUserProgress();

  // Fetch bookmarked articles details
  const { data: bookmarkedArticles } = useQuery({
    queryKey: ['upsc-bookmarked-articles', bookmarks?.map(b => b.article_id)],
    queryFn: async () => {
      if (!bookmarks || bookmarks.length === 0) return [];
      
      const { data, error } = await supabase
        .from('articles')
        .select(`
          id, title, slug, reading_time, created_at,
          category:categories(name, slug, color)
        `)
        .in('id', bookmarks.map(b => b.article_id))
        .limit(5);

      if (error) throw error;
      return data;
    },
    enabled: !!bookmarks && bookmarks.length > 0,
  });

  // Fetch recent completed articles
  const { data: recentArticles } = useQuery({
    queryKey: ['upsc-recent-completed', progress?.slice(0, 5).map(p => p.article_id)],
    queryFn: async () => {
      if (!progress || progress.length === 0) return [];
      
      const recentProgress = progress.slice(0, 10);
      const { data, error } = await supabase
        .from('articles')
        .select(`
          id, title, slug,
          category:categories(name, slug)
        `)
        .in('id', recentProgress.map(p => p.article_id));

      if (error) throw error;
      
      // Match with progress data to get completion time
      return data.map(article => ({
        ...article,
        completed_at: recentProgress.find(p => p.article_id === article.id)?.completed_at,
      }));
    },
    enabled: !!progress && progress.length > 0,
  });

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h1>
        <p className="text-gray-600 mb-6">Please login to access your dashboard</p>
        <Button asChild>
          <Link to="/auth">Login / Sign Up</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>My Dashboard | UPSCBriefs</title>
        <meta name="description" content="Track your UPSC preparation progress, streaks, and achievements." />
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Dashboard</h1>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statsLoading ? (
            <>
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </>
          ) : (
            <>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <CheckCircle2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{stats?.articlesCompleted || 0}</div>
                      <div className="text-xs text-gray-500">Articles Read</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Bookmark className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{stats?.bookmarksCount || 0}</div>
                      <div className="text-xs text-gray-500">Bookmarks</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{stats?.totalQuizzes || 0}</div>
                      <div className="text-xs text-gray-500">Quizzes Taken</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Trophy className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{stats?.avgScore || 0}%</div>
                      <div className="text-xs text-gray-500">Avg Quiz Score</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Streak Widget */}
          <div className="md:col-span-1">
            <UPSCStreakWidget />
          </div>

          {/* Bookmarked Articles */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bookmark className="w-5 h-5 text-yellow-500" />
                  Saved Articles
                </CardTitle>
                {bookmarks && bookmarks.length > 5 && (
                  <Link to="/upscbriefs/bookmarks" className="text-sm text-blue-600 hover:underline">
                    View All
                  </Link>
                )}
              </CardHeader>
              <CardContent>
                {bookmarksLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-12" />
                    <Skeleton className="h-12" />
                    <Skeleton className="h-12" />
                  </div>
                ) : bookmarkedArticles && bookmarkedArticles.length > 0 ? (
                  <ul className="space-y-3">
                    {bookmarkedArticles.map((article: any) => (
                      <li key={article.id}>
                        <Link
                          to={`/upscbriefs/${article.category?.slug}/${article.slug}`}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900 line-clamp-1">
                              {article.title}
                            </p>
                            <p className="text-xs text-gray-500">
                              {article.category?.name} • {article.reading_time || 5} min read
                            </p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <Bookmark className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No bookmarks yet</p>
                    <p className="text-xs mt-1">Save articles to read them later</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Activity */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-500" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {progressLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
              </div>
            ) : recentArticles && recentArticles.length > 0 ? (
              <ul className="space-y-2">
                {recentArticles.slice(0, 10).map((article: any) => (
                  <li
                    key={article.id}
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <Link
                        to={`/upscbriefs/${article.category?.slug}/${article.slug}`}
                        className="text-sm text-gray-700 hover:text-blue-600"
                      >
                        {article.title}
                      </Link>
                    </div>
                    {article.completed_at && (
                      <span className="text-xs text-gray-400">
                        {format(new Date(article.completed_at), 'MMM d, h:mm a')}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No activity yet</p>
                <p className="text-xs mt-1">Start reading articles to track your progress</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subject Progress */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Subject Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {['Polity', 'Economy', 'Geography', 'History', 'Environment', 'Science & Tech'].map((subject) => (
                <div key={subject} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">{subject}</span>
                    <span className="text-gray-500">0%</span>
                  </div>
                  <Progress value={0} className="h-2" />
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-4 text-center">
              Progress tracking by subject coming soon
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default UPSCDashboardPage;
