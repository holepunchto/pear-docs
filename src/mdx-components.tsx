import defaultMdxComponents from 'fumadocs-ui/mdx';
import { ImageZoom } from 'fumadocs-ui/components/image-zoom';
import type { MDXComponents } from 'mdx/types';
import type { ImgHTMLAttributes } from 'react';
import { ImageGrid } from '@/components/ImageGrid';
import { Image } from '@/components/Image';
import { Mermaid } from '@/components/mermaid';
import { Status } from '@/components/Status';
import { Since, Until } from '@/components/version';
import { cn } from '@/lib/cn';

/**
 * Markdown `![]()` maps to `img`. We render a native `<img>` (not
 * `next/image`) because markdown images often omit width/height. Click-to-zoom
 * uses Fumadocs `ImageZoom` + `react-medium-image-zoom`.
 */
function MdxImg({
  className,
  srcSet,
  srcset,
  src,
  alt,
  ...rest
}: ImgHTMLAttributes<HTMLImageElement> & { srcset?: string }) {
  const mergedClassName = cn('rounded-lg', className);
  const srcStr = typeof src === 'string' ? src : undefined;
  return (
    <ImageZoom src={srcStr} alt={alt ?? ''}>
      {/* eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element */}
      <img
        {...rest}
        src={src}
        alt={alt}
        srcSet={srcSet ?? srcset}
        className={mergedClassName}
      />
    </ImageZoom>
  );
}

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    img: MdxImg,
    ImageGrid,
    Image,
    Mermaid,
    Status,
    // Platform version annotations — see src/components/version/index.tsx
    Since,
    Until,
    ...components,
  };
}
