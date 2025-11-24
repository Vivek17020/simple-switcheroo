import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Download, FileImage, Loader2 } from "lucide-react";
import { toast } from "sonner";
import * as pdfjsLib from "pdfjs-dist";
import { AdvancedSEOHead } from "@/components/seo/advanced-seo-head";
import { SoftwareApplicationSchema } from "@/components/seo/software-application-schema";
import { BreadcrumbSchema } from "@/components/seo/breadcrumb-schema";
import { ToolBreadcrumb } from "@/components/tools/tool-breadcrumb";
import { RelatedTools } from "@/components/tools/related-tools";
import { FileText, FileSpreadsheet, Image } from "lucide-react";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function PdfToJpg() {
  const [file, setFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  const canonicalUrl = `${window.location.origin}/tools/pdf-to-jpg`;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setImages([]);
      toast.success("PDF file uploaded successfully!");
    } else {
      toast.error("Please upload a valid PDF file");
    }
  };

  const handleConvert = async () => {
    if (!file) {
      toast.error("Please upload a PDF file first");
      return;
    }

    setIsConverting(true);
    setImages([]);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const imageUrls: string[] = [];

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) continue;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: context,
          viewport: viewport
        } as any).promise;

        const imageUrl = canvas.toDataURL("image/jpeg", 0.95);
        imageUrls.push(imageUrl);
      }

      setImages(imageUrls);
      toast.success(`Successfully converted ${imageUrls.length} page(s) to JPG!`);
    } catch (error) {
      console.error("Conversion error:", error);
      toast.error("Failed to convert PDF. Please try again.");
    } finally {
      setIsConverting(false);
    }
  };

  const downloadImage = (imageUrl: string, index: number) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `page-${index + 1}.jpg`;
    link.click();
  };

  const downloadAll = () => {
    images.forEach((imageUrl, index) => {
      setTimeout(() => downloadImage(imageUrl, index), index * 100);
    });
    toast.success("Downloading all images...");
  };

  const relatedTools = [
    {
      title: "JPG to PDF",
      description: "Convert JPG images to PDF documents",
      url: "/tools/jpg-to-pdf",
      icon: FileText
    },
    {
      title: "PDF to Excel",
      description: "Extract tables from PDF to Excel",
      url: "/tools/pdf-to-excel",
      icon: FileSpreadsheet
    },
    {
      title: "Image Compressor",
      description: "Reduce image file sizes",
      url: "/tools/image-compressor",
      icon: Image
    }
  ];

  return (
    <>
      <AdvancedSEOHead
        title="PDF to JPG Converter – Free Online Tool | TheBulletinBriefs"
        description="Convert PDF pages to high-quality JPG images online. Free, fast, and secure conversion with no signup required."
        canonical={canonicalUrl}
        tags={["pdf to jpg", "pdf to image", "convert pdf", "pdf converter", "pdf to jpeg"]}
        image={`${window.location.origin}/og-image.jpg`}
      />
      <SoftwareApplicationSchema
        name="PDF to JPG Converter"
        description="Convert PDF pages to JPG images online for free"
        url={canonicalUrl}
        applicationCategory="UtilitiesApplication"
      />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: window.location.origin },
          { name: "Tools", url: `${window.location.origin}/tools` },
          { name: "PDF Tools", url: `${window.location.origin}/tools/pdf-tools` },
          { name: "PDF to JPG", url: canonicalUrl }
        ]}
      />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <ToolBreadcrumb
          items={[
            { label: "Tools", url: "/tools" },
            { label: "PDF Tools", url: "/tools/pdf-tools" },
            { label: "PDF to JPG" }
          ]}
        />

        <h1 className="text-4xl font-bold mb-4">Free PDF to JPG Converter</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Convert PDF pages to high-quality JPG images instantly. Extract all pages or individual pages from your PDF documents.
        </p>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileImage className="h-5 w-5" />
              Upload PDF File
            </CardTitle>
            <CardDescription>
              Convert each page to a separate JPG image
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                className="hidden"
                id="pdf-upload"
              />
              <label htmlFor="pdf-upload" className="cursor-pointer">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">
                  Click to upload or drag and drop
                </p>
                <p className="text-sm text-muted-foreground">
                  PDF files only
                </p>
              </label>
            </div>

            {file && (
              <Alert>
                <FileImage className="h-4 w-4" />
                <AlertDescription>
                  Selected file: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(2)} KB)
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleConvert}
              disabled={!file || isConverting}
              className="w-full"
              size="lg"
            >
              {isConverting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Converting...
                </>
              ) : (
                <>
                  <Download className="h-5 w-5 mr-2" />
                  Convert to JPG
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {images.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Converted Images ({images.length})</CardTitle>
                <Button onClick={downloadAll} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {images.map((imageUrl, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <img
                      src={imageUrl}
                      alt={`Page ${index + 1}`}
                      className="w-full mb-3 rounded"
                    />
                    <Button
                      onClick={() => downloadImage(imageUrl, index)}
                      variant="outline"
                      className="w-full"
                      size="sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Page {index + 1}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">What quality are the JPG images?</h3>
              <p className="text-muted-foreground">
                We convert at high quality (2x scale) with 95% JPEG quality to ensure crisp, clear images while maintaining reasonable file sizes.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Can I convert password-protected PDFs?</h3>
              <p className="text-muted-foreground">
                No, password-protected PDFs need to be unlocked before conversion. Please remove the password first.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Is there a page limit?</h3>
              <p className="text-muted-foreground">
                You can convert PDFs with any number of pages, but very large files may take longer to process.
              </p>
            </div>
          </CardContent>
        </Card>

        <RelatedTools tools={relatedTools} />
      </div>
    </>
  );
}
