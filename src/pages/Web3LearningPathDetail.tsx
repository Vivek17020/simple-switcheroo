import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "react-helmet-async";
import { Web3Navbar } from "@/components/web3/Web3Navbar";
import { Web3Footer } from "@/components/web3/Web3Footer";
import { Web3Breadcrumb } from "@/components/web3/Web3Breadcrumb";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Clock, BookOpen, ArrowRight } from "lucide-react";
import { useWeb3Progress } from "@/hooks/use-web3-progress";
import { Skeleton } from "@/components/ui/skeleton";

interface PathStep {
  title: string;
  description: string;
  completed?: boolean;
}

export default function Web3LearningPathDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { userPathProgress, updatePathProgress } = useWeb3Progress();

  const { data: learningPath, isLoading } = useQuery({
    queryKey: ["learning-path", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("web3_learning_paths")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const pathProgress = userPathProgress?.find(
    (p) => p.learning_path_id === learningPath?.id
  );

  const steps = (learningPath?.steps as any) || [];
  const stepsArray: PathStep[] = Array.isArray(steps) ? steps : [];
  const completedSteps = pathProgress?.completed_steps || [];
  const progressPercentage = stepsArray.length
    ? (completedSteps.length / stepsArray.length) * 100
    : 0;

  const levelColors = {
    Beginner: "bg-green-100 text-green-700 border-green-300",
    Intermediate: "bg-yellow-100 text-yellow-700 border-yellow-300",
    Advanced: "bg-red-100 text-red-700 border-red-300",
  };

  if (isLoading) {
    return (
      <>
        <Web3Navbar />
        <div className="min-h-screen bg-gradient-to-b from-[#F8F9FF] to-white pt-24 pb-16">
          <div className="max-w-5xl mx-auto px-6">
            <Skeleton className="h-8 w-64 mb-8" />
            <Skeleton className="h-12 w-full mb-4" />
            <Skeleton className="h-24 w-full mb-8" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
        <Web3Footer />
      </>
    );
  }

  if (!learningPath) {
    return (
      <>
        <Web3Navbar />
        <div className="min-h-screen bg-gradient-to-b from-[#F8F9FF] to-white pt-24 pb-16">
          <div className="max-w-5xl mx-auto px-6 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Learning Path Not Found
            </h1>
            <p className="text-gray-600 mb-8">
              The learning path you're looking for doesn't exist.
            </p>
            <Link to="/web3forindia">
              <Button>Back to Web3 Home</Button>
            </Link>
          </div>
        </div>
        <Web3Footer />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{learningPath.title} - Web3 Learning Path | TheBulletinBriefs</title>
        <meta
          name="description"
          content={learningPath.description}
        />
        <meta
          name="keywords"
          content={`web3 learning path, ${learningPath.difficulty} web3, blockchain learning, ${learningPath.title}`}
        />
      </Helmet>

      <Web3Navbar />

      <div className="min-h-screen bg-gradient-to-b from-[#F8F9FF] to-white pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-6">
          <Web3Breadcrumb
            items={[
              { label: "Learning Paths", href: "/web3forindia#learning-paths" },
              { label: learningPath.title },
            ]}
          />

          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <Badge
                className={`${
                  levelColors[learningPath.difficulty as keyof typeof levelColors]
                } border`}
              >
                {learningPath.difficulty}
              </Badge>
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-4 h-4" />
                <span className="text-sm">{learningPath.duration}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <BookOpen className="w-4 h-4" />
                <span className="text-sm">{steps.length} Steps</span>
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {learningPath.title}
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              {learningPath.description}
            </p>

            {pathProgress && (
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">
                    Your Progress
                  </span>
                  <span className="text-sm font-bold text-[#6A5BFF]">
                    {completedSteps.length} of {steps.length} completed
                  </span>
                </div>
                <Progress value={progressPercentage} className="h-3" />
              </div>
            )}
          </div>

          {/* Learning Steps */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Learning Steps
            </h2>

            {stepsArray.map((step, index) => {
              const isCompleted = completedSteps.includes(index);
              const isCurrent = pathProgress?.current_step === index;

              return (
                <div
                  key={index}
                  className={`p-6 rounded-2xl border-2 transition-all ${
                    isCompleted
                      ? "bg-green-50 border-green-300"
                      : isCurrent
                      ? "bg-white border-[#6A5BFF] shadow-lg"
                      : "bg-white border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                      ) : (
                        <Circle
                          className={`w-6 h-6 ${
                            isCurrent ? "text-[#6A5BFF]" : "text-gray-400"
                          }`}
                        />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">
                          Step {index + 1}: {step.title}
                        </h3>
                        {isCurrent && (
                          <Badge className="bg-[#6A5BFF] text-white">
                            Current
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-600 mb-4">{step.description}</p>

                      {!isCompleted && (
                        <Button
                          onClick={() =>
                            updatePathProgress({
                              pathId: learningPath.id,
                              stepIndex: index,
                            })
                          }
                          variant={isCurrent ? "default" : "outline"}
                          className={
                            isCurrent
                              ? "bg-gradient-to-r from-[#6A5BFF] to-[#4AC4FF] text-white"
                              : ""
                          }
                        >
                          {isCurrent ? "Mark as Complete" : "Start Step"}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Completion Card */}
          {progressPercentage === 100 && (
            <div className="mt-12 p-8 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Congratulations! 🎉
              </h3>
              <p className="text-gray-600 mb-6">
                You've completed the {learningPath.title}!
              </p>
              <Link to="/web3forindia/dashboard">
                <Button className="bg-gradient-to-r from-[#6A5BFF] to-[#4AC4FF] text-white">
                  View Your Dashboard
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      <Web3Footer />
    </>
  );
}
