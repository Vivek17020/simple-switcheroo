import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, XCircle, Award } from "lucide-react";
import { Helmet } from "react-helmet-async";

export default function Web3CertificateVerify() {
  const { code } = useParams<{ code: string }>();

  const { data: certificate, isLoading } = useQuery({
    queryKey: ["certificate-verify", code],
    queryFn: async () => {
      if (!code) throw new Error("No verification code provided");

      const { data, error } = await supabase
        .from("web3_certificates")
        .select(
          `
          *,
          learning_path:web3_learning_paths(title, description)
        `
        )
        .eq("verification_code", code)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!code,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Certificate Verification - Web3 for India</title>
        <meta
          name="description"
          content="Verify the authenticity of Web3 for India learning certificates"
        />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-[#6A5BFF]/10 via-white to-[#4AC4FF]/10 py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Award className="w-8 h-8 text-[#6A5BFF]" />
                Certificate Verification
              </CardTitle>
            </CardHeader>
            <CardContent>
              {certificate ? (
                <div className="space-y-6">
                  {/* Verification Status */}
                  <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-green-900">
                        Certificate Verified ✓
                      </p>
                      <p className="text-sm text-green-700">
                        This certificate is authentic and was issued by Web3 for India
                      </p>
                    </div>
                  </div>

                  {/* Certificate Details */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Recipient Name
                        </p>
                        <p className="font-semibold">
                          {(certificate.certificate_data as any)?.userName || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Certificate Number
                        </p>
                        <p className="font-mono text-sm bg-accent px-2 py-1 rounded inline-block">
                          {certificate.certificate_number}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Learning Path
                      </p>
                      <p className="font-semibold text-lg text-[#6A5BFF]">
                        {(certificate.certificate_data as any)?.learningPathTitle || "N/A"}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Issued On
                        </p>
                        <p className="font-semibold">
                          {new Date(certificate.issued_at).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Articles Completed
                        </p>
                        <p className="font-semibold">
                          {(certificate.certificate_data as any)?.totalArticles || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Points Earned
                        </p>
                        <p className="font-semibold">
                          {(certificate.certificate_data as any)?.totalPoints || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Verification Code */}
                  <div className="pt-6 border-t">
                    <p className="text-xs text-muted-foreground mb-2">
                      Verification Code
                    </p>
                    <p className="font-mono text-xs bg-accent px-3 py-2 rounded break-all">
                      {code}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="pt-6 border-t">
                    <p className="text-sm text-muted-foreground text-center">
                      This certificate can be verified at any time using the verification
                      code above.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-red-900">
                        Certificate Not Found
                      </p>
                      <p className="text-sm text-red-700">
                        The verification code provided is invalid or the certificate
                        does not exist.
                      </p>
                    </div>
                  </div>

                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      Please check the verification code and try again.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
