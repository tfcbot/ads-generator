'use client';

import { useCheckout } from '../hooks/useCheckout';

export function BuyCreditsButton() {
  const { startCheckout, isLoading } = useCheckout();
  return (
    <button
      onClick={() => startCheckout()}
      disabled={isLoading}
      className="bg-accent-primary hover:bg-accent-secondary text-white font-medium rounded-md px-4 py-1.5 text-sm transition-colors disabled:opacity-70"
    >
      {isLoading ? 'Processing...' : 'Buy Credits'}
    </button>
  );
} 