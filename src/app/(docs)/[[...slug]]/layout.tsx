import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { LinkItemType } from 'fumadocs-ui/layouts/shared';
import { baseOptions } from '@/lib/layout.shared';
import { customTree } from '@/lib/custom-tree';
import { KeetIcon } from '@/components/keet-icon';
import KeetRoomModalMount from '@/components/keet-modal';
import { McpMenu } from '@/components/mcp-menu';

export const dynamic = 'force-static';

export default function Layout({ children }: LayoutProps<'/'>) {
  // Keet renders as an icon link in the navbar. Its href is a placeholder hash —
  // `KeetRoomModalMount` intercepts clicks on `a[aria-label="Keet"]` and opens
  // the Pear Development Group modal instead of navigating.
  const linkItems: LinkItemType[] = [
    {
      type: 'custom',
      // Placed on the right (secondary) so it sits with the nav actions.
      secondary: true,
      children: <McpMenu />,
    },
    {
      type: 'icon',
      url: '#keet-room',
      label: 'Keet',
      text: 'Keet',
      icon: <KeetIcon />,
    },
  ];

  return (
    <>
      <DocsLayout
        {...baseOptions()}
        tree={{ name: 'docs', children: customTree }}
        links={linkItems}
      >
        {children}
      </DocsLayout>
      <KeetRoomModalMount />
    </>
  );
}
