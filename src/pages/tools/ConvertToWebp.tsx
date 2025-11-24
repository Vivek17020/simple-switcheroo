import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Upload, Download, Image as ImageIcon, Zap, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { formatFileSize } from "@/lib/image-optimizer";

const faqs = [
  {
    question: "What is WebP format?",
    answer: "WebP is a modern image format developed by Google that provides superior compression for images on the web. It supports both lossy and lossless compression, as well as transparency.",
  },
  {
    question: "Why convert to WebP?",
    answer: "WebP images are typically 25-35% smaller than JPG and PNG with similar quality, leading to faster page loads and reduced bandwidth usage. It's widely supported by modern browsers.",
  },
  {
    question: "Is quality preserved?",
    answer: "Yes, you can control the quality level. Higher quality settings preserve more detail. WebP's compression algorithm often achieves better quality than JPG at the same file size.",
  },
  {
    question: "Can I convert any image format?",
    answer: "Yes, you can convert JPG, PNG, GIF, and other common image formats to WebP. The tool maintains transparency when converting from PNG.",
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

export default function ConvertToWebp() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [quality, setQuality] = useState([85]);
  const [originalSize, setOriginalSize] = useState<number>(0);
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
    setOriginalSize(file.size);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    toast.success("Image loaded successfully");
  };

  const convertToWebp = async () => {
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

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            toast.error("Conversion failed");
            return;
          }

          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = selectedFile.name.replace(/\.[^/.]+$/i, ".webp");
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          const savedSize = originalSize - blob.size;
          const savedPercent = Math.round((savedSize / originalSize) * 100);
          toast.success(`WebP downloaded! Saved ${savedPercent}% (${formatFileSize(savedSize)})`);
        },
        "image/webp",
        quality[0] / 100
      );
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
        <title>Convert to WebP Online – Free & Fast | TheBulletinBriefs</title>
        <meta
          name="description"
          content="Convert images to WebP format for faster web loading. Free, secure, and no signup required. Reduce file size by up to 35%."
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://thebulletinbriefs.in/tools/convert-to-webp/" />
        
        <meta property="og:title" content="Convert to WebP Online – Free & Fast | TheBulletinBriefs" />
        <meta property="og:description" content="Convert images to modern WebP format. Smaller files, faster loading." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://thebulletinbriefs.in/tools/convert-to-webp/" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Convert to WebP Online – Free & Fast" />
        <meta name="twitter:description" content="Convert images to WebP for better web performance." />
        
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
              Free WebP Converter
            </h1>
            <p className="text-lg text-muted-foreground">
              Convert images to modern WebP format for faster loading and smaller file sizes. Perfect for web optimization.
            </p>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Convert to WebP
              </CardTitle>
              <CardDescription>Upload any image and convert to WebP format</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!selectedFile ? (
                <div
                  className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Click to upload image</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Supports JPG, PNG, GIF, and other formats
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
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
                    <p className="text-center text-sm text-muted-foreground mt-2">
                      Original size: {formatFileSize(originalSize)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="quality-slider">Quality: {quality[0]}%</Label>
                      <span className="text-sm text-muted-foreground">
                        {quality[0] >= 90 ? "High" : quality[0] >= 70 ? "Medium" : "Low"}
                      </span>
                    </div>
                    <Slider
                      id="quality-slider"
                      min={50}
                      max={100}
                      step={5}
                      value={quality}
                      onValueChange={setQuality}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Higher quality = larger file size, better image quality
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <Button
                      onClick={convertToWebp}
                      disabled={isConverting}
                      className="flex-1"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {isConverting ? "Converting..." : "Convert & Download WebP"}
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
            <h2 className="text-3xl font-bold mb-4">How to Convert to WebP</h2>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Click the upload area or drag and drop your image</li>
              <li>Adjust the quality slider to balance file size and image quality</li>
              <li>Click "Convert & Download WebP" to save your optimized image</li>
              <li>Use the WebP image on your website for faster loading times</li>
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
