/**
 * Enhanced Feature Card Component with Glassmorphism Effect
 * 
 * This component creates fancy, modern-looking cards with:
 * - Glass morphism effect (blurred, semi-transparent background)
 * - Gradient borders that animate on hover
 * - Smooth animations using Framer Motion
 * - Responsive design using Tailwind CSS
 */

'use client' // This tells Next.js this is a client component (runs in browser, not server)

import { ReactNode, useState } from 'react'
import { MotionDiv } from '../framer-motion'
import Link from 'next/link'

// TypeScript interface defines what props this component accepts
// This helps catch errors and provides autocomplete in your editor
interface EnhancedFeatureProps {
  title: string           // The main heading of the card
  description: string     // The body text
  tags?: string[]        // Optional array of tag strings
  href?: string          // Optional link URL
  icon?: ReactNode       // Optional React component for icon
  gradient?: string      // Optional custom gradient class
  delay?: number         // Animation delay in seconds
}

export function EnhancedFeature({
  title,
  description,
  tags = [],
  href,
  icon,
  gradient = 'from-purple-500 to-pink-500',
  delay = 0
}: EnhancedFeatureProps) {
  // useState hook manages component state
  // isHovered tracks if mouse is over the card
  const [isHovered, setIsHovered] = useState(false)

  // The main card content wrapped in a div
  const cardContent = (
    <>
      {/* Icon container with animated glow effect */}
      {icon && (
        <div className={`
          mb-4 w-12 h-12 rounded-xl 
          bg-gradient-to-br ${gradient} 
          flex items-center justify-center
          ${isHovered ? 'animate-pulse-slow' : ''}
        `}>
          <div className="text-white text-xl">
            {icon}
          </div>
        </div>
      )}

      {/* Card title with gradient text effect */}
      <h3 className={`
        text-2xl font-bold mb-3
        ${isHovered ? 'gradient-text' : 'text-gray-800 dark:text-gray-100'}
        transition-all duration-300
      `}>
        {title}
      </h3>

      {/* Description text */}
      <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
        {description}
      </p>

      {/* Tags section with pill-shaped badges */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <span
              key={index}
              className={`
                px-3 py-1 text-xs rounded-full
                bg-gradient-to-r ${gradient} bg-opacity-10
                text-gray-700 dark:text-gray-300
                border border-gray-200 dark:border-gray-700
                ${isHovered ? 'border-purple-500/50' : ''}
                transition-colors duration-300
              `}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Call-to-action arrow that appears on hover */}
      {href && (
        <div className={`
          mt-4 flex items-center gap-2
          text-purple-600 dark:text-purple-400
          ${isHovered ? 'translate-x-2' : ''}
          transition-transform duration-300
        `}>
          <span>探索更多</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}
    </>
  )

  // The animated container using Framer Motion
  const motionContainer = (
    <MotionDiv
      // Initial state when component first renders
      initial={{ 
        opacity: 0,      // Start invisible
        y: 50,          // Start 50px below final position
        scale: 0.95     // Start slightly smaller
      }}
      // Animation when component enters viewport
      whileInView={{ 
        opacity: 1,      // Fade in to full opacity
        y: 0,           // Move to final position
        scale: 1        // Scale to full size
      }}
      // Only animate once when scrolled into view
      viewport={{ once: true, margin: '-100px' }}
      // Animation timing
      transition={{ 
        duration: 0.5,
        delay: delay,
        ease: 'easeOut'
      }}
      // Mouse hover handlers
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      // CSS classes for styling
      className={`
        relative p-6 rounded-2xl
        /* Glass morphism effect: */
        backdrop-blur-xl              /* Blurs content behind */
        bg-white/10 dark:bg-black/10  /* Semi-transparent background */
        border border-white/20 dark:border-white/10
        /* Shadow and hover effects: */
        shadow-xl hover:shadow-2xl
        transition-all duration-300
        /* Gradient border on hover: */
        ${isHovered ? 'border-purple-500/50' : ''}
        /* 3D transform on hover: */
        hover:-translate-y-2
        /* Ensure card is above background: */
        z-10
      `}
    >
      {/* Animated gradient background (subtle) */}
      <div className={`
        absolute inset-0 rounded-2xl
        bg-gradient-to-br ${gradient}
        opacity-0 ${isHovered ? 'opacity-5' : ''}
        transition-opacity duration-500
      `} />

      {/* Card content with relative positioning to stay above gradient */}
      <div className="relative z-10">
        {cardContent}
      </div>

      {/* Animated shimmer effect on hover */}
      {isHovered && (
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
      )}
    </MotionDiv>
  )

  // If href is provided, wrap in Link component for navigation
  if (href) {
    return (
      <Link href={href} className="block no-underline">
        {motionContainer}
      </Link>
    )
  }

  // Otherwise, just return the card without link wrapper
  return motionContainer
}