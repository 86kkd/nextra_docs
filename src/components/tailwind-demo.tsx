/**
 * Tailwind CSS 交互式教程演示组件
 * 每个类名都有实时的视觉效果展示
 */

'use client'

import { useState } from 'react'

export function TailwindDemo() {
  const [activeTab, setActiveTab] = useState('width')

  return (
    <div className="my-8">
      {/* 标签页导航 */}
      <div className="flex flex-wrap gap-2 mb-6 border-b">
        {['width', 'margin', 'padding', 'text', 'color', 'border', 'shadow', 'flex'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium transition-colors ${activeTab === tab
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
              }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* 宽度演示 */}
      {activeTab === 'width' && <WidthDemo />}

      {/* 外边距演示 */}
      {activeTab === 'margin' && <MarginDemo />}

      {/* 内边距演示 */}
      {activeTab === 'padding' && <PaddingDemo />}

      {/* 文字演示 */}
      {activeTab === 'text' && <TextDemo />}

      {/* 颜色演示 */}
      {activeTab === 'color' && <ColorDemo />}

      {/* 边框演示 */}
      {activeTab === 'border' && <BorderDemo />}

      {/* 阴影演示 */}
      {activeTab === 'shadow' && <ShadowDemo />}

      {/* Flex 布局演示 */}
      {activeTab === 'flex' && <FlexDemo />}
    </div>
  )
}

// 宽度演示组件
function WidthDemo() {
  return (
    <div className="space-y-6 bg-gray-50 p-6 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">🎯 宽度控制实时演示</h3>

      {/* 父容器参考线 */}
      <div className="relative border-2 border-dashed border-gray-400 p-4">
        <div className="absolute top-0 left-0 bg-gray-600 text-white text-xs px-2 py-1">
          父容器 (100% 宽度)
        </div>

        {/* w-full 演示 */}
        <div className="mt-8 mb-4">
          <code className="text-sm text-gray-600">w-full</code>
          <div className="w-full bg-blue-200 p-2 text-center">
            占满父容器宽度 (100%)
          </div>
        </div>

        {/* w-1/2 演示 */}
        <div className="mb-4">
          <code className="text-sm text-gray-600">w-1/2</code>
          <div className="w-1/2 bg-green-200 p-2 text-center">
            占一半宽度 (50%)
          </div>
        </div>

        {/* w-1/3 演示 */}
        <div className="mb-4">
          <code className="text-sm text-gray-600">w-1/3</code>
          <div className="w-1/3 bg-yellow-200 p-2 text-center">
            占 1/3 宽度
          </div>
        </div>

        {/* w-64 演示 */}
        <div className="mb-4">
          <code className="text-sm text-gray-600">w-64</code>
          <div className="w-64 bg-purple-200 p-2 text-center">
            固定 256px 宽度
          </div>
        </div>
      </div>

      {/* max-w 演示 */}
      <div className="border-2 border-dashed border-gray-400 p-4">
        <h4 className="font-semibold mb-3">最大宽度限制 (max-w)</h4>
        <p className="text-sm text-gray-600 mb-4">调整浏览器窗口大小查看效果</p>

        <div className="space-y-3">
          <div>
            <code className="text-sm text-gray-600">max-w-sm (384px)</code>
            <div className="max-w-sm bg-red-100 p-2">内容不会超过 384px</div>
          </div>

          <div>
            <code className="text-sm text-gray-600">max-w-md (448px)</code>
            <div className="max-w-md bg-blue-100 p-2">内容不会超过 448px</div>
          </div>

          <div>
            <code className="text-sm text-gray-600">max-w-lg (512px)</code>
            <div className="max-w-lg bg-green-100 p-2">内容不会超过 512px</div>
          </div>

          <div>
            <code className="text-sm text-gray-600">max-w-xl (576px)</code>
            <div className="max-w-xl bg-yellow-100 p-2">内容不会超过 576px</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 外边距演示组件
function MarginDemo() {
  return (
    <div className="space-y-6 bg-gray-50 p-6 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">📐 外边距实时演示</h3>

      {/* 四周外边距 */}
      <div className="bg-white p-4 rounded">
        <h4 className="font-semibold mb-3">四周外边距</h4>
        <div className="bg-gray-200 p-2">
          <div className="m-0 bg-blue-200 p-2">m-0 (无外边距)</div>
        </div>
        <div className="bg-gray-200 p-2 mt-2">
          <div className="m-2 bg-blue-200 p-2">m-2 (8px)</div>
        </div>
        <div className="bg-gray-200 p-2 mt-2">
          <div className="m-4 bg-blue-200 p-2">m-4 (16px)</div>
        </div>
        <div className="bg-gray-200 p-2 mt-2">
          <div className="m-8 bg-blue-200 p-2">m-8 (32px)</div>
        </div>
      </div>

      {/* 水平居中 */}
      <div className="bg-white p-4 rounded">
        <h4 className="font-semibold mb-3">水平居中 (mx-auto)</h4>
        <div className="bg-gray-200 p-4">
          <div className="w-32 mx-auto bg-green-200 p-2 text-center">
            mx-auto 居中
          </div>
        </div>
      </div>

      {/* 方向性外边距 */}
      <div className="bg-white p-4 rounded">
        <h4 className="font-semibold mb-3">方向性外边距</h4>
        <div className="space-y-2">
          <div className="bg-gray-200 p-2">
            <div className="mt-4 bg-yellow-200 p-2">mt-4 (顶部 16px)</div>
          </div>
          <div className="bg-gray-200 p-2">
            <div className="mb-4 bg-yellow-200 p-2">mb-4 (底部 16px)</div>
          </div>
          <div className="bg-gray-200 p-2">
            <div className="ml-4 bg-yellow-200 p-2">ml-4 (左侧 16px)</div>
          </div>
          <div className="bg-gray-200 p-2">
            <div className="mr-4 bg-yellow-200 p-2">mr-4 (右侧 16px)</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 内边距演示组件
function PaddingDemo() {
  return (
    <div className="space-y-6 bg-gray-50 p-6 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">📦 内边距实时演示</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded">
          <div className="p-0 bg-red-100 border-2 border-red-300">
            <div className="bg-red-300 text-center">p-0 (无内边距)</div>
          </div>
        </div>

        <div className="bg-white rounded">
          <div className="p-2 bg-blue-100 border-2 border-blue-300">
            <div className="bg-blue-300 text-center">p-2 (8px)</div>
          </div>
        </div>

        <div className="bg-white rounded">
          <div className="p-4 bg-green-100 border-2 border-green-300">
            <div className="bg-green-300 text-center">p-4 (16px)</div>
          </div>
        </div>

        <div className="bg-white rounded">
          <div className="p-8 bg-purple-100 border-2 border-purple-300">
            <div className="bg-purple-300 text-center">p-8 (32px)</div>
          </div>
        </div>
      </div>

      {/* 方向性内边距 */}
      <div className="bg-white p-4 rounded">
        <h4 className="font-semibold mb-3">方向性内边距</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="px-8 py-2 bg-yellow-100 border-2 border-yellow-300">
            <div className="bg-yellow-300 text-center">px-8 py-2</div>
          </div>
          <div className="px-2 py-8 bg-pink-100 border-2 border-pink-300">
            <div className="bg-pink-300 text-center">px-2 py-8</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 文字演示组件
function TextDemo() {
  return (
    <div className="space-y-6 bg-gray-50 p-6 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">✏️ 文字样式实时演示</h3>

      {/* 字体大小 */}
      <div className="bg-white p-4 rounded">
        <h4 className="font-semibold mb-3">字体大小</h4>
        <div className="space-y-2">
          <p className="text-xs">text-xs - 极小文字 (12px)</p>
          <p className="text-sm">text-sm - 小文字 (14px)</p>
          <p className="text-base">text-base - 基础文字 (16px)</p>
          <p className="text-lg">text-lg - 大文字 (18px)</p>
          <p className="text-xl">text-xl - 特大文字 (20px)</p>
          <p className="text-2xl">text-2xl - 超大文字 (24px)</p>
          <p className="text-3xl">text-3xl - 巨大文字 (30px)</p>
          <p className="text-4xl">text-4xl - 最大文字 (36px)</p>
        </div>
      </div>

      {/* 字体粗细 */}
      <div className="bg-white p-4 rounded">
        <h4 className="font-semibold mb-3">字体粗细</h4>
        <div className="space-y-2 text-lg">
          <p className="font-thin">font-thin - 极细 (100)</p>
          <p className="font-light">font-light - 细 (300)</p>
          <p className="font-normal">font-normal - 正常 (400)</p>
          <p className="font-medium">font-medium - 中等 (500)</p>
          <p className="font-semibold">font-semibold - 半粗 (600)</p>
          <p className="font-bold">font-bold - 粗体 (700)</p>
          <p className="font-extrabold">font-extrabold - 特粗 (800)</p>
        </div>
      </div>

      {/* 文字对齐 */}
      <div className="bg-white p-4 rounded">
        <h4 className="font-semibold mb-3">文字对齐</h4>
        <div className="space-y-2">
          <p className="text-left bg-gray-100 p-2">text-left - 左对齐</p>
          <p className="text-center bg-gray-100 p-2">text-center - 居中对齐</p>
          <p className="text-right bg-gray-100 p-2">text-right - 右对齐</p>
        </div>
      </div>
    </div>
  )
}

// 颜色演示组件
function ColorDemo() {
  return (
    <div className="space-y-6 bg-gray-50 p-6 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">🎨 颜色实时演示</h3>

      {/* 文字颜色 */}
      <div className="bg-white p-4 rounded">
        <h4 className="font-semibold mb-3">文字颜色</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-lg font-medium">
          <p className="text-gray-400">text-gray-400</p>
          <p className="text-gray-600">text-gray-600</p>
          <p className="text-gray-800">text-gray-800</p>
          <p className="text-red-500">text-red-500</p>
          <p className="text-blue-500">text-blue-500</p>
          <p className="text-green-500">text-green-500</p>
          <p className="text-yellow-500">text-yellow-500</p>
          <p className="text-purple-500">text-purple-500</p>
          <p className="text-pink-500">text-pink-500</p>
        </div>
      </div>

      {/* 背景颜色 */}
      <div className="bg-white p-4 rounded">
        <h4 className="font-semibold mb-3">背景颜色</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="bg-gray-100 p-3 text-center rounded">bg-gray-100</div>
          <div className="bg-gray-200 p-3 text-center rounded">bg-gray-200</div>
          <div className="bg-gray-300 p-3 text-center rounded">bg-gray-300</div>
          <div className="bg-red-100 p-3 text-center rounded">bg-red-100</div>
          <div className="bg-blue-100 p-3 text-center rounded">bg-blue-100</div>
          <div className="bg-green-100 p-3 text-center rounded">bg-green-100</div>
          <div className="bg-yellow-100 p-3 text-center rounded">bg-yellow-100</div>
          <div className="bg-purple-100 p-3 text-center rounded">bg-purple-100</div>
          <div className="bg-pink-100 p-3 text-center rounded">bg-pink-100</div>
        </div>
      </div>

      {/* 颜色深度 */}
      <div className="bg-white p-4 rounded">
        <h4 className="font-semibold mb-3">颜色深度规律 (以蓝色为例)</h4>
        <div className="space-y-2">
          <div className="bg-blue-100 p-2 text-gray-800">bg-blue-100 (最浅)</div>
          <div className="bg-blue-200 p-2 text-gray-800">bg-blue-200</div>
          <div className="bg-blue-300 p-2 text-gray-800">bg-blue-300</div>
          <div className="bg-blue-400 p-2 text-white">bg-blue-400</div>
          <div className="bg-blue-500 p-2 text-white">bg-blue-500 (标准)</div>
          <div className="bg-blue-600 p-2 text-white">bg-blue-600</div>
          <div className="bg-blue-700 p-2 text-white">bg-blue-700</div>
          <div className="bg-blue-800 p-2 text-white">bg-blue-800</div>
          <div className="bg-blue-900 p-2 text-white">bg-blue-900 (最深)</div>
        </div>
      </div>
    </div>
  )
}

// 边框演示组件
function BorderDemo() {
  return (
    <div className="space-y-6 bg-gray-50 p-6 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">🔲 边框实时演示</h3>

      {/* 边框宽度 */}
      <div className="bg-white p-4 rounded">
        <h4 className="font-semibold mb-3">边框宽度</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="border-0 border-gray-400 p-3 text-center bg-gray-50">
            border-0 (无边框)
          </div>
          <div className="border border-gray-400 p-3 text-center">
            border (1px)
          </div>
          <div className="border-2 border-gray-400 p-3 text-center">
            border-2 (2px)
          </div>
          <div className="border-4 border-gray-400 p-3 text-center">
            border-4 (4px)
          </div>
          <div className="border-8 border-gray-400 p-3 text-center">
            border-8 (8px)
          </div>
        </div>
      </div>

      {/* 边框颜色 */}
      <div className="bg-white p-4 rounded">
        <h4 className="font-semibold mb-3">边框颜色</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="border-2 border-gray-300 p-3 text-center">
            border-gray-300
          </div>
          <div className="border-2 border-red-500 p-3 text-center">
            border-red-500
          </div>
          <div className="border-2 border-blue-500 p-3 text-center">
            border-blue-500
          </div>
          <div className="border-2 border-green-500 p-3 text-center">
            border-green-500
          </div>
          <div className="border-2 border-yellow-500 p-3 text-center">
            border-yellow-500
          </div>
          <div className="border-2 border-purple-500 p-3 text-center">
            border-purple-500
          </div>
        </div>
      </div>

      {/* 圆角 */}
      <div className="bg-white p-4 rounded">
        <h4 className="font-semibold mb-3">圆角</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="border-2 border-gray-400 p-3 text-center rounded-none">
            rounded-none
          </div>
          <div className="border-2 border-gray-400 p-3 text-center rounded-sm">
            rounded-sm
          </div>
          <div className="border-2 border-gray-400 p-3 text-center rounded">
            rounded
          </div>
          <div className="border-2 border-gray-400 p-3 text-center rounded-md">
            rounded-md
          </div>
          <div className="border-2 border-gray-400 p-3 text-center rounded-lg">
            rounded-lg
          </div>
          <div className="border-2 border-gray-400 p-3 text-center rounded-xl">
            rounded-xl
          </div>
          <div className="border-2 border-gray-400 p-3 text-center rounded-2xl">
            rounded-2xl
          </div>
          <div className="border-2 border-gray-400 p-3 text-center rounded-full">
            rounded-full
          </div>
        </div>
      </div>
    </div>
  )
}

// 阴影演示组件
function ShadowDemo() {
  return (
    <div className="space-y-6 bg-gray-50 p-6 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">🌟 阴影实时演示</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-4 rounded text-center">
          无阴影
        </div>
        <div className="bg-white p-4 rounded shadow-sm text-center">
          shadow-sm
        </div>
        <div className="bg-white p-4 rounded shadow text-center">
          shadow
        </div>
        <div className="bg-white p-4 rounded shadow-md text-center">
          shadow-md
        </div>
        <div className="bg-white p-4 rounded shadow-lg text-center">
          shadow-lg
        </div>
        <div className="bg-white p-4 rounded shadow-xl text-center">
          shadow-xl
        </div>
        <div className="bg-white p-4 rounded shadow-2xl text-center">
          shadow-2xl
        </div>
      </div>

      {/* 彩色阴影 */}
      <div className="bg-white p-4 rounded">
        <h4 className="font-semibold mb-3">悬停效果</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded shadow hover:shadow-lg transition-shadow text-center cursor-pointer">
            悬停查看效果
            <br />
            <span className="text-sm text-gray-500">hover:shadow-lg</span>
          </div>
          <div className="bg-white p-4 rounded shadow-md hover:shadow-xl transition-shadow text-center cursor-pointer">
            悬停查看效果
            <br />
            <span className="text-sm text-gray-500">hover:shadow-xl</span>
          </div>
          <div className="bg-white p-4 rounded shadow-lg hover:shadow-2xl transition-shadow text-center cursor-pointer">
            悬停查看效果
            <br />
            <span className="text-sm text-gray-500">hover:shadow-2xl</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Flex 布局演示组件
function FlexDemo() {
  return (
    <div className="space-y-6 bg-gray-50 p-6 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">🎯 Flexbox 布局实时演示</h3>

      {/* flex-direction */}
      <div className="bg-white p-4 rounded">
        <h4 className="font-semibold mb-3">排列方向</h4>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">flex flex-row (水平排列)</p>
          <div className="flex flex-row gap-2 bg-gray-100 p-3">
            <div className="bg-blue-200 p-2">项目 1</div>
            <div className="bg-blue-300 p-2">项目 2</div>
            <div className="bg-blue-400 p-2">项目 3</div>
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-600 mb-2">flex flex-col (垂直排列)</p>
          <div className="flex flex-col gap-2 bg-gray-100 p-3">
            <div className="bg-green-200 p-2">项目 1</div>
            <div className="bg-green-300 p-2">项目 2</div>
            <div className="bg-green-400 p-2">项目 3</div>
          </div>
        </div>
      </div>

      {/* justify-content */}
      <div className="bg-white p-4 rounded">
        <h4 className="font-semibold mb-3">主轴对齐 (justify)</h4>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">justify-start</p>
            <div className="flex justify-start gap-2 bg-gray-100 p-3">
              <div className="bg-red-200 p-2">1</div>
              <div className="bg-red-300 p-2">2</div>
              <div className="bg-red-400 p-2">3</div>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-2">justify-center</p>
            <div className="flex justify-center gap-2 bg-gray-100 p-3">
              <div className="bg-yellow-200 p-2">1</div>
              <div className="bg-yellow-300 p-2">2</div>
              <div className="bg-yellow-400 p-2">3</div>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-2">justify-end</p>
            <div className="flex justify-end gap-2 bg-gray-100 p-3">
              <div className="bg-green-200 p-2">1</div>
              <div className="bg-green-300 p-2">2</div>
              <div className="bg-green-400 p-2">3</div>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-2">justify-between</p>
            <div className="flex justify-between bg-gray-100 p-3">
              <div className="bg-blue-200 p-2">1</div>
              <div className="bg-blue-300 p-2">2</div>
              <div className="bg-blue-400 p-2">3</div>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-2">justify-around</p>
            <div className="flex justify-around bg-gray-100 p-3">
              <div className="bg-purple-200 p-2">1</div>
              <div className="bg-purple-300 p-2">2</div>
              <div className="bg-purple-400 p-2">3</div>
            </div>
          </div>
        </div>
      </div>

      {/* align-items */}
      <div className="bg-white p-4 rounded">
        <h4 className="font-semibold mb-3">交叉轴对齐 (items)</h4>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">items-start</p>
            <div className="flex items-start gap-2 bg-gray-100 p-3 h-24">
              <div className="bg-pink-200 p-2">1</div>
              <div className="bg-pink-300 p-2 text-2xl">2</div>
              <div className="bg-pink-400 p-2">3</div>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-2">items-center</p>
            <div className="flex items-center gap-2 bg-gray-100 p-3 h-24">
              <div className="bg-indigo-200 p-2">1</div>
              <div className="bg-indigo-300 p-2 text-2xl">2</div>
              <div className="bg-indigo-400 p-2">3</div>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-2">items-end</p>
            <div className="flex items-end gap-2 bg-gray-100 p-3 h-24">
              <div className="bg-teal-200 p-2">1</div>
              <div className="bg-teal-300 p-2 text-2xl">2</div>
              <div className="bg-teal-400 p-2">3</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TailwindDemo
