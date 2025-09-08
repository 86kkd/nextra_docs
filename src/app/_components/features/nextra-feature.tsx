/**
 * Nextra-style Feature Card Component
 * 
 * This component creates clean, minimalist feature cards that match
 * the Nextra official website design:
 * - Simple hover effects with subtle animations
 * - Clean borders and shadows
 * - Minimalist design philosophy
 * - Smooth transitions
 */

'use client' // This tells Next.js this is a client component (runs in browser)

import { ReactNode } from 'react'
import { MotionDiv } from '../framer-motion'
import Link from 'next/link'

// TypeScript interface - defines what props this component accepts
interface NextraFeatureProps {
  title: string           // The main heading of the card
  description: string     // The body text describing the feature
  icon?: ReactNode       // Optional icon or emoji to display
  href?: string          // Optional link URL  
  delay?: number         // Animation delay in seconds for staggered effects
}

export function NextraFeature({
  title,
  description,
  icon,
  href,
  delay = 0
}: NextraFeatureProps) {
  // The card content
  const cardContent = (
    <>
      {/* Icon display - simple and clean */}
      {icon && (
        <div className="text-4xl mb-4">
          {icon}
        </div>
      )}

      {/* Title with clean typography */}
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>

      {/* Description text */}
      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
        {description}
      </p>

      {/* Link indicator - shows on hover if href provided */}
      {href && (
        <div className="mt-4 flex items-center text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <span className="text-sm font-medium">了解更多</span>
          <svg className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}
    </>
  )

  // The animated container with Nextra-style design
  const motionContainer = (
    <MotionDiv
      // Initial animation state
      initial={{ 
        opacity: 0,
        y: 20
      }}
      // Animation when scrolled into view
      whileInView={{ 
        opacity: 1,
        y: 0
      }}
      // Only animate once
      viewport={{ once: true }}
      // Smooth animation timing
      transition={{ 
        duration: 0.4,
        delay: delay,
        ease: [0.25, 0.1, 0.25, 1]
      }}
      // Clean card styling
      className="group relative p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-lg transition-all duration-200"
    >
      {cardContent}
    </MotionDiv>
  )

  // Wrap in Link if href provided
  if (href) {
    return (
      <Link href={href} className="block">
        {motionContainer}
      </Link>
    )
  }

  return motionContainer
}