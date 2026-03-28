"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const HomeLink = () => {
  const pathname = usePathname();

  if (pathname === "/") {
    return null;
  }

  return (
    <Link href="/" className="text-muted">
      Home
    </Link>
  );
};
