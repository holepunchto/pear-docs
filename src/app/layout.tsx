import './global.css';
import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import { Provider } from '@/app/provider';
import { getDocsSeoConfig } from '@/lib/seo-config';

export const dynamic = 'force-static';

const { metadataBase, siteName } = getDocsSeoConfig();

export const metadata: Metadata = {
  metadataBase,
  // Suffix every page's <title> with the brand so it differs from the on-page
  // <h1> (page.data.title). buildDocsMetadata returns sub-page titles as plain
  // strings (template applies) and the home title as `{ absolute }` (bypassed).
  title: {
    template: `%s | ${siteName}`,
    default: siteName,
  },
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
