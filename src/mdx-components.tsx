import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import type { ImgHTMLAttributes } from 'react';
import { ImageGrid } from '@/components/ImageGrid';
import { Image } from '@/components/Image';
import { cn } from '@/lib/cn';

/**
 * Markdown `![]()` maps to `img`. We intentionally use the native element
 * (not `next/image`) because MDX images don't carry width/height metadata,
 * and `next/image` requires both. The `alt` attribute comes from MDX's
 * bracketed text and is forwarded via `...rest`.
 */
function MdxImg({
  className,
  srcSet,
  srcset,
  ...rest
}: ImgHTMLAttributes<HTMLImageElement> & { srcset?: string }) {
  return (
    // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
    <img
      {...rest}
      srcSet={srcSet ?? srcset}
      className={cn('rounded-lg', className)}
    />
  );
}

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    img: MdxImg,
    ImageGrid,
    Image,
    ...components,
  };
}
