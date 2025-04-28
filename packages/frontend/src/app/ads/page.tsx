import React from 'react';
import { AdsList } from '../../components/AdsList';

export const metadata = {
  title: 'Your Ads - Ads Generator',
  description: 'View all your generated ads',
};

export default function AdsPage() {
  return <AdsList />;
}
