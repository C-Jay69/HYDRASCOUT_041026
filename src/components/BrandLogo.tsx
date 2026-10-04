import Image from "next/image";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  /** Pixel size (square) of the icon mark. */
  size?: number;
  /** Whether to render the "HydraScout" wordmark next to the icon. */
  showText?: boolean;
  /** Extra classes for the wordmark text (e.g. color for light/dark backgrounds). */
  textClassName?: string;
  /** Extra classes for the outer wrapping element. */
  className?: string;
  /** Mark this as the LCP image (use on above-the-fold headers). */
  priority?: boolean;
}

/**
 * HydraScout brand mark: the droplet/skyline icon plus the "HydraScout" wordmark.
 * Source asset: public/logo-icon.png (cropped from the official logo, transparent background).
 */
export function BrandLogo({
  size = 32,
  showText = true,
  textClassName,
  className,
  priority = false,
}: BrandLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Image
        src="/logo-icon.png"
        alt="HydraScout"
        width={size}
        height={size}
        priority={priority}
        className="object-contain flex-shrink-0"
      />
      {showText && (
        <span className={cn("text-xl font-bold", textClassName)}>
          Hydra<span className="text-[#1a56db]">Scout</span>
        </span>
      )}
    </span>
  );
}
