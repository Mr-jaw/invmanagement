import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export const Newsletter: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase
        .from('subscriptions')
        .insert([{ email, active: true }]);

      if (error) throw error;

      setSuccess(true);
      setEmail('');
    } catch (error: any) {
      if (error.code === '23505') {
        setError('This email is already subscribed.');
      } else {
        setError('Failed to subscribe. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <section className="py-20 bg-gradient-to-r from-primary-600 to-luxury-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/10 backdrop-blur-md rounded-2xl p-8 text-white"
          >
            <Check className="mx-auto h-16 w-16 mb-4" />
            <h2 className="text-3xl font-bold mb-4">Thank You!</h2>
            <p className="text-lg opacity-90">
              You've successfully subscribed to our newsletter. Get ready for exclusive updates!
            </p>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gradient-to-r from-primary-600 to-luxury-600">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="bg-white/10 backdrop-blur-md rounded-2xl p-8 text-white"
        >
          <Mail className="mx-auto h-12 w-12 mb-6" />
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Stay in the Loop
          </h2>
          <p className="text-lg mb-8 opacity-90">
            Subscribe to our newsletter and be the first to know about new products, exclusive offers, and luxury insights.
          </p>
          
          <form onSubmit={handleSubmit} className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 bg-white/20 border-white/30 text-white placeholder-white/70"
              />
              <Button
                type="submit"
                loading={loading}
                variant="secondary"
                className="bg-white text-primary-600 hover:bg-gray-100"
              >
                Subscribe
              </Button>
            </div>
            {error && (
              <p className="mt-3 text-red-200 text-sm">{error}</p>
            )}
          </form>
          
          <p className="mt-4 text-sm opacity-70">
            No spam, unsubscribe at any time.
          </p>
        </motion.div>
      </div>
    </section>
  );
};