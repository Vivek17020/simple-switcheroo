import { Helmet } from "react-helmet-async";

interface UPSCStructuredDataProps {
  type: "website" | "article" | "course";
  data: {
    title?: string;
    description?: string;
    url?: string;
    datePublished?: string;
    dateModified?: string;
    author?: string;
    subject?: string;
  };
}

export const UPSCStructuredData = ({ type, data }: UPSCStructuredDataProps) => {
  const baseUrl = "https://www.thebulletinbriefs.in";

  const getSchema = () => {
    switch (type) {
      case "website":
        return {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "UPSCBriefs",
          description: "UPSC Preparation Made Simple - Free study material for IAS, IPS, and Civil Services",
          url: `${baseUrl}/upscbriefs`,
          potentialAction: {
            "@type": "SearchAction",
            target: `${baseUrl}/upscbriefs/search?q={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
          publisher: {
            "@type": "Organization",
            name: "The Bulletin Briefs",
            logo: {
              "@type": "ImageObject",
              url: `${baseUrl}/logo.png`,
            },
          },
        };

      case "article":
        return {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: data.title,
          description: data.description,
          url: data.url || baseUrl,
          datePublished: data.datePublished,
          dateModified: data.dateModified || data.datePublished,
          author: {
            "@type": "Organization",
            name: "UPSCBriefs",
          },
          publisher: {
            "@type": "Organization",
            name: "The Bulletin Briefs",
            logo: {
              "@type": "ImageObject",
              url: `${baseUrl}/logo.png`,
            },
          },
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": data.url || baseUrl,
          },
          articleSection: data.subject || "UPSC Preparation",
          educationalLevel: "Advanced",
          audience: {
            "@type": "EducationalAudience",
            educationalRole: "student",
          },
        };

      case "course":
        return {
          "@context": "https://schema.org",
          "@type": "Course",
          name: data.title,
          description: data.description,
          provider: {
            "@type": "Organization",
            name: "UPSCBriefs",
          },
          educationalLevel: "Advanced",
          coursePrerequisites: "Basic knowledge of Indian Constitution and Governance",
          hasCourseInstance: {
            "@type": "CourseInstance",
            courseMode: "online",
          },
        };

      default:
        return null;
    }
  };

  const schema = getSchema();
  if (!schema) return null;

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};
