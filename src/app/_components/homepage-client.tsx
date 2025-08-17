/**
 * Homepage Client Component
 * 
 * This wrapper component handles all client-side features for the homepage.
 * It's marked with 'use client' to ensure it only runs in the browser.
 * This solves the BuildError by keeping browser-only code out of MDX.
 */

'use client'

import { HeroSection } from './hero-section'
import { ParticleBackground } from './particle-background'
import { EnhancedFeature } from './features/enhanced-feature'
import { Suspense, lazy } from 'react'

// Lazy load particle background for better performance
// Note: We do the dynamic import HERE, not in MDX
const LazyParticleBackground = lazy(() => 
  import('./particle-background').then(mod => ({ 
    default: mod.ParticleBackground 
  }))
)

export function HomepageClient() {
  return (
    <>
      {/* Suspense wrapper handles the lazy loading */}
      {/* While particles load, show nothing (fallback={null}) */}
      <Suspense fallback={null}>
        <LazyParticleBackground />
      </Suspense>

      {/* Hero section with all animations */}
      <HeroSection />

      {/* Enhanced feature cards section */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-center mb-12 gradient-text">
          探索技术领域
        </h2>
        
        {/* Responsive grid layout */}
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