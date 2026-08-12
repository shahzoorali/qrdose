import Link from "next/link";
import Image from "next/image";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex items-center ${className}`}>
      <Image
        src="/qrdose-logo.svg"
        alt="QRdose"
        width={140}
        height={60}
        priority
        className="h-9 w-auto"
      />
    </Link>
  );
}
