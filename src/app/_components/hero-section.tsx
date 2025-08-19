'use client'
import { MotionDiv } from './framer-motion'
import { useState, useEffect } from 'react'

export function HeroSection() {
  // Initialize with null to avoid hydration mismatch
  // Server and client will both start with null
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null)
  
  useEffect(() => {
    // Set initial position after component mounts (client-side only)
    setMousePosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <section className="relative min-h-[90vh] overflow-hidden flex items-center justify-center">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-indigo-900/20 animate-gradient" />
      
      {/* Interactive gradient orb that follows mouse */}
      {/* Only render after client-side mount to avoid hydration issues */}
      {mousePosition && (
        <div 
          className="absolute w-96 h-96 opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(147, 51, 234, 0.3) 0%, transparent 70%)',
            left: `${mousePosition.x - 192}px`,
            top: `${mousePosition.y - 192}px`,
            transition: 'all 0.3s ease-out',
            pointerEvents: 'none'
          }}
        />
      )}

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='60' height='60' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 60 0 L 0 0 0 60' fill='none' stroke='gray' stroke-width='0.5' opacity='0.2'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grid)' /%3E%3C/svg%3E")`
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
        {/* Animated title */}
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-6xl md:text-8xl font-bold mb-6">
            <span className="gradient-text">技术探索</span>
            <br />
            <span className="text-4xl md:text-6xl text-gray-600 dark:text-gray-300">
              与知识分享
            </span>
          </h1>
        </MotionDiv>

        {/* Animated subtitle */}
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-12"
        >
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            深入研究 AI/ML、强化学习、计算机视觉等前沿技术
            <br />
            从理论到实践，探索技术的无限可能
          </p>
        </MotionDiv>

        {/* Animated CTA buttons */}
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex gap-4 justify-center flex-wrap"
        >
          <button className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-semibold text-lg hover:shadow-lg hover:scale-105 transition-all duration-300 hover:shadow-purple-500/25">
            开始探索
          </button>
          <button className="px-8 py-4 glass dark:glass-dark rounded-full font-semibold text-lg hover:scale-105 transition-all duration-300 border border-purple-500/30">
            查看项目
          </button>
        </MotionDiv>

        {/* Animated tech stack icons */}
        <MotionDiv
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="mt-16 flex justify-center gap-8 flex-wrap"
        >
          {['React', 'TypeScript', 'Python', 'PyTorch', 'TensorFlow'].map((tech, i) => (
            <MotionDiv
              key={tech}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.8 + i * 0.1 }}
              whileHover={{ scale: 1.2, rotate: 5 }}
              className="w-16 h-16 glass dark:glass-dark rounded-xl flex items-center justify-center font-mono text-sm hover:border-purple-500/50 transition-colors"
            >
              {tech.slice(0, 2)}
            </MotionDiv>
          ))}
        </MotionDiv>

        {/* TODO(human): Add interactive feature here - could be a typing animation, 
            particle system, or 3D element. This will make the hero section more engaging. */}
      </div>

      {/* Scroll indicator */}
      <MotionDiv
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <div className="animate-bounce">
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </MotionDiv>
    </section>
  )
}