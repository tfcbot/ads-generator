'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Credits } from './Credits';
import { BuyCreditsButton } from './UpgradeButton';
import { SignInButton, SignOutButton, useUser } from '@clerk/nextjs';

export function Navbar() {
  const pathname = usePathname();
  const { isSignedIn } = useUser();
  
  return (
    <nav className="bg-bg-secondary border-b border-border py-4 px-6">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/" className="text-xl font-semibold text-fg-primary">
            Ads Generator
          </Link>
        </div>
        
        <div className="flex items-center space-x-6">
          <Credits />
          <BuyCreditsButton />
          <NavLink href="/" active={pathname === '/'}>
            Submit Task
          </NavLink>

          
          {isSignedIn ? (
            <SignOutButton>
              <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors">
                Sign Out
              </button>
            </SignOutButton>
          ) : (
            <SignInButton>
              <button className="bg-accent-tertiary hover:bg-accent-secondary text-white px-4 py-2 rounded text-sm font-medium transition-colors">
                Sign In
              </button>
            </SignInButton>
          )}
        </div>
      </div>
    </nav>
  );
}

function NavLink({ 
  href, 
  active, 
  children 
}: { 
  href: string; 
  active: boolean; 
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`text-sm font-medium ${
        active 
          ? 'text-accent-tertiary border-b-2 border-accent-tertiary pb-1' 
          : 'text-fg-secondary hover:text-fg-primary'
      }`}
    >
      {children}
    </Link>
  );
}    