"use client";

import React from "react";
import { useTheme } from "next-themes";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (mounted) {
      document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
    }
  }, [resolvedTheme, mounted]);

  if (!mounted) {
    return <>{children}</>;
  }

  return <>{children}</>;
}
