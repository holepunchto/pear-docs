import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { baseOptions } from '@/lib/layout.shared';
import { customTree } from '@/lib/custom-tree';

export const dynamic = 'force-static';

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <DocsLayout
      tree={{ name: 'docs', children: customTree }}
      {...baseOptions()}
    >
      {children}
    </DocsLayout>
  );
}
