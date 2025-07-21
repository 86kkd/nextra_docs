import nextra from "nextra";

// Set up Nextra with its configuration
const withNextra = nextra({
  defaultShowCopyCode: true,
  unstable_shouldAddLocaleToLinks: true,
});

// Export the final Next.js config with Nextra included
export default withNextra({
  reactStrictMode: true,
  webpack(config: any) {
    // 添加 SVGR 支持
    config.module.rules.push({
      test: /\.svg$/,
      use: [
        {
          loader: '@svgr/webpack',
          options: {
            svgoConfig: {
              plugins: [
                {
                  name: 'preset-default',
                  params: {
                    overrides: {
                      removeViewBox: false,
                    },
                  },
                },
              ],
            },
          },
        },
      ],
    });

    return config;
  },
});
