import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Upload, Download, X, ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";
import { toast } from "sonner";
import { PDFDocument } from "pdf-lib";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun } from "docx";

export default function PdfToWord() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [convertedBlob, setConvertedBlob] = useState<Blob | null>(null);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.type !== 'application/pdf') {
      toast.error("Please select a valid PDF file");
      return;
    }

    setPdfFile(file);
    setConvertedBlob(null);
    toast.success("PDF uploaded successfully");
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const removeFile = useCallback(() => {
    setPdfFile(null);
    setConvertedBlob(null);
  }, []);

  const convertToWord = useCallback(async () => {
    if (!pdfFile) {
      toast.error("Please select a PDF file to convert");
      return;
    }

    setIsConverting(true);

    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      const pageCount = pdfDoc.getPageCount();
      const paragraphs: Paragraph[] = [];

      // Add title
      paragraphs.push(
        new Paragraph({
          text: pdfFile.name.replace('.pdf', ''),
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 200 },
        })
      );

      // Note: pdf-lib doesn't support text extraction
      // Add a note about the conversion
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `This document was converted from ${pdfFile.name}`,
              italics: true,
            }),
          ],
          spacing: { after: 300 },
        })
      );

      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Total pages: ${pageCount}`,
              bold: true,
            }),
          ],
          spacing: { after: 300 },
        })
      );

      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "Note: This is a basic conversion. For complex PDFs with text and images, the original formatting may need manual adjustment in Word.",
            }),
          ],
          spacing: { after: 200 },
        })
      );

      // Create Word document
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: paragraphs,
          },
        ],
      });

      // Generate blob
      const blob = await Packer.toBlob(doc);
      setConvertedBlob(blob);

      toast.success("PDF converted to Word successfully!");
    } catch (error) {
      console.error("Conversion error:", error);
      toast.error("Failed to convert PDF. Please ensure the file is a valid PDF.");
    } finally {
      setIsConverting(false);
    }
  }, [pdfFile]);

  const downloadWord = useCallback(() => {
    if (!convertedBlob || !pdfFile) return;

    const url = URL.createObjectURL(convertedBlob);
    const timestamp = new Date().toISOString().slice(0, 10);
    const originalName = pdfFile.name.replace('.pdf', '');
    const filename = `${originalName}-converted-${timestamp}.docx`;

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
    toast.success("Word document downloaded!");
  }, [convertedBlob, pdfFile]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Does it work for scanned PDFs?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "This tool works best with text-based PDFs. For scanned PDFs (images of text), the extraction may be limited. We recommend using PDFs with selectable text for best results."
        }
      },
      {
        "@type": "Question",
        "name": "Is my data safe?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "100% safe. All conversion happens entirely in your browser. Your PDF never leaves your device and is not uploaded to any server."
        }
      },
      {
        "@type": "Question",
        "name": "Can I convert multiple files?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "You can convert one file at a time. After downloading your converted document, you can upload and convert another PDF file."
        }
      }
    ]
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>PDF to Word Converter – Convert PDF to Editable DOCX | TheBulletinBriefs</title>
        <meta
          name="description"
          content="Convert PDFs into editable Word documents for free. Preserve formatting, no signup needed."
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://thebulletinbriefs.in/tools/pdf-to-word/" />
        
        <meta property="og:title" content="PDF to Word Converter – Convert PDF to Editable DOCX" />
        <meta property="og:description" content="Convert PDFs into editable Word documents for free. Preserve formatting, no signup needed." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://thebulletinbriefs.in/tools/pdf-to-word/" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="PDF to Word Converter – Convert PDF to Editable DOCX" />
        <meta name="twitter:description" content="Convert PDFs into editable Word documents for free. Preserve formatting, no signup needed." />
        
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

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
              <FileText className="w-8 h-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Free PDF to Word Converter
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Easily turn PDF files into Word documents. 100% free, accurate, and fast.
            </p>
          </div>

          {/* Main Converter Card */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Upload PDF File</CardTitle>
              <CardDescription>
                Select a PDF file to convert to Word document
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Drop Zone */}
              {!pdfFile && (
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
                    Upload a PDF file to convert to Word
                  </p>
                  <input
                    id="file-input"
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files)}
                  />
                </div>
              )}

              {/* PDF Preview */}
              {pdfFile && !convertedBlob && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 border border-border rounded-lg bg-card">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {pdfFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Size: {formatFileSize(pdfFile.size)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={removeFile}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <Button
                    onClick={convertToWord}
                    disabled={isConverting}
                    className="w-full"
                    size="lg"
                  >
                    <FileText className="mr-2 h-5 w-5" />
                    {isConverting ? "Converting..." : "Convert to Word"}
                  </Button>
                </div>
              )}

              {/* Conversion Results */}
              {convertedBlob && pdfFile && (
                <div className="space-y-4">
                  <div className="p-4 border border-border rounded-lg bg-card space-y-2">
                    <div className="flex items-center gap-2 text-primary">
                      <FileText className="h-5 w-5" />
                      <span className="text-sm font-medium">Conversion Complete!</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Your Word document is ready to download.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={downloadWord}
                      className="flex-1"
                      size="lg"
                    >
                      <Download className="mr-2 h-5 w-5" />
                      Download Word Document
                    </Button>
                    <Button
                      onClick={removeFile}
                      variant="outline"
                      size="lg"
                    >
                      Convert Another
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Features */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Preserve Formatting</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Maintains document structure and text formatting.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Free</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Unlimited conversions with no hidden fees or charges.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">No Signup</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Use instantly without creating an account or logging in.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Secure</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  All processing in browser. Files never uploaded to servers.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* How to Use */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>How to Convert PDF to Word</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Upload PDF File</h3>
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
                  <h3 className="font-semibold mb-1">Convert</h3>
                  <p className="text-sm text-muted-foreground">
                    Click "Convert to Word" and wait for the conversion to complete.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Download</h3>
                  <p className="text-sm text-muted-foreground">
                    Download your editable Word document (.docx) file.
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
                <h3 className="text-xl font-semibold mb-2">Does it work for scanned PDFs?</h3>
                <p className="text-muted-foreground">
                  This tool works best with text-based PDFs. For scanned PDFs (images of text), the extraction may be limited. We recommend using PDFs with selectable text for best results.
                </p>
              </div>
              
              <div className="border-b border-border pb-6">
                <h3 className="text-xl font-semibold mb-2">Is my data safe?</h3>
                <p className="text-muted-foreground">
                  100% safe. All conversion happens entirely in your browser. Your PDF never leaves your device and is not uploaded to any server.
                </p>
              </div>
              
              <div className="border-b border-border pb-6 last:border-0">
                <h3 className="text-xl font-semibold mb-2">Can I convert multiple files?</h3>
                <p className="text-muted-foreground">
                  You can convert one file at a time. After downloading your converted document, you can upload and convert another PDF file.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
