import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Upload, Download, Image as ImageIcon, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { optimizeImage, formatFileSize } from "@/lib/image-optimizer";

const faqs = [
  {
    question: "How much can I compress images?",
    answer: "Compression ratio depends on the original image and quality settings. Typically, you can reduce file size by 50-80% while maintaining good visual quality.",
  },
  {
    question: "Does compression reduce image quality?",
    answer: "Some quality loss is inevitable with compression, but you can control the quality level. Higher quality settings preserve more detail but result in larger files.",
  },
  {
    question: "What image formats are supported?",
    answer: "We support JPG, PNG, and WebP formats. PNG images are automatically converted to WebP for better compression.",
  },
  {
    question: "Is there a file size limit?",
    answer: "While there's no strict limit, very large images (over 10MB) may take longer to process. We recommend compressing one image at a time for best results.",
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

export default function ImageCompressor() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [compressedSize, setCompressedSize] = useState<number>(0);
  const [compressionRatio, setCompressionRatio] = useState<number>(0);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    setSelectedFile(file);
    setOriginalSize(file.size);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setCompressedBlob(null);
    toast.success("Image loaded successfully");
  };

  const compressImage = async () => {
    if (!selectedFile) return;

    setIsCompressing(true);
    try {
      const result = await optimizeImage(selectedFile, (progress) => {
        console.log(`Compression progress: ${progress}%`);
      });

      const blob = new Blob([result.optimizedFile]);
      setCompressedBlob(blob);
      setCompressedSize(result.optimizedSize);
      setCompressionRatio(result.compressionRatio);

      toast.success(`Image compressed by ${result.compressionRatio}%!`);
    } catch (error) {
      console.error("Compression error:", error);
      toast.error("Failed to compress image");
    } finally {
      setIsCompressing(false);
    }
  };

  const downloadCompressed = () => {
    if (!compressedBlob || !selectedFile) return;

    const url = URL.createObjectURL(compressedBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = selectedFile.name.replace(/\.[^/.]+$/, "-compressed$&");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Compressed image downloaded!");
  };

  const resetTool = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    setCompressedBlob(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Image Compressor Online – Reduce File Size Free | TheBulletinBriefs</title>
        <meta
          name="description"
          content="Compress images online for free. Reduce file size while maintaining quality. Supports JPG, PNG, and WebP formats. No signup required."
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://www.thebulletinbriefs.in/tools/image-compressor" />
        
        <meta property="og:title" content="Image Compressor Online – Reduce File Size Free | TheBulletinBriefs" />
        <meta property="og:image" content="https://www.thebulletinbriefs.in/og-images/image-compressor.jpg" />
        <meta property="og:description" content="Compress images online for free. Reduce file size while maintaining quality." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://thebulletinbriefs.in/tools/image-compressor/" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Image Compressor Online – Reduce File Size Free" />
        <meta name="twitter:description" content="Compress images while maintaining quality. Free and secure." />
        
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

          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
              Free Image Compressor
            </h1>
            <p className="text-lg text-muted-foreground">
              Reduce image file size while maintaining quality. Perfect for web optimization and faster loading times.
            </p>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Compress Images</CardTitle>
              <CardDescription>Upload an image and reduce its file size</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!selectedFile ? (
                <div
                  className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Click to upload image</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Supports JPG, PNG, and WebP formats
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border border-border rounded-lg p-4">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-w-full max-h-96 mx-auto rounded"
                    />
                  </div>

                  {compressedBlob && (
                    <div className="bg-muted p-4 rounded-lg space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Original Size:</span>
                        <span className="text-sm">{formatFileSize(originalSize)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Compressed Size:</span>
                        <span className="text-sm">{formatFileSize(compressedSize)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Saved:</span>
                        <span className="text-sm font-semibold text-primary">
                          {compressionRatio}% smaller
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4">
                    {!compressedBlob ? (
                      <Button
                        onClick={compressImage}
                        disabled={isCompressing}
                        className="flex-1"
                      >
                        {isCompressing ? "Compressing..." : "Compress Image"}
                      </Button>
                    ) : (
                      <Button onClick={downloadCompressed} className="flex-1">
                        <Download className="w-4 h-4 mr-2" />
                        Download Compressed Image
                      </Button>
                    )}
                    <Button onClick={resetTool} variant="outline">
                      Upload New Image
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-4">How to Compress Images</h2>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Click the upload area or drag and drop your image</li>
              <li>Click "Compress Image" to start the optimization process</li>
              <li>Review the compression results and file size savings</li>
              <li>Download your compressed image</li>
              <li>Use the optimized image for faster web loading or reduced storage</li>
            </ol>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-6">Frequently Asked Questions</h2>
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div key={index} className="border-b border-border pb-6 last:border-0">
                  <h3 className="text-xl font-semibold mb-2">{faq.question}</h3>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
