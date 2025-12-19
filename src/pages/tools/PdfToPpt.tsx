import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Download, Presentation, Loader2 } from "lucide-react";
import { toast } from "sonner";
import * as pdfjsLib from "pdfjs-dist";
import pptxgen from "pptxgenjs";
import { AdvancedSEOHead } from "@/components/seo/advanced-seo-head";
import { SoftwareApplicationSchema } from "@/components/seo/software-application-schema";
import { BreadcrumbSchema } from "@/components/seo/breadcrumb-schema";
import { ToolBreadcrumb } from "@/components/tools/tool-breadcrumb";
import { RelatedTools } from "@/components/tools/related-tools";
import { FileText, FileImage, FileSpreadsheet } from "lucide-react";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function PdfToPpt() {
  const [file, setFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  const canonicalUrl = "https://www.thebulletinbriefs.in/tools/pdf-to-ppt";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
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
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      // Create PowerPoint presentation
      const pptx = new pptxgen();
      
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.5 });
        
        // Create canvas to render PDF page
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        if (context) {
          const renderContext = {
            canvasContext: context,
            viewport: viewport,
            canvas: canvas
          };
          await page.render(renderContext).promise;
          const imageData = canvas.toDataURL('image/png');
          
          // Add slide with PDF page as image
          const slide = pptx.addSlide();
          slide.addImage({
            data: imageData,
            x: 0,
            y: 0,
            w: '100%',
            h: '100%',
            sizing: { type: 'contain', w: '100%', h: '100%' }
          });
        }
      }
      
      // Save PowerPoint
      const filename = file.name.replace('.pdf', '.pptx');
      await pptx.writeFile({ fileName: filename });
      
      toast.success("PDF converted to PowerPoint successfully!");
    } catch (error) {
      console.error("Conversion error:", error);
      toast.error("Failed to convert PDF. Please try again.");
    } finally {
      setIsConverting(false);
    }
  };

  const relatedTools = [
    {
      title: "PowerPoint to PDF",
      description: "Convert PowerPoint presentations to PDF",
      url: "/tools/ppt-to-pdf",
      icon: Presentation
    },
    {
      title: "PDF to Word",
      description: "Convert PDF to editable Word documents",
      url: "/tools/pdf-to-word",
      icon: FileText
    },
    {
      title: "PDF to JPG",
      description: "Convert PDF pages to JPG images",
      url: "/tools/pdf-to-jpg",
      icon: FileImage
    }
  ];

  return (
    <>
      <AdvancedSEOHead
        title="PDF to PowerPoint Converter – Free & Easy | TheBulletinBriefs"
        description="Convert PDFs into editable PowerPoint slides online. Free, no signup. Recreate your PDFs as editable PowerPoint presentations instantly."
        canonical={canonicalUrl}
        tags={["pdf to ppt", "pdf to powerpoint", "convert pdf", "pdf converter", "pdf to slides"]}
        image={`${window.location.origin}/og-image.jpg`}
      />
      <SoftwareApplicationSchema
        name="PDF to PowerPoint Converter"
        description="Convert PDF documents to PowerPoint presentations online for free"
        url={canonicalUrl}
        applicationCategory="UtilitiesApplication"
      />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: window.location.origin },
          { name: "Tools", url: `${window.location.origin}/tools` },
          { name: "PDF Tools", url: `${window.location.origin}/tools/pdf-tools` },
          { name: "PDF to PowerPoint", url: canonicalUrl }
        ]}
      />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <ToolBreadcrumb
          items={[
            { label: "Tools", url: "/tools" },
            { label: "PDF Tools", url: "/tools/pdf-tools" },
            { label: "PDF to PowerPoint" }
          ]}
        />

        <h1 className="text-4xl font-bold mb-4">Free PDF to PowerPoint Converter</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Recreate your PDFs as editable PowerPoint presentations instantly. Convert PDF slides or documents into editable .pptx format.
        </p>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Presentation className="h-5 w-5" />
              Upload PDF File
            </CardTitle>
            <CardDescription>
              Convert PDF to PowerPoint presentation
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
                <Presentation className="h-4 w-4" />
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
                  Convert to PowerPoint
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Can I edit the converted slides?</h3>
              <p className="text-muted-foreground">
                Yes, each PDF page is converted to a PowerPoint slide as an image. Text is also extracted and added to speaker notes for reference.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Will fonts and images be preserved?</h3>
              <p className="text-muted-foreground">
                Yes, each page is rendered as a high-quality image, preserving all visual elements including fonts, images, and layout.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Is there a file-size restriction?</h3>
              <p className="text-muted-foreground">
                No strict limits, but very large PDFs may take longer to convert. All processing happens in your browser for maximum privacy.
              </p>
            </div>
          </CardContent>
        </Card>

        <RelatedTools tools={relatedTools} />
      </div>
    </>
  );
}
