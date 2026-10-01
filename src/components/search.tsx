'use client';
import type { SharedProps } from 'fumadocs-ui/components/dialog/search';
import {
  InkeepModalSearchAndChat,
  type InkeepModalSearchAndChatProps,
} from '@inkeep/cxkit-react';
import { useTheme } from 'next-themes';

export default function CustomSearchDialog({ open, onOpenChange }: SharedProps) {
  const { resolvedTheme } = useTheme();

  const config: InkeepModalSearchAndChatProps = {
    baseSettings: {
      apiKey: process.env.NEXT_PUBLIC_INKEEP_API_KEY!,
      organizationDisplayName: 'Pear Docs',
      primaryBrandColor: resolvedTheme === 'dark' ? '#bbde5c' : '#759300',
      colorMode: {
        forcedColorMode: resolvedTheme === 'dark' ? 'dark' : 'light',
      },
    },
    modalSettings: {
      isOpen: open,
      onOpenChange,
    },
  };

  return <InkeepModalSearchAndChat {...config} />;
}
