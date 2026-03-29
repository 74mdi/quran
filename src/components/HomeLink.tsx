"use client";

import { usePathname } from "next/navigation";
import { Link } from "next-view-transitions";

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
