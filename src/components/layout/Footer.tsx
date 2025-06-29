import React from 'react';
import { Link } from 'react-router-dom';
import { Crown, Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const handleSocialClick = (platform: string) => {
    // In a real app, these would be actual social media URLs
    const socialUrls = {
      facebook: 'https://facebook.com/luxeshowcase',
      twitter: 'https://twitter.com/luxeshowcase',
      instagram: 'https://instagram.com/luxeshowcase',
      linkedin: 'https://linkedin.com/company/luxeshowcase'
    };
    
    // For demo purposes, show an alert. In production, these would be real URLs
    alert(`This would redirect to: ${socialUrls[platform as keyof typeof socialUrls]}`);
  };

  const handleSupportClick = (section: string) => {
    // In a real app, these would link to actual support pages
    const supportSections = {
      help: '/help-center',
      privacy: '/privacy-policy',
      terms: '/terms-of-service',
      returns: '/returns-policy'
    };
    
    alert(`This would redirect to: ${supportSections[section as keyof typeof supportSections]}`);
  };

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="p-2 bg-gradient-to-r from-primary-600 to-luxury-600 rounded-lg">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary-400 to-luxury-400 bg-clip-text text-transparent">
                LuxeShowcase
              </span>
            </div>
            <p className="text-gray-400 mb-6 max-w-md">
              Discover premium products crafted with excellence. Your destination for luxury and quality.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-2 mb-6">
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <Mail className="h-4 w-4" />
                <span>hello@luxeshowcase.com</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <Phone className="h-4 w-4" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <MapPin className="h-4 w-4" />
                <span>123 Luxury Ave, New York, NY 10001</span>
              </div>
            </div>

            {/* Social Media */}
            <div className="flex space-x-4">
              <button 
                onClick={() => handleSocialClick('facebook')}
                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
                aria-label="Follow us on Facebook"
              >
                <Facebook size={20} />
              </button>
              <button 
                onClick={() => handleSocialClick('twitter')}
                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
                aria-label="Follow us on Twitter"
              >
                <Twitter size={20} />
              </button>
              <button 
                onClick={() => handleSocialClick('instagram')}
                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
                aria-label="Follow us on Instagram"
              >
                <Instagram size={20} />
              </button>
              <button 
                onClick={() => handleSocialClick('linkedin')}
                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
                aria-label="Follow us on LinkedIn"
              >
                <Linkedin size={20} />
              </button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/products" className="text-gray-400 hover:text-white transition-colors">
                  Products
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-400 hover:text-white transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <button 
                  onClick={() => handleSupportClick('help')}
                  className="text-gray-400 hover:text-white transition-colors text-left"
                >
                  Help Center
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleSupportClick('privacy')}
                  className="text-gray-400 hover:text-white transition-colors text-left"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleSupportClick('terms')}
                  className="text-gray-400 hover:text-white transition-colors text-left"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleSupportClick('returns')}
                  className="text-gray-400 hover:text-white transition-colors text-left"
                >
                  Returns Policy
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
          <p>&copy; {currentYear} LuxeShowcase. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};