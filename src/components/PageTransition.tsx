"use client";

import { usePathname } from "next/navigation";
import type React from "react";

interface PageTransitionProps {
  children: React.ReactNode;
}

export const PageTransition = ({ children }: PageTransitionProps) => {
  const pathname = usePathname();

  return (
    <div className="page-stage">
      <div key={pathname} className="page-enter">
        {children}
      </div>
    </div>
  );
};
