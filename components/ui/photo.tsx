"use client";
import Image, { type ImageLoaderProps, type ImageProps } from "next/image";
import { cldUrl, cn, initials } from "@/lib/utils";

/** Cloudinary does the resizing/format negotiation itself; everything else uses Next's optimiser. */
const cloudinaryLoader = ({ src, width }: ImageLoaderProps) => cldUrl(src, width);

export function Photo({ src, alt, className, ...props }: Omit<ImageProps, "src"> & { src?: string | null }) {
  if (!src) return <div className={cn("bg-surface-2", className)} aria-label={alt} role="img" />;
  const isCld = src.includes("res.cloudinary.com");
  return (
    <Image
      src={src}
      alt={alt}
      loader={isCld ? cloudinaryLoader : undefined}
      className={cn("object-cover", className)}
      {...props}
    />
  );
}

export function Avatar({
  src,
  name,
  size = 48,
  className,
  ring,
}: {
  src?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
  ring?: boolean;
}) {
  return (
    <span
      className={cn(
        "relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-brand-soft font-bold text-brand",
        ring && "border border-[var(--pop-border)] shadow-[var(--pop-shadow-sm)]",
        className,
      )}
      style={{ width: size, height: size, fontSize: size / 2.8 }}
    >
      {src ? (
        <Photo src={src} alt={name ?? "Profile photo"} fill sizes={`${size}px`} />
      ) : (
        <span aria-hidden>{initials(name)}</span>
      )}
    </span>
  );
}
