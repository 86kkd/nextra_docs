/**
 * Homepage Wrapper Component
 * 
 * This is a simplified wrapper that's easier for MDX to import.
 * We place it in src/components to match Nextra's expected structure.
 */

'use client'

import { HeroSection } from '../app/_components/hero-section'
import { EnhancedFeature } from '../app/_components/features/enhanced-feature'
import { useEffect, useState } from 'react'

// Simple client-side wrapper without complex lazy loading
export default function HomepageWrapper() {
  // Track if component is mounted to prevent SSR issues
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Don't render client-only content until mounted
  if (!isMounted) {
    // Return a placeholder that matches the expected layout
    return (
      <div>
        <div className="min-h-[90vh] flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-6xl font-bold mb-6">Loading...</h1>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Hero section with animations */}
      <HeroSection />

      {/* Enhanced feature cards */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-center mb-12 gradient-text">
          探索技术领域
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          <EnhancedFeature
            title="Machine Learning"
            description="深入探索机器学习算法，从基础的线性回归到复杂的深度神经网络，理解AI背后的数学原理。"
            tags={["PyTorch", "TensorFlow", "Scikit-learn"]}
            href="/Algorithm"
            icon="🤖"
            gradient="from-blue-500 to-cyan-500"
            delay={0.1}
          />
          
          <EnhancedFeature
            title="Web Development"
            description="现代Web开发技术栈，包括React、Next.js、TypeScript等前端框架，以及Node.js后端开发。"
            tags={["React", "Next.js", "TypeScript"]}
            href="/Development/Web"
            icon="🌐"
            gradient="from-green-500 to-teal-500"
            delay={0.2}
          />
          
          <EnhancedFeature
            title="System & DevOps"
            description="Linux系统管理、容器化技术、CI/CD流程，构建高效的开发运维环境。"
            tags={["Docker", "K8s", "Linux"]}
            href="/tricks"
            icon="⚙️"
            gradient="from-orange-500 to-red-500"
            delay={0.3}
          />
        </div>
      </div>
    </>
  )
}