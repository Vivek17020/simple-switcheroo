import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap, Star } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  description: string;
  features: string[];
  popular?: boolean;
  icon: React.ReactNode;
  razorpayPlanId?: string;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'month',
    description: 'Perfect for casual readers',
    features: [
      'Access to all public articles',
      '3 premium articles per week',
      'Basic newsletter',
      'Community access'
    ],
    icon: <Star className="h-5 w-5" />,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 9.99,
    interval: 'month',
    description: 'Best for regular readers',
    features: [
      'Unlimited premium articles',
      'Ad-free reading experience',
      'Premium newsletters',
      'Exclusive content',
      'Early access to news',
      'Mobile app access'
    ],
    popular: true,
    icon: <Crown className="h-5 w-5" />,
    razorpayPlanId: 'plan_premium_monthly',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 99.99,
    interval: 'year',
    description: 'Best value for news enthusiasts',
    features: [
      'Everything in Premium',
      'Exclusive interviews',
      'Advanced analytics dashboard',
      'Priority customer support',
      'Journalist Q&A sessions',
      'Archive access (10+ years)'
    ],
    icon: <Zap className="h-5 w-5" />,
    razorpayPlanId: 'plan_pro_yearly',
  },
];

export const SubscriptionPlans = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubscribe = async (plan: Plan) => {
    if (!user) {
      toast.error('Please sign in to subscribe to a plan');
      return;
    }

    if (plan.id === 'free') {
      toast.error('You are already on the free plan');
      return;
    }

    setLoading(plan.id);

    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay SDK');
      }

      // Create subscription
      const { data, error } = await supabase.functions.invoke('create-razorpay-subscription', {
        body: {
          planId: plan.razorpayPlanId,
          planName: plan.name,
          planPrice: plan.price,
        },
      });

      if (error) throw error;

      if (data?.subscriptionId) {
        // Open Razorpay checkout
        const options = {
          key: 'rzp_test_RGK3vy1r83ba5b', // Razorpay Test Key ID
          subscription_id: data.subscriptionId,
          name: 'TheBulletinBriefs',
          description: `${plan.name} Subscription`,
          image: '/favicon.ico',
          prefill: {
            email: user.email,
            name: user.user_metadata?.full_name || user.email.split('@')[0],
            contact: user.user_metadata?.phone || '',
          },
          theme: {
            color: '#3B82F6',
          },
          modal: {
            ondismiss: () => {
              setLoading(null);
            }
          },
          handler: (response: any) => {
            toast.success('Payment successful! Your subscription is now active.');
            setLoading(null);
            window.location.reload();
          },
          payment_methods: {
            upi: true,
            card: true,
            netbanking: true,
            wallet: true,
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (error: any) {
      console.error('Subscription error:', error);
      toast.error(error.message || 'Failed to start checkout process. Please try again.');
      setLoading(null);
    }
  };

  return (
    <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
      {plans.map((plan) => (
        <Card 
          key={plan.id} 
          className={`relative overflow-hidden ${
            plan.popular 
              ? 'border-primary ring-2 ring-primary/20 scale-105' 
              : 'hover:shadow-lg transition-shadow'
          }`}
        >
          {plan.popular && (
            <div className="absolute top-0 left-0 right-0">
              <div className="bg-primary text-primary-foreground text-xs text-center py-1">
                Most Popular
              </div>
            </div>
          )}
          
          <CardHeader className={`text-center ${plan.popular ? 'pt-8' : 'pt-6'}`}>
            <div className="mx-auto mb-2 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              {plan.icon}
            </div>
            <CardTitle className="text-xl">{plan.name}</CardTitle>
            <div className="text-3xl font-bold">
              ${plan.price}
              <span className="text-lg font-normal text-muted-foreground">
                /{plan.interval}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{plan.description}</p>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {plan.features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
            
            <Button 
              onClick={() => handleSubscribe(plan)}
              disabled={loading === plan.id}
              className="w-full"
              variant={plan.popular ? "default" : "outline"}
              size="lg"
            >
              {loading === plan.id ? 'Processing...' : 
               plan.id === 'free' ? 'Current Plan' : 
               `Subscribe to ${plan.name}`}
            </Button>
            
            {plan.id !== 'free' && (
              <p className="text-xs text-center text-muted-foreground">
                Cancel anytime • No hidden fees
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};