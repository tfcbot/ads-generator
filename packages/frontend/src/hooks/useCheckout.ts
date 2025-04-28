'use client';

import { useState } from 'react';
import { initiateCheckout } from '../services/creditService';
import { useAuth } from './useAuth';
import { loadStripe } from '@stripe/stripe-js';

const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

export function useCheckout() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getAuthToken } = useAuth();

  const startCheckout = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('No token found');
      }
      const id = await initiateCheckout(token);


      if (!stripeKey) {
        
        throw new Error('No Stripe key available');
      }
      const stripe = await loadStripe(stripeKey);

      if (!stripe) {
        throw new Error('Failed to load Stripe');
      }
      // Redirect to Checkout
      const { error } = await stripe.redirectToCheckout({ sessionId: id });
      
      // Redirect to the checkout URL
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate checkout');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    startCheckout,
    isLoading,
    error
  };
} 