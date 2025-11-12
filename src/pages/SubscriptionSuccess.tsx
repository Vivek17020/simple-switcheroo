import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/public/navbar';
import { Footer } from '@/components/public/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Crown } from 'lucide-react';
import { useSubscription } from '@/hooks/use-subscription';

export default function SubscriptionSuccess() {
  const navigate = useNavigate();
  const { checkSubscription } = useSubscription();

  useEffect(() => {
    // Check subscription status after successful payment
    const timer = setTimeout(() => {
      checkSubscription();
    }, 2000);

    return () => clearTimeout(timer);
  }, [checkSubscription]);

  return (
    <>
      <Helmet>
        <title>Subscription Successful - TheBulletinBriefs</title>
        <meta name="description" content="Welcome to premium! Your subscription has been activated successfully." />
        <link rel="canonical" href={`${window.location.origin}/subscription/success`} />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />
        
        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Welcome to Premium!</CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="flex items-center gap-2 justify-center text-muted-foreground">
                <Crown className="h-5 w-5 text-yellow-500" />
                <span>Your subscription has been activated successfully</span>
              </div>
              
              <div className="text-left space-y-3">
                <h3 className="font-semibold">You now have access to:</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>✓ Unlimited premium articles</li>
                  <li>✓ Ad-free reading experience</li>
                  <li>✓ Exclusive interviews & reports</li>
                  <li>✓ Early access to breaking news</li>
                  <li>✓ Premium newsletters</li>
                </ul>
              </div>
              
              <div className="flex flex-col gap-3 pt-4">
                <Button 
                  onClick={() => navigate('/')}
                  className="w-full"
                  size="lg"
                >
                  Start Reading Premium Content
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate('/subscription')}
                  className="w-full"
                >
                  Manage Subscription
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