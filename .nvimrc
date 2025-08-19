-- 项目级别的 Neovim 配置
-- 这个文件只在当前项目中生效，不影响全局配置

-- 1. 文件类型检测 - 解决 MDX 不被识别的问题
vim.filetype.add({
  extension = {
    mdx = 'mdx',
  },
  pattern = {
    ['.*%.mdx'] = 'mdx',
  },
})

-- 2. 确保 MDX 文件总是被正确识别
vim.api.nvim_create_autocmd({"BufRead", "BufNewFile"}, {
  pattern = "*.mdx",
  callback = function()
    vim.bo.filetype = 'mdx'
    print("✅ 文件类型设置为: mdx")
  end,
})

-- 3. MDX 语法高亮解决方案
vim.api.nvim_create_autocmd("FileType", {
  pattern = "mdx",
  callback = function()
    -- 使用 markdown 语法作为基础
    vim.cmd('runtime! syntax/markdown.vim')
    
    -- 设置 MDX 特定的语法高亮
    vim.cmd([[
      syn region mdxJSXBlock start=/{/ end=/}/ contains=@javascript
      syn region mdxImport start=/^import/ end=/$/ contains=@javascript
      syn region mdxExport start=/^export/ end=/$/ contains=@javascript
      
      hi link mdxJSXBlock Special
      hi link mdxImport PreProc
      hi link mdxExport PreProc
    ]])
    
    print("🎨 MDX 语法高亮已加载")
  end,
})

-- 4. Tree-sitter 配置 (如果你有安装)
pcall(function()
  -- 为 MDX 注册 markdown parser
  vim.treesitter.language.register("markdown", "mdx")
  print("🌳 Tree-sitter: 为 MDX 注册了 markdown parser")
end)

-- 5. MDX 特定的编辑器设置
vim.api.nvim_create_autocmd("FileType", {
  pattern = "mdx",
  callback = function()
    -- 设置缩进
    vim.opt_local.shiftwidth = 2
    vim.opt_local.tabstop = 2
    vim.opt_local.expandtab = true
    
    -- 设置折叠
    vim.opt_local.foldmethod = 'syntax'
    vim.opt_local.foldlevel = 99
    
    -- 启用拼写检查（对文档很有用）
    vim.opt_local.spell = true
    vim.opt_local.spelllang = 'en,cjk'
    
    -- 启用自动换行
    vim.opt_local.wrap = true
    vim.opt_local.linebreak = true
    
    print("⚙️ MDX 编辑器设置已应用")
  end,
})

-- 6. 调试命令
vim.api.nvim_create_user_command('MdxInfo', function()
  print("=== MDX 状态信息 ===")
  print("文件: " .. vim.fn.expand('%'))
  print("文件类型: " .. vim.bo.filetype)
  print("语法: " .. vim.bo.syntax)
  
  -- Tree-sitter 信息
  local ts_ok, ts_lang = pcall(vim.treesitter.language.get_lang, vim.bo.filetype)
  if ts_ok and ts_lang then
    print("Tree-sitter 语言: " .. ts_lang)
  else
    print("Tree-sitter: 未配置")
  end
  
  -- LSP 信息
  local clients = vim.lsp.get_active_clients({ bufnr = 0 })
  print("活动 LSP: " .. #clients .. " 个")
  for _, client in ipairs(clients) do
    print("  - " .. client.name)
  end
end, {})

print("📝 MDX 项目配置已加载！使用 :MdxInfo 查看状态")