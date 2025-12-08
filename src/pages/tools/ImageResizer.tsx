import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Upload, Download, Image as ImageIcon, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

const presets = [
  { name: "Custom", width: 0, height: 0 },
  { name: "Instagram Post (1:1)", width: 1080, height: 1080 },
  { name: "Instagram Story (9:16)", width: 1080, height: 1920 },
  { name: "Facebook Post", width: 1200, height: 630 },
  { name: "Twitter Post", width: 1200, height: 675 },
  { name: "YouTube Thumbnail", width: 1280, height: 720 },
  { name: "HD (1080p)", width: 1920, height: 1080 },
];

const faqs = [
  {
    question: "Can I maintain aspect ratio?",
    answer: "Yes! By default, the aspect ratio is locked. When you change width or height, the other dimension adjusts automatically. You can unlock it to set custom dimensions.",
  },
  {
    question: "What presets are available?",
    answer: "We offer popular presets for Instagram, Facebook, Twitter, YouTube, and standard HD sizes. You can also set custom dimensions.",
  },
  {
    question: "Is image quality affected?",
    answer: "High-quality resampling is used to maintain the best possible quality. Upscaling may result in some quality loss, while downscaling typically preserves quality well.",
  },
  {
    question: "What's the maximum size?",
    answer: "You can resize images up to 10000x10000 pixels, though we recommend reasonable sizes for optimal web performance.",
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

export default function ImageResizer() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [originalWidth, setOriginalWidth] = useState<number>(0);
  const [originalHeight, setOriginalHeight] = useState<number>(0);
  const [width, setWidth] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [isResizing, setIsResizing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

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

    const img = new Image();
    img.onload = () => {
      setOriginalWidth(img.width);
      setOriginalHeight(img.height);
      setWidth(img.width.toString());
      setHeight(img.height.toString());
      imageRef.current = img;
    };
    img.src = url;

    toast.success("Image loaded successfully");
  };

  const handlePresetChange = (presetName: string) => {
    const preset = presets.find((p) => p.name === presetName);
    if (!preset || preset.width === 0) return;

    setWidth(preset.width.toString());
    setHeight(preset.height.toString());
  };

  const handleWidthChange = (value: string) => {
    setWidth(value);
    if (maintainAspectRatio && originalWidth && originalHeight) {
      const newWidth = parseInt(value) || 0;
      const newHeight = Math.round((newWidth * originalHeight) / originalWidth);
      setHeight(newHeight.toString());
    }
  };

  const handleHeightChange = (value: string) => {
    setHeight(value);
    if (maintainAspectRatio && originalWidth && originalHeight) {
      const newHeight = parseInt(value) || 0;
      const newWidth = Math.round((newHeight * originalWidth) / originalHeight);
      setWidth(newWidth.toString());
    }
  };

  const resizeImage = async () => {
    if (!selectedFile || !imageRef.current) return;

    const newWidth = parseInt(width);
    const newHeight = parseInt(height);

    if (!newWidth || !newHeight || newWidth <= 0 || newHeight <= 0) {
      toast.error("Please enter valid dimensions");
      return;
    }

    setIsResizing(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = newWidth;
      canvas.height = newHeight;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Could not get canvas context");
      }

      ctx.drawImage(imageRef.current, 0, 0, newWidth, newHeight);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            toast.error("Resize failed");
            return;
          }

          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = selectedFile.name.replace(/\.[^/.]+$/, `-${newWidth}x${newHeight}$&`);
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          toast.success(`Image resized to ${newWidth}x${newHeight}!`);
        },
        selectedFile.type,
        0.95
      );
    } catch (error) {
      console.error("Resize error:", error);
      toast.error("Failed to resize image");
    } finally {
      setIsResizing(false);
    }
  };

  const resetTool = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    setWidth("");
    setHeight("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Image Resizer Online – Free & Fast | TheBulletinBriefs</title>
        <meta
          name="description"
          content="Resize images online for free. Custom dimensions or popular presets. Maintain aspect ratio. No signup required."
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://www.thebulletinbriefs.in/tools/image-resizer" />
        
        <meta property="og:title" content="Image Resizer Online – Free & Fast | TheBulletinBriefs" />
        <meta property="og:description" content="Resize images to custom dimensions or popular presets. Free and secure." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://thebulletinbriefs.in/tools/image-resizer/" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Image Resizer Online – Free & Fast" />
        <meta name="twitter:description" content="Resize images to any dimension. Free and secure." />
        
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
              Free Image Resizer
            </h1>
            <p className="text-lg text-muted-foreground">
              Resize images to custom dimensions or popular presets. Perfect for social media, web, and print.
            </p>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Resize Images</CardTitle>
              <CardDescription>Upload an image and set new dimensions</CardDescription>
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
                    Supports JPG, PNG, and WebP formats
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
                      Original: {originalWidth} × {originalHeight}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="preset">Preset Sizes</Label>
                      <Select onValueChange={handlePresetChange}>
                        <SelectTrigger id="preset">
                          <SelectValue placeholder="Choose a preset or enter custom size" />
                        </SelectTrigger>
                        <SelectContent>
                          {presets.map((preset) => (
                            <SelectItem key={preset.name} value={preset.name}>
                              {preset.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="width">Width (px)</Label>
                        <Input
                          id="width"
                          type="number"
                          value={width}
                          onChange={(e) => handleWidthChange(e.target.value)}
                          placeholder="Width"
                        />
                      </div>
                      <div>
                        <Label htmlFor="height">Height (px)</Label>
                        <Input
                          id="height"
                          type="number"
                          value={height}
                          onChange={(e) => handleHeightChange(e.target.value)}
                          placeholder="Height"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="aspect-ratio"
                        checked={maintainAspectRatio}
                        onCheckedChange={(checked) => setMaintainAspectRatio(checked as boolean)}
                      />
                      <Label htmlFor="aspect-ratio" className="cursor-pointer">
                        Maintain aspect ratio
                      </Label>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button
                      onClick={resizeImage}
                      disabled={isResizing}
                      className="flex-1"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {isResizing ? "Resizing..." : "Resize & Download"}
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
            <h2 className="text-3xl font-bold mb-4">How to Resize Images</h2>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Upload your image by clicking or dragging into the upload area</li>
              <li>Choose a preset size or enter custom width and height</li>
              <li>Toggle "Maintain aspect ratio" to lock or unlock proportions</li>
              <li>Click "Resize & Download" to get your resized image</li>
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
