import nextra from "nextra";

// Set up Nextra with its configuration
const withNextra = nextra({
  // 使用Nextra的默认配置
});

// Export the final Next.js config with Nextra included
export default withNextra({
  // ... Add regular Next.js options here
  output: "export", // 🎯 启用静态导出
  trailingSlash: true, // 🎯 URL 末尾添加斜杠
  images: {
    unoptimized: true, // 🎯 禁用图片优化（静态部署需要）
  },

  turbopack: {
    resolveAlias: {
      // 修正MDX组件文件路径，使用.js扩展名
      "next-mdx-import-source-file": "src/mdx-components.js",
    },
  },
});
