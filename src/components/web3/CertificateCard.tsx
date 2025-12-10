import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, Download, Share2, ExternalLink } from "lucide-react";
import { useState } from "react";
import {
  generateCertificatePDF,
  downloadCertificate,
  shareOnLinkedIn,
  type CertificateData,
} from "@/lib/certificate-generator";
import { toast } from "sonner";

interface CertificateCardProps {
  certificate: {
    id: string;
    certificate_number: string;
    verification_code: string;
    issued_at: string;
    certificate_data: CertificateData;
  };
}

export function CertificateCard({ certificate }: CertificateCardProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const blob = await generateCertificatePDF(certificate.certificate_data);
      downloadCertificate(
        blob,
        `certificate-${certificate.certificate_data.learningPathTitle.replace(/\s+/g, "-")}.pdf`
      );
      toast.success("Certificate downloaded successfully!");
    } catch (error) {
      console.error("Failed to download certificate:", error);
      toast.error("Failed to download certificate");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = () => {
    shareOnLinkedIn(certificate.certificate_data);
  };

  const handleVerify = () => {
    window.open(
      `/web3forindia/verify/${certificate.verification_code}`,
      "_blank"
    );
  };

  return (
    <Card className="group overflow-hidden border-2 hover:border-[#6A5BFF] transition-all duration-300 hover:shadow-xl hover:shadow-[#6A5BFF]/10">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Certificate Icon */}
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#6A5BFF] to-[#4AC4FF] flex items-center justify-center flex-shrink-0">
            <Award className="w-8 h-8 text-white" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg mb-2 truncate">
              {certificate.certificate_data.learningPathTitle}
            </h3>
            
            <div className="space-y-1 text-sm text-muted-foreground mb-4">
              <p>
                <span className="font-medium">Issued:</span>{" "}
                {new Date(certificate.issued_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <p>
                <span className="font-medium">Certificate No:</span>{" "}
                <code className="text-xs bg-accent px-2 py-0.5 rounded">
                  {certificate.certificate_number}
                </code>
              </p>
              <p className="flex items-center gap-2">
                <span className="font-medium">Stats:</span>
                <span className="text-xs">
                  {certificate.certificate_data.totalArticles} Articles •{" "}
                  {certificate.certificate_data.totalPoints} Points
                </span>
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={handleDownload}
                disabled={isDownloading}
                className="bg-gradient-to-r from-[#6A5BFF] to-[#4AC4FF] text-white"
              >
                <Download className="w-4 h-4 mr-1" />
                {isDownloading ? "Generating..." : "Download PDF"}
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={handleShare}
                className="border-[#6A5BFF] text-[#6A5BFF] hover:bg-[#6A5BFF] hover:text-white"
              >
                <Share2 className="w-4 h-4 mr-1" />
                Share on LinkedIn
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={handleVerify}
                className="text-muted-foreground hover:text-[#6A5BFF]"
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                Verify
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
