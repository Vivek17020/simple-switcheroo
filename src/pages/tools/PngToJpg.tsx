import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Upload, Download, Image as ImageIcon, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

const faqs = [
  {
    question: "Is quality preserved when converting PNG to JPG?",
    answer: "You can control the quality level using our slider. Higher quality settings preserve more detail but result in larger file sizes. Note that JPG doesn't support transparency.",
  },
  {
    question: "What happens to transparent backgrounds?",
    answer: "JPG format doesn't support transparency. Transparent areas in your PNG will be replaced with a white background during conversion.",
  },
  {
    question: "Can I convert multiple PNG files at once?",
    answer: "Currently, you can convert one file at a time. Simply repeat the process for each image you want to convert.",
  },
  {
    question: "Why convert PNG to JPG?",
    answer: "JPG files are typically smaller than PNG, making them ideal for photographs and web use where transparency isn't needed. This helps reduce page load times.",
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

export default function PngToJpg() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [quality, setQuality] = useState([85]);
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

  const convertToJpg = async () => {
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

      // Fill with white background for transparency
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
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
          a.download = selectedFile.name.replace(/\.png$/i, ".jpg");
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          toast.success("JPG downloaded successfully!");
        },
        "image/jpeg",
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
        <title>PNG to JPG Converter Online – Free & Fast | TheBulletinBriefs</title>
        <meta
          name="description"
          content="Convert PNG images to JPG format instantly. Free, secure, and no signup required. Reduce file size while maintaining quality."
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://thebulletinbriefs.in/tools/png-to-jpg/" />
        
        <meta property="og:title" content="PNG to JPG Converter Online – Free & Fast | TheBulletinBriefs" />
        <meta property="og:description" content="Convert PNG images to JPG format instantly. Free, secure, and no signup required." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://thebulletinbriefs.in/tools/png-to-jpg/" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="PNG to JPG Converter Online – Free & Fast" />
        <meta name="twitter:description" content="Convert PNG images to JPG format instantly. Free and secure." />
        
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
              Free PNG to JPG Converter
            </h1>
            <p className="text-lg text-muted-foreground">
              Convert PNG images to JPG format for smaller file sizes. Perfect for web optimization and faster loading times.
            </p>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Convert PNG to JPG</CardTitle>
              <CardDescription>Upload a PNG image and download it as JPG</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!selectedFile ? (
                <div
                  className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Click to upload PNG image</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    or drag and drop your file here
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png"
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
                  </div>

                  <div className="flex gap-4">
                    <Button
                      onClick={convertToJpg}
                      disabled={isConverting}
                      className="flex-1"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {isConverting ? "Converting..." : "Convert & Download JPG"}
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
            <h2 className="text-3xl font-bold mb-4">How to Convert PNG to JPG</h2>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Click the upload area or drag and drop your PNG image</li>
              <li>Adjust the quality slider to your preference (higher = better quality, larger file)</li>
              <li>Preview your image to ensure it's correct</li>
              <li>Click "Convert & Download JPG" to save your converted image</li>
              <li>The JPG file will be downloaded to your device instantly</li>
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
