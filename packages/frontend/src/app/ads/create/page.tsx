import React from 'react';
import { AdsForm } from '../../../components/AdsForm';

export const metadata = {
  title: 'Create Ad - Ads Generator',
  description: 'Create a new ad with our AI-powered generator',
};

export default function CreateAdPage() {
  return (
    <div className="max-w-2xl mx-auto min-h-screen flex flex-col justify-center">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2 text-fg-primary">Create an Ad</h1>
      </div>
      
      <AdsForm />
    </div>
  );
}
