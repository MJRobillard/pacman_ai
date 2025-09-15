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
  { href: '/demo', label: 'Demo', icon: '👾' },
];

export default function NavBar({ children }: PropsWithChildren) {
  const pathname = usePathname() || '/';
  // Hide navbar entirely on the demo route
  if (pathname.startsWith('/demo')) {
    return null;
  }

  return (
    <div className="w-full border-b border-gray-800/60 bg-[rgba(10,15,25,0.6)] backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-yellow-400 to-amber-400 flex items-center justify-center text-xl">
            🎮
          </div>
          <div className="text-display text-2xl bg-gradient-to-r from-yellow-300 via-amber-300 to-orange-400 bg-clip-text text-transparent">
            Pacman AI
          </div>
        </div>

        <nav className="flex items-center gap-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            const className = isActive ? 'btn-pacman px-5 py-2.5' : 'btn-secondary px-5 py-2.5';
            return (
              <Link key={item.href} href={item.href} aria-current={isActive ? 'page' : undefined} className={className}>
                <span className="flex items-center gap-2">
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
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


