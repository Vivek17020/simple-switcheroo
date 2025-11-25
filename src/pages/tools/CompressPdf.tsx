import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Upload, Download, X, ArrowLeft, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { PDFDocument } from "pdf-lib";

interface CompressionResult {
  originalSize: number;
  compressedSize: number;
  compressionPercentage: number;
  blob: Blob;
}

export default function CompressPdf() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionResult, setCompressionResult] = useState<CompressionResult | null>(null);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.type !== 'application/pdf') {
      toast.error("Please select a valid PDF file");
      return;
    }

    setPdfFile(file);
    setCompressionResult(null);
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
    setCompressionResult(null);
  }, []);

  const compressPdf = useCallback(async () => {
    if (!pdfFile) {
      toast.error("Please select a PDF file to compress");
      return;
    }

    setIsCompressing(true);

    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);

      // Save with compression options
      const compressedPdfBytes = await pdfDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
        objectsPerTick: 50,
      });

      const originalSize = pdfFile.size;
      const compressedSize = compressedPdfBytes.byteLength;
      const compressionPercentage = ((originalSize - compressedSize) / originalSize) * 100;

      const blob = new Blob([compressedPdfBytes as BlobPart], { type: 'application/pdf' });

      setCompressionResult({
        originalSize,
        compressedSize,
        compressionPercentage: Math.max(0, compressionPercentage),
        blob
      });

      toast.success("PDF compressed successfully!");
    } catch (error) {
      console.error("Compression error:", error);
      toast.error("Failed to compress PDF. Please ensure the file is a valid PDF.");
    } finally {
      setIsCompressing(false);
    }
  }, [pdfFile]);

  const downloadCompressed = useCallback(() => {
    if (!compressionResult || !pdfFile) return;

    const url = URL.createObjectURL(compressionResult.blob);
    const timestamp = new Date().toISOString().slice(0, 10);
    const originalName = pdfFile.name.replace('.pdf', '');
    const filename = `${originalName}-compressed-${timestamp}.pdf`;

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
    toast.success("Compressed PDF downloaded!");
  }, [compressionResult, pdfFile]);

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
        "name": "Will compression reduce quality?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Our compression optimizes the PDF structure without degrading image or text quality. The file size is reduced while maintaining document clarity and readability."
        }
      },
      {
        "@type": "Question",
        "name": "Is there a size limit?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Since all processing happens in your browser, the limit depends on your device's memory. Most devices can easily handle PDFs up to 100MB."
        }
      },
      {
        "@type": "Question",
        "name": "How secure is my PDF?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "100% secure. All compression happens entirely in your browser. Your PDF never leaves your device and is not uploaded to any server."
        }
      }
    ]
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Compress PDF Online – Reduce PDF File Size Free | TheBulletinBriefs</title>
        <meta
          name="description"
          content="Reduce PDF file size online for free. Fast compression without losing quality. No signup needed."
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://thebulletinbriefs.in/tools/compress-pdf/" />
        
        <meta property="og:title" content="Compress PDF Online – Reduce PDF File Size Free" />
        <meta property="og:description" content="Reduce PDF file size online for free. Fast compression without losing quality. No signup needed." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://thebulletinbriefs.in/tools/compress-pdf/" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Compress PDF Online – Reduce PDF File Size Free" />
        <meta name="twitter:description" content="Reduce PDF file size online for free. Fast compression without losing quality. No signup needed." />
        
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
              <FileDown className="w-8 h-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Free Compress PDF Tool
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Shrink large PDFs to share faster or upload easily. Free and secure compression in one click.
            </p>
          </div>

          {/* Main Compressor Card */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Upload PDF File</CardTitle>
              <CardDescription>
                Select a PDF file to compress and reduce its size
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
                    Upload a PDF file to compress
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
              {pdfFile && !compressionResult && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 border border-border rounded-lg bg-card">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {pdfFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Original size: {formatFileSize(pdfFile.size)}
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
                    onClick={compressPdf}
                    disabled={isCompressing}
                    className="w-full"
                    size="lg"
                  >
                    <FileDown className="mr-2 h-5 w-5" />
                    {isCompressing ? "Compressing..." : "Compress PDF"}
                  </Button>
                </div>
              )}

              {/* Compression Results */}
              {compressionResult && pdfFile && (
                <div className="space-y-4">
                  <div className="p-4 border border-border rounded-lg bg-card space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Original Size:</span>
                      <span className="text-sm">{formatFileSize(compressionResult.originalSize)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Compressed Size:</span>
                      <span className="text-sm text-primary">{formatFileSize(compressionResult.compressedSize)}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Compression:</span>
                        <span className="text-sm font-bold text-primary">
                          {compressionResult.compressionPercentage.toFixed(1)}% reduced
                        </span>
                      </div>
                      <Progress value={compressionResult.compressionPercentage} className="h-2" />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={downloadCompressed}
                      className="flex-1"
                      size="lg"
                    >
                      <Download className="mr-2 h-5 w-5" />
                      Download Compressed PDF
                    </Button>
                    <Button
                      onClick={removeFile}
                      variant="outline"
                      size="lg"
                    >
                      Compress Another
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
                <CardTitle className="text-lg">Quality Retained</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Compress without losing document quality or clarity.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Free</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Unlimited compressions with no hidden fees or charges.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Safe</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  All processing in browser. Files never uploaded to servers.
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
          </div>

          {/* How to Use */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>How to Compress PDF Files</CardTitle>
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
                  <h3 className="font-semibold mb-1">Compress</h3>
                  <p className="text-sm text-muted-foreground">
                    Click "Compress PDF" and wait a few seconds for the optimization to complete.
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
                    View the compression results and download your reduced-size PDF file.
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
                <h3 className="text-xl font-semibold mb-2">Will compression reduce quality?</h3>
                <p className="text-muted-foreground">
                  Our compression optimizes the PDF structure without degrading image or text quality. The file size is reduced while maintaining document clarity and readability.
                </p>
              </div>
              
              <div className="border-b border-border pb-6">
                <h3 className="text-xl font-semibold mb-2">Is there a size limit?</h3>
                <p className="text-muted-foreground">
                  Since all processing happens in your browser, the limit depends on your device's memory. Most devices can easily handle PDFs up to 100MB.
                </p>
              </div>
              
              <div className="border-b border-border pb-6 last:border-0">
                <h3 className="text-xl font-semibold mb-2">How secure is my PDF?</h3>
                <p className="text-muted-foreground">
                  100% secure. All compression happens entirely in your browser. Your PDF never leaves your device and is not uploaded to any server.
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
