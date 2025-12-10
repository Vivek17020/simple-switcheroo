import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Upload, Download, Image as ImageIcon, Crop, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const faqs = [
  {
    question: "How do I crop images?",
    answer: "Upload an image, then specify the crop area by entering the X and Y coordinates for the starting point, along with the desired width and height of the cropped section.",
  },
  {
    question: "Can I preview before downloading?",
    answer: "Yes, after setting your crop dimensions, the preview will update to show exactly what will be downloaded.",
  },
  {
    question: "What happens to image quality?",
    answer: "The cropped portion maintains the same quality as the original image. No compression is applied unless you choose to compress separately.",
  },
  {
    question: "Can I crop to specific aspect ratios?",
    answer: "Yes, simply calculate the width and height to match your desired ratio (e.g., 1:1 for square, 16:9 for widescreen, etc.).",
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

export default function ImageCropper() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [originalWidth, setOriginalWidth] = useState<number>(0);
  const [originalHeight, setOriginalHeight] = useState<number>(0);
  const [cropX, setCropX] = useState<string>("0");
  const [cropY, setCropY] = useState<string>("0");
  const [cropWidth, setCropWidth] = useState<string>("");
  const [cropHeight, setCropHeight] = useState<string>("");
  const [isCropping, setIsCropping] = useState(false);
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
      setCropWidth(img.width.toString());
      setCropHeight(img.height.toString());
      imageRef.current = img;
    };
    img.src = url;

    toast.success("Image loaded successfully");
  };

  const cropImage = async () => {
    if (!selectedFile || !imageRef.current) return;

    const x = parseInt(cropX);
    const y = parseInt(cropY);
    const width = parseInt(cropWidth);
    const height = parseInt(cropHeight);

    if (isNaN(x) || isNaN(y) || isNaN(width) || isNaN(height)) {
      toast.error("Please enter valid crop dimensions");
      return;
    }

    if (x < 0 || y < 0 || width <= 0 || height <= 0) {
      toast.error("Crop dimensions must be positive");
      return;
    }

    if (x + width > originalWidth || y + height > originalHeight) {
      toast.error("Crop area exceeds image boundaries");
      return;
    }

    setIsCropping(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Could not get canvas context");
      }

      ctx.drawImage(imageRef.current, x, y, width, height, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            toast.error("Crop failed");
            return;
          }

          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = selectedFile.name.replace(/\.[^/.]+$/, `-cropped$&`);
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          toast.success("Cropped image downloaded!");
        },
        selectedFile.type,
        0.95
      );
    } catch (error) {
      console.error("Crop error:", error);
      toast.error("Failed to crop image");
    } finally {
      setIsCropping(false);
    }
  };

  const resetTool = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    setCropX("0");
    setCropY("0");
    setCropWidth("");
    setCropHeight("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Image Cropper Online – Free & Precise | TheBulletinBriefs</title>
        <meta
          name="description"
          content="Crop images online for free. Precise control over crop area. No signup required. Perfect for focusing on important details."
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://www.thebulletinbriefs.in/tools/image-cropper" />
        
        <meta property="og:title" content="Image Cropper Online – Free & Precise | TheBulletinBriefs" />
        <meta property="og:description" content="Crop images with precise control. Free and secure online tool." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://thebulletinbriefs.in/tools/image-cropper/" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Image Cropper Online – Free & Precise" />
        <meta name="twitter:description" content="Crop images to focus on what matters. Free and secure." />
        
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
              Free Image Cropper
            </h1>
            <p className="text-lg text-muted-foreground">
              Crop images to focus on what matters most. Precise control over crop area for perfect results.
            </p>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Crop Images</CardTitle>
              <CardDescription>Upload an image and define the crop area</CardDescription>
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
                      Image size: {originalWidth} × {originalHeight}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="crop-x">Start X (px)</Label>
                        <Input
                          id="crop-x"
                          type="number"
                          value={cropX}
                          onChange={(e) => setCropX(e.target.value)}
                          placeholder="0"
                          min="0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="crop-y">Start Y (px)</Label>
                        <Input
                          id="crop-y"
                          type="number"
                          value={cropY}
                          onChange={(e) => setCropY(e.target.value)}
                          placeholder="0"
                          min="0"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="crop-width">Crop Width (px)</Label>
                        <Input
                          id="crop-width"
                          type="number"
                          value={cropWidth}
                          onChange={(e) => setCropWidth(e.target.value)}
                          placeholder="Width"
                          min="1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="crop-height">Crop Height (px)</Label>
                        <Input
                          id="crop-height"
                          type="number"
                          value={cropHeight}
                          onChange={(e) => setCropHeight(e.target.value)}
                          placeholder="Height"
                          min="1"
                        />
                      </div>
                    </div>

                    <div className="bg-muted p-3 rounded text-sm">
                      <p className="font-medium mb-1">Crop Area:</p>
                      <p className="text-muted-foreground">
                        From ({cropX}, {cropY}) with size {cropWidth} × {cropHeight}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button
                      onClick={cropImage}
                      disabled={isCropping}
                      className="flex-1"
                    >
                      <Crop className="w-4 h-4 mr-2" />
                      {isCropping ? "Cropping..." : "Crop & Download"}
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
            <h2 className="text-3xl font-bold mb-4">How to Crop Images</h2>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Upload your image by clicking or dragging into the upload area</li>
              <li>Set the starting point (X, Y coordinates) for your crop area</li>
              <li>Define the width and height of the area you want to keep</li>
              <li>Click "Crop & Download" to save your cropped image</li>
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
