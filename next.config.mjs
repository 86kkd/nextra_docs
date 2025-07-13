import nextra from "nextra";

// Set up Nextra with its configuration
const withNextra = nextra({
  // 使用Nextra的默认配置
});

// Export the final Next.js config with Nextra included
export default withNextra({
  // ... Add regular Next.js options here
  turbopack: {
    resolveAlias: {
      // 修正MDX组件文件路径，使用.js扩展名
      "next-mdx-import-source-file": "src/mdx-components.js",
    },
  },
});
