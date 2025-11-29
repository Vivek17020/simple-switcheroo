import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Upload, Download, X, ArrowLeft, FileText, Scissors, FileSpreadsheet, FileImage, Presentation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";
import { toast } from "sonner";
import { PDFDocument } from "pdf-lib";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdvancedSEOHead } from "@/components/seo/advanced-seo-head";
import { SoftwareApplicationSchema } from "@/components/seo/software-application-schema";
import { BreadcrumbSchema } from "@/components/seo/breadcrumb-schema";
import { ToolBreadcrumb } from "@/components/tools/tool-breadcrumb";
import { RelatedTools } from "@/components/tools/related-tools";

interface PageSelection {
  pageNumber: number;
  selected: boolean;
  preview?: string;
}

export default function SplitPdf() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageSelection[]>([]);
  const [isSplitting, setSplitting] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.type !== 'application/pdf') {
      toast.error("Please select a valid PDF file");
      return;
    }

    setPdfFile(file);
    setIsLoadingPreview(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pageCount = pdfDoc.getPageCount();

      // Initialize page selections
      const pageSelections: PageSelection[] = Array.from(
        { length: pageCount },
        (_, i) => ({
          pageNumber: i + 1,
          selected: false,
        })
      );

      setPages(pageSelections);
      toast.success(`PDF loaded: ${pageCount} pages found`);
    } catch (error) {
      console.error("Error loading PDF:", error);
      toast.error("Failed to load PDF. Please try another file.");
      setPdfFile(null);
    } finally {
      setIsLoadingPreview(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const togglePageSelection = useCallback((pageNumber: number) => {
    setPages(prev =>
      prev.map(page =>
        page.pageNumber === pageNumber
          ? { ...page, selected: !page.selected }
          : page
      )
    );
  }, []);

  const selectAll = useCallback(() => {
    setPages(prev => prev.map(page => ({ ...page, selected: true })));
  }, []);

  const deselectAll = useCallback(() => {
    setPages(prev => prev.map(page => ({ ...page, selected: false })));
  }, []);

  const selectRange = useCallback(() => {
    const start = parseInt(rangeStart);
    const end = parseInt(rangeEnd);

    if (isNaN(start) || isNaN(end) || start < 1 || end > pages.length || start > end) {
      toast.error("Invalid page range");
      return;
    }

    setPages(prev =>
      prev.map(page => ({
        ...page,
        selected: page.pageNumber >= start && page.pageNumber <= end,
      }))
    );
    toast.success(`Selected pages ${start} to ${end}`);
  }, [rangeStart, rangeEnd, pages.length]);

  const splitPdf = useCallback(async () => {
    if (!pdfFile) {
      toast.error("Please upload a PDF file");
      return;
    }

    const selectedPages = pages.filter(p => p.selected);
    if (selectedPages.length === 0) {
      toast.error("Please select at least one page to extract");
      return;
    }

    setSplitting(true);

    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const originalPdf = await PDFDocument.load(arrayBuffer);

      // Create new PDF with selected pages
      const newPdf = await PDFDocument.create();
      
      for (const page of selectedPages) {
        const [copiedPage] = await newPdf.copyPages(originalPdf, [page.pageNumber - 1]);
        newPdf.addPage(copiedPage);
      }

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const timestamp = new Date().toISOString().slice(0, 10);
      const pageNumbers = selectedPages.map(p => p.pageNumber).join('-');
      const filename = `split-pdf-pages-${pageNumbers}-${timestamp}.pdf`;
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      
      URL.revokeObjectURL(url);
      
      toast.success(`Extracted ${selectedPages.length} page(s) successfully!`);
    } catch (error) {
      console.error("Split error:", error);
      toast.error("Failed to split PDF. Please try again.");
    } finally {
      setSplitting(false);
    }
  }, [pdfFile, pages]);

  const clearFile = useCallback(() => {
    setPdfFile(null);
    setPages([]);
    setRangeStart("");
    setRangeEnd("");
  }, []);

  const selectedCount = pages.filter(p => p.selected).length;

  const canonicalUrl = "https://www.thebulletinbriefs.in/tools/split-pdf";

  const relatedTools = [
    {
      title: "Merge PDF",
      description: "Combine multiple PDF files into one",
      url: "/tools/merge-pdf",
      icon: FileText
    },
    {
      title: "Compress PDF",
      description: "Reduce PDF file size",
      url: "/tools/compress-pdf",
      icon: FileText
    },
    {
      title: "PDF to Excel",
      description: "Convert PDF to Excel spreadsheet",
      url: "/tools/pdf-to-excel",
      icon: FileSpreadsheet
    },
    {
      title: "PDF to PPT",
      description: "Convert PDF to PowerPoint",
      url: "/tools/pdf-to-ppt",
      icon: Presentation
    }
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Can I extract a specific range of pages?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes! You can select individual pages or use the range selector to extract specific page ranges from your PDF."
        }
      },
      {
        "@type": "Question",
        "name": "Is this tool free to use?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, our PDF splitter is completely free with no limitations on file size or number of splits."
        }
      },
      {
        "@type": "Question",
        "name": "Are my PDFs uploaded to your server?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No, all PDF processing happens locally in your browser. Your files never leave your device."
        }
      }
    ]
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AdvancedSEOHead
        title="Split PDF Files Online – Free PDF Splitter | TheBulletinBriefs"
        description="Extract or split pages from PDF easily. 100% free online PDF splitter, no signup required."
        canonical={canonicalUrl}
        type="website"
        tags={["split pdf", "extract pdf pages", "pdf splitter", "pdf tools", "free pdf"]}
        schemas={[faqSchema]}
      />

      <SoftwareApplicationSchema
        name="Split PDF Tool"
        description="Free online tool to extract and split pages from PDF files"
        url={canonicalUrl}
        applicationCategory="UtilitiesApplication"
      />

      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.thebulletinbriefs.in" },
          { name: "Tools", url: "https://www.thebulletinbriefs.in/tools" },
          { name: "Split PDF", url: canonicalUrl }
        ]}
      />

      <Navbar />

      <main className="flex-1 container py-8 md:py-12">
        <div className="max-w-5xl mx-auto">
          <ToolBreadcrumb items={[
            { label: "Tools", url: "/tools" },
            { label: "Split PDF" }
          ]} />

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
              <Scissors className="w-8 h-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Free Split PDF Tool
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Quickly separate pages or sections from your PDF file. No software needed.
            </p>
          </div>

          {/* Main Splitter Card */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Upload PDF File</CardTitle>
              <CardDescription>
                Upload a PDF and select pages to extract
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!pdfFile ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary transition-colors cursor-pointer"
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">
                    Drop PDF file here or click to upload
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Upload a PDF to split or extract pages
                  </p>
                  <input
                    id="file-input"
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files)}
                  />
                </div>
              ) : (
                <>
                  {/* File Info */}
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-card">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-primary" />
                      <div>
                        <p className="font-medium">{pdfFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {pages.length} pages • {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={clearFile}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Selection Controls */}
                  {pages.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <Button variant="outline" size="sm" onClick={selectAll}>
                          Select All
                        </Button>
                        <Button variant="outline" size="sm" onClick={deselectAll}>
                          Deselect All
                        </Button>
                        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                          <Label htmlFor="range-start" className="text-sm whitespace-nowrap">
                            Pages:
                          </Label>
                          <Input
                            id="range-start"
                            type="number"
                            min="1"
                            max={pages.length}
                            placeholder="From"
                            value={rangeStart}
                            onChange={(e) => setRangeStart(e.target.value)}
                            className="w-20"
                          />
                          <span className="text-muted-foreground">-</span>
                          <Input
                            id="range-end"
                            type="number"
                            min="1"
                            max={pages.length}
                            placeholder="To"
                            value={rangeEnd}
                            onChange={(e) => setRangeEnd(e.target.value)}
                            className="w-20"
                          />
                          <Button variant="secondary" size="sm" onClick={selectRange}>
                            Select Range
                          </Button>
                        </div>
                      </div>

                      {selectedCount > 0 && (
                        <p className="text-sm text-muted-foreground">
                          {selectedCount} page(s) selected for extraction
                        </p>
                      )}
                    </div>
                  )}

                  {/* Page Grid */}
                  {isLoadingPreview ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {pages.map((page) => (
                        <div
                          key={page.pageNumber}
                          onClick={() => togglePageSelection(page.pageNumber)}
                          className={`relative border-2 rounded-lg p-3 cursor-pointer transition-all hover:shadow-md ${
                            page.selected
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="aspect-[3/4] bg-muted rounded flex items-center justify-center mb-2">
                            <FileText className="h-12 w-12 text-muted-foreground" />
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">Page {page.pageNumber}</p>
                            <Checkbox
                              checked={page.selected}
                              onCheckedChange={() => togglePageSelection(page.pageNumber)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Split Button */}
                  {pages.length > 0 && selectedCount > 0 && (
                    <Button
                      onClick={splitPdf}
                      disabled={isSplitting}
                      className="w-full"
                      size="lg"
                    >
                      <Download className="mr-2 h-5 w-5" />
                      {isSplitting ? "Extracting..." : `Extract ${selectedCount} Page(s) & Download`}
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Split by Page</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Select individual pages or ranges to extract exactly what you need.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Privacy-Safe</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  All processing happens locally in your browser. Files never uploaded.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">No Watermark</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Extract clean PDFs without watermarks or advertisements.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* How to Use */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>How to Split PDF Files</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Upload PDF</h3>
                  <p className="text-sm text-muted-foreground">
                    Click or drag and drop your PDF file into the upload area.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Select Pages</h3>
                  <p className="text-sm text-muted-foreground">
                    Click individual pages or use the range selector to choose pages to extract.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Extract & Download</h3>
                  <p className="text-sm text-muted-foreground">
                    Click "Extract Pages & Download" to create a new PDF with your selected pages.
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
                <h3 className="text-xl font-semibold mb-2">Can I extract a specific range of pages?</h3>
                <p className="text-muted-foreground">
                  Yes! You can select individual pages or use the range selector to extract specific page ranges from your PDF.
                </p>
              </div>
              
              <div className="border-b border-border pb-6">
                <h3 className="text-xl font-semibold mb-2">Is this tool free to use?</h3>
                <p className="text-muted-foreground">
                  Yes, our PDF splitter is completely free with no limitations on file size or number of splits.
                </p>
              </div>
              
              <div className="border-b border-border pb-6 last:border-0">
                <h3 className="text-xl font-semibold mb-2">Are my PDFs uploaded to your server?</h3>
                <p className="text-muted-foreground">
                  No, all PDF processing happens locally in your browser. Your files never leave your device.
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
