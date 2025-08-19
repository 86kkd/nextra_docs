/**
 * Particle Background Component
 * Creates an animated particle field effect using HTML5 Canvas
 * 
 * Key Concepts:
 * - useEffect: React hook for side effects (like animations)
 * - useRef: React hook to directly access DOM elements
 * - requestAnimationFrame: Browser API for smooth 60fps animations
 * - Canvas API: For drawing graphics programmatically
 */

'use client'

import { useEffect, useRef } from 'react'

interface Particle {
  x: number          // Horizontal position
  y: number          // Vertical position  
  vx: number         // Horizontal velocity (speed)
  vy: number         // Vertical velocity
  radius: number     // Size of particle
  opacity: number    // Transparency (0-1)
}

export function ParticleBackground() {
  // useRef creates a reference to the canvas element
  // This lets us directly manipulate the canvas DOM element
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    // Get the canvas element and its 2D drawing context
    const canvas = canvasRef.current
    if (!canvas) return // Exit if canvas doesn't exist yet

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size to fill the window
    const updateCanvasSize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    updateCanvasSize()

    // Array to store all particle objects
    const particles: Particle[] = []
    const particleCount = 50 // Number of particles to create

    // Create initial particles with random properties
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,        // Random x position
        y: Math.random() * canvas.height,       // Random y position
        vx: (Math.random() - 0.5) * 0.5,       // Random horizontal speed (-0.25 to 0.25)
        vy: (Math.random() - 0.5) * 0.5,       // Random vertical speed
        radius: Math.random() * 2 + 1,          // Random size (1-3 pixels)
        opacity: Math.random() * 0.5 + 0.1      // Random opacity (0.1-0.6)
      })
    }

    // Store mouse position for interaction
    let mouseX = 0
    let mouseY = 0

    // Update mouse position when it moves
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
    }
    window.addEventListener('mousemove', handleMouseMove)

    // Animation function that runs every frame
    const animate = () => {
      // Clear the entire canvas for the next frame
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Update and draw each particle
      particles.forEach((particle, index) => {
        // Update particle position based on velocity
        particle.x += particle.vx
        particle.y += particle.vy

        // Wrap particles around screen edges (infinite scrolling effect)
        if (particle.x < 0) particle.x = canvas.width
        if (particle.x > canvas.width) particle.x = 0
        if (particle.y < 0) particle.y = canvas.height
        if (particle.y > canvas.height) particle.y = 0

        // Calculate distance from mouse
        const dx = mouseX - particle.x
        const dy = mouseY - particle.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        // Repel particles from mouse when close
        if (distance < 100) {
          // Calculate repulsion force (stronger when closer)
          const force = (100 - distance) / 100
          // Apply force in opposite direction of mouse
          particle.vx -= (dx / distance) * force * 0.02
          particle.vy -= (dy / distance) * force * 0.02
        }

        // Apply friction to slow down particles over time
        particle.vx *= 0.99
        particle.vy *= 0.99

        // Add small random movement for organic feel
        particle.vx += (Math.random() - 0.5) * 0.01
        particle.vy += (Math.random() - 0.5) * 0.01

        // Draw the particle as a circle
        ctx.beginPath()
        // Create gradient for each particle (gives glow effect)
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,           // Inner circle (center)
          particle.x, particle.y, particle.radius * 2  // Outer circle
        )
        gradient.addColorStop(0, `rgba(147, 51, 234, ${particle.opacity})`)  // Purple center
        gradient.addColorStop(1, 'rgba(147, 51, 234, 0)')                    // Transparent edge
        
        ctx.fillStyle = gradient
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
        ctx.fill()

        // Draw connections between nearby particles
        particles.forEach((otherParticle, otherIndex) => {
          if (index === otherIndex) return // Don't connect to self

          // Calculate distance between particles
          const dx = particle.x - otherParticle.x
          const dy = particle.y - otherParticle.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          // If particles are close enough, draw a line between them
          if (distance < 150) {
            ctx.beginPath()
            ctx.moveTo(particle.x, particle.y)
            ctx.lineTo(otherParticle.x, otherParticle.y)
            // Line opacity decreases with distance
            ctx.strokeStyle = `rgba(147, 51, 234, ${0.1 * (1 - distance / 150)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        })
      })

      // Request next animation frame (creates smooth 60fps animation)
      requestAnimationFrame(animate)
    }

    // Start the animation loop
    animate()

    // Handle window resize
    window.addEventListener('resize', updateCanvasSize)

    // Cleanup function (runs when component unmounts)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', updateCanvasSize)
    }
  }, []) // Empty dependency array means this effect runs once on mount

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-50"
      style={{
        // Use CSS for additional performance optimization
        willChange: 'transform',
        // Hardware acceleration hint
        transform: 'translateZ(0)'
      }}
    />
  )
}