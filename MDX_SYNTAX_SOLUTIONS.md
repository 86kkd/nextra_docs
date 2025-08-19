# MDX 语法高亮解决方案

## 当前解决方案 (.nvimrc)
- ✅ 自动文件类型检测
- ✅ 基础语法高亮 (基于 markdown)
- ✅ LSP 支持 (mdx-analyzer)
- ✅ 项目级别配置，不影响全局

## 进阶解决方案

### 1. Tree-sitter MDX 支持
如果你使用 nvim-treesitter，可以添加：

```lua
-- 在你的 treesitter 配置中
require('nvim-treesitter.configs').setup({
  ensure_installed = {
    "markdown",
    "markdown_inline", 
    "tsx",             -- 用于 JSX 部分
    "typescript",      -- 用于 TypeScript
    "javascript",      -- 用于 JavaScript
  },
  highlight = {
    enable = true,
    additional_vim_regex_highlighting = false,
  },
})
```

### 2. 专门的 MDX 插件
推荐插件：
- `davidmh/mdx.nvim` - 专门的 MDX 支持
- `iamcco/markdown-preview.nvim` - Markdown 预览（支持 MDX）

### 3. 安装 davidmh/mdx.nvim
如果你使用 lazy.nvim：

```lua
{
  'davidmh/mdx.nvim',
  config = true,
  dependencies = { "nvim-treesitter/nvim-treesitter" }
}
```

如果你使用 packer.nvim：

```lua
use {
  'davidmh/mdx.nvim',
  config = function()
    require('mdx').setup()
  end,
  requires = { "nvim-treesitter/nvim-treesitter" }
}
```

## 测试步骤

1. **重启 Neovim** 或在项目目录运行 `:source .nvimrc`
2. **打开 MDX 文件**: `:edit src/content/index.mdx`
3. **检查状态**: `:MdxInfo`
4. **查看语法高亮**: 应该能看到不同颜色的语法高亮

## 预期结果

- ✅ 文件类型自动识别为 `mdx`
- ✅ mdx-analyzer 自动 attach
- ✅ 基本的语法高亮 (标题、代码块、链接等)
- ✅ JSX/React 组件高亮
- ✅ Import/Export 语句高亮

## 故障排除

如果还是没有语法高亮：

1. **检查文件类型**: `:echo &filetype` 应该显示 `mdx`
2. **检查语法**: `:echo &syntax` 应该显示 `mdx` 或 `markdown`
3. **手动加载语法**: `:syntax on` 然后 `:setlocal syntax=markdown`
4. **查看错误**: `:messages` 查看是否有错误信息

## 为什么选择这个方案

1. **不修改全局配置** - 只在当前项目生效
2. **Mason 兼容** - 不干扰你的 Mason 配置
3. **渐进式增强** - 从基础功能开始，可以逐步添加更多功能
4. **调试友好** - 提供了 :MdxInfo 命令帮助诊断问题