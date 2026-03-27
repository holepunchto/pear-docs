import NextImage from "next/image";

interface ImageProps {
  src: string;
  alt: string;
  size?: 'mobile' | 'sm' | 'md' | 'lg' | 'full';
  className?: string;
  width?: number;
  height?: number;
}

const sizes = {
  mobile: 'max-w-[300px]',
  sm: 'max-w-[192px]',
  md: 'max-w-[256px]',
  lg: 'max-w-[320px]',
  full: 'w-full',
};

export function Image({ 
  src, 
  alt, 
  size = 'full', 
  className = '',
  width = 800,
  height = 600,
}: ImageProps) {
  return (
    <NextImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={`rounded-lg ${sizes[size]} ${className}`}
    />
  );
}