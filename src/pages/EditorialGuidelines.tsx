import { Navbar } from '@/components/public/navbar';
import { Footer } from '@/components/public/footer';
import { SEOHead } from '@/utils/seo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Shield, Scale, Eye, Users } from 'lucide-react';

export default function EditorialGuidelines() {
  return (
    <>
      <SEOHead 
        title="Editorial Guidelines - TheBulletinBriefs"
        description="Learn about TheBulletinBriefs editorial standards, ethics, and guidelines that ensure accurate, fair, and responsible journalism."
        canonicalUrl={`${window.location.origin}/editorial-guidelines`}
      />
      
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Editorial Guidelines</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our commitment to accurate, fair, and responsible journalism.
            </p>
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Editorial Integrity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  At TheBulletinBriefs, we are committed to the highest standards of journalistic integrity. 
                  Our editorial decisions are made independently, free from commercial or political influence.
                </p>
                
                <div className="space-y-3">
                  <h4 className="font-semibold">Core Principles:</h4>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>Accuracy and truthfulness in all reporting</li>
                    <li>Independence from undue influence</li>
                    <li>Fairness and impartiality</li>
                    <li>Accountability for our content</li>
                    <li>Respect for privacy and dignity</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5 text-primary" />
                  Fact-Checking Standards
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  Every story published on TheBulletinBriefs undergoes rigorous fact-checking to ensure accuracy.
                </p>
                
                <div className="space-y-3">
                  <h4 className="font-semibold">Our Process:</h4>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>Multiple source verification for all claims</li>
                    <li>Cross-referencing with reliable sources</li>
                    <li>Expert consultation when needed</li>
                    <li>Clear distinction between fact and opinion</li>
                    <li>Prompt corrections when errors are identified</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  Transparency
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  We believe in transparency with our readers about our reporting process and any potential conflicts of interest.
                </p>
                
                <div className="space-y-3">
                  <h4 className="font-semibold">We Disclose:</h4>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>Sources and methodology when possible</li>
                    <li>Any financial relationships or partnerships</li>
                    <li>Corrections and updates clearly</li>
                    <li>Our editorial decision-making process</li>
                    <li>Limitations in our reporting</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Community Standards
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  We foster a respectful community environment for our readers and contributors.
                </p>
                
                <div className="space-y-3">
                  <h4 className="font-semibold">Comment Policy:</h4>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>Respectful discourse is required</li>
                    <li>No hate speech, harassment, or personal attacks</li>
                    <li>Stay on topic and contribute meaningfully</li>
                    <li>No spam, advertising, or self-promotion</li>
                    <li>Moderation decisions are final</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Separator className="my-8" />

            <Card>
              <CardHeader>
                <CardTitle>Corrections and Complaints</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Corrections</h4>
                  <p className="text-muted-foreground">
                    We take accuracy seriously and will promptly correct any factual errors. 
                    Corrections are clearly marked and explain what was changed.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Complaints</h4>
                  <p className="text-muted-foreground">
                    If you believe we have violated our editorial standards, please contact us at 
                    editorial@thebulletinbriefs.com with details of your concern.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Contact Information</h4>
                  <p className="text-muted-foreground">
                    Editor-in-Chief: editor@thebulletinbriefs.com<br />
                    Editorial Team: editorial@thebulletinbriefs.com
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}