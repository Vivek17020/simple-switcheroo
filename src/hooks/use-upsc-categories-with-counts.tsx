import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Building, Globe, History, Leaf, Cpu, Palette, Users, TrendingUp,
  BookOpen, CheckSquare, Brain, Target, Calendar, BookMarked, FileText, 
  PenTool, Clock, Map, Download
} from "lucide-react";
import { LucideIcon } from "lucide-react";

const MIN_ARTICLES_FOR_VISIBILITY = 3;

export interface UPSCCategoryWithCount {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  article_count: number;
  icon?: LucideIcon;
  gsPaper?: string;
}

// Icon and color mappings for known UPSC categories
const categoryMeta: Record<string, { icon: LucideIcon; color: string; gsPaper: string }> = {
  "polity": { icon: Building, color: "#2563EB", gsPaper: "GS2" },
  "economy": { icon: FileText, color: "#059669", gsPaper: "GS3" },
  "geography": { icon: Globe, color: "#D97706", gsPaper: "GS1" },
  "history": { icon: History, color: "#DC2626", gsPaper: "GS1" },
  "upsc-environment": { icon: Leaf, color: "#16A34A", gsPaper: "GS3" },
  "science-tech": { icon: Cpu, color: "#7C3AED", gsPaper: "GS3" },
  "art-culture": { icon: Palette, color: "#DB2777", gsPaper: "GS1" },
  "upsc-international-relations": { icon: Users, color: "#0891B2", gsPaper: "GS2" },
  "upsc-society": { icon: Users, color: "#EA580C", gsPaper: "GS1" },
  "society": { icon: Users, color: "#EA580C", gsPaper: "GS1" },
  "upsc-daily-ca": { icon: TrendingUp, color: "#059669", gsPaper: "CA" },
  // Prelims
  "upsc-prelims-gs-notes": { icon: BookOpen, color: "#2563EB", gsPaper: "Prelims" },
  "upsc-topic-wise-mcqs": { icon: CheckSquare, color: "#059669", gsPaper: "Prelims" },
  "upsc-csat": { icon: Brain, color: "#7C3AED", gsPaper: "Prelims" },
  "upsc-prelims-pyq": { icon: History, color: "#DC2626", gsPaper: "Prelims" },
  "upsc-prelims-mock-tests": { icon: Target, color: "#D97706", gsPaper: "Prelims" },
  // Mains
  "upsc-gs1": { icon: BookOpen, color: "#2563EB", gsPaper: "GS1" },
  "upsc-gs2": { icon: Building, color: "#059669", gsPaper: "GS2" },
  "upsc-gs3": { icon: Cpu, color: "#7C3AED", gsPaper: "GS3" },
  "upsc-gs4": { icon: Users, color: "#D97706", gsPaper: "GS4" },
  "upsc-essay-strategy": { icon: PenTool, color: "#DB2777", gsPaper: "Mains" },
  "upsc-model-answers": { icon: FileText, color: "#059669", gsPaper: "Mains" },
  "upsc-mains-pyq": { icon: History, color: "#DC2626", gsPaper: "Mains" },
  // Optional
  "upsc-psir": { icon: Building, color: "#2563EB", gsPaper: "Optional" },
  "upsc-sociology-optional": { icon: Users, color: "#EA580C", gsPaper: "Optional" },
  "upsc-geography-optional": { icon: Globe, color: "#D97706", gsPaper: "Optional" },
  "upsc-anthropology": { icon: Users, color: "#0891B2", gsPaper: "Optional" },
  "upsc-public-admin": { icon: Building, color: "#059669", gsPaper: "Optional" },
  "upsc-history-optional": { icon: History, color: "#DC2626", gsPaper: "Optional" },
  "upsc-philosophy": { icon: Brain, color: "#7C3AED", gsPaper: "Optional" },
  "upsc-economics-optional": { icon: FileText, color: "#059669", gsPaper: "Optional" },
  "upsc-literature-optional": { icon: BookOpen, color: "#DB2777", gsPaper: "Optional" },
  // Current Affairs
  "upsc-monthly-ca": { icon: BookMarked, color: "#059669", gsPaper: "CA" },
  "upsc-pib-summary": { icon: FileText, color: "#2563EB", gsPaper: "CA" },
  "upsc-yojana-summary": { icon: BookOpen, color: "#D97706", gsPaper: "CA" },
  "upsc-kurukshetra-summary": { icon: BookOpen, color: "#16A34A", gsPaper: "CA" },
  "upsc-editorial-notes": { icon: PenTool, color: "#DB2777", gsPaper: "CA" },
  // Practice
  "upsc-daily-quiz": { icon: CheckSquare, color: "#059669", gsPaper: "Practice" },
  "upsc-weekly-quiz": { icon: Clock, color: "#D97706", gsPaper: "Practice" },
  "upsc-topic-test": { icon: Target, color: "#2563EB", gsPaper: "Practice" },
  "upsc-flashcards": { icon: BookMarked, color: "#7C3AED", gsPaper: "Practice" },
  "upsc-revision-notes": { icon: FileText, color: "#DC2626", gsPaper: "Practice" },
  // Resources
  "upsc-syllabus": { icon: FileText, color: "#2563EB", gsPaper: "Resources" },
  "upsc-ncert-notes": { icon: BookOpen, color: "#059669", gsPaper: "Resources" },
  "upsc-booklist": { icon: BookMarked, color: "#D97706", gsPaper: "Resources" },
  "upsc-pyp": { icon: History, color: "#DC2626", gsPaper: "Resources" },
  "upsc-maps-infographics": { icon: Map, color: "#0891B2", gsPaper: "Resources" },
  "upsc-calendar": { icon: Calendar, color: "#7C3AED", gsPaper: "Resources" },
  "upsc-pdf-downloads": { icon: Download, color: "#16A34A", gsPaper: "Resources" },
};

// Category groupings for navigation
export type UPSCCategoryGroup = "subjects" | "prelims" | "mains" | "optional" | "currentAffairs" | "practice" | "resources";

const categoryGroups: Record<UPSCCategoryGroup, string[]> = {
  subjects: ["polity", "economy", "geography", "history", "upsc-environment", "science-tech", "art-culture", "upsc-international-relations", "upsc-society", "society"],
  prelims: ["upsc-prelims-gs-notes", "upsc-topic-wise-mcqs", "upsc-csat", "upsc-prelims-pyq", "upsc-prelims-mock-tests"],
  mains: ["upsc-gs1", "upsc-gs2", "upsc-gs3", "upsc-gs4", "upsc-essay-strategy", "upsc-model-answers", "upsc-mains-pyq"],
  optional: ["upsc-psir", "upsc-sociology-optional", "upsc-geography-optional", "upsc-anthropology", "upsc-public-admin", "upsc-history-optional", "upsc-philosophy", "upsc-economics-optional", "upsc-literature-optional"],
  currentAffairs: ["upsc-daily-ca", "upsc-monthly-ca", "upsc-pib-summary", "upsc-yojana-summary", "upsc-kurukshetra-summary", "upsc-editorial-notes"],
  practice: ["upsc-daily-quiz", "upsc-weekly-quiz", "upsc-topic-test", "upsc-flashcards", "upsc-revision-notes"],
  resources: ["upsc-syllabus", "upsc-ncert-notes", "upsc-booklist", "upsc-pyp", "upsc-maps-infographics", "upsc-calendar", "upsc-pdf-downloads"],
};

/**
 * Hook to fetch all UPSC categories with article counts.
 * Categories are filtered for visibility based on MIN_ARTICLES_FOR_VISIBILITY.
 */
export const useUPSCCategoriesWithCounts = () => {
  return useQuery({
    queryKey: ["upsc-categories-with-counts"],
    queryFn: async () => {
      // Get parent category
      const { data: parentCategory, error: parentError } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", "upscbriefs")
        .maybeSingle();

      if (parentError) throw parentError;
      if (!parentCategory) return { allCategories: [], visibleCategories: [], groupedCategories: {} };

      // Get all subcategories
      const { data: categories, error: catError } = await supabase
        .from("categories")
        .select("*")
        .eq("parent_id", parentCategory.id);

      if (catError) throw catError;

      const categoryIds = (categories || []).map((c) => c.id);

      // Get article counts
      const { data: articleCounts, error: countError } = await supabase
        .from("articles")
        .select("category_id")
        .in("category_id", categoryIds)
        .eq("published", true);

      if (countError) throw countError;

      // Count articles per category
      const countsMap: Record<string, number> = {};
      (articleCounts || []).forEach((article) => {
        countsMap[article.category_id] = (countsMap[article.category_id] || 0) + 1;
      });

      // Add counts and metadata to categories
      const categoriesWithCounts: UPSCCategoryWithCount[] = (categories || []).map((cat) => {
        const meta = categoryMeta[cat.slug] || { icon: BookOpen, color: cat.color || "#2563EB", gsPaper: "GS" };
        return {
          ...cat,
          article_count: countsMap[cat.id] || 0,
          icon: meta.icon,
          gsPaper: meta.gsPaper,
          color: meta.color,
        };
      });

      // Filter visible categories
      const visibleCategories = categoriesWithCounts.filter(
        (cat) => cat.article_count >= MIN_ARTICLES_FOR_VISIBILITY
      );

      // Group categories for navigation
      const groupedCategories: Record<UPSCCategoryGroup, UPSCCategoryWithCount[]> = {
        subjects: [],
        prelims: [],
        mains: [],
        optional: [],
        currentAffairs: [],
        practice: [],
        resources: [],
      };

      // Populate grouped categories with visibility filtering
      Object.entries(categoryGroups).forEach(([group, slugs]) => {
        groupedCategories[group as UPSCCategoryGroup] = slugs
          .map((slug) => categoriesWithCounts.find((cat) => cat.slug === slug))
          .filter((cat): cat is UPSCCategoryWithCount => 
            cat !== undefined && cat.article_count >= MIN_ARTICLES_FOR_VISIBILITY
          );
      });

      return {
        allCategories: categoriesWithCounts,
        visibleCategories,
        groupedCategories,
      };
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook to get UPSC subjects for the homepage hexagon grid
 */
export const useUPSCSubjectsForHomepage = () => {
  const { data, isLoading } = useUPSCCategoriesWithCounts();
  
  const groupedCats = data?.groupedCategories as Record<UPSCCategoryGroup, UPSCCategoryWithCount[]> | undefined;
  const subjects = (groupedCats?.subjects || []).map((cat) => ({
    name: cat.name,
    slug: cat.slug,
    description: cat.description || "",
    icon: cat.icon || BookOpen,
    color: cat.color || "#2563EB",
    gsPaper: cat.gsPaper || "GS",
    articleCount: cat.article_count,
  }));

  return { subjects, isLoading };
};

/**
 * Hook for UPSC footer subjects
 */
export const useUPSCFooterCategories = () => {
  const { data, isLoading } = useUPSCCategoriesWithCounts();
  
  const groupedCats = data?.groupedCategories as Record<UPSCCategoryGroup, UPSCCategoryWithCount[]> | undefined;
  return {
    subjects: groupedCats?.subjects || [],
    isLoading,
  };
};
