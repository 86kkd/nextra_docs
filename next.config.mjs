import nextra from "nextra";

// Set up Nextra with its configuration
const withNextra = nextra({
  // 使用Nextra的默认配置
});

// Export the final Next.js config with Nextra included
export default withNextra({
  output: "export",
  turbopack: {
    resolveAlias: {
      "next-mdx-import-source-file": "src/mdx-components.js",
    },
  },
});
