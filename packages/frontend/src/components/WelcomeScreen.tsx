'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser, useClerk } from '@clerk/nextjs';
import { useUserCredits } from '../hooks/useCredits';
import { useQueryClient } from '@tanstack/react-query';

// Maximum number of retries for account setup
const MAX_RETRIES = 5;
const RETRY_DELAY = 1000; // 1 second

export default function WelcomeScreen() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const clerk = useClerk();
  const creditsQuery = useUserCredits();
  const queryClient = useQueryClient();
  const [isChecking, setIsChecking] = useState(false);
  const [setupAttempts, setSetupAttempts] = useState(0);
  const [setupStatus, setSetupStatus] = useState('Initializing...');
  const [progress, setProgress] = useState(10); // Starting progress percentage

  // Helper function to check if backend services are ready by using the credits service
  const checkBackendServices = async (): Promise<boolean> => {
    try {
      setSetupStatus('Checking account services...');
      setProgress(30);
      
      // Refetch credits to test if backend is responsive
      await creditsQuery.refetch();
      
      // If we get a successful response (even if it's 0 credits), the backend is ready
      return !creditsQuery.isError;
    } catch (error) {
      console.log('Backend services not ready yet, will retry');
      return false;
    }
  };

  const checkUserSetup = async (): Promise<boolean> => {
    if (!user || !isSignedIn) return false;
    
    try {
      // 1. Verify backend services are ready by checking credits service
      const servicesReady = await checkBackendServices();
      if (!servicesReady && setupAttempts < MAX_RETRIES) {
        return false;
      }
      
      // 2. Check if the session has the necessary claims
      // We rely on the backend to set the metadata
      setProgress(60);
      setSetupStatus('Verifying account details...');
      await clerk.session?.reload();
      
      // Access session claims properly
      const session = clerk.session;
      const metadata = session?.user?.publicMetadata || {};
      
      // Check if keyId exists in the metadata
      return !!metadata.keyId;
    } catch (error) {
      console.error('Error during user setup check:', error);
      return false;
    }
  };

  // Ensure fresh data before redirecting
  const redirectWithFreshData = async () => {
    setSetupStatus('Finalizing your account setup...');
    setProgress(80);
    
    try {
      // Invalidate all queries to ensure fresh data on next page
      await queryClient.invalidateQueries();
      
      // Force a final credits refresh to ensure latest data
      await creditsQuery.refetch();
      
      // Wait a moment for data to settle
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setProgress(100);
      setSetupStatus('Setup complete! Redirecting...');
      setTimeout(() => router.push('/'), 500);
    } catch (error) {
      console.error('Error refreshing data before redirect:', error);
      // Redirect anyway as a fallback
      setTimeout(() => router.push('/'), 500);
    }
  };

  useEffect(() => {
    if (!isLoaded || !isSignedIn || isChecking) return;

    const waitForSetup = async () => {
      // Don't proceed if we've already started the checking process
      if (isChecking) return;
      
      // If we've exceeded max retries, redirect anyway
      if (setupAttempts >= MAX_RETRIES) {
        setSetupStatus('Setup taking longer than expected. Redirecting...');
        await redirectWithFreshData();
        return;
      }
      
      setIsChecking(true);
      
      // Only proceed with initial delay on first attempt
      if (setupAttempts === 0) {
        setSetupStatus('Preparing your account...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      const setupComplete = await checkUserSetup();
      
      if (setupComplete) {
        await redirectWithFreshData();
      } else {
        // Increment retry counter and try again after delay
        setSetupAttempts(prev => prev + 1);
        setIsChecking(false);
        setTimeout(() => {
          // Force clerk session refresh to ensure we have the latest data
          clerk.session?.touch();
        }, RETRY_DELAY);
      }
    };

    waitForSetup();
  }, [isLoaded, isSignedIn, router, user, isChecking, setupAttempts, clerk.session, creditsQuery, queryClient]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center min-h-screen bg-bg-primary z-50">
      <div className="flex flex-col items-center justify-center max-w-lg text-center px-8">
        <h1 className="text-3xl font-bold mb-8 text-white">Account Setup</h1>
        
        {/* Status Message */}
        <p className="text-xl mb-6 text-gray-200">{setupStatus}</p>
        
        {/* Progress Bar */}
        <div className="w-full max-w-md mx-auto relative h-4 bg-gray-700 rounded-full overflow-hidden mb-6">
          <div 
            className="absolute top-0 left-0 h-full bg-indigo-500 rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        {/* Additional Message */}
        {setupAttempts > 2 && (
          <p className="text-sm text-gray-400 mt-4">
            This is taking longer than usual. Please be patient...
          </p>
        )}
      </div>
    </div>
  );
} 