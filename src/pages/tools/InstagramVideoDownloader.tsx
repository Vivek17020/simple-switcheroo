import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, Link as LinkIcon, Loader2, Instagram } from "lucide-react";
import { toast } from "sonner";
import { AdvancedSEOHead } from "@/components/seo/advanced-seo-head";
import { SoftwareApplicationSchema } from "@/components/seo/software-application-schema";
import { BreadcrumbSchema } from "@/components/seo/breadcrumb-schema";
import { ToolBreadcrumb } from "@/components/tools/tool-breadcrumb";
import { RelatedTools } from "@/components/tools/related-tools";
import { Video, Youtube } from "lucide-react";

export default function InstagramVideoDownloader() {
  const [url, setUrl] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);

  const canonicalUrl = `${window.location.origin}/tools/instagram-video-downloader`;

  const handleDownload = async () => {
    if (!url) {
      toast.error("Please enter an Instagram video URL");
      return;
    }

    if (!url.includes("instagram.com")) {
      toast.error("Please enter a valid Instagram URL");
      return;
    }

    setIsDownloading(true);
    try {
      const response = await fetch('https://tadcyglvsjycpgsjkywj.supabase.co/functions/v1/download-instagram-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (data.success && data.videoUrl) {
        // Download the video
        const videoResponse = await fetch(data.videoUrl);
        const blob = await videoResponse.blob();
        const downloadUrl = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `instagram-video-${Date.now()}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);
        
        toast.success("Video downloaded successfully!");
      } else {
        // Show configuration info
        toast.error("Instagram API not configured");
        toast.info("This tool requires Instagram API credentials. See FAQ for setup instructions.");
        console.log("Setup required:", data);
      }
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download video. Please ensure the URL is correct and the video is public.");
    } finally {
      setIsDownloading(false);
    }
  };

  const relatedTools = [
    {
      title: "YouTube Shorts Downloader",
      description: "Download YouTube Shorts videos",
      url: "/tools/youtube-shorts-downloader",
      icon: Youtube
    },
    {
      title: "Video Tools",
      description: "Explore all video conversion tools",
      url: "/tools/video-tools",
      icon: Video
    }
  ];

  return (
    <>
      <AdvancedSEOHead
        title="Instagram Video Downloader – Free & Fast | TheBulletinBriefs"
        description="Download Instagram videos, reels, and IGTV content online. Free, fast, and easy to use. No signup required."
        canonical={canonicalUrl}
        tags={["instagram video downloader", "download instagram reels", "instagram downloader", "save instagram videos", "ig video download"]}
        image={`${window.location.origin}/og-image.jpg`}
      />
      <SoftwareApplicationSchema
        name="Instagram Video Downloader"
        description="Download Instagram videos and reels online for free"
        url={canonicalUrl}
        applicationCategory="MultimediaApplication"
      />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: window.location.origin },
          { name: "Tools", url: `${window.location.origin}/tools` },
          { name: "Video Tools", url: `${window.location.origin}/tools/video-tools` },
          { name: "Instagram Video Downloader", url: canonicalUrl }
        ]}
      />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <ToolBreadcrumb
          items={[
            { label: "Tools", url: "/tools" },
            { label: "Video Tools", url: "/tools/video-tools" },
            { label: "Instagram Video Downloader" }
          ]}
        />

        <h1 className="text-4xl font-bold mb-4">Free Instagram Video Downloader</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Download Instagram videos, reels, and IGTV content easily. Save your favorite Instagram content to watch offline anytime.
        </p>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Instagram className="h-5 w-5" />
              Download Instagram Video
            </CardTitle>
            <CardDescription>
              Paste the Instagram video or reel URL below
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="url"
                  placeholder="https://www.instagram.com/reel/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Button
              onClick={handleDownload}
              disabled={!url || isDownloading}
              className="w-full"
              size="lg"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="h-5 w-5 mr-2" />
                  Download Video
                </>
              )}
            </Button>

            <Alert>
              <LinkIcon className="h-4 w-4" />
              <AlertDescription>
                <strong>How to use:</strong> Copy the Instagram video or reel link, paste it above, and click Download.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <Card className="mb-8 border-yellow-500">
          <CardHeader>
            <CardTitle className="text-yellow-600">Backend Service Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Full Instagram video downloading functionality requires a backend service with proper API integration. 
              This tool currently shows the interface. Contact our team to enable the download feature with Instagram API compliance.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Can I download private Instagram videos?</h3>
              <p className="text-muted-foreground">
                No, you can only download publicly available Instagram content. Private account videos cannot be downloaded.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Why isn't the download working?</h3>
              <p className="text-muted-foreground">
                Instagram video download requires API credentials from Meta Developers. To enable this feature: 1) Register an Instagram app at Meta for Developers, 2) Get API access tokens, 3) Add credentials to project secrets. Alternatively, use third-party Instagram download services or apps.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Is it legal to download Instagram videos?</h3>
              <p className="text-muted-foreground">
                You should only download content that you have permission to use. Respect copyright laws and Instagram's terms of service.
              </p>
            </div>
          </CardContent>
        </Card>

        <RelatedTools tools={relatedTools} />
      </div>
    </>
  );
}
