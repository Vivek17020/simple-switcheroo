import { Helmet } from "react-helmet-async";

interface FAQItem {
  question: string;
  answer: string;
}

interface CourseModule {
  name: string;
  description: string;
  url: string;
}

interface Web3StructuredDataProps {
  type: "article" | "course" | "faq" | "breadcrumb";
  data?: {
    // Article Schema
    headline?: string;
    description?: string;
    author?: string;
    datePublished?: string;
    dateModified?: string;
    imageUrl?: string;
    articleUrl?: string;

    // Course Schema
    courseName?: string;
    courseDescription?: string;
    provider?: string;
    courseUrl?: string;
    modules?: CourseModule[];

    // FAQ Schema
    faqs?: FAQItem[];

    // Breadcrumb Schema
    breadcrumbs?: { name: string; url: string }[];
  };
}

export function Web3StructuredData({ type, data }: Web3StructuredDataProps) {
  const generateSchema = () => {
    const baseUrl = "https://www.thebulletinbriefs.in";

    switch (type) {
      case "article":
        return {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: data?.headline,
          description: data?.description,
          image: data?.imageUrl || `${baseUrl}/og-image.jpg`,
          author: {
            "@type": "Person",
            name: data?.author || "Web3 for India",
          },
          publisher: {
            "@type": "Organization",
            name: "The Bulletin Briefs",
            logo: {
              "@type": "ImageObject",
              url: `${baseUrl}/logo.png`,
            },
          },
          datePublished: data?.datePublished,
          dateModified: data?.dateModified,
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": data?.articleUrl || baseUrl,
          },
        };

      case "course":
        return {
          "@context": "https://schema.org",
          "@type": "Course",
          name: data?.courseName,
          description: data?.courseDescription,
          provider: {
            "@type": "Organization",
            name: data?.provider || "Web3 for India",
            url: `${baseUrl}/web3forindia`,
          },
          url: data?.courseUrl,
          educationalLevel: "Beginner to Advanced",
          teaches: "Blockchain, Smart Contracts, DeFi, NFTs, Web3 Development",
          inLanguage: "en",
          hasCourseInstance: data?.modules?.map((module) => ({
            "@type": "CourseInstance",
            name: module.name,
            description: module.description,
            courseMode: "Online",
            url: module.url,
          })),
        };

      case "faq":
        return {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: data?.faqs?.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.answer,
            },
          })),
        };

      case "breadcrumb":
        return {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: data?.breadcrumbs?.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.name,
            item: item.url,
          })),
        };

      default:
        return null;
    }
  };

  const schema = generateSchema();

  if (!schema) return null;

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}
