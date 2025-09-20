import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Navbar } from '@/components/public/navbar';
import { Footer } from '@/components/public/footer';
import { SubscriptionPlans } from '@/components/monetization/subscription-plans';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { Crown, Shield, Clock, Users, Star, Check } from 'lucide-react';

export default function SubscriptionPage() {
  const { user } = useAuth();
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [rzpReady, setRzpReady] = useState(false);

  useEffect(() => {
    if (user) {
      checkCurrentSubscription();
    }
  }, [user]);

  // Load Razorpay Checkout script on client only
  useEffect(() => {
    const scriptId = 'razorpay-checkout-js';
    if (document.getElementById(scriptId)) {
      setRzpReady(true);
      return;
    }
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setRzpReady(true);
    script.onerror = () => setRzpReady(false);
    document.body.appendChild(script);
  }, []);

  const checkCurrentSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('check-razorpay-subscription');
      
      if (error) {
        console.error('Error checking subscription:', error);
        return;
      }

      if (data.subscribed) {
        setCurrentPlan(data.subscription_tier?.toLowerCase() || 'premium');
        setSubscriptionEnd(data.subscription_end);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const benefits = [
    {
      icon: <Crown className="h-6 w-6 text-yellow-500" />,
      title: "Premium Content Access",
      description: "Read unlimited premium articles and exclusive reports"
    },
    {
      icon: <Shield className="h-6 w-6 text-green-500" />,
      title: "Ad-Free Experience", 
      description: "Enjoy clean, distraction-free reading"
    },
    {
      icon: <Clock className="h-6 w-6 text-blue-500" />,
      title: "Early Access",
      description: "Get breaking news before it goes public"
    },
    {
      icon: <Users className="h-6 w-6 text-purple-500" />,
      title: "Community Access",
      description: "Join exclusive subscriber discussions and Q&As"
    },
  ];

  const startCheckout = async () => {
    try {
      if (!rzpReady) {
        alert('Payment module is still loading. Please try again in a moment.');
        return;
      }

      // Create order via Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
        body: { amount: 50000, currency: 'INR' }
      });

      if (error) {
        console.error('Error creating order:', error);
        alert('Unable to start payment. Please try again.');
        return;
      }

      const order = data?.order;
      if (!order?.id) {
        alert('Order creation failed.');
        return;
      }

      const options: any = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'The Bulletin Briefs',
        description: 'Subscription',
        order_id: order.id,
        prefill: {
          name: user?.user_metadata?.full_name || '',
          email: user?.email || '',
        },
        handler: function (response: any) {
          // TODO: verify payment on server and store details
          window.location.href = '/subscription-success';
        },
        modal: {
          ondismiss: function () {
            console.log('Payment popup closed');
          }
        },
        theme: {
          color: '#0ea5e9'
        }
      };

      // @ts-ignore
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Something went wrong starting the checkout.');
    }
  };

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Business Executive",
      content: "The premium content has been invaluable for staying ahead in my industry.",
      rating: 5
    },
    {
      name: "Mike Chen",
      role: "Journalist",
      content: "Best investment I've made. The early access feature is a game-changer.",
      rating: 5
    },
    {
      name: "Emma Davis",
      role: "Student", 
      content: "Ad-free reading makes studying so much more focused and productive.",
      rating: 5
    }
  ];

  return (
    <>
      <Helmet>
        <title>Premium Subscription Plans - TheBulletinBriefs</title>
        <meta name="description" content="Unlock premium content, ad-free reading, and exclusive features with our subscription plans. Choose the plan that fits your needs." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Hero Section */}
          <section className="text-center mb-16">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Upgrade Your News Experience
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Get unlimited access to premium content, exclusive reports, and an ad-free reading experience
              </p>
              
              {user && (
                <Card className="mb-8">
                  <CardContent className="flex items-center justify-between p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Crown className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">Current Plan: {currentPlan}</p>
                        {subscriptionEnd && (
                          <p className="text-sm text-muted-foreground">
                            Renews on {new Date(subscriptionEnd).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant={currentPlan === 'free' ? 'secondary' : 'default'}>
                      {currentPlan === 'free' ? 'Free User' : 'Premium Subscriber'}
                    </Badge>
                  </CardContent>
                </Card>
              )}
            </div>
          </section>

          {/* Benefits Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12">Why Go Premium?</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, index) => (
                <Card key={index} className="text-center">
                  <CardHeader>
                    <div className="mx-auto mb-4">
                      {benefit.icon}
                    </div>
                    <CardTitle className="text-lg">{benefit.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Subscription Plans */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12">Choose Your Plan</h2>
            <div className="flex flex-col items-center gap-4">
              <SubscriptionPlans />
              <Button size="lg" onClick={startCheckout} disabled={!rzpReady}>
                {rzpReady ? 'Subscribe' : 'Loading payment...'}
              </Button>
            </div>
          </section>

          {/* Testimonials */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12">What Our Subscribers Say</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-4">"{testimonial.content}"</p>
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* FAQ Section */}
          <section>
            <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
            <div className="max-w-3xl mx-auto space-y-6">
              {[
                {
                  question: "Can I cancel my subscription anytime?",
                  answer: "Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your current billing period."
                },
                {
                  question: "What payment methods do you accept?",
                  answer: "We accept major cards and popular UPI/wallets through our secure payment processor Razorpay."
                },
                {
                  question: "Is there a free trial?",
                  answer: "New subscribers get 3 premium articles per week on the free plan to experience our premium content quality."
                },
                {
                  question: "Can I upgrade or downgrade my plan?",
                  answer: "Yes, you can change your plan at any time. Changes take effect at your next billing cycle."
                }
              ].map((faq, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-2">{faq.question}</h3>
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}