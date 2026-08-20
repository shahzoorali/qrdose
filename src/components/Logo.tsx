import Link from "next/link";
import Image from "next/image";

/**
 * The logo artwork on its own. Use where the mark is decorative — inside
 * cards or section headers — so the page isn't littered with links home.
 */
export function LogoMark({
  className = "h-12 w-auto",
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/qrdose-logo.svg"
      alt="QRdose"
      width={140}
      height={60}
      priority={priority}
      className={className}
    />
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex items-center ${className}`}>
      <LogoMark priority />
    </Link>
  );
}
