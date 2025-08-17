# MDX Language Server Setup for Neovim

## Problem
You have `mdx-analyzer` installed but the LSP isn't working in Neovim for MDX files.

## Solution Steps

### 1. Verify Installation
```bash
# Check if mdx-language-server is in PATH
which mdx-language-server

# Test if it starts
mdx-language-server --help
```

### 2. Configure LSP Client

#### For `nvim-lspconfig` (most common):

Add to your Neovim config (`init.lua` or `~/.config/nvim/lua/lsp.lua`):

```lua
-- Add MDX language server
require('lspconfig').mdx_analyzer.setup({
  cmd = { "mdx-language-server", "--stdio" },
  filetypes = { "mdx" },
  root_dir = require('lspconfig').util.root_pattern('package.json', '.git'),
  settings = {},
})
```

#### Alternative manual setup:
```lua
local lspconfig = require('lspconfig')
local configs = require('lspconfig.configs')

-- Define MDX analyzer if not already defined
if not configs.mdx_analyzer then
  configs.mdx_analyzer = {
    default_config = {
      cmd = { 'mdx-language-server', '--stdio' },
      filetypes = { 'mdx' },
      root_dir = lspconfig.util.root_pattern('package.json', '.git', '.'),
      settings = {},
    },
  }
end

-- Setup the server
lspconfig.mdx_analyzer.setup({})
```

### 3. File Type Detection

Ensure Neovim recognizes `.mdx` files. Add to your config:

```lua
-- Auto-detect MDX files
vim.filetype.add({
  extension = {
    mdx = 'mdx',
  },
})
```

### 4. Alternative: Using Mason (Recommended)

If you use Mason for LSP management:

```lua
-- In your Mason setup
require('mason').setup()
require('mason-lspconfig').setup({
  ensure_installed = {
    'mdx_analyzer',  -- This will install mdx-analyzer
    -- other servers...
  }
})

-- Then setup normally
require('lspconfig').mdx_analyzer.setup({})
```

### 5. Debugging LSP Issues

#### Check LSP status:
```vim
:LspInfo
```

#### Enable LSP logging:
```lua
vim.lsp.set_log_level("debug")
-- Check logs at: ~/.cache/nvim/lsp.log
```

#### Manual test:
```bash
# In your project directory
echo '# Hello MDX' | mdx-language-server --stdio
```

## Complete Example Configuration

Here's a complete working setup:

```lua
-- ~/.config/nvim/lua/lsp-config.lua

local lspconfig = require('lspconfig')

-- Ensure MDX filetype is recognized
vim.filetype.add({
  extension = {
    mdx = 'mdx',
  },
})

-- Setup MDX analyzer
lspconfig.mdx_analyzer.setup({
  cmd = { "mdx-language-server", "--stdio" },
  filetypes = { "mdx" },
  root_dir = lspconfig.util.root_pattern(
    'package.json',
    'tsconfig.json',
    '.git'
  ),
  settings = {
    typescript = {
      -- Use your project's TypeScript version
      preferences = {
        includePackageJsonAutoImports = "on",
      },
    },
  },
  -- Optional: Add capabilities for autocomplete
  capabilities = require('cmp_nvim_lsp').default_capabilities(),
})

-- Setup keybindings for LSP
vim.api.nvim_create_autocmd('LspAttach', {
  group = vim.api.nvim_create_augroup('UserLspConfig', {}),
  callback = function(ev)
    local opts = { buffer = ev.buf }
    vim.keymap.set('n', 'gd', vim.lsp.buf.definition, opts)
    vim.keymap.set('n', 'K', vim.lsp.buf.hover, opts)
    vim.keymap.set('n', '<leader>rn', vim.lsp.buf.rename, opts)
    vim.keymap.set('n', '<leader>ca', vim.lsp.buf.code_action, opts)
  end,
})
```

## Troubleshooting

### Common Issues:

1. **LSP not starting**:
   - Check `which mdx-language-server`
   - Verify PATH includes the executable
   - Try absolute path in cmd: `cmd = { "/full/path/to/mdx-language-server", "--stdio" }`

2. **No autocomplete**:
   - Ensure you have `nvim-cmp` and `cmp-nvim-lsp` installed
   - Add capabilities to setup

3. **TypeScript errors**:
   - Make sure your project has `tsconfig.json`
   - Install TypeScript types: `npm install -D @types/react @types/node`

### Test Your Setup:

1. Open an `.mdx` file in Neovim
2. Run `:LspInfo` - should show mdx_analyzer as attached
3. Try hovering over React components - should show type info
4. Try autocomplete with Ctrl+Space

## Project-Specific Setup

For your Nextra project, create `.nvimrc` in the project root:

```lua
-- Project-specific Neovim config
vim.opt.conceallevel = 0  -- Show all markdown syntax
vim.opt.wrap = true       -- Wrap long lines in MDX files

-- MDX-specific settings
vim.api.nvim_create_autocmd("FileType", {
  pattern = "mdx",
  callback = function()
    vim.opt_local.shiftwidth = 2
    vim.opt_local.tabstop = 2
    vim.opt_local.expandtab = true
  end,
})
```

This should get your MDX language server working properly in Neovim!