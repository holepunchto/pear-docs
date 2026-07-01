import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import Image from 'next/image';

export const gitConfig = {
  user: 'tetherto',
  repo: 'pear-apps-docs-migration',
  branch: 'main',
};

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <>
          <Image
            src="/pear-1.svg"
            alt="Logo"
            width={265}
            height={358}
            className="h-6 w-auto"
          />
          Pear Docs
        </>
      ),
    },
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  };
}