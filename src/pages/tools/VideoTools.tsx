import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Video, Download, Play, Film } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";
import { AdvancedSEOHead } from "@/components/seo/advanced-seo-head";
import { BreadcrumbSchema } from "@/components/seo/breadcrumb-schema";
import { ToolBreadcrumb } from "@/components/tools/tool-breadcrumb";

interface VideoTool {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  link: string;
}

const videoTools: VideoTool[] = [
  {
    id: "youtube-shorts",
    name: "YouTube Shorts Downloader",
    description: "Download YouTube Shorts videos in HD quality instantly",
    icon: <Video className="w-8 h-8" />,
    link: "/tools/youtube-shorts-downloader",
  },
  {
    id: "instagram-video",
    name: "Instagram Video Downloader",
    description: "Save Instagram Reels and videos online for free",
    icon: <Download className="w-8 h-8" />,
    link: "/tools/instagram-video-downloader",
  },
  {
    id: "video-converter",
    name: "Video Converter",
    description: "Convert videos between different formats (Coming Soon)",
    icon: <Film className="w-8 h-8" />,
    link: "/tools/video-tools",
  },
  {
    id: "video-compressor",
    name: "Video Compressor",
    description: "Reduce video file size while maintaining quality (Coming Soon)",
    icon: <Play className="w-8 h-8" />,
    link: "/tools/video-tools",
  },
];

const faqs = [
  {
    question: "Are video downloaders free to use?",
    answer: "Yes! All our video downloader tools are completely free with no limits, subscriptions, or hidden charges.",
  },
  {
    question: "What video quality can I download?",
    answer: "You can download videos in the highest quality available from the source platform, including HD and Full HD formats.",
  },
  {
    question: "Do you store downloaded videos?",
    answer: "No, we don't store any videos. All downloads happen directly from the source platform to your device, ensuring complete privacy.",
  },
  {
    question: "Can I download private or age-restricted videos?",
    answer: "Our tools can only download publicly available videos. Private, age-restricted, or copyright-protected content cannot be downloaded.",
  },
  {
    question: "Is it legal to download videos?",
    answer: "Downloading videos for personal use from public sources is generally acceptable. However, always respect copyright laws and platform terms of service. Don't redistribute downloaded content without permission.",
  }
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

const itemListSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "Video Downloader Tools",
  "description": "Free video downloader tools for YouTube Shorts, Instagram Reels, and more",
  "numberOfItems": videoTools.length,
  "itemListElement": videoTools.map((tool, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": tool.name,
    "description": tool.description,
    "url": `${window.location.origin}${tool.link}`
  }))
};

export default function VideoTools() {
  const canonicalUrl = "https://www.thebulletinbriefs.in/tools/video-tools";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AdvancedSEOHead
        title="Free Video Downloader Tools – YouTube, Instagram & More | TheBulletinBriefs"
        description="Download videos from YouTube Shorts, Instagram Reels, and more. Free, fast, and HD quality. No signup required."
        canonical={canonicalUrl}
        tags={["video downloader", "youtube shorts downloader", "instagram reels downloader", "download videos", "free video downloader"]}
        image={`${window.location.origin}/og-image.jpg`}
      />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: window.location.origin },
          { name: "Tools", url: `${window.location.origin}/tools` },
          { name: "Video Tools", url: canonicalUrl }
        ]}
      />
      
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(itemListSchema)}
        </script>

        {/* Open Graph */}
        <meta property="og:title" content="Free Video Downloader Tools – YouTube, Instagram & More" />
        <meta property="og:description" content="Download videos from YouTube Shorts, Instagram Reels, and more. Free, fast, and HD quality." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Free Video Downloader Tools – YouTube, Instagram & More" />
        <meta name="twitter:description" content="Download videos from YouTube Shorts, Instagram Reels, and more." />
      </Helmet>

      <Navbar />

      <main className="flex-1 container py-8 md:py-12">
        <ToolBreadcrumb
          items={[
            { label: "Tools", url: "/tools" },
            { label: "Video Tools" }
          ]}
        />

        <div className="max-w-4xl mx-auto text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            Free Video Downloader Tools
          </h1>
          <p className="text-lg text-muted-foreground">
            Download videos from YouTube Shorts, Instagram Reels, and popular social media platforms. 
            Fast, free, and high-quality downloads with no signup required. All processing is secure 
            and happens directly in your browser.
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {videoTools.map((tool) => {
            const isComingSoon = tool.link === "/tools/video-tools";
            return (
              <Card 
                key={tool.id} 
                className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <CardHeader>
                  <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    {tool.icon}
                  </div>
                  <CardTitle className="text-xl">{tool.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {tool.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  {isComingSoon ? (
                    <Button variant="secondary" disabled className="w-full">
                      Coming Soon
                    </Button>
                  ) : (
                    <Button asChild className="w-full">
                      <Link to={tool.link}>Use Tool</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* About Section */}
        <section className="max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-4">About Our Video Downloader Tools</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Our video downloader tools make it easy to save your favorite videos from popular platforms 
            like YouTube Shorts and Instagram Reels. Whether you're a content creator building a 
            portfolio, a marketer analyzing competitors, or simply want to save videos for offline viewing, 
            our tools provide fast, reliable downloads in the highest quality available.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            All downloads are processed securely, and we never store your downloaded videos. The tools 
            work directly with the source platforms to fetch videos, ensuring you get authentic, 
            unmodified content. Use our video downloaders responsibly and always respect content creators' 
            rights and platform terms of service.
          </p>
        </section>

        {/* FAQs Section */}
        <section className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-border pb-6 last:border-0">
                <h3 className="text-xl font-semibold mb-2">{faq.question}</h3>
                <p className="text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
