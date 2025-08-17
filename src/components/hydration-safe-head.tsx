'use client'

import { Head } from "nextra/components";
import { useEffect, useState } from 'react';

export function HydrationSafeHead({ children, ...props }: any) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // During SSR and initial hydration, don't render problematic elements
  if (!isMounted) {
    return null;
  }

  return (
    <Head {...props}>
      {children}
    </Head>
  );
}