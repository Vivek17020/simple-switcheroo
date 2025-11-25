import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Upload, Download, X, ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";
import { toast } from "sonner";
import { jsPDF } from "jspdf";

export default function JpgToPdf() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isConverting, setIsConverting] = useState(false);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    const imageFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/')
    );

    if (imageFiles.length === 0) {
      toast.error("Please select valid image files");
      return;
    }

    setSelectedFiles(prev => [...prev, ...imageFiles]);

    // Generate previews
    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });

    toast.success(`${imageFiles.length} image(s) added`);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const removeFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  }, []);

  const convertToPdf = useCallback(async () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select at least one image");
      return;
    }

    setIsConverting(true);

    try {
      const pdf = new jsPDF();
      let isFirstPage = true;

      for (let i = 0; i < previews.length; i++) {
        const imgData = previews[i];
        
        // Create an image element to get dimensions
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = imgData;
        });

        // Calculate dimensions to fit the page
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = img.width;
        const imgHeight = img.height;
        
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        const width = imgWidth * ratio;
        const height = imgHeight * ratio;
        
        // Center the image
        const x = (pdfWidth - width) / 2;
        const y = (pdfHeight - height) / 2;

        if (!isFirstPage) {
          pdf.addPage();
        }
        
        pdf.addImage(imgData, 'JPEG', x, y, width, height);
        isFirstPage = false;
      }

      // Generate filename
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `converted-images-${timestamp}.pdf`;

      // Save the PDF
      pdf.save(filename);
      
      toast.success("PDF created successfully!");
    } catch (error) {
      console.error("Conversion error:", error);
      toast.error("Failed to convert images to PDF");
    } finally {
      setIsConverting(false);
    }
  }, [selectedFiles, previews]);

  const clearAll = useCallback(() => {
    setSelectedFiles([]);
    setPreviews([]);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Free JPG to PDF Converter Online – Fast & Secure | TheBulletinBriefs</title>
        <meta
          name="description"
          content="Convert JPG, PNG, and other images to PDF instantly. Free online JPG to PDF converter with no file size limits. Fast, secure, and works in your browser."
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://thebulletinbriefs.in/tools/jpg-to-pdf/" />
        
        <meta property="og:title" content="Free JPG to PDF Converter Online – Fast & Secure" />
        <meta property="og:description" content="Convert JPG, PNG, and other images to PDF instantly. Free, fast, and secure." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://thebulletinbriefs.in/tools/jpg-to-pdf/" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Free JPG to PDF Converter Online" />
        <meta name="twitter:description" content="Convert JPG, PNG, and other images to PDF instantly. Free, fast, and secure." />
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
              JPG to PDF Converter
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Convert your JPG, PNG, and other images to PDF format instantly. Free, fast, 
              and secure – all processing happens in your browser.
            </p>
          </div>

          {/* Main Converter Card */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Upload Images</CardTitle>
              <CardDescription>
                Select one or multiple images to convert to PDF
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
                  Drop images here or click to upload
                </p>
                <p className="text-sm text-muted-foreground">
                  Supports JPG, PNG, and other image formats
                </p>
                <input
                  id="file-input"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files)}
                />
              </div>

              {/* Preview Grid */}
              {previews.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      {selectedFiles.length} image(s) selected
                    </p>
                    <Button variant="ghost" size="sm" onClick={clearAll}>
                      Clear All
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {previews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-border"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {selectedFiles[index].name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Convert Button */}
              {selectedFiles.length > 0 && (
                <Button
                  onClick={convertToPdf}
                  disabled={isConverting}
                  className="w-full"
                  size="lg"
                >
                  <Download className="mr-2 h-5 w-5" />
                  {isConverting ? "Converting..." : "Convert to PDF & Download"}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">100% Free</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  No hidden costs, no subscriptions. Convert unlimited images to PDF for free.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Private & Secure</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  All conversions happen in your browser. Your files never leave your device.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">No Signup Required</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Start converting immediately. No account creation or email required.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* How to Use */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>How to Convert JPG to PDF</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Upload Images</h3>
                  <p className="text-sm text-muted-foreground">
                    Click or drag and drop your JPG, PNG, or other image files into the upload area.
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
                    Preview your images and remove any you don't want. They'll appear in the PDF in the order shown.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Convert & Download</h3>
                  <p className="text-sm text-muted-foreground">
                    Click "Convert to PDF & Download" and your PDF will be created and downloaded instantly.
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
                <h3 className="text-xl font-semibold mb-2">Is this JPG to PDF converter really free?</h3>
                <p className="text-muted-foreground">
                  Yes, completely free with no limitations on file size or number of conversions.
                </p>
              </div>
              
              <div className="border-b border-border pb-6">
                <h3 className="text-xl font-semibold mb-2">Are my files safe?</h3>
                <p className="text-muted-foreground">
                  Absolutely. All processing happens directly in your browser. Your files are never uploaded to any server.
                </p>
              </div>
              
              <div className="border-b border-border pb-6">
                <h3 className="text-xl font-semibold mb-2">What image formats are supported?</h3>
                <p className="text-muted-foreground">
                  We support all common image formats including JPG, JPEG, PNG, GIF, BMP, and WebP.
                </p>
              </div>
              
              <div className="border-b border-border pb-6 last:border-0">
                <h3 className="text-xl font-semibold mb-2">Can I convert multiple images at once?</h3>
                <p className="text-muted-foreground">
                  Yes! Upload multiple images and they'll all be combined into a single PDF file.
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
