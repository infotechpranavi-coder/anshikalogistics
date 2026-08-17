import { APP_LOGO, APP_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";

export function BrandLogo({
  className,
  imgClassName,
}: {
  className?: string;
  imgClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center", className)}>
      {/* Local brand mark from /public */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={APP_LOGO}
        alt={APP_NAME}
        className={cn("h-10 w-auto object-contain", imgClassName)}
      />
    </span>
  );
}
