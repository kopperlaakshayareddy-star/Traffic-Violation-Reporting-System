interface ImagePreviewProps {
  src: string;
  alt?: string;
  className?: string;
}

export default function ImagePreview({ src, alt = 'Violation evidence', className = '' }: ImagePreviewProps) {
  return (
    <div className={`inline-block ${className}`}>
      <img
        src={src}
        alt={alt}
        className="rounded-lg border border-gray-200 object-cover w-full h-full"
        loading="lazy"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    </div>
  );
}
