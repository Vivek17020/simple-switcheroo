import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Upload, Download, X, ArrowLeft, FileText, GripVertical, FileSpreadsheet, FileImage } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";
import { toast } from "sonner";
import { PDFDocument } from "pdf-lib";
import { AdvancedSEOHead } from "@/components/seo/advanced-seo-head";
import { SoftwareApplicationSchema } from "@/components/seo/software-application-schema";
import { BreadcrumbSchema } from "@/components/seo/breadcrumb-schema";
import { ToolBreadcrumb } from "@/components/tools/tool-breadcrumb";
import { RelatedTools } from "@/components/tools/related-tools";

interface PDFFile {
  file: File;
  id: string;
}

export default function MergePdf() {
  const [pdfFiles, setPdfFiles] = useState<PDFFile[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    const pdfFilesArray = Array.from(files).filter(file => 
      file.type === 'application/pdf'
    );

    if (pdfFilesArray.length === 0) {
      toast.error("Please select valid PDF files");
      return;
    }

    const newPdfFiles = pdfFilesArray.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9)
    }));

    setPdfFiles(prev => [...prev, ...newPdfFiles]);
    toast.success(`${pdfFilesArray.length} PDF(s) added`);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const removeFile = useCallback((id: string) => {
    setPdfFiles(prev => prev.filter(pdf => pdf.id !== id));
  }, []);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragEnter = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newFiles = [...pdfFiles];
    const draggedFile = newFiles[draggedIndex];
    newFiles.splice(draggedIndex, 1);
    newFiles.splice(index, 0, draggedFile);
    
    setPdfFiles(newFiles);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const mergePdfs = useCallback(async () => {
    if (pdfFiles.length < 2) {
      toast.error("Please select at least 2 PDF files to merge");
      return;
    }

    setIsMerging(true);

    try {
      const mergedPdf = await PDFDocument.create();

      for (const pdfFile of pdfFiles) {
        const arrayBuffer = await pdfFile.file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach(page => mergedPdf.addPage(page));
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `merged-pdf-${timestamp}.pdf`;
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      
      URL.revokeObjectURL(url);
      
      toast.success("PDFs merged successfully!");
    } catch (error) {
      console.error("Merge error:", error);
      toast.error("Failed to merge PDFs. Please ensure all files are valid PDFs.");
    } finally {
      setIsMerging(false);
    }
  }, [pdfFiles]);

  const clearAll = useCallback(() => {
    setPdfFiles([]);
  }, []);

  const canonicalUrl = "https://www.thebulletinbriefs.in/tools/merge-pdf";

  const relatedTools = [
    {
      title: "Split PDF",
      description: "Extract or split pages from PDF files",
      url: "/tools/split-pdf",
      icon: FileText
    },
    {
      title: "Compress PDF",
      description: "Reduce PDF file size while maintaining quality",
      url: "/tools/compress-pdf",
      icon: FileText
    },
    {
      title: "PDF to Excel",
      description: "Convert PDF documents to Excel spreadsheets",
      url: "/tools/pdf-to-excel",
      icon: FileSpreadsheet
    },
    {
      title: "PDF to JPG",
      description: "Convert PDF pages to JPG images",
      url: "/tools/pdf-to-jpg",
      icon: FileImage
    }
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Can I merge more than two PDFs?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes! You can merge as many PDF files as you want. Simply upload all the PDFs you need to combine and they'll be merged in the order you arrange them."
        }
      },
      {
        "@type": "Question",
        "name": "Is there a file size limit?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Since all processing happens in your browser, the limit depends on your device's memory. Most devices can easily handle PDFs up to 50MB each."
        }
      },
      {
        "@type": "Question",
        "name": "Do you store my documents?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No, we never store your files. All PDF merging happens entirely in your browser. Your documents never leave your device."
        }
      }
    ]
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AdvancedSEOHead
        title="Merge PDF Files Online – Combine PDFs Free | TheBulletinBriefs"
        description="Easily merge multiple PDFs into one in seconds. Free, secure, and no signup needed."
        canonical={canonicalUrl}
        image="https://www.thebulletinbriefs.in/og-images/merge-pdf.jpg"
        type="website"
        tags={["merge pdf", "combine pdf", "pdf merger", "pdf tools", "free pdf", "online pdf"]}
        schemas={[faqSchema]}
      />

      <SoftwareApplicationSchema
        name="Merge PDF Tool"
        description="Free online tool to merge multiple PDF files into one document"
        url={canonicalUrl}
        applicationCategory="UtilitiesApplication"
      />

      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.thebulletinbriefs.in" },
          { name: "Tools", url: "https://www.thebulletinbriefs.in/tools" },
          { name: "Merge PDF", url: canonicalUrl }
        ]}
      />

      <Navbar />

      <main className="flex-1 container py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          <ToolBreadcrumb items={[
            { label: "Tools", url: "/tools" },
            { label: "Merge PDF" }
          ]} />

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
              <FileText className="w-8 h-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Free Merge PDF Tool
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Combine multiple PDF files into one organized document. 100% free and privacy-safe.
            </p>
          </div>

          {/* Main Merger Card */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Upload PDF Files</CardTitle>
              <CardDescription>
                Select multiple PDFs to merge into one document
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Drop Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary transition-colors cursor-pointer"
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">
                  Drop PDF files here or click to upload
                </p>
                <p className="text-sm text-muted-foreground">
                  Upload 2 or more PDF files to merge
                </p>
                <input
                  id="file-input"
                  type="file"
                  accept="application/pdf"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files)}
                />
              </div>

              {/* PDF List with Reordering */}
              {pdfFiles.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      {pdfFiles.length} PDF file(s) selected
                    </p>
                    <Button variant="ghost" size="sm" onClick={clearAll}>
                      Clear All
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {pdfFiles.map((pdfFile, index) => (
                      <div
                        key={pdfFile.id}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragEnter={() => handleDragEnter(index)}
                        onDragEnd={handleDragEnd}
                        className={`flex items-center gap-3 p-3 border border-border rounded-lg bg-card hover:bg-accent/50 transition-colors cursor-move ${
                          draggedIndex === index ? 'opacity-50' : ''
                        }`}
                      >
                        <GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {pdfFile.file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(pdfFile.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <span className="text-sm text-muted-foreground flex-shrink-0">
                          #{index + 1}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="flex-shrink-0"
                          onClick={() => removeFile(pdfFile.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    💡 Drag files to reorder them before merging
                  </p>
                </div>
              )}

              {/* Merge Button */}
              {pdfFiles.length >= 2 && (
                <Button
                  onClick={mergePdfs}
                  disabled={isMerging}
                  className="w-full"
                  size="lg"
                >
                  <Download className="mr-2 h-5 w-5" />
                  {isMerging ? "Merging..." : "Merge PDFs & Download"}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Features */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Free</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Completely free with no limitations on file count.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Secure</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  All processing happens in your browser. Files never uploaded.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Fast Merge</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Merge dozens of PDFs in seconds with instant download.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">No Watermark</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Clean merged PDFs without any watermarks or branding.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* How to Use */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>How to Merge PDF Files</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Upload PDF Files</h3>
                  <p className="text-sm text-muted-foreground">
                    Click or drag and drop 2 or more PDF files into the upload area.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Arrange Order</h3>
                  <p className="text-sm text-muted-foreground">
                    Drag files up or down to reorder them. The merged PDF will follow this order.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Merge & Download</h3>
                  <p className="text-sm text-muted-foreground">
                    Click "Merge PDFs & Download" and your combined PDF will be created instantly.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* FAQ */}
          <section>
            <h2 className="text-3xl font-bold mb-6">Frequently Asked Questions</h2>
            <div className="space-y-6">
              <div className="border-b border-border pb-6">
                <h3 className="text-xl font-semibold mb-2">Can I merge more than two PDFs?</h3>
                <p className="text-muted-foreground">
                  Yes! You can merge as many PDF files as you want. Simply upload all the PDFs you need to combine and they'll be merged in the order you arrange them.
                </p>
              </div>
              
              <div className="border-b border-border pb-6">
                <h3 className="text-xl font-semibold mb-2">Is there a file size limit?</h3>
                <p className="text-muted-foreground">
                  Since all processing happens in your browser, the limit depends on your device's memory. Most devices can easily handle PDFs up to 50MB each.
                </p>
              </div>
              
              <div className="border-b border-border pb-6 last:border-0">
                <h3 className="text-xl font-semibold mb-2">Do you store my documents?</h3>
                <p className="text-muted-foreground">
                  No, we never store your files. All PDF merging happens entirely in your browser. Your documents never leave your device.
                </p>
              </div>
            </div>
          </section>

          {/* Related Tools */}
          <RelatedTools tools={relatedTools} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
