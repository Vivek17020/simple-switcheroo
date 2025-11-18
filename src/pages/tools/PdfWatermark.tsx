import { useState, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { Upload, Download, FileText, Type, Image as ImageIcon, Droplet } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";
import { AdvancedSEOHead } from "@/components/seo/advanced-seo-head";
import { BreadcrumbSchema } from "@/components/seo/breadcrumb-schema";
import { ToolBreadcrumb } from "@/components/tools/tool-breadcrumb";
import { RelatedTools } from "@/components/tools/related-tools";
import { toast } from "sonner";
import { PDFDocument, rgb, degrees } from "pdf-lib";
import { FileDown, Merge, Scissors } from "lucide-react";

type WatermarkType = "text" | "image";
type Position = "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right";

export default function PdfWatermark() {
  const [file, setFile] = useState<File | null>(null);
  const [watermarkType, setWatermarkType] = useState<WatermarkType>("text");
  const [watermarkText, setWatermarkText] = useState("CONFIDENTIAL");
  const [watermarkImage, setWatermarkImage] = useState<File | null>(null);
  const [opacity, setOpacity] = useState([50]);
  const [position, setPosition] = useState<Position>("center");
  const [rotation, setRotation] = useState([0]);
  const [fontSize, setFontSize] = useState([48]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      toast.success("PDF file loaded successfully");
    } else {
      toast.error("Please select a valid PDF file");
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type.startsWith("image/")) {
      setWatermarkImage(selectedFile);
      toast.success("Watermark image loaded");
    } else {
      toast.error("Please select a valid image file");
    }
  };

  const getPositionCoordinates = (pageWidth: number, pageHeight: number, watermarkWidth: number, watermarkHeight: number) => {
    const margin = 50;
    switch (position) {
      case "top-left":
        return { x: margin, y: pageHeight - watermarkHeight - margin };
      case "top-right":
        return { x: pageWidth - watermarkWidth - margin, y: pageHeight - watermarkHeight - margin };
      case "bottom-left":
        return { x: margin, y: margin };
      case "bottom-right":
        return { x: pageWidth - watermarkWidth - margin, y: margin };
      case "center":
      default:
        return { x: (pageWidth - watermarkWidth) / 2, y: (pageHeight - watermarkHeight) / 2 };
    }
  };

  const addWatermark = async () => {
    if (!file) {
      toast.error("Please select a PDF file first");
      return;
    }

    if (watermarkType === "text" && !watermarkText.trim()) {
      toast.error("Please enter watermark text");
      return;
    }

    if (watermarkType === "image" && !watermarkImage) {
      toast.error("Please select a watermark image");
      return;
    }

    setIsProcessing(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      const opacityValue = opacity[0] / 100;

      if (watermarkType === "text") {
        // Add text watermark
        for (const page of pages) {
          const { width, height } = page.getSize();
          const textWidth = watermarkText.length * fontSize[0] * 0.6;
          const textHeight = fontSize[0];
          const { x, y } = getPositionCoordinates(width, height, textWidth, textHeight);

          page.drawText(watermarkText, {
            x,
            y,
            size: fontSize[0],
            color: rgb(0.5, 0.5, 0.5),
            opacity: opacityValue,
            rotate: degrees(rotation[0]),
          });
        }
      } else if (watermarkType === "image" && watermarkImage) {
        // Add image watermark
        const imageBytes = await watermarkImage.arrayBuffer();
        let embedImage;

        if (watermarkImage.type === "image/png") {
          embedImage = await pdfDoc.embedPng(imageBytes);
        } else if (watermarkImage.type === "image/jpeg" || watermarkImage.type === "image/jpg") {
          embedImage = await pdfDoc.embedJpg(imageBytes);
        } else {
          toast.error("Unsupported image format. Please use PNG or JPG");
          setIsProcessing(false);
          return;
        }

        const imageDims = embedImage.scale(0.3);

        for (const page of pages) {
          const { width, height } = page.getSize();
          const { x, y } = getPositionCoordinates(width, height, imageDims.width, imageDims.height);

          page.drawImage(embedImage, {
            x,
            y,
            width: imageDims.width,
            height: imageDims.height,
            opacity: opacityValue,
            rotate: degrees(rotation[0]),
          });
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `watermarked-${file.name}`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success("Watermark added successfully!");
    } catch (error) {
      console.error("Error adding watermark:", error);
      toast.error("Failed to add watermark. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const canonicalUrl = "https://www.thebulletinbriefs.in/tools/pdf-watermark";

  const relatedTools = [
    {
      title: "Merge PDF",
      description: "Combine multiple PDF files into one",
      url: "/tools/merge-pdf",
      icon: Merge
    },
    {
      title: "Split PDF",
      description: "Split PDF into separate pages",
      url: "/tools/split-pdf",
      icon: Scissors
    },
    {
      title: "Compress PDF",
      description: "Reduce PDF file size",
      url: "/tools/compress-pdf",
      icon: FileDown
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AdvancedSEOHead
        title="Free PDF Watermark Tool – Add Text & Image Watermarks | TheBulletinBriefs"
        description="Add custom text or image watermarks to PDF files online. Protect your documents with customizable watermarks. Free, secure, and easy to use."
        canonical={canonicalUrl}
        tags={["pdf watermark", "add watermark to pdf", "pdf protection", "watermark tool"]}
        image={`${window.location.origin}/og-image.jpg`}
      />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: window.location.origin },
          { name: "Tools", url: `${window.location.origin}/tools` },
          { name: "PDF Tools", url: `${window.location.origin}/tools/pdf-tools` },
          { name: "PDF Watermark", url: canonicalUrl }
        ]}
      />
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "PDF Watermark Tool",
            "applicationCategory": "UtilitiesApplication",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "operatingSystem": "Any"
          })}
        </script>
      </Helmet>

      <Navbar />

      <main className="flex-1 container py-8 md:py-12">
        <ToolBreadcrumb
          items={[
            { label: "Tools", url: "/tools" },
            { label: "PDF Tools", url: "/tools/pdf-tools" },
            { label: "PDF Watermark" }
          ]}
        />

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Free PDF Watermark Tool – Add Text & Image Watermarks
            </h1>
            <p className="text-lg text-muted-foreground">
              Protect your PDF documents by adding custom text or image watermarks. 
              Fully customizable position, opacity, and rotation. All processing happens securely in your browser.
            </p>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Add Watermark to PDF</CardTitle>
              <CardDescription>
                Upload your PDF and customize your watermark settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="pdf-file">Select PDF File</Label>
                <div className="flex gap-2">
                  <Input
                    id="pdf-file"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    className="flex-1"
                  />
                  {file && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </div>
                {file && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {file.name}
                  </p>
                )}
              </div>

              {/* Watermark Type */}
              <div className="space-y-2">
                <Label>Watermark Type</Label>
                <RadioGroup value={watermarkType} onValueChange={(value) => setWatermarkType(value as WatermarkType)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="text" id="text" />
                    <Label htmlFor="text" className="flex items-center gap-2 cursor-pointer">
                      <Type className="h-4 w-4" />
                      Text Watermark
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="image" id="image" />
                    <Label htmlFor="image" className="flex items-center gap-2 cursor-pointer">
                      <ImageIcon className="h-4 w-4" />
                      Image Watermark
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Text Watermark Settings */}
              {watermarkType === "text" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="watermark-text">Watermark Text</Label>
                    <Input
                      id="watermark-text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      placeholder="Enter watermark text"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Font Size: {fontSize[0]}px</Label>
                    <Slider
                      value={fontSize}
                      onValueChange={setFontSize}
                      min={12}
                      max={120}
                      step={1}
                    />
                  </div>
                </>
              )}

              {/* Image Watermark Settings */}
              {watermarkType === "image" && (
                <div className="space-y-2">
                  <Label htmlFor="watermark-image">Watermark Image (PNG/JPG)</Label>
                  <Input
                    id="watermark-image"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleImageChange}
                    ref={imageInputRef}
                  />
                  {watermarkImage && (
                    <p className="text-sm text-muted-foreground">
                      Selected: {watermarkImage.name}
                    </p>
                  )}
                </div>
              )}

              {/* Common Settings */}
              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Select value={position} onValueChange={(value) => setPosition(value as Position)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="top-left">Top Left</SelectItem>
                    <SelectItem value="top-right">Top Right</SelectItem>
                    <SelectItem value="bottom-left">Bottom Left</SelectItem>
                    <SelectItem value="bottom-right">Bottom Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Droplet className="h-4 w-4" />
                  Opacity: {opacity[0]}%
                </Label>
                <Slider
                  value={opacity}
                  onValueChange={setOpacity}
                  min={10}
                  max={100}
                  step={5}
                />
              </div>

              <div className="space-y-2">
                <Label>Rotation: {rotation[0]}°</Label>
                <Slider
                  value={rotation}
                  onValueChange={setRotation}
                  min={-45}
                  max={45}
                  step={5}
                />
              </div>

              <Button
                onClick={addWatermark}
                disabled={!file || isProcessing}
                className="w-full"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Upload className="mr-2 h-5 w-5 animate-spin" />
                    Adding Watermark...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-5 w-5" />
                    Add Watermark & Download
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Features */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Why Use Our PDF Watermark Tool?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Dual Watermark Types
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Add either text or image watermarks to protect your documents.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">🎨 Full Customization</h3>
                  <p className="text-sm text-muted-foreground">
                    Control position, opacity, rotation, and size of watermarks.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">🔒 100% Secure</h3>
                  <p className="text-sm text-muted-foreground">
                    All processing happens locally in your browser. Files never uploaded.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">⚡ Instant Processing</h3>
                  <p className="text-sm text-muted-foreground">
                    Add watermarks to all pages instantly with client-side processing.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How to Use */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>How to Add Watermark to PDF</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-3 text-muted-foreground">
                <li>Upload your PDF file using the file selector</li>
                <li>Choose between text or image watermark type</li>
                <li>For text: Enter your watermark text and adjust font size</li>
                <li>For image: Upload your watermark image (PNG or JPG)</li>
                <li>Select the position where you want the watermark</li>
                <li>Adjust opacity and rotation to your preference</li>
                <li>Click "Add Watermark & Download" to process and save your file</li>
              </ol>
            </CardContent>
          </Card>

          <RelatedTools tools={relatedTools} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
