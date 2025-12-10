import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Cookie } from 'lucide-react';
import { Link } from 'react-router-dom';

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      // Delay showing banner for better UX
      const timer = setTimeout(() => setShowBanner(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setShowBanner(false);
  };

  const declineCookies = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background border-t shadow-lg animate-in slide-in-from-bottom duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <Cookie className="h-6 w-6 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">We use cookies</p>
              <p className="text-xs text-muted-foreground">
                We use cookies and similar technologies to enhance your experience, analyze traffic, and serve personalized ads. 
                By clicking "Accept All", you consent to our use of cookies. Read our{' '}
                <Link to="/cookies" className="text-primary hover:underline">Cookie Policy</Link> and{' '}
                <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link> for more information.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={declineCookies}>
              Decline
            </Button>
            <Button size="sm" onClick={acceptCookies}>
              Accept All
            </Button>
          </div>
          
          <button 
            onClick={declineCookies}
            className="absolute top-2 right-2 sm:hidden p-1 hover:bg-muted rounded"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
