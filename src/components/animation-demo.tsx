/**
 * 动画效果演示组件
 * 展示各种彩色字体和淡入淡出效果的实现
 */

'use client'

import { useState, useEffect } from 'react'
import { MotionDiv } from '../app/_components/framer-motion'

export function AnimationDemo() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // 3秒后触发动画
    const timer = setTimeout(() => setIsVisible(true), 1000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-12">
      <h1 className="text-4xl font-bold text-center mb-8">动画效果演示</h1>

      {/* 1. 基础渐变文字 */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">1. 基础渐变文字</h2>
        <div className="gradient-text text-3xl font-bold">
          技术探索与知识分享
        </div>
        <div className="text-sm text-gray-600">
          使用 CSS linear-gradient + background-clip: text 实现
        </div>
      </section>

      {/* 2. 多种渐变效果 */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">2. 不同渐变方向</h2>
        
        {/* 水平渐变 */}
        <div 
          className="text-2xl font-bold"
          style={{
            background: 'linear-gradient(to right, #ff6b6b, #4ecdc4, #45b7d1)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          水平渐变文字 →
        </div>

        {/* 垂直渐变 */}
        <div 
          className="text-2xl font-bold"
          style={{
            background: 'linear-gradient(to bottom, #667eea, #764ba2)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          垂直渐变文字 ↓
        </div>

        {/* 对角渐变 */}
        <div 
          className="text-2xl font-bold"
          style={{
            background: 'linear-gradient(45deg, #f093fb, #f5576c, #4facfe)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          对角渐变文字 ↗
        </div>
      </section>

      {/* 3. Framer Motion 淡入动画 */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">3. Framer Motion 淡入动画</h2>
        
        {/* 基础淡入 */}
        <MotionDiv
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
          className="p-4 bg-blue-100 rounded-lg"
        >
          基础淡入效果 (2秒)
        </MotionDiv>

        {/* 从下方滑入 */}
        <MotionDiv
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="p-4 bg-green-100 rounded-lg"
        >
          从下方滑入 + 淡入效果
        </MotionDiv>

        {/* 从左侧滑入 */}
        <MotionDiv
          initial={{ opacity: 0, x: -100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 1 }}
          className="p-4 bg-purple-100 rounded-lg"
        >
          从左侧滑入 + 淡入效果
        </MotionDiv>

        {/* 缩放 + 淡入 */}
        <MotionDiv
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 1.5 }}
          className="p-4 bg-pink-100 rounded-lg"
        >
          缩放 + 淡入效果
        </MotionDiv>
      </section>

      {/* 4. 滚动触发动画 */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">4. 滚动触发动画</h2>
        
        {Array.from({ length: 5 }, (_, i) => (
          <MotionDiv
            key={i}
            initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ 
              duration: 0.6, 
              delay: i * 0.1,
              ease: 'easeOut'
            }}
            className="p-4 bg-gradient-to-r from-cyan-100 to-blue-100 rounded-lg"
          >
            滚动触发的动画卡片 #{i + 1}
          </MotionDiv>
        ))}
      </section>

      {/* 5. 状态切换动画 */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">5. 状态切换动画</h2>
        
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          切换显示状态
        </button>

        <MotionDiv
          initial={{ opacity: 0, height: 0 }}
          animate={{ 
            opacity: isVisible ? 1 : 0,
            height: isVisible ? 'auto' : 0
          }}
          transition={{ duration: 0.5 }}
          className="overflow-hidden"
        >
          <div className="p-4 bg-yellow-100 rounded-lg">
            这是一个可以切换显示/隐藏的内容区域！
            <br />
            使用 Framer Motion 实现平滑的高度和透明度动画。
          </div>
        </MotionDiv>
      </section>

      {/* 6. CSS 动画示例 */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">6. CSS 动画效果</h2>
        
        {/* 脉冲效果 */}
        <div className="animate-pulse p-4 bg-red-100 rounded-lg">
          CSS 脉冲动画 (animate-pulse)
        </div>

        {/* 弹跳效果 */}
        <div className="animate-bounce p-4 bg-green-100 rounded-lg inline-block">
          CSS 弹跳动画 (animate-bounce)
        </div>

        {/* 旋转效果 */}
        <div className="animate-spin w-8 h-8 bg-blue-500 rounded-full mx-auto"></div>
        <p className="text-center text-sm text-gray-600">CSS 旋转动画</p>
      </section>
    </div>
  )
}

// 使用示例
export default function AnimationDemoPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <AnimationDemo />
    </div>
  )
}