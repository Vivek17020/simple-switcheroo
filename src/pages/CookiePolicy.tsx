import { Navbar } from '@/components/public/navbar';
import { Footer } from '@/components/public/footer';
import { SEOHead } from '@/utils/seo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cookie, Settings, BarChart, Target, Shield } from 'lucide-react';

export default function CookiePolicy() {
  return (
    <>
      <SEOHead 
        title="Cookie Policy - TheBulletinBriefs"
        description="Learn about how TheBulletinBriefs uses cookies to improve your browsing experience and provide personalized content."
      />
      
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-4">Cookie Policy</h1>
              <p className="text-xl text-muted-foreground">
                Last updated: January 2025
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cookie className="h-5 w-5 text-primary" />
                  What Are Cookies?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Cookies are small text files that are placed on your computer or mobile device when you visit our website. They help us provide you with a better experience by remembering your preferences and understanding how you use our site.
                </p>
                <p className="text-muted-foreground">
                  We use cookies to improve functionality, analyze performance, and provide personalized content.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  Essential Cookies
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>These cookies are necessary for the website to function properly:</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li><strong>Authentication cookies:</strong> Keep you logged in to your account</li>
                  <li><strong>Security cookies:</strong> Protect against fraud and ensure secure browsing</li>
                  <li><strong>Preference cookies:</strong> Remember your language and accessibility settings</li>
                  <li><strong>Session cookies:</strong> Maintain your browsing session state</li>
                </ul>
                <p className="text-sm font-medium">These cookies cannot be disabled as they are essential for site functionality.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="h-5 w-5 text-primary" />
                  Analytics Cookies
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>We use analytics cookies to understand how visitors interact with our website:</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Track page views and popular content</li>
                  <li>Monitor site performance and loading times</li>
                  <li>Identify technical issues and improve user experience</li>
                  <li>Generate reports on website usage patterns</li>
                </ul>
                <p className="text-sm">We use Google Analytics and other analytics services that may set their own cookies.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Advertising Cookies
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>These cookies help us provide relevant advertisements:</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Remember your interests and preferences</li>
                  <li>Limit the number of times you see the same ad</li>
                  <li>Measure advertising effectiveness</li>
                  <li>Provide personalized content recommendations</li>
                </ul>
                <p className="text-sm">Third-party advertising networks may also place cookies on your device.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Managing Your Cookie Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>You have several options to control cookies:</p>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Browser Settings</h4>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                      <li>Most browsers allow you to block or delete cookies</li>
                      <li>You can set your browser to notify you when cookies are being set</li>
                      <li>Private/incognito browsing modes limit cookie storage</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Opt-Out Tools</h4>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                      <li>Google Analytics Opt-out Browser Add-on</li>
                      <li>Digital Advertising Alliance opt-out tools</li>
                      <li>Network Advertising Initiative opt-out</li>
                    </ul>
                  </div>
                </div>
                
                <p className="text-sm text-amber-600">
                  <strong>Note:</strong> Disabling certain cookies may affect website functionality and your user experience.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Third-Party Cookies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>Our website may contain content from third-party services that set their own cookies:</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li><strong>Social Media:</strong> Facebook, Twitter, Instagram embedded content</li>
                  <li><strong>Video Players:</strong> YouTube, Vimeo embedded videos</li>
                  <li><strong>Analytics:</strong> Google Analytics, Google Tag Manager</li>
                  <li><strong>Advertising:</strong> Google Ads, other ad networks</li>
                </ul>
                <p className="text-sm">These services have their own privacy policies and cookie practices.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Us</CardTitle>
              </CardHeader>
              <CardContent>
                <p>If you have questions about our cookie policy, please contact us:</p>
                <div className="mt-4 space-y-2">
                  <p><strong>Email:</strong> contact@thebulletinbriefs.in</p>
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