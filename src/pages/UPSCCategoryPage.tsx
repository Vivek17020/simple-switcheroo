import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Building, FileText, Globe, History, Leaf, Cpu, Palette, Users, LucideIcon } from "lucide-react";
import { UPSCBreadcrumb } from "@/components/upsc/UPSCBreadcrumb";
import { UPSCArticleList } from "@/components/upsc/UPSCArticleList";
import { UPSCStructuredData } from "@/components/upsc/UPSCStructuredData";
import { useUPSCArticles, useUPSCCategories } from "@/hooks/use-upsc-articles";

const subjectIcons: Record<string, LucideIcon> = {
  polity: Building,
  economy: FileText,
  geography: Globe,
  history: History,
  environment: Leaf,
  "science-tech": Cpu,
  "art-culture": Palette,
  "international-relations": Users,
  society: Users,
};

const UPSCCategoryPage = () => {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const { data: categories = [] } = useUPSCCategories();
  const { data: articles = [], isLoading } = useUPSCArticles(categorySlug);

  const category = categories.find((c) => c.slug === categorySlug);
  const Icon = categorySlug ? subjectIcons[categorySlug] || Building : Building;

  if (!category) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">Subject not found</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{category.name} - UPSC Notes | UPSCBriefs</title>
        <meta
          name="description"
          content={category.description || `UPSC ${category.name} notes and study material for IAS preparation.`}
        />
        <link rel="canonical" href={`https://www.thebulletinbriefs.in/upscbriefs/${categorySlug}`} />
      </Helmet>

      <UPSCStructuredData
        type="course"
        data={{
          title: `${category.name} - UPSC Preparation`,
          description: category.description || `Complete ${category.name} notes for UPSC Civil Services`,
        }}
      />

      {/* Header */}
      <div
        className="py-8 border-b"
        style={{ backgroundColor: `${category.color}08` }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <UPSCBreadcrumb items={[{ label: category.name }]} />

          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${category.color}15` }}
            >
              <Icon className="w-7 h-7" style={{ color: category.color }} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{category.name}</h1>
              {category.description && (
                <p className="text-gray-600 mt-1">{category.description}</p>
              )}
              <p className="text-sm text-gray-500 mt-2">{articles.length} articles</p>
            </div>
          </div>
        </div>
      </div>

      {/* Articles List */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="p-4">
            <UPSCArticleList articles={articles} loading={isLoading} />
          </div>
        </div>
      </div>
    </>
  );
};

export default UPSCCategoryPage;
