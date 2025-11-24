import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { 
  FileText, Video, Image, FileDown, Search, 
  Scissors, Merge, FileImage, Zap, Clock,
  ArrowRight, Check
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";
import { AdvancedSEOHead } from "@/components/seo/advanced-seo-head";
import { BreadcrumbSchema } from "@/components/seo/breadcrumb-schema";
import { useState } from "react";

interface ToolCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  link: string;
  featuredTools: string[];
  toolCount: number;
}

interface FeaturedTool {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  link: string;
  category: string;
}

const categories: ToolCategory[] = [
  {
    id: "pdf-tools",
    name: "PDF Tools",
    description: "Convert, merge, split, compress, and edit PDF files",
    icon: <FileText className="w-10 h-10" />,
    link: "/tools/pdf-tools",
    featuredTools: ["PDF to Word", "Merge PDF", "Compress PDF"],
    toolCount: 12
  },
  {
    id: "video-tools",
    name: "Video Tools",
    description: "Download videos from YouTube, Instagram, and social media",
    icon: <Video className="w-10 h-10" />,
    link: "/tools/video-tools",
    featuredTools: ["YouTube Shorts", "Instagram Reels", "Video Converter"],
    toolCount: 5
  },
  {
    id: "image-tools",
    name: "Image Tools",
    description: "Convert, compress, resize, crop, and optimize images",
    icon: <Image className="w-10 h-10" />,
    link: "/tools/image-tools",
    featuredTools: ["JPG to PNG", "Image Compressor", "WebP Converter"],
    toolCount: 6
  },
  {
    id: "converter-tools",
    name: "File Converters",
    description: "Convert between document, image, and file formats",
    icon: <Zap className="w-10 h-10" />,
    link: "/tools/pdf-tools",
    featuredTools: ["Word to PDF", "Excel to PDF", "JPG to PDF"],
    toolCount: 10
  }
];

const featuredTools: FeaturedTool[] = [
  {
    id: "jpg-to-pdf",
    name: "JPG to PDF",
    description: "Convert JPG images to high-quality PDF documents instantly",
    icon: <FileImage className="w-8 h-8" />,
    link: "/tools/jpg-to-pdf",
    category: "PDF Tools"
  },
  {
    id: "youtube-shorts",
    name: "YouTube Shorts Downloader",
    description: "Download YouTube Shorts videos in HD quality for free",
    icon: <Video className="w-8 h-8" />,
    link: "/tools/youtube-shorts-downloader",
    category: "Video Tools"
  },
  {
    id: "merge-pdf",
    name: "Merge PDF",
    description: "Combine multiple PDF files into one document easily",
    icon: <Merge className="w-8 h-8" />,
    link: "/tools/merge-pdf",
    category: "PDF Tools"
  },
  {
    id: "instagram-video",
    name: "Instagram Video Downloader",
    description: "Save Instagram Reels and videos online for free",
    icon: <FileDown className="w-8 h-8" />,
    link: "/tools/instagram-video-downloader",
    category: "Video Tools"
  },
  {
    id: "compress-pdf",
    name: "Compress PDF",
    description: "Reduce PDF file size while maintaining quality",
    icon: <FileText className="w-8 h-8" />,
    link: "/tools/compress-pdf",
    category: "PDF Tools"
  },
  {
    id: "image-compressor",
    name: "Image Compressor",
    description: "Compress images without losing quality for faster loading",
    icon: <Image className="w-8 h-8" />,
    link: "/tools/image-compressor",
    category: "Image Tools"
  }
];

const faqs = [
  {
    question: "How do I use TheBulletinBriefs Tools?",
    answer: "Simply click on any tool card, upload your file, and let our browser-based tools process it instantly. No signup, no installation required. All processing happens securely in your browser."
  },
  {
    question: "Are all tools completely free?",
    answer: "Yes! All our tools are 100% free to use with no hidden charges, subscriptions, or file limits. We believe in providing accessible tools for everyone."
  },
  {
    question: "Do I need to create an account?",
    answer: "No account needed. You can use all tools instantly without any signup process. Just visit, upload, convert, and download."
  },
  {
    question: "Are my files safe and secure?",
    answer: "Absolutely. Your privacy is our priority. All file processing happens locally in your browser — we never upload or store your files on our servers."
  },
  {
    question: "Can I use these tools on mobile devices?",
    answer: "Yes! All our tools are fully responsive and work perfectly on smartphones, tablets, and desktop computers. No app installation required."
  }
];

const benefits = [
  "100% Free Forever",
  "No Signup Required",
  "Browser-Based Processing",
  "Complete Privacy & Security",
  "No File Size Limits",
  "Works on All Devices"
];

export default function Tools() {
  const [searchQuery, setSearchQuery] = useState("");
  const canonicalUrl = "https://www.thebulletinbriefs.in/tools/";

  const filteredTools = featuredTools.filter(tool =>
    tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ItemList Schema for Categories
  const categorySchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Tool Categories",
    "description": "Free online tool categories for PDF, video, image, and file conversion",
    "numberOfItems": categories.length,
    "itemListElement": categories.map((category, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": category.name,
      "description": category.description,
      "url": `https://www.thebulletinbriefs.in${category.link}`
    }))
  };

  // SoftwareApplication Schema for Featured Tools
  const toolsSchema = featuredTools.map(tool => ({
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": tool.name,
    "description": tool.description,
    "applicationCategory": "WebApplication",
    "operatingSystem": "Any",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "url": `https://www.thebulletinbriefs.in${tool.link}`
  }));

  // FAQ Schema
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AdvancedSEOHead
        title="Free Online Tools – Convert, Download & Optimize | The Bulletin Briefs"
        description="Access 100+ free tools for PDF conversion, video downloading, file compression, and more. No signup required — secure, fast, and free."
        canonical={canonicalUrl}
        tags={["free online tools", "pdf converter", "video downloader", "image compressor", "file converter", "merge pdf", "youtube downloader"]}
        image={`${window.location.origin}/og-image.jpg`}
      />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: window.location.origin },
          { name: "Tools", url: canonicalUrl }
        ]}
      />
      
      <Helmet>
        {/* Schema Markup */}
        <script type="application/ld+json">
          {JSON.stringify(categorySchema)}
        </script>
        {toolsSchema.map((schema, index) => (
          <script key={index} type="application/ld+json">
            {JSON.stringify(schema)}
          </script>
        ))}
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>

        {/* Open Graph Tags */}
        <meta property="og:title" content="Free Online Tools – Convert, Download & Optimize" />
        <meta property="og:description" content="Use 100+ free tools by TheBulletinBriefs to merge PDFs, download videos, convert files, and more." />
        <meta property="og:image" content="https://www.thebulletinbriefs.in/og-image.jpg" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="website" />

        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Free Online Tools – Convert, Download & Optimize" />
        <meta name="twitter:description" content="Use 100+ free tools by TheBulletinBriefs to merge PDFs, download videos, convert files, and more." />
        <meta name="twitter:image" content="https://www.thebulletinbriefs.in/og-image.jpg" />
      </Helmet>

      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/5 to-background py-16 md:py-24">
          <div className="container">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
                Free Online Tools
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground mb-8">
                Convert, download, and optimize — all your favorite tools in one place.
                100% free, no signup, completely secure.
              </p>

              {/* Search Bar */}
              <div className="max-w-2xl mx-auto mb-8">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <Input
                    type="search"
                    placeholder="Search for tools... (e.g., 'PDF to Word', 'YouTube downloader')"
                    className="pl-12 h-14 text-lg"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Benefits Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-foreground">{benefit}</span>
                  </div>
                ))}
              </div>

              <Button asChild size="lg" className="text-lg px-8">
                <a href="#categories">Explore All Tools <ArrowRight className="ml-2 w-5 h-5" /></a>
              </Button>
            </div>
          </div>
        </section>

        {/* Category Grid */}
        <section id="categories" className="py-16 md:py-24 container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Tool Categories</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Browse our comprehensive collection of free online tools organized by category
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {categories.map((category) => (
              <Card 
                key={category.id}
                className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 hover:border-primary/50"
              >
                <CardHeader>
                  <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors mx-auto">
                    {category.icon}
                  </div>
                  <CardTitle className="text-2xl text-center">{category.name}</CardTitle>
                  <CardDescription className="text-center text-base">
                    {category.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-6">
                    <p className="text-sm font-semibold text-muted-foreground">Featured:</p>
                    {category.featuredTools.map((tool, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary flex-shrink-0" />
                        <span>{tool}</span>
                      </div>
                    ))}
                  </div>
                  <Button asChild className="w-full" size="lg">
                    <Link to={category.link}>
                      View All ({category.toolCount}) <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Featured Tools Section */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Featured Tools</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Our most popular and frequently used tools — ready to use instantly
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(searchQuery ? filteredTools : featuredTools).map((tool) => (
                <Card 
                  key={tool.id}
                  className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors flex-shrink-0">
                        {tool.icon}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-1">{tool.name}</CardTitle>
                        <span className="text-xs text-primary font-medium">{tool.category}</span>
                      </div>
                    </div>
                    <CardDescription className="text-base mt-3">
                      {tool.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild className="w-full" variant="default">
                      <Link to={tool.link}>Use Tool <ArrowRight className="ml-2 w-4 h-4" /></Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {searchQuery && filteredTools.length === 0 && (
              <div className="text-center py-12">
                <p className="text-lg text-muted-foreground">No tools found matching "{searchQuery}"</p>
                <Button variant="outline" className="mt-4" onClick={() => setSearchQuery("")}>
                  Clear Search
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* SEO Content Block */}
        <section className="py-16 md:py-24 container">
          <div className="max-w-4xl mx-auto prose prose-lg dark:prose-invert">
            <h2 className="text-3xl font-bold mb-6">Why Choose TheBulletinBriefs Free Online Tools?</h2>
            
            <p className="text-muted-foreground leading-relaxed mb-4">
              Welcome to <strong>TheBulletinBriefs Tools Hub</strong> — your complete collection of free online tools 
              designed to make file conversion, video downloading, and document optimization effortless. Whether you need 
              to <strong>convert files</strong>, <strong>merge PDFs</strong>, <strong>download videos</strong> from YouTube 
              and Instagram, or <strong>optimize documents</strong> for faster sharing, we've got you covered.
            </p>

            <p className="text-muted-foreground leading-relaxed mb-4">
              Our <strong>free online tools</strong> are built with privacy and performance in mind. Unlike other platforms 
              that require subscriptions, registration, or compromise your data security, TheBulletinBriefs processes 
              everything directly in your browser. This means your files never touch our servers, ensuring complete privacy 
              and lightning-fast processing speeds. From <strong>PDF converters</strong> to <strong>image compressors</strong>, 
              every tool is designed to work seamlessly across all devices.
            </p>

            <p className="text-muted-foreground leading-relaxed mb-4">
              Students, professionals, content creators, and businesses trust our platform for reliable file management. 
              Need to <strong>compress PDF files</strong> to share via email? Want to <strong>convert images to WebP</strong> for 
              better web performance? Looking to <strong>download Instagram Reels</strong> or <strong>YouTube Shorts</strong>? 
              Our tools deliver professional results instantly, with no watermarks, no file size restrictions, and no hidden fees.
            </p>

            <p className="text-muted-foreground leading-relaxed">
              Join thousands of users who rely on <strong>TheBulletinBriefs Tools</strong> daily. With regular updates, 
              new tool additions, and a commitment to user experience, we're building the most comprehensive free tools 
              platform on the web. Bookmark this page and experience the convenience of having all your essential 
              productivity tools in one secure, accessible location.
            </p>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Frequently Asked Questions</h2>
              <div className="space-y-6">
                {faqs.map((faq, index) => (
                  <Card key={index} className="border-l-4 border-l-primary">
                    <CardHeader>
                      <CardTitle className="text-xl">{faq.question}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10">
          <div className="container text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Choose from our growing collection of free tools and start converting, downloading, and optimizing today.
            </p>
            <Button asChild size="lg" className="text-lg px-8">
              <a href="#categories">Browse All Tools <ArrowRight className="ml-2 w-5 h-5" /></a>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
