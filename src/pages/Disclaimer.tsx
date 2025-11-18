import { Navbar } from '@/components/public/navbar';
import { Footer } from '@/components/public/footer';
import { SEOHead } from '@/utils/seo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, ExternalLink, TrendingUp, Users, Globe, Mail } from 'lucide-react';

export default function Disclaimer() {
  return (
    <>
      <SEOHead 
        title="Disclaimer - TheBulletinBriefs"
        description="Important disclaimers and limitations regarding the content and services provided by TheBulletinBriefs news platform."
        canonicalUrl="https://www.thebulletinbriefs.in/disclaimer"
      />
      
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-4">Disclaimer</h1>
              <p className="text-xl text-muted-foreground">
                Last updated: January 2025
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-primary" />
                  General Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  The information on this website is provided on an "as is" basis. To the fullest extent permitted by law, TheBulletinBriefs excludes all representations, warranties, obligations, and liabilities arising out of or in connection with this website.
                </p>
                <p className="text-muted-foreground">
                  While we strive to provide accurate and up-to-date information, we make no warranties or representations as to the accuracy or completeness of the information provided.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  News Content Accuracy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>TheBulletinBriefs endeavors to provide accurate news reporting, however:</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>News events are often developing stories with changing details</li>
                  <li>We rely on sources that may later prove to be incomplete or inaccurate</li>
                  <li>Breaking news may contain preliminary information subject to correction</li>
                  <li>We update articles when new information becomes available</li>
                  <li>Readers should verify important information from multiple sources</li>
                </ul>
                <p className="text-sm font-medium">
                  We are committed to issuing corrections when errors are identified.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="h-5 w-5 text-primary" />
                  External Links and Third-Party Content
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>Our website may contain links to external websites and third-party content:</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>We do not control or endorse the content of external websites</li>
                  <li>Third-party content reflects the views of the original authors</li>
                  <li>External links are provided for convenience and information purposes</li>
                  <li>We are not responsible for the availability or content of linked sites</li>
                  <li>Users access external links at their own risk</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  User-Generated Content
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>Comments, submissions, and other user-generated content:</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Represent the views and opinions of the individual users</li>
                  <li>Do not necessarily reflect the views of TheBulletinBriefs</li>
                  <li>Are moderated but may not be pre-screened before publication</li>
                  <li>May be removed if they violate our community guidelines</li>
                  <li>Are the responsibility of the user who posted them</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  Investment and Financial Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Any financial or investment information provided on our website is for informational purposes only and should not be considered as:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Professional financial or investment advice</li>
                  <li>A recommendation to buy, sell, or hold any financial instruments</li>
                  <li>A substitute for professional financial consultation</li>
                  <li>Guaranteed accurate or complete market information</li>
                </ul>
                <p className="text-sm font-medium text-amber-600">
                  Always consult with qualified financial professionals before making investment decisions.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Limitation of Liability</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  TheBulletinBriefs shall not be liable for any loss or damage including, without limitation, indirect or consequential loss or damage, or any loss or damage whatsoever arising from:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Loss of data or profits arising out of the use of this website</li>
                  <li>Inability to access the website or interruption of service</li>
                  <li>Actions taken based on information found on this website</li>
                  <li>Viruses or other harmful components that may infect your device</li>
                  <li>Content on external websites linked from our site</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Professional Advice</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  The information on this website is not intended to replace professional advice in areas such as:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Medical or health advice</li>
                  <li>Legal counsel or representation</li>
                  <li>Financial or investment planning</li>
                  <li>Tax preparation or advice</li>
                  <li>Technical or professional services</li>
                </ul>
                <p className="text-sm">
                  Always seek qualified professional advice for specific situations and decisions.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>If you have questions about this disclaimer or need to report an error, please contact us:</p>
                <div className="mt-4 space-y-2">
                  <p><strong>Email:</strong> contact@thebulletinbriefs.in</p>
                  <p><strong>Editorial:</strong> editor@thebulletinbriefs.in</p>
                  <p><strong>Phone:</strong> 918390710252</p>
                  <p><strong>Address:</strong> Maharashtra, India</p>
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