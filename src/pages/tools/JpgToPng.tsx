import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Upload, Download, Image as ImageIcon, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";
import { toast } from "sonner";

const faqs = [
  {
    question: "Is formatting preserved when converting JPG to PNG?",
    answer: "Yes, the image quality and dimensions are preserved. PNG format also supports transparency, making it ideal for web graphics and logos.",
  },
  {
    question: "Can I convert multiple JPG files at once?",
    answer: "Currently, you can convert one file at a time. Simply repeat the process for each image you want to convert.",
  },
  {
    question: "Are my images stored on your servers?",
    answer: "No, all conversion happens locally in your browser. Your images are never uploaded to our servers, ensuring complete privacy and security.",
  },
  {
    question: "What's the difference between JPG and PNG?",
    answer: "JPG is better for photographs with smaller file sizes, while PNG supports transparency and is better for graphics, logos, and images requiring lossless compression.",
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

export default function JpgToPng() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isConverting, setIsConverting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    toast.success("Image loaded successfully");
  };

  const convertToPng = async () => {
    if (!selectedFile) return;

    setIsConverting(true);
    try {
      const img = new Image();
      img.src = previewUrl;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Could not get canvas context");
      }

      ctx.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        if (!blob) {
          toast.error("Conversion failed");
          return;
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = selectedFile.name.replace(/\.(jpg|jpeg)$/i, ".png");
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success("PNG downloaded successfully!");
      }, "image/png");
    } catch (error) {
      console.error("Conversion error:", error);
      toast.error("Failed to convert image");
    } finally {
      setIsConverting(false);
    }
  };

  const resetTool = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>JPG to PNG Converter Online – Free & Fast | TheBulletinBriefs</title>
        <meta
          name="description"
          content="Convert JPG images to PNG format instantly. Free, secure, and no signup required. Preserve quality while adding transparency support."
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://thebulletinbriefs.in/tools/jpg-to-png/" />
        
        <meta property="og:title" content="JPG to PNG Converter Online – Free & Fast | TheBulletinBriefs" />
        <meta property="og:description" content="Convert JPG images to PNG format instantly. Free, secure, and no signup required." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://thebulletinbriefs.in/tools/jpg-to-png/" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="JPG to PNG Converter Online – Free & Fast" />
        <meta name="twitter:description" content="Convert JPG images to PNG format instantly. Free and secure." />
        
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <Navbar />

      <main className="flex-1 container py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Button variant="ghost" asChild className="mb-6">
            <Link to="/tools">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Tools
            </Link>
          </Button>

          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
              Free JPG to PNG Converter
            </h1>
            <p className="text-lg text-muted-foreground">
              Quickly convert JPG images to PNG format without losing quality. Perfect for adding transparency support to your images.
            </p>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Convert JPG to PNG</CardTitle>
              <CardDescription>Upload a JPG image and download it as PNG</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!selectedFile ? (
                <div
                  className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Click to upload JPG image</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    or drag and drop your file here
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border border-border rounded-lg p-4">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-w-full max-h-96 mx-auto rounded"
                    />
                  </div>
                  <div className="flex gap-4">
                    <Button
                      onClick={convertToPng}
                      disabled={isConverting}
                      className="flex-1"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {isConverting ? "Converting..." : "Convert & Download PNG"}
                    </Button>
                    <Button onClick={resetTool} variant="outline">
                      Upload New Image
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-4">How to Convert JPG to PNG</h2>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Click the upload area or drag and drop your JPG image</li>
              <li>Preview your image to ensure it's correct</li>
              <li>Click "Convert & Download PNG" to save your converted image</li>
              <li>The PNG file will be downloaded to your device instantly</li>
            </ol>
          </section>

          <section>
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
        </div>
      </main>

      <Footer />
    </div>
  );
}
