"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PropsWithChildren } from 'react';

type NavItem = {
  href: string;
  label: string;
  icon: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Search', icon: '🔍' },
  { href: '/multiagent', label: 'Multi-Agent', icon: '👻' },
  { href: '/ghostbusters', label: 'Ghostbusters', icon: '🎯' },
];

export default function NavBar({ children }: PropsWithChildren) {
  const pathname = usePathname() || '/';
  // Hide navbar entirely on the demo route
  if (pathname.startsWith('/demo')) {
    return null;
  }

  return (
    <div className="w-full border-b border-gray-800/60 bg-[rgba(10,15,25,0.6)] backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-4 flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-yellow-400 to-amber-400 flex items-center justify-center text-lg sm:text-xl">
            🎮
          </div>
          <div className="text-display text-lg sm:text-2xl bg-gradient-to-r from-yellow-300 via-amber-300 to-orange-400 bg-clip-text text-transparent">
            <span className="hidden xs:inline">Pacman AI</span>
            <span className="xs:hidden">Pacman</span>
          </div>
        </div>

        <nav className="flex items-center gap-1 sm:gap-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            const className = isActive ? 'btn-pacman px-2 sm:px-5 py-1.5 sm:py-2.5' : 'btn-secondary px-2 sm:px-5 py-1.5 sm:py-2.5';
            return (
              <Link key={item.href} href={item.href} aria-current={isActive ? 'page' : undefined} className={className}>
                <span className="flex items-center gap-1 sm:gap-2">
                  <span className="text-sm sm:text-base">{item.icon}</span>
                  <span className="hidden nav-label-desktop text-sm sm:text-base">{item.label}</span>
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
      {children}
    </div>
  );
}


