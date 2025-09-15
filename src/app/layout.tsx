import type { Metadata } from 'next';
import './globals.css';
import NavBar from '../components/NavBar';

export const metadata: Metadata = {
  title: 'Pacman AI Search Visualization',
  description: 'Interactive visualization of search algorithms in Pacman mazes',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <NavBar>
          <div />
        </NavBar>
        {children}
      </body>
    </html>
  );
}
