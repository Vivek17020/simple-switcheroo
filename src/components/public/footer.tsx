import { Link } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';
import { NewsletterSignup } from './newsletter-signup';
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react';

const socialLinks = [
  { name: 'Facebook', icon: Facebook, href: 'https://www.facebook.com/profile.php?id=61580246143943' },
  { name: 'Twitter', icon: Twitter, href: 'https://x.com/Bulletinb176163' },
  { name: 'Instagram', icon: Instagram, href: 'https://www.instagram.com/thebulletinbriefs/' },
  { name: 'YouTube', icon: Youtube, href: 'https://www.youtube.com/@thebulletinbriefs' },
];

const footerLinks = {
  company: [
    { name: 'About Us', href: '/about' },
    { name: 'Contact', href: '/contact' },
    { name: 'Editorial Guidelines', href: '/editorial-guidelines' },
    { name: 'RSS Feed', href: '/rss' },
  ],
  legal: [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Cookie Policy', href: '/cookies' },
    { name: 'Disclaimer', href: '/disclaimer' },
  ],
  sections: [
    { name: 'Latest News', href: '/' },
    { name: 'Politics News', href: '/category/politics' },
    { name: 'Technology Updates', href: '/category/tech' },
    { name: 'Business & Finance', href: '/category/business' },
    { name: 'Sports Coverage', href: '/category/sports' },
    { name: 'World News', href: '/category/world' },
  ],
  explore: [
    { name: 'Trending Web Stories', href: '/web-stories' },
    { name: 'Learn Web3 & Blockchain', href: '/web3forindia' },
    { name: 'Web3 Tutorials for Beginners', href: '/web3forindia/blockchain-basics' },
    { name: 'Free Online Tools', href: '/tools' },
    { name: 'Government Jobs', href: '/jobs/government-jobs' },
    { name: 'Private Sector Jobs', href: '/jobs/private-jobs' },
  ],
};

export function Footer() {
  return (
    <footer className="bg-card border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Newsletter Section */}
        <div className="py-12">
          <div className="max-w-md mx-auto">
            <NewsletterSignup />
          </div>
        </div>

        <Separator />

        {/* Main Footer Content */}
        <div className="py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <img 
                src="/logo.png" 
                alt="TheBulletinBriefs Logo" 
                className="w-8 h-8 rounded-full object-cover"
              />
              <span className="font-bold text-xl">TheBulletinBriefs</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Your trusted source for breaking news, in-depth analysis, and comprehensive coverage of events that matter.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>vivek@thebulletinbriefs.in</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>918390710252</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>Maharashtra, India</span>
              </div>
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link 
                    to={link.href} 
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Sections */}
          <div>
            <h3 className="font-semibold mb-4">Sections</h3>
            <ul className="space-y-3">
              {footerLinks.sections.map((link) => (
                <li key={link.name}>
                  <Link 
                    to={link.href} 
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Explore Links */}
          <div>
            <h3 className="font-semibold mb-4">Explore</h3>
            <ul className="space-y-3">
              {footerLinks.explore.map((link) => (
                <li key={link.name}>
                  <Link 
                    to={link.href} 
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator />

        {/* Legal Links Row */}
        <div className="py-6 flex flex-wrap justify-center gap-6">
          {footerLinks.legal.map((link) => (
            <Link 
              key={link.name}
              to={link.href} 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.name}
            </Link>
          ))}
        </div>

        <Separator />

        {/* Bottom Section */}
        <div className="py-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} TheBulletinBriefs. All rights reserved.
          </p>
          
          {/* Social Links */}
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-muted rounded-full flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                  aria-label={social.name}
                >
                  <Icon className="h-4 w-4" />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}