import Image from "next/image";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProductPhoto({
  src,
  alt,
  size = 40,
  className,
}: {
  src: string | null;
  alt: string;
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          width={size}
          height={size}
          className="h-full w-full object-cover"
        />
      ) : (
        <Package
          className="text-muted-foreground"
          style={{ width: size * 0.5, height: size * 0.5 }}
        />
      )}
    </div>
  );
}
