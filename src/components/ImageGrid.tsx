import NextImage from "next/image";

interface ImageGridProps {
  images: { src: string; alt: string; width?: number; height?: number }[];
}

export function ImageGrid({ images }: ImageGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 not-prose">
      {images.map((img, i) => (
        <NextImage
          key={i}
          src={img.src}
          alt={img.alt}
          width={img.width || 400}
          height={img.height || 300}
          className="rounded-lg"
        />
      ))}
    </div>
  );
}