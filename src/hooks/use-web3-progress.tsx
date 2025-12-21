import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { toast } from "sonner";

export function useWeb3Progress(articleId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get progress for a specific article
  const { data: articleProgress, isLoading: progressLoading } = useQuery({
    queryKey: ["web3-article-progress", user?.id, articleId],
    queryFn: async () => {
      if (!user?.id || !articleId) return null;

      const { data, error } = await supabase
        .from("web3_article_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("article_id", articleId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !!articleId,
  });

  // Get user's overall stats
  const { data: userStats, isLoading: statsLoading } = useQuery({
    queryKey: ["web3-user-stats", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase.rpc("get_user_web3_stats", {
        user_uuid: user.id,
      });

      if (error) throw error;
      return data?.[0] || null;
    },
    enabled: !!user?.id,
  });

  // Get user's badges
  const { data: userBadges, isLoading: badgesLoading } = useQuery({
    queryKey: ["web3-user-badges", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("user_web3_badges")
        .select(
          `
          *,
          badge:web3_badges(*)
        `
        )
        .eq("user_id", user.id)
        .order("earned_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Get all available badges
  const { data: availableBadges } = useQuery({
    queryKey: ["web3-all-badges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("web3_badges")
        .select("*")
        .order("points", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Get user's certificates
  const { data: userCertificates, isLoading: certificatesLoading } = useQuery({
    queryKey: ["web3-user-certificates", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("web3_certificates")
        .select(
          `
          *,
          learning_path:web3_learning_paths(
            id,
            title,
            description
          )
        `
        )
        .eq("user_id", user.id)
        .order("issued_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Mark article as complete
  const markComplete = useMutation({
    mutationFn: async ({
      articleId,
      readingTime,
    }: {
      articleId: string;
      readingTime?: number;
    }) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("web3_article_progress")
        .upsert(
          {
            user_id: user.id,
            article_id: articleId,
            completed: true,
            completed_at: new Date().toISOString(),
            reading_time: readingTime,
          },
          {
            onConflict: "user_id,article_id",
          }
        )
        .select()
        .single();

      if (error) throw error;

      // Check for new badges
      await supabase.rpc("check_and_award_badges", { user_uuid: user.id });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["web3-article-progress"] });
      queryClient.invalidateQueries({ queryKey: ["web3-user-stats"] });
      queryClient.invalidateQueries({ queryKey: ["web3-user-badges"] });
      
      toast.success("Article marked as complete! 🎉");
    },
    onError: (error) => {
      console.error("Error marking article complete:", error);
      toast.error("Failed to mark article as complete");
    },
  });

  // Get completed articles
  const { data: completedArticles } = useQuery({
    queryKey: ["web3-completed-articles", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("web3_article_progress")
        .select(
          `
          *,
          article:articles(
            id,
            title,
            slug,
            excerpt,
            image_url,
            category_id,
            reading_time
          )
        `
        )
        .eq("user_id", user.id)
        .eq("completed", true)
        .order("completed_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Get all learning paths
  const { data: learningPaths, isLoading: pathsLoading } = useQuery({
    queryKey: ["web3-learning-paths"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("web3_learning_paths")
        .select("*")
        .eq("is_published", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Get user's learning path progress
  const { data: userPathProgress } = useQuery({
    queryKey: ["user-learning-path-progress", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("user_learning_path_progress")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Update learning path progress
  const updatePathProgress = useMutation({
    mutationFn: async ({
      pathId,
      stepIndex,
    }: {
      pathId: string;
      stepIndex: number;
    }) => {
      if (!user?.id) throw new Error("User not authenticated");

      // Get current progress
      const { data: existing } = await supabase
        .from("user_learning_path_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("learning_path_id", pathId)
        .maybeSingle();

      const completedSteps = existing?.completed_steps || [];
      const newCompletedSteps = [...completedSteps, stepIndex].filter(
        (v, i, a) => a.indexOf(v) === i
      ); // unique

      // Get total steps count
      const { data: path } = await supabase
        .from("web3_learning_paths")
        .select("steps, title")
        .eq("id", pathId)
        .single();

      const totalSteps = (path?.steps as any[])?.length || 0;
      const isCompleted = newCompletedSteps.length >= totalSteps;

      const { data, error } = await supabase
        .from("user_learning_path_progress")
        .upsert(
          {
            user_id: user.id,
            learning_path_id: pathId,
            completed_steps: newCompletedSteps,
            current_step: isCompleted ? totalSteps - 1 : stepIndex + 1,
            completed_at: isCompleted ? new Date().toISOString() : null,
          },
          {
            onConflict: "user_id,learning_path_id",
          }
        )
        .select()
        .single();

      if (error) throw error;

      // Generate certificate if just completed
      if (isCompleted && !existing?.completed_at) {
        await generateCertificate(pathId, path?.title || "Learning Path");
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["user-learning-path-progress"],
      });
      queryClient.invalidateQueries({ queryKey: ["web3-user-stats"] });
      toast.success("Progress updated! 🎉");
    },
    onError: (error) => {
      console.error("Error updating path progress:", error);
      toast.error("Failed to update progress");
    },
  });

  // Helper function to generate certificate
  const generateCertificate = async (
    pathId: string,
    pathTitle: string
  ) => {
    if (!user?.id) return;

    try {
      const { generateCertificateNumber, generateVerificationCode } = await import(
        "@/lib/certificate-generator"
      );

      const certificateNumber = generateCertificateNumber();
      const verificationCode = generateVerificationCode();

      // Only select necessary public fields
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, username")
        .eq("id", user.id)
        .single();

      const userName = profile?.full_name || profile?.username || "Student";

      const certificateData = {
        userName,
        learningPathTitle: pathTitle,
        completedDate: new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        certificateNumber,
        verificationCode,
        totalArticles: userStats?.total_completed || 0,
        totalPoints: userStats?.total_points || 0,
      };

      const { error } = await supabase.from("web3_certificates").insert({
        user_id: user.id,
        learning_path_id: pathId,
        certificate_number: certificateNumber,
        verification_code: verificationCode,
        certificate_data: certificateData,
      });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["web3-user-certificates"] });
      toast.success("🎉 Certificate generated! Check your dashboard.");
    } catch (error) {
      console.error("Failed to generate certificate:", error);
    }
  };

  return {
    articleProgress,
    progressLoading,
    userStats,
    statsLoading,
    userBadges,
    badgesLoading,
    availableBadges,
    completedArticles,
    learningPaths,
    pathsLoading,
    userPathProgress,
    userCertificates,
    certificatesLoading,
    markComplete: markComplete.mutate,
    isMarkingComplete: markComplete.isPending,
    updatePathProgress: updatePathProgress.mutate,
    isUpdatingPath: updatePathProgress.isPending,
  };
}
