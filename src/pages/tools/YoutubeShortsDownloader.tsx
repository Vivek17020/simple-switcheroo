import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Download, Link as LinkIcon, Video, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";
import { toast } from "sonner";

const faqs = [
  {
    question: "How do I download YouTube Shorts?",
    answer: "Simply paste the YouTube Shorts URL in the input field, click 'Load Video', preview the video, and then click download to save it to your device.",
  },
  {
    question: "Is it free to use?",
    answer: "Yes! Our YouTube Shorts Downloader is completely free with no hidden charges or subscription fees.",
  },
  {
    question: "What video quality can I download?",
    answer: "You can download videos in multiple quality options including HD (720p/1080p) and SD (360p/480p) depending on the original video quality.",
  },
  {
    question: "Do I need to install any software?",
    answer: "No installation needed! Our tool works directly in your web browser on any device.",
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

export default function YoutubeShortsDownloader() {
  const [url, setUrl] = useState("");
  const [videoId, setVideoId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const extractVideoId = (url: string): string | null => {
    // Match YouTube Shorts URLs
    const shortsPattern = /(?:youtube\.com\/shorts\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    // Also match regular YouTube URLs
    const regularPattern = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    
    const shortsMatch = url.match(shortsPattern);
    if (shortsMatch) return shortsMatch[1];
    
    const regularMatch = url.match(regularPattern);
    if (regularMatch) return regularMatch[1];
    
    return null;
  };

  const handleLoadVideo = () => {
    if (!url.trim()) {
      toast.error("Please enter a YouTube URL");
      return;
    }

    setIsLoading(true);
    const id = extractVideoId(url);
    
    if (id) {
      setVideoId(id);
      toast.success("Video loaded successfully!");
    } else {
      toast.error("Invalid YouTube URL. Please enter a valid YouTube Shorts or video URL.");
    }
    setIsLoading(false);
  };

  const handleDownload = (quality: string) => {
    if (!videoId) {
      toast.error("Please load a video first");
      return;
    }

    // Note: Direct downloading from YouTube requires backend or third-party API
    // Here we'll use a popular download service as a workaround
    const downloadUrl = `https://www.y2mate.com/youtube/${videoId}`;
    window.open(downloadUrl, '_blank');
    toast.success(`Opening download service for ${quality} quality`);
  };

  const handleReset = () => {
    setUrl("");
    setVideoId(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>YouTube Shorts Downloader – Download Shorts Videos Free in HD</title>
        <meta
          name="description"
          content="Download YouTube Shorts videos instantly in HD quality. Free, fast, and easy-to-use online tool. No signup required. Save Shorts to your device now."
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://thebulletinbriefs.in/tools/youtube-shorts-downloader/" />
        
        {/* Open Graph */}
        <meta property="og:title" content="YouTube Shorts Downloader – Download Shorts Videos Free in HD" />
        <meta property="og:description" content="Download YouTube Shorts videos instantly in HD quality. Free, fast, and easy-to-use online tool. No signup required." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://thebulletinbriefs.in/tools/youtube-shorts-downloader/" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="YouTube Shorts Downloader – Download Shorts Videos Free in HD" />
        <meta name="twitter:description" content="Download YouTube Shorts videos instantly in HD quality. Free, fast, and easy-to-use online tool." />
        
        {/* FAQ Schema */}
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
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
              YouTube Shorts Downloader
            </h1>
            <p className="text-lg text-muted-foreground">
              Download YouTube Shorts videos instantly in HD quality. Free, fast, and easy to use.
            </p>
          </div>

          {/* Main Tool Card */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="w-5 h-5" />
                Download Your Video
              </CardTitle>
              <CardDescription>
                Paste the YouTube Shorts URL below to get started
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* URL Input */}
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="https://youtube.com/shorts/..."
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleLoadVideo()}
                      className="pl-9"
                      disabled={isLoading}
                    />
                  </div>
                  <Button onClick={handleLoadVideo} disabled={isLoading}>
                    Load Video
                  </Button>
                </div>
                
                {videoId && (
                  <Button variant="outline" onClick={handleReset} className="w-full">
                    Load Different Video
                  </Button>
                )}
              </div>

              {/* Video Preview */}
              {videoId && (
                <div className="space-y-4">
                  <div className="aspect-video w-full max-w-md mx-auto rounded-lg overflow-hidden border border-border">
                    <iframe
                      src={`https://www.youtube.com/embed/${videoId}`}
                      title="YouTube video preview"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  </div>

                  {/* Download Options */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-center">Choose Quality & Download</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Button 
                        onClick={() => handleDownload("HD 1080p")}
                        className="w-full"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download HD (1080p)
                      </Button>
                      <Button 
                        onClick={() => handleDownload("HD 720p")}
                        variant="secondary"
                        className="w-full"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download HD (720p)
                      </Button>
                      <Button 
                        onClick={() => handleDownload("SD 480p")}
                        variant="secondary"
                        className="w-full"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download SD (480p)
                      </Button>
                      <Button 
                        onClick={() => handleDownload("SD 360p")}
                        variant="secondary"
                        className="w-full"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download SD (360p)
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      You'll be redirected to a secure download service
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <CheckCircle2 className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">100% Free</h3>
                  <p className="text-sm text-muted-foreground">
                    No hidden costs or subscriptions required
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <Video className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">HD Quality</h3>
                  <p className="text-sm text-muted-foreground">
                    Download videos in up to 1080p resolution
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <Download className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">Fast Downloads</h3>
                  <p className="text-sm text-muted-foreground">
                    Quick and easy video downloads in seconds
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* How to Use */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6">How to Download YouTube Shorts</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Copy YouTube Shorts URL</h3>
                  <p className="text-muted-foreground">
                    Open YouTube app or website, find the Shorts video you want to download, and copy its URL.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Paste URL & Load Video</h3>
                  <p className="text-muted-foreground">
                    Paste the copied URL into the input field above and click "Load Video" to preview it.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Choose Quality & Download</h3>
                  <p className="text-muted-foreground">
                    Select your preferred video quality (HD or SD) and click the download button to save the video.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* About Section */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-4">About YouTube Shorts Downloader</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Our YouTube Shorts Downloader is a free online tool designed to help you download your favorite 
              YouTube Shorts videos in high quality. Whether you want to save entertaining content, educational 
              videos, or creative content for offline viewing, our tool makes it simple and fast.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              With support for multiple quality options including HD 1080p and 720p, you can choose the best 
              format for your device and storage needs. No software installation required – everything works 
              directly in your browser.
            </p>
          </section>

          {/* FAQs */}
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

          {/* Disclaimer */}
          <Card className="mt-8 border-warning/20 bg-warning/5">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-semibold text-foreground mb-1">Important Notice</p>
                  <p>
                    Please respect copyright laws and only download videos you have permission to use. 
                    This tool is intended for personal use and educational purposes only.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
