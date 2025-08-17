/**
 * className 效果演示
 * 展示不同 CSS 类名的视觉效果
 */

'use client'

export function ClassNameDemo() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">

      {/* 1. 容器类名效果演示 */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-center mb-6">容器类名效果</h2>

        {/* 无样式的基础容器 */}
        <div className="mb-4 bg-red-100 border border-red-300">
          <p className="p-2">无样式容器 - 占满全宽</p>
        </div>

        {/* 应用 max-w-4xl mx-auto */}
        <div className="max-w-4xl mx-auto bg-blue-100 border border-blue-300">
          <p className="p-2">max-w-4xl mx-auto - 最大宽度限制 + 居中</p>
        </div>

        {/* 添加内边距 */}
        <div className="max-w-4xl mx-auto p-8 bg-green-100 border border-green-300 mt-4">
          <p>max-w-4xl mx-auto p-8 - 添加了 32px 内边距</p>
        </div>
      </section>

      {/* 2. 文字类名效果演示 */}
      <section className="max-w-4xl mx-auto mb-12">
        <h2 className="text-2xl font-bold text-center mb-6">文字类名效果</h2>

        <div className="space-y-6 bg-white p-6 rounded-lg shadow">
          <p className="text-xs">text-xs - 极小文字 (12px)</p>
          <p className="text-sm">text-sm - 小文字 (14px)</p>
          <p className="text-base">text-base - 基础文字 (16px)</p>
          <p className="text-lg">text-lg - 大文字 (18px)</p>
          <p className="text-xl">text-xl - 特大文字 (20px)</p>
          <p className="text-2xl">text-2xl - 超大文字 (24px)</p>
          <p className="text-3xl font-bold">text-3xl font-bold - 巨大粗体 (30px)</p>
          <p className="text-4xl font-bold text-center">text-4xl font-bold text-center - 最大居中粗体 (36px)</p>
        </div>
      </section>

      {/* 3. 间距类名效果演示 */}
      <section className="max-w-4xl mx-auto mb-12">
        <h2 className="text-2xl font-bold text-center mb-6">间距类名效果</h2>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">space-y 效果演示</h3>

          {/* space-y-2 */}
          <div className="space-y-2 mb-6 bg-gray-50 p-4 rounded">
            <p className="bg-blue-200 p-2 rounded">space-y-2 项目 1</p>
            <p className="bg-blue-200 p-2 rounded">space-y-2 项目 2</p>
            <p className="bg-blue-200 p-2 rounded">space-y-2 项目 3</p>
          </div>

          {/* space-y-6 */}
          <div className="space-y-6 mb-6 bg-gray-50 p-4 rounded">
            <p className="bg-green-200 p-2 rounded">space-y-6 项目 1</p>
            <p className="bg-green-200 p-2 rounded">space-y-6 项目 2</p>
            <p className="bg-green-200 p-2 rounded">space-y-6 项目 3</p>
          </div>

          {/* space-y-12 */}
          <div className="space-y-12 bg-gray-50 p-4 rounded">
            <p className="bg-purple-200 p-2 rounded">space-y-12 项目 1</p>
            <p className="bg-purple-200 p-2 rounded">space-y-12 项目 2</p>
            <p className="bg-purple-200 p-2 rounded">space-y-12 项目 3</p>
          </div>
        </div>
      </section>

      {/* 4. 渐变文字效果演示 */}
      <section className="max-w-4xl mx-auto mb-12">
        <h2 className="text-2xl font-bold text-center mb-6">渐变文字效果</h2>

        <div className="bg-white p-6 rounded-lg shadow space-y-6">
          <div className="gradient-text text-3xl font-bold text-center">
            这是渐变文字效果
          </div>

          <div className="text-center text-sm text-gray-600">
            使用 gradient-text + text-3xl + font-bold + text-center
          </div>

          {/* 对比普通文字 */}
          <div className="text-3xl font-bold text-center text-gray-800">
            这是普通文字效果
          </div>

          <div className="text-center text-sm text-gray-600">
            使用 text-3xl + font-bold + text-center + text-gray-800
          </div>
        </div>
      </section>

      {/* 5. 组合效果演示 */}
      <section className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-6">完整组合效果</h2>

        <div className="max-w-4xl mx-auto p-8 space-y-13 bg-white rounded-lg shadow-lg">
          <h1 className="text-4xl font-bold text-center mb-8 gradient-text">
            这就是你代码中的效果
          </h1>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">1. 基础渐变文字</h2>
            <div className="gradient-text text-3xl font-bold">
              技术探索与知识分享
            </div>
            <div className="text-sm text-gray-600">
              使用 CSS linear-gradient + background-clip: text 实现
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">2. 说明文字</h2>
            <p className="text-gray-700">
              每个 className 都有特定的作用，组合起来创建完整的布局和样式效果。
            </p>
          </section>
        </div>
      </section>
    </div>
  )
}

export default ClassNameDemo
