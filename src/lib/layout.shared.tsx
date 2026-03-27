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
            src="/pearpass.svg"
            alt="Logo"
            width={24}
            height={24}
          />
          PearPass
        </>
      ),
    },
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  };
}