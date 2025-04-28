'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Credits } from './Credits';
import { BuyCreditsButton } from './UpgradeButton';
import { SignInButton, SignOutButton, useUser } from '@clerk/nextjs';
import { useSidebarContext } from '../context/SidebarContext';

export function Sidebar() {
  const { isCollapsed, setIsCollapsed } = useSidebarContext();
  const pathname = usePathname();
  const { isSignedIn, user } = useUser();

  return (
    <aside 
      role="complementary"
      className={`h-screen bg-bg-secondary text-fg-primary border-r border-border transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-20' : 'w-64'
      } relative`}
    >
      <div className="p-4 flex items-center justify-between">
        {!isCollapsed && (
          <div className="transition-opacity duration-300">
            <h1 className="text-xl font-bold">Research Agent</h1>
          </div>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 hover:bg-bg-tertiary rounded"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" role="img" aria-hidden="true">
            {isCollapsed 
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            }
          </svg>
        </button>
      </div>

      <nav className="mt-8">
        <NavLink href="/" active={pathname === '/'} isCollapsed={isCollapsed}>
          {isCollapsed ? '📝' : 'Submit Task'}
        </NavLink>
        <NavLink href="/research" active={pathname === '/research'} isCollapsed={isCollapsed}>
          {isCollapsed ? '🔍' : 'View Research'}
        </NavLink>
      </nav>

      <div className="flex flex-col h-[calc(100%-12rem)]">
        <div className="flex-grow"></div>
        
        {!isCollapsed && (
          <div className="p-4 border-t border-border">
            <Credits />
          </div>
        )}

        {!isCollapsed && (
          <div className="p-4 border-t border-border">
            <BuyCreditsButton />
            <div className="mt-4">
              {isSignedIn ? (
                <SignOutButton>
                  <button className="bg-red-500 hover:bg-red-600 text-white font-medium rounded-md px-4 py-1.5 text-sm transition-colors">
                    Sign Out
                  </button>
                </SignOutButton>
              ) : (
                <SignInButton>
                  <button className="w-full bg-accent-tertiary hover:bg-accent-secondary text-white px-4 py-2 rounded text-sm font-medium transition-colors">
                    Sign In
                  </button>
                </SignInButton>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

function NavLink({ 
  href, 
  active, 
  isCollapsed,
  children 
}: { 
  href: string; 
  active: boolean;
  isCollapsed: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`block py-2 px-4 mx-2 rounded transition-colors ${
        active ? 'bg-bg-tertiary' : 'hover:bg-bg-tertiary'
      }`}
    >
      {children}
    </Link>
  );
} 