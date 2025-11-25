import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/public/navbar';
import { Footer } from '@/components/public/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

export default function SubscriptionCanceled() {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Subscription Canceled - TheBulletinBriefs</title>
        <meta name="description" content="Your subscription process was canceled. You can try again anytime." />
        <link rel="canonical" href={`${window.location.origin}/subscription/canceled`} />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />
        
        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl">Subscription Canceled</CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">
                Your subscription process was canceled. No charges were made to your account.
              </p>
              
              <p className="text-sm text-muted-foreground">
                You can still enjoy our free articles and try subscribing again anytime.
              </p>
              
              <div className="flex flex-col gap-3 pt-4">
                <Button 
                  onClick={() => navigate('/subscription')}
                  className="w-full"
                  size="lg"
                >
                  Try Again
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="w-full"
                >
                  Browse Free Articles
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>

        <Footer />
      </div>
    </>
  );
}