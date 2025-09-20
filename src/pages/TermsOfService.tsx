import { Navbar } from '@/components/public/navbar';
import { Footer } from '@/components/public/footer';
import { SEOHead } from '@/utils/seo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Users, AlertTriangle, Scale, Ban, Gavel } from 'lucide-react';

export default function TermsOfService() {
  return (
    <>
      <SEOHead 
        title="Terms of Service - TheBulletinBriefs"
        description="Read TheBulletinBriefs' Terms of Service to understand your rights and responsibilities when using our news platform and services."
      />
      
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
              <p className="text-xl text-muted-foreground">
                Last updated: January 2025
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Acceptance of Terms
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  By accessing and using TheBulletinBriefs website and services, you accept and agree to be bound by the terms and provision of this agreement.
                </p>
                <p className="text-muted-foreground">
                  If you do not agree to abide by the above, please do not use this service.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  User Responsibilities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>As a user of our service, you agree to:</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Provide accurate and truthful information when creating an account</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Use the service only for lawful purposes</li>
                  <li>Respect the intellectual property rights of others</li>
                  <li>Not attempt to disrupt or interfere with our services</li>
                  <li>Comply with all applicable laws and regulations</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-primary" />
                  Content and Copyright
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>All content published on TheBulletinBriefs is protected by copyright and other intellectual property laws:</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>News articles, images, and multimedia content are owned by TheBulletinBriefs or licensed from third parties</li>
                  <li>You may share articles through our sharing tools for personal, non-commercial use</li>
                  <li>Republication or commercial use requires written permission</li>
                  <li>User-generated content (comments, submissions) grants us license to use and display</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ban className="h-5 w-5 text-primary" />
                  Prohibited Activities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>The following activities are strictly prohibited:</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Posting false, misleading, or defamatory content</li>
                  <li>Harassment, hate speech, or discrimination</li>
                  <li>Spam, promotional content, or unauthorized advertising</li>
                  <li>Attempting to hack, breach, or compromise our security</li>
                  <li>Using automated tools to scrape or download content</li>
                  <li>Violating any applicable laws or regulations</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5 text-primary" />
                  Disclaimer of Warranties
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  TheBulletinBriefs provides its services "as is" without any warranties, express or implied. We strive for accuracy but cannot guarantee:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Complete accuracy of all news content</li>
                  <li>Uninterrupted or error-free service</li>
                  <li>Security against all possible threats</li>
                  <li>Compatibility with all devices or browsers</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gavel className="h-5 w-5 text-primary" />
                  Limitation of Liability
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  TheBulletinBriefs shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of our services.
                </p>
                <p className="text-muted-foreground">
                  Our total liability for any claims shall not exceed the amount paid by you for our services in the preceding 12 months.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Changes to Terms</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  We reserve the right to modify these terms at any time. Changes will be posted on this page with an updated revision date. Continued use of our services constitutes acceptance of the modified terms.
                </p>
                <div className="mt-4 space-y-2">
                  <p><strong>Contact Us:</strong></p>
                  <p>Email: contact@thebulletinbriefs.in</p>
                  <p>Phone: 918390710252</p>
                  <p>Address: Maharashtra, India</p>
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