# 掌握现代Python测试：pytest与uv工具完全指南

在Python项目开发中，自动化测试是保证代码质量的关键。本文将深入解析如何使用现代化的测试工具组合——pytest测试框架和uv包管理器，让你的测试工作更高效、更可靠。

## 什么是uv？

<div className="uv-intro bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 my-8">
  <div className="flex items-start gap-4">
    <div className="icon-box">
      <span className="text-5xl">⚡</span>
    </div>
    <div className="content flex-1">
      <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-4">uv - 极速Python包管理器</h3>
      <p className="text-gray-700 dark:text-gray-300 mb-4">
        uv是一个用Rust编写的新一代Python包安装和项目管理工具，以其极高的速度而闻名。它可以看作是pip和venv的极速替代品。
      </p>
      <div className="features grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="feature-card bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🚀</span>
            <span className="font-semibold text-gray-800 dark:text-gray-200">速度极快</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            比pip快10-100倍的安装速度
          </p>
        </div>
        <div className="feature-card bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🔒</span>
            <span className="font-semibold text-gray-800 dark:text-gray-200">环境隔离</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            自动管理虚拟环境，避免依赖冲突
          </p>
        </div>
        <div className="feature-card bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🎯</span>
            <span className="font-semibold text-gray-800 dark:text-gray-200">简单易用</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            一个命令搞定环境和执行
          </p>
        </div>
      </div>
    </div>
  </div>
</div>

## 命令详解：两个实战示例

让我们通过两个实际的pytest命令来深入理解每个参数的作用。

### 命令一：运行所有测试

```bash
uv run pytest tests/ -v --tb=short -q
```

<div className="command-breakdown my-8">
  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6">
    <h4 className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-6 flex items-center gap-2">
      <span className="text-2xl">🔍</span> 命令分解
    </h4>
    
    <div className="parts-container space-y-4">
      <!-- uv run -->
      <div className="part-item flex items-start gap-4">
        <div className="part-label min-w-[120px]">
          <code className="bg-blue-100 dark:bg-blue-900/50 px-3 py-1 rounded text-sm font-mono">uv run</code>
        </div>
        <div className="part-description flex-1">
          <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1">在虚拟环境中执行</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            确保pytest在项目的隔离环境中运行，包含所有必要的依赖。相当于自动激活虚拟环境并执行命令。
          </p>
        </div>
      </div>
      
      <!-- pytest -->
      <div className="part-item flex items-start gap-4">
        <div className="part-label min-w-[120px]">
          <code className="bg-green-100 dark:bg-green-900/50 px-3 py-1 rounded text-sm font-mono">pytest</code>
        </div>
        <div className="part-description flex-1">
          <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1">测试框架</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Python最流行的测试框架，自动发现和运行测试。
          </p>
        </div>
      </div>
      
      <!-- tests/ -->
      <div className="part-item flex items-start gap-4">
        <div className="part-label min-w-[120px]">
          <code className="bg-purple-100 dark:bg-purple-900/50 px-3 py-1 rounded text-sm font-mono">tests/</code>
        </div>
        <div className="part-description flex-1">
          <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1">测试目录</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            指定测试文件的位置。pytest会递归搜索所有test_*.py或*_test.py文件。
          </p>
        </div>
      </div>
      
      <!-- -v -->
      <div className="part-item flex items-start gap-4">
        <div className="part-label min-w-[120px]">
          <code className="bg-yellow-100 dark:bg-yellow-900/50 px-3 py-1 rounded text-sm font-mono">-v</code>
        </div>
        <div className="part-description flex-1">
          <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1">详细输出 (verbose)</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            显示每个测试函数的名称和结果，而不只是简单的点号。
          </p>
          <div className="example-output bg-gray-100 dark:bg-gray-700 p-3 rounded mt-2">
            <p className="text-xs font-mono">
              <span className="text-green-600">✓</span> test_user_creation PASSED<br/>
              <span className="text-red-600">✗</span> test_user_deletion FAILED
            </p>
          </div>
        </div>
      </div>
      
      <!-- --tb=short -->
      <div className="part-item flex items-start gap-4">
        <div className="part-label min-w-[120px]">
          <code className="bg-orange-100 dark:bg-orange-900/50 px-3 py-1 rounded text-sm font-mono">--tb=short</code>
        </div>
        <div className="part-description flex-1">
          <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1">简短回溯 (traceback)</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            失败时只显示关键错误信息，避免冗长的堆栈跟踪。
          </p>
        </div>
      </div>
      
      <!-- -q -->
      <div className="part-item flex items-start gap-4">
        <div className="part-label min-w-[120px]">
          <code className="bg-red-100 dark:bg-red-900/50 px-3 py-1 rounded text-sm font-mono">-q</code>
        </div>
        <div className="part-description flex-1">
          <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1">安静模式 (quiet)</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            减少pytest的启动信息和元数据输出，让结果更清晰。
          </p>
        </div>
      </div>
    </div>
  </div>
</div>

### 命令二：运行特定测试文件

```bash
uv run pytest tests/test_utils/test_metrics.py -v --tb=short
```

<div className="specific-test-highlight my-8">
  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6">
    <h4 className="text-lg font-bold text-green-600 dark:text-green-400 mb-4">
      🎯 关键区别：精确测试
    </h4>
    <div className="comparison-box bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="broad-test">
          <h5 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">📁 目录测试</h5>
          <code className="block bg-gray-100 dark:bg-gray-700 p-2 rounded text-sm mb-2">tests/</code>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>• 运行所有测试文件</li>
            <li>• 适合全面回归测试</li>
            <li>• CI/CD流程使用</li>
          </ul>
        </div>
        <div className="specific-test">
          <h5 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">📄 文件测试</h5>
          <code className="block bg-gray-100 dark:bg-gray-700 p-2 rounded text-sm mb-2">tests/test_utils/test_metrics.py</code>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>• 只运行指定文件</li>
            <li>• 适合开发时快速验证</li>
            <li>• 节省测试时间</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</div>

## pytest参数完全指南

<div className="parameters-guide my-8">
  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8">
    <h3 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-6">
      ⚙️ 常用参数速查表
    </h3>
    
    <div className="parameters-table">
      <table className="w-full">
        <thead>
          <tr className="border-b-2 border-indigo-200 dark:border-indigo-700">
            <th className="text-left py-3 px-4 font-semibold text-gray-800 dark:text-gray-200">参数</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-800 dark:text-gray-200">作用</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-800 dark:text-gray-200">使用场景</th>
            <th className="text-center py-3 px-4 font-semibold text-gray-800 dark:text-gray-200">推荐度</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          <tr className="hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
            <td className="py-3 px-4">
              <code className="bg-indigo-100 dark:bg-indigo-800/30 px-2 py-1 rounded text-sm">-v/--verbose</code>
            </td>
            <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">详细显示每个测试结果</td>
            <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">几乎总是使用</td>
            <td className="py-3 px-4 text-center">
              <span className="text-green-500">⭐⭐⭐⭐⭐</span>
            </td>
          </tr>
          <tr className="hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
            <td className="py-3 px-4">
              <code className="bg-indigo-100 dark:bg-indigo-800/30 px-2 py-1 rounded text-sm">--tb=short</code>
            </td>
            <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">简化错误堆栈信息</td>
            <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">快速定位问题</td>
            <td className="py-3 px-4 text-center">
              <span className="text-green-500">⭐⭐⭐⭐⭐</span>
            </td>
          </tr>
          <tr className="hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
            <td className="py-3 px-4">
              <code className="bg-indigo-100 dark:bg-indigo-800/30 px-2 py-1 rounded text-sm">-q/--quiet</code>
            </td>
            <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">减少元数据输出</td>
            <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">清洁输出</td>
            <td className="py-3 px-4 text-center">
              <span className="text-yellow-500">⭐⭐⭐</span>
            </td>
          </tr>
          <tr className="hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
            <td className="py-3 px-4">
              <code className="bg-indigo-100 dark:bg-indigo-800/30 px-2 py-1 rounded text-sm">-x</code>
            </td>
            <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">首个失败后停止</td>
            <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">调试单个问题</td>
            <td className="py-3 px-4 text-center">
              <span className="text-yellow-500">⭐⭐⭐⭐</span>
            </td>
          </tr>
          <tr className="hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
            <td className="py-3 px-4">
              <code className="bg-indigo-100 dark:bg-indigo-800/30 px-2 py-1 rounded text-sm">-k "pattern"</code>
            </td>
            <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">运行匹配的测试</td>
            <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">测试特定功能</td>
            <td className="py-3 px-4 text-center">
              <span className="text-yellow-500">⭐⭐⭐</span>
            </td>
          </tr>
          <tr className="hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
            <td className="py-3 px-4">
              <code className="bg-indigo-100 dark:bg-indigo-800/30 px-2 py-1 rounded text-sm">--lf</code>
            </td>
            <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">只运行上次失败的测试</td>
            <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">修复bug后验证</td>
            <td className="py-3 px-4 text-center">
              <span className="text-green-500">⭐⭐⭐⭐</span>
            </td>
          </tr>
          <tr className="hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
            <td className="py-3 px-4">
              <code className="bg-indigo-100 dark:bg-indigo-800/30 px-2 py-1 rounded text-sm">--cov</code>
            </td>
            <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">生成覆盖率报告</td>
            <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">代码质量检查</td>
            <td className="py-3 px-4 text-center">
              <span className="text-green-500">⭐⭐⭐⭐</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>

## 测试范围控制技巧

<div className="scope-control my-8">
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <!-- 目录级别 -->
    <div className="scope-card">
      <div className="bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6">
        <div className="icon-title flex items-center gap-3 mb-4">
          <span className="text-3xl">📁</span>
          <h4 className="text-lg font-bold text-blue-700 dark:text-blue-400">目录级别</h4>
        </div>
        <code className="block bg-white dark:bg-gray-800 p-3 rounded mb-3 text-sm">
          pytest tests/
        </code>
        <ul className="text-sm space-y-2 text-gray-700 dark:text-gray-300">
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <span>运行所有测试</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <span>适合CI/CD</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <span>全面回归测试</span>
          </li>
        </ul>
      </div>
    </div>
    
    <!-- 文件级别 -->
    <div className="scope-card">
      <div className="bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-6">
        <div className="icon-title flex items-center gap-3 mb-4">
          <span className="text-3xl">📄</span>
          <h4 className="text-lg font-bold text-green-700 dark:text-green-400">文件级别</h4>
        </div>
        <code className="block bg-white dark:bg-gray-800 p-3 rounded mb-3 text-sm">
          pytest tests/test_user.py
        </code>
        <ul className="text-sm space-y-2 text-gray-700 dark:text-gray-300">
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <span>测试单个模块</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <span>开发时使用</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <span>快速验证</span>
          </li>
        </ul>
      </div>
    </div>
    
    <!-- 函数级别 -->
    <div className="scope-card">
      <div className="bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-6">
        <div className="icon-title flex items-center gap-3 mb-4">
          <span className="text-3xl">🎯</span>
          <h4 className="text-lg font-bold text-purple-700 dark:text-purple-400">函数级别</h4>
        </div>
        <code className="block bg-white dark:bg-gray-800 p-3 rounded mb-3 text-sm">
          pytest tests/test_user.py::test_login
        </code>
        <ul className="text-sm space-y-2 text-gray-700 dark:text-gray-300">
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <span>调试特定用例</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <span>修复bug时</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <span>最快执行</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</div>

## 最佳实践工作流

<div className="workflow-guide my-8">
  <div className="bg-gradient-to-r from-pink-50 to-rose-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8">
    <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400 mb-6">
      🔄 推荐的测试工作流
    </h3>
    
    <div className="workflow-steps">
      <!-- Step 1: 开发新功能 -->
      <div className="step-item mb-6 flex items-start gap-4">
        <div className="step-number w-10 h-10 bg-rose-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0">
          1
        </div>
        <div className="step-content flex-1">
          <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">开发新功能时</h4>
          <div className="command-box bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">为新功能编写测试后，反复运行：</p>
            <code className="block bg-gray-100 dark:bg-gray-700 p-3 rounded text-sm">
              uv run pytest tests/test_my_feature.py -v --tb=short
            </code>
          </div>
        </div>
      </div>
      
      <!-- Step 2: 修复失败测试 -->
      <div className="step-item mb-6 flex items-start gap-4">
        <div className="step-number w-10 h-10 bg-rose-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0">
          2
        </div>
        <div className="step-content flex-1">
          <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">定位失败测试</h4>
          <div className="command-box bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">只运行失败的特定测试：</p>
            <code className="block bg-gray-100 dark:bg-gray-700 p-3 rounded text-sm">
              uv run pytest tests/test_my_feature.py::test_specific_case -v -x
            </code>
          </div>
        </div>
      </div>
      
      <!-- Step 3: 提交前验证 -->
      <div className="step-item mb-6 flex items-start gap-4">
        <div className="step-number w-10 h-10 bg-rose-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0">
          3
        </div>
        <div className="step-content flex-1">
          <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">提交代码前</h4>
          <div className="command-box bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">运行完整测试套件：</p>
            <code className="block bg-gray-100 dark:bg-gray-700 p-3 rounded text-sm">
              uv run pytest tests/ -v --tb=short
            </code>
          </div>
        </div>
      </div>
      
      <!-- Step 4: 持续集成 -->
      <div className="step-item flex items-start gap-4">
        <div className="step-number w-10 h-10 bg-rose-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0">
          4
        </div>
        <div className="step-content flex-1">
          <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">CI/CD配置</h4>
          <div className="command-box bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">在CI中添加覆盖率检查：</p>
            <code className="block bg-gray-100 dark:bg-gray-700 p-3 rounded text-sm">
              uv run pytest tests/ --cov=src --cov-report=html
            </code>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

## 高级技巧

<div className="advanced-tips my-8">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <!-- 并行测试 -->
    <div className="tip-card">
      <div className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-xl p-6">
        <h4 className="text-lg font-bold text-teal-700 dark:text-teal-400 mb-3 flex items-center gap-2">
          <span className="text-2xl">⚡</span> 并行运行测试
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          使用pytest-xdist插件可以并行运行测试，大幅提升速度：
        </p>
        <code className="block bg-white dark:bg-gray-800 p-3 rounded text-sm">
          uv run pytest tests/ -n auto
        </code>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
          -n auto 会自动使用所有CPU核心
        </p>
      </div>
    </div>
    
    <!-- 标记测试 -->
    <div className="tip-card">
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-6">
        <h4 className="text-lg font-bold text-amber-700 dark:text-amber-400 mb-3 flex items-center gap-2">
          <span className="text-2xl">🏷️</span> 使用标记分组
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          给测试添加标记，按需运行不同分组：
        </p>
        <code className="block bg-white dark:bg-gray-800 p-3 rounded text-sm mb-2">
          @pytest.mark.slow<br/>
          def test_database_operation():
        </code>
        <code className="block bg-white dark:bg-gray-800 p-3 rounded text-sm">
          uv run pytest -m "not slow"
        </code>
      </div>
    </div>
  </div>
</div>

## 常见问题排查

<div className="troubleshooting my-8">
  <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6">
    <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4">
      🔧 问题排查指南
    </h3>
    
    <div className="issues-list space-y-4">
      <div className="issue-item bg-white dark:bg-gray-800 p-4 rounded-lg">
        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">测试无法被发现</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">确保测试文件和函数遵循命名规范：</p>
        <ul className="text-sm space-y-1 ml-4">
          <li>• 文件名：test_*.py 或 *_test.py</li>
          <li>• 函数名：test_ 开头</li>
          <li>• 类名：Test 开头</li>
        </ul>
      </div>
      
      <div className="issue-item bg-white dark:bg-gray-800 p-4 rounded-lg">
        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">导入错误</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">确保项目根目录有__init__.py或使用：</p>
        <code className="block bg-gray-100 dark:bg-gray-700 p-2 rounded text-sm">
          uv run pytest --pythonpath=.
        </code>
      </div>
      
      <div className="issue-item bg-white dark:bg-gray-800 p-4 rounded-lg">
        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">测试速度慢</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">考虑：</p>
        <ul className="text-sm space-y-1 ml-4 mt-2">
          <li>• 使用 -x 快速失败</li>
          <li>• 使用 --lf 只运行失败的</li>
          <li>• 使用 -n auto 并行运行</li>
        </ul>
      </div>
    </div>
  </div>
</div>

## 总结

掌握pytest和uv的组合使用，可以让你的Python测试工作变得高效而愉快：

1. **uv提供了极速的包管理**：不再需要等待漫长的依赖安装
2. **pytest提供了强大的测试能力**：灵活的参数让测试更精准
3. **合理的工作流**：从单个测试到全面回归，层层递进

记住最重要的原则：
- 开发时频繁运行小范围测试
- 提交前运行全量测试
- 善用参数组合提高效率

现在，你已经掌握了现代Python测试的精髓，是时候在你的项目中实践了！

## 相关资源

- [pytest官方文档](https://docs.pytest.org/)
- [uv项目主页](https://github.com/astral-sh/uv)
- [pytest最佳实践](https://docs.pytest.org/en/latest/explanation/goodpractices.html)
- [Python测试自动化](https://realpython.com/pytest-python-testing/)