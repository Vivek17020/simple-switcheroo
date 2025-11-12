import { Navbar } from '@/components/public/navbar';
import { Footer } from '@/components/public/footer';
import { SEOHead } from '@/utils/seo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Users, Target, Award, Globe } from 'lucide-react';

export default function AboutUs() {
  const canonicalUrl = 'https://www.thebulletinbriefs.in/about';
  
  return (
    <>
      <SEOHead 
        title="About Us - TheBulletinBriefs"
        description="Learn about TheBulletinBriefs - your trusted source for breaking news, politics, technology, business, sports, and entertainment news from around the world."
        canonicalUrl={canonicalUrl}
      />
      
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">About TheBulletinBriefs</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Your trusted source for breaking news and in-depth reporting from around the world.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 mb-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Our Mission
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  To deliver accurate, timely, and unbiased news coverage that keeps our readers informed 
                  about the events shaping our world. We believe in the power of journalism to foster 
                  understanding and drive positive change.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  Global Coverage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Our team of experienced journalists and correspondents covers news from every corner 
                  of the globe, bringing you comprehensive reporting on politics, technology, business, 
                  sports, and entertainment.
                </p>
              </CardContent>
            </Card>
          </div>

          <Separator className="my-12" />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Our Team
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground leading-relaxed">
                TheBulletinBriefs is powered by a dedicated team of journalists, editors, and digital 
                media professionals committed to excellence in news reporting. Our diverse team brings 
                together decades of experience in journalism, ensuring that every story meets the 
                highest standards of accuracy and integrity.
              </p>
              
              <div className="grid gap-6 md:grid-cols-3">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Award className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Editorial Excellence</h3>
                  <p className="text-sm text-muted-foreground">
                    Award-winning editors ensuring quality and accuracy in every story.
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Globe className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Global Network</h3>
                  <p className="text-sm text-muted-foreground">
                    Correspondents and sources worldwide for comprehensive coverage.
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Target className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Fact-Checking</h3>
                  <p className="text-sm text-muted-foreground">
                    Rigorous fact-checking process to ensure information accuracy.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator className="my-12" />

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Editorial Office</h4>
                <p className="text-muted-foreground">
                  Email: editorial@thebulletinbriefs.com<br />
                  Phone: +1 (555) 123-4567
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Business Inquiries</h4>
                <p className="text-muted-foreground">
                  Email: business@thebulletinbriefs.com
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Press Releases</h4>
                <p className="text-muted-foreground">
                  Email: press@thebulletinbriefs.com
                </p>
              </div>
            </CardContent>
          </Card>
        </main>

        <Footer />
      </div>
    </>
  );
}