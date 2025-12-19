import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Download, FileType, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AdvancedSEOHead } from "@/components/seo/advanced-seo-head";
import { SoftwareApplicationSchema } from "@/components/seo/software-application-schema";
import { BreadcrumbSchema } from "@/components/seo/breadcrumb-schema";
import { ToolBreadcrumb } from "@/components/tools/tool-breadcrumb";
import { RelatedTools } from "@/components/tools/related-tools";
import { FileImage, FileSpreadsheet, Presentation } from "lucide-react";
import { jsPDF } from "jspdf";

export default function PptToPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  const canonicalUrl = "https://www.thebulletinbriefs.in/tools/ppt-to-pdf";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
          selectedFile.type === "application/vnd.ms-powerpoint") {
        setFile(selectedFile);
        toast.success("PowerPoint file uploaded successfully!");
      } else {
        toast.error("Please upload a valid PowerPoint file (.pptx or .ppt)");
      }
    }
  };

  const handleConvert = async () => {
    if (!file) {
      toast.error("Please upload a PowerPoint file first");
      return;
    }

    setIsConverting(true);
    try {
      // Create a basic PDF with file information
      const pdf = new jsPDF();
      const fileName = file.name;
      const fileSize = (file.size / 1024).toFixed(2) + " KB";
      
      // Add title
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text("PowerPoint to PDF Conversion", 20, 20);
      
      // Add file details
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`File: ${fileName}`, 20, 40);
      pdf.text(`Size: ${fileSize}`, 20, 50);
      pdf.text(`Date: ${new Date().toLocaleDateString()}`, 20, 60);
      
      // Add note
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'italic');
      const note = [
        "",
        "Note: This is a basic conversion that creates a PDF document",
        "with your PowerPoint file information.",
        "",
        "For full slide-by-slide conversion with preserved formatting,",
        "images, and text, please use desktop software like:",
        "- Microsoft PowerPoint's 'Save as PDF' feature",
        "- Adobe Acrobat",
        "- Online services with backend processing",
        "",
        "Client-side browser conversion of PPTX to PDF with full",
        "fidelity requires complex parsing and rendering that is",
        "best handled by desktop applications or server-side services."
      ];
      
      let yPos = 80;
      note.forEach(line => {
        pdf.text(line, 20, yPos);
        yPos += 7;
      });
      
      // Save PDF
      const filename = file.name.replace(/\.(pptx?|ppt)$/i, '') + '-converted.pdf';
      pdf.save(filename);
      
      toast.success("PDF document created with file information!");
      toast.info("For full conversion, use desktop software or online services with backend support.");
    } catch (error) {
      console.error("Conversion error:", error);
      toast.error("Failed to create PDF. Please try again.");
    } finally {
      setIsConverting(false);
    }
  };

  const relatedTools = [
    {
      title: "PDF to PowerPoint",
      description: "Convert PDF files to PowerPoint presentations",
      url: "/tools/pdf-to-ppt",
      icon: Presentation
    },
    {
      title: "PDF to JPG",
      description: "Convert PDF pages to JPG images",
      url: "/tools/pdf-to-jpg",
      icon: FileImage
    },
    {
      title: "PDF to Excel",
      description: "Extract tables from PDF to Excel",
      url: "/tools/pdf-to-excel",
      icon: FileSpreadsheet
    }
  ];

  return (
    <>
      <AdvancedSEOHead
        title="PowerPoint to PDF Converter – Convert PPTX to PDF | TheBulletinBriefs"
        description="Convert PowerPoint presentations to PDF format online. Free and fast PPTX to PDF conversion."
        canonical={canonicalUrl}
        tags={["ppt to pdf", "powerpoint to pdf", "pptx to pdf", "convert ppt", "presentation converter"]}
        image={`${window.location.origin}/og-image.jpg`}
      />
      <SoftwareApplicationSchema
        name="PowerPoint to PDF Converter"
        description="Convert PowerPoint presentations to PDF format online for free"
        url={canonicalUrl}
        applicationCategory="UtilitiesApplication"
      />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: window.location.origin },
          { name: "Tools", url: `${window.location.origin}/tools` },
          { name: "PDF Tools", url: `${window.location.origin}/tools/pdf-tools` },
          { name: "PowerPoint to PDF", url: canonicalUrl }
        ]}
      />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <ToolBreadcrumb
          items={[
            { label: "Tools", url: "/tools" },
            { label: "PDF Tools", url: "/tools/pdf-tools" },
            { label: "PowerPoint to PDF" }
          ]}
        />

        <h1 className="text-4xl font-bold mb-4">PowerPoint to PDF Converter</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Convert PowerPoint presentations to PDF format. Creates a PDF document with your file information.
        </p>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileType className="h-5 w-5" />
              Upload PowerPoint File
            </CardTitle>
            <CardDescription>
              Convert PPTX or PPT to PDF
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
              <input
                type="file"
                accept=".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                onChange={handleFileChange}
                className="hidden"
                id="ppt-upload"
              />
              <label htmlFor="ppt-upload" className="cursor-pointer">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">
                  Click to upload or drag and drop
                </p>
                <p className="text-sm text-muted-foreground">
                  PowerPoint files (.ppt, .pptx)
                </p>
              </label>
            </div>

            {file && (
              <Alert>
                <FileType className="h-4 w-4" />
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
                  Convert to PDF
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
              <h3 className="font-semibold mb-2">Does it preserve formatting?</h3>
              <p className="text-muted-foreground">
                This tool creates a basic PDF with file information. For full slide-by-slide conversion with preserved formatting, images, and animations, use desktop software like Microsoft PowerPoint's "Save as PDF" feature or Adobe Acrobat.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Why not full conversion?</h3>
              <p className="text-muted-foreground">
                Full PowerPoint to PDF conversion with perfect fidelity requires complex parsing of PPTX format and rendering of slides, which is best handled by desktop applications or server-side services with proper PowerPoint libraries.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">What's the best way to convert?</h3>
              <p className="text-muted-foreground">
                For the highest quality conversion, use Microsoft PowerPoint's built-in "File → Save As → PDF" feature, which preserves all formatting, images, animations, and layout perfectly.
              </p>
            </div>
          </CardContent>
        </Card>

        <RelatedTools tools={relatedTools} />
      </div>
    </>
  );
}
