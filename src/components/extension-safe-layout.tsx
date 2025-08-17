'use client'

import { useEffect, useState } from 'react'

export function ExtensionSafeLayout({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    // Only render after hydration to avoid mismatches
    setIsHydrated(true)
    
    // Optional: Detect and handle common extensions
    const isDarkReaderActive = document.querySelector('.darkreader') !== null
    const isAdBlockActive = document.querySelector('[id*="adblock"]') !== null
    
    if (isDarkReaderActive || isAdBlockActive) {
      console.log('🔍 Browser extensions detected:', {
        darkReader: isDarkReaderActive,
        adBlock: isAdBlockActive
      })
    }
  }, [])

  // During SSR and initial hydration, render a simplified version
  if (!isHydrated) {
    return (
      <div suppressHydrationWarning>
        {children}
      </div>
    )
  }

  // After hydration, render the full component
  return <>{children}</>
}