import './global.css';
import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import { Provider } from '@/app/provider';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
};

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
});

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={poppins.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
