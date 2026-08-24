import type { ReactNode } from 'react';

export const metadata = {
  title: 'Docs search + MCP',
  description: 'Semantic search and MCP tools over the documentation corpus.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', margin: '3rem auto', maxWidth: '46rem', padding: '0 1.5rem', lineHeight: 1.6 }}>
        {children}
      </body>
    </html>
  );
}
