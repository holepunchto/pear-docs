import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import type { ImgHTMLAttributes } from 'react';
import { ImageGrid } from '@/components/ImageGrid';
import { Image } from '@/components/Image';
import { cn } from '@/lib/cn';

/** Markdown `![]()` maps to `img`. Native element avoids Next/Image width/height requirements. */
function MdxImg({
  className,
  srcSet,
  srcset,
  ...rest
}: ImgHTMLAttributes<HTMLImageElement> & { srcset?: string }) {
  return (
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
