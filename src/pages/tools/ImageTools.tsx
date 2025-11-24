import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Image, Minimize, Maximize, Crop, FileImage, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";

interface ImageTool {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  link: string;
}

const imageTools: ImageTool[] = [
  {
    id: "jpg-to-png",
    name: "JPG to PNG Converter",
    description: "Convert JPG images to PNG format with transparency support.",
    icon: <Image className="w-8 h-8" />,
    link: "/tools/jpg-to-png",
  },
  {
    id: "png-to-jpg",
    name: "PNG to JPG Converter",
    description: "Convert PNG images to JPG format for smaller file sizes.",
    icon: <FileImage className="w-8 h-8" />,
    link: "/tools/png-to-jpg",
  },
  {
    id: "image-compressor",
    name: "Image Compressor",
    description: "Reduce image file size while maintaining quality.",
    icon: <Minimize className="w-8 h-8" />,
    link: "/tools/image-compressor",
  },
  {
    id: "image-resizer",
    name: "Image Resizer",
    description: "Resize images to custom dimensions or presets.",
    icon: <Maximize className="w-8 h-8" />,
    link: "/tools/image-resizer",
  },
  {
    id: "image-cropper",
    name: "Image Cropper",
    description: "Crop images to focus on what matters most.",
    icon: <Crop className="w-8 h-8" />,
    link: "/tools/image-cropper",
  },
  {
    id: "convert-to-webp",
    name: "Convert to WebP",
    description: "Convert images to modern WebP format for faster loading.",
    icon: <Zap className="w-8 h-8" />,
    link: "/tools/convert-to-webp",
  },
];

const faqs = [
  {
    question: "Are image tools free to use?",
    answer: "Yes! All our image conversion and editing tools are completely free with no limits or watermarks.",
  },
  {
    question: "Is image quality preserved?",
    answer: "Yes, we maintain the highest quality possible during conversion and processing. You can also adjust quality settings for compression.",
  },
  {
    question: "Are my images stored on servers?",
    answer: "No, all processing happens locally in your browser. Your images never leave your device, ensuring complete privacy.",
  },
  {
    question: "What image formats are supported?",
    answer: "We support JPG, PNG, WebP, and most common image formats. Each tool specifies its supported input and output formats.",
  },
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

export default function ImageTools() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Free Image Tools – Convert, Compress, Resize | TheBulletinBriefs</title>
        <meta
          name="description"
          content="Free online image tools for converting, compressing, resizing, and cropping images. JPG to PNG, PNG to JPG, WebP converter, and more. No signup required."
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://thebulletinbriefs.in/tools/image-tools/" />
        
        <meta property="og:title" content="Free Image Tools – Convert, Compress, Resize | TheBulletinBriefs" />
        <meta property="og:description" content="Free online image tools for converting, compressing, resizing, and cropping images. JPG to PNG, PNG to JPG, WebP converter, and more." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://thebulletinbriefs.in/tools/image-tools/" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Free Image Tools – Convert, Compress, Resize | TheBulletinBriefs" />
        <meta name="twitter:description" content="Free online image tools for converting, compressing, resizing, and cropping images." />
        
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <Navbar />

      <main className="flex-1 container py-8 md:py-12">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            Free Image Tools – Convert, Compress & Edit Images Online
          </h1>
          <p className="text-lg text-muted-foreground">
            Transform your images with our powerful, free online tools. Convert between formats, 
            compress files, resize dimensions, and crop images – all processed securely in your browser 
            with no file size limits or registration required.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {imageTools.map((tool) => (
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
                <Button asChild className="w-full">
                  <Link to={tool.link}>Use Tool</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <section className="max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-4">About Our Image Tools</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Our image processing tools are built with privacy and performance in mind. All conversions 
            and edits happen entirely in your browser using advanced web technologies, meaning your 
            images never touch our servers.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Whether you're a photographer optimizing images for web, a designer converting formats, 
            or just need to quickly resize a photo, our tools are fast, reliable, and completely free.
          </p>
        </section>

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
