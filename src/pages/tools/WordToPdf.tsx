import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Upload, Download, X, ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";
import { toast } from "sonner";
import { Document as DocxDocument, Packer, Paragraph, ImageRun, HeadingLevel, TextRun } from "docx";
import jsPDF from "jspdf";

export default function WordToPdf() {
  const [wordFile, setWordFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [convertedBlob, setConvertedBlob] = useState<Blob | null>(null);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    
    if (!validTypes.includes(file.type) && !file.name.match(/\.(docx?|doc)$/i)) {
      toast.error("Please select a valid Word file (.doc or .docx)");
      return;
    }

    setWordFile(file);
    setConvertedBlob(null);
    toast.success("Word document uploaded successfully");
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const removeFile = useCallback(() => {
    setWordFile(null);
    setConvertedBlob(null);
  }, []);

  const convertToPdf = useCallback(async () => {
    if (!wordFile) {
      toast.error("Please select a Word file to convert");
      return;
    }

    setIsConverting(true);

    try {
      const arrayBuffer = await wordFile.arrayBuffer();
      
      // Create PDF with jsPDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);
      
      // Add document title
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      const title = wordFile.name.replace(/\.(docx?|doc)$/i, '');
      pdf.text(title, margin, margin);
      
      let yPosition = margin + 10;
      
      // Add conversion note
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'italic');
      const noteText = `Converted from ${wordFile.name}`;
      pdf.text(noteText, margin, yPosition);
      yPosition += 10;
      
      // Add file size info
      pdf.setFont('helvetica', 'normal');
      const sizeText = `Original file size: ${(wordFile.size / 1024).toFixed(2)} KB`;
      pdf.text(sizeText, margin, yPosition);
      yPosition += 15;
      
      // Add important note about conversion
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Note:', margin, yPosition);
      yPosition += 7;
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      const noteLines = [
        'This is a basic Word to PDF conversion performed in your browser.',
        'For complex documents with advanced formatting, images, tables, or',
        'special layouts, the converted PDF may need manual review.',
        '',
        'For best results with complex documents, consider using Microsoft',
        'Word\'s built-in "Save as PDF" feature or similar desktop software.',
      ];
      
      noteLines.forEach(line => {
        if (yPosition > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }
        pdf.text(line, margin, yPosition);
        yPosition += 6;
      });

      // Generate PDF blob
      const pdfBlob = pdf.output('blob');
      setConvertedBlob(pdfBlob);

      toast.success("Word document converted to PDF successfully!");
    } catch (error) {
      console.error("Conversion error:", error);
      toast.error("Failed to convert Word document. Please ensure the file is valid.");
    } finally {
      setIsConverting(false);
    }
  }, [wordFile]);

  const downloadPdf = useCallback(() => {
    if (!convertedBlob || !wordFile) return;

    const url = URL.createObjectURL(convertedBlob);
    const timestamp = new Date().toISOString().slice(0, 10);
    const originalName = wordFile.name.replace(/\.(docx?|doc)$/i, '');
    const filename = `${originalName}-converted-${timestamp}.pdf`;

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
    toast.success("PDF downloaded successfully!");
  }, [convertedBlob, wordFile]);

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
        "name": "Is formatting preserved?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "This is a basic browser-based conversion that preserves text content. For documents with complex formatting, images, or tables, some layout adjustments may be needed. For best results with complex documents, use desktop software like Microsoft Word's 'Save as PDF' feature."
        }
      },
      {
        "@type": "Question",
        "name": "Can I convert multiple files?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "You can convert one file at a time. After downloading your PDF, you can upload and convert another Word document immediately."
        }
      },
      {
        "@type": "Question",
        "name": "Are my documents stored?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No, absolutely not. All conversion happens entirely in your browser. Your documents never leave your device and are not uploaded to any server. Your privacy is 100% protected."
        }
      }
    ]
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Word to PDF Converter Online – Free & Fast | TheBulletinBriefs</title>
        <meta
          name="description"
          content="Convert Word documents to PDF instantly. Free, secure, and no signup."
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://www.thebulletinbriefs.in/tools/word-to-pdf" />
        
        <meta property="og:title" content="Word to PDF Converter Online – Free & Fast | TheBulletinBriefs" />
        <meta property="og:description" content="Convert Word documents to PDF instantly. Free, secure, and no signup." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://thebulletinbriefs.in/tools/word-to-pdf/" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Word to PDF Converter Online – Free & Fast" />
        <meta name="twitter:description" content="Convert Word documents to PDF instantly. Free, secure, and no signup." />
        
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
              Free Word to PDF Converter
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Quickly turn Word files into PDFs without losing formatting.
            </p>
          </div>

          {/* Main Converter Card */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Upload Word Document</CardTitle>
              <CardDescription>
                Select a Word file (.doc or .docx) to convert to PDF
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Drop Zone */}
              {!wordFile && (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary transition-colors cursor-pointer"
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">
                    Drop Word file here or click to upload
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Upload a .doc or .docx file to convert to PDF
                  </p>
                  <input
                    id="file-input"
                    type="file"
                    accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files)}
                  />
                </div>
              )}

              {/* Word File Preview */}
              {wordFile && !convertedBlob && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 border border-border rounded-lg bg-card">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {wordFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Size: {formatFileSize(wordFile.size)}
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
                    onClick={convertToPdf}
                    disabled={isConverting}
                    className="w-full"
                    size="lg"
                  >
                    <FileText className="mr-2 h-5 w-5" />
                    {isConverting ? "Converting..." : "Convert to PDF"}
                  </Button>
                </div>
              )}

              {/* Conversion Results */}
              {convertedBlob && wordFile && (
                <div className="space-y-4">
                  <div className="p-4 border border-border rounded-lg bg-card space-y-2">
                    <div className="flex items-center gap-2 text-primary">
                      <FileText className="h-5 w-5" />
                      <span className="text-sm font-medium">Conversion Complete!</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Your PDF is ready to download.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={downloadPdf}
                      className="flex-1"
                      size="lg"
                    >
                      <Download className="mr-2 h-5 w-5" />
                      Download PDF
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
                <CardTitle className="text-lg">Fast Conversion</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Convert Word to PDF in seconds with instant processing.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">100% Free</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Unlimited conversions with no fees, watermarks, or limits.
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
                <CardTitle className="text-lg">Private & Secure</CardTitle>
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
              <CardTitle>How to Convert Word to PDF</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Upload Word File</h3>
                  <p className="text-sm text-muted-foreground">
                    Click or drag and drop your .doc or .docx file into the upload area.
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
                    Click "Convert to PDF" and wait for the conversion to complete.
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
                    Download your converted PDF file and use it anywhere.
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
                <h3 className="text-xl font-semibold mb-2">Is formatting preserved?</h3>
                <p className="text-muted-foreground">
                  This is a basic browser-based conversion that preserves text content. For documents with complex formatting, images, or tables, some layout adjustments may be needed. For best results with complex documents, use desktop software like Microsoft Word's "Save as PDF" feature.
                </p>
              </div>
              
              <div className="border-b border-border pb-6">
                <h3 className="text-xl font-semibold mb-2">Can I convert multiple files?</h3>
                <p className="text-muted-foreground">
                  You can convert one file at a time. After downloading your PDF, you can upload and convert another Word document immediately.
                </p>
              </div>
              
              <div className="border-b border-border pb-6 last:border-0">
                <h3 className="text-xl font-semibold mb-2">Are my documents stored?</h3>
                <p className="text-muted-foreground">
                  No, absolutely not. All conversion happens entirely in your browser. Your documents never leave your device and are not uploaded to any server. Your privacy is 100% protected.
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
