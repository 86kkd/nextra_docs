import nextra from "nextra";

// Set up Nextra with its configuration
const withNextra = nextra({
  defaultShowCopyCode: true,
  unstable_shouldAddLocaleToLinks: true,
});

// Export the final Next.js config with Nextra included
export default withNextra({
  reactStrictMode: true,
  
  // Disable hydration warnings for browser extension compatibility
  experimental: {
    // Note: suppressHydrationWarning is not a valid Next.js experimental option
    // Using HTML suppressHydrationWarning attribute instead
  },
  
  // Enable detailed logging for debugging
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  
  // Development optimizations for better error reporting
  ...(process.env.NODE_ENV === 'development' && {
    onDemandEntries: {
      maxInactiveAge: 25 * 1000,
      pagesBufferLength: 2,
    },
  }),
  
  webpack(config: any, { dev, isServer }) {
    // Add comprehensive error logging for development
    if (dev) {
      console.log(`🔧 Webpack building for ${isServer ? 'server' : 'client'}`)
      
      // Better source maps for debugging
      config.devtool = 'eval-source-map'
      
      // Add detailed error reporting
      const originalStats = config.stats || {}
      config.stats = {
        ...originalStats,
        errors: true,
        errorDetails: true,
        warnings: true,
        reasons: true,
        modules: true,
        chunks: true,
        chunkModules: true,
        source: true,
        cached: true,
        cachedAssets: true,
        nestedModules: true,
        usedExports: true,
        providedExports: true,
        optimizationBailout: true,
        children: true,
      }
      
      // Log module resolution attempts
      config.resolve = config.resolve || {}
      const originalResolve = config.resolve
      
      // Hook into module resolution to log attempts
      if (!config.plugins) config.plugins = []
      
      config.plugins.push({
        apply: (compiler: any) => {
          compiler.hooks.normalModuleFactory.tap('DebugResolver', (nmf: any) => {
            nmf.hooks.beforeResolve.tap('DebugResolver', (resolveData: any) => {
              if (resolveData.request.includes('homepage') || resolveData.request.includes('hero')) {
                console.log(`🔍 Resolving: ${resolveData.request} from ${resolveData.context}`)
              }
            })
            
            nmf.hooks.afterResolve.tap('DebugResolver', (resolveData: any) => {
              if (resolveData.resource && (resolveData.resource.includes('homepage') || resolveData.resource.includes('hero'))) {
                console.log(`✅ Resolved: ${resolveData.resource}`)
              }
            })
          })
          
          compiler.hooks.compilation.tap('DebugCompilation', (compilation: any) => {
            compilation.hooks.buildModule.tap('DebugBuild', (module: any) => {
              if (module.resource && (module.resource.includes('index.mdx') || module.resource.includes('homepage'))) {
                console.log(`🏗️ Building: ${module.resource}`)
              }
            })
            
            compilation.hooks.failedModule.tap('DebugFailed', (module: any, error: any) => {
              console.error(`💥 FAILED MODULE: ${module.resource || module.identifier()}`)
              console.error(`💥 ERROR MESSAGE: ${error.message}`)
              console.error(`💥 ERROR STACK:`)
              console.error(error.stack)
              
              // Additional context
              if (error.dependencies) {
                console.error(`💥 DEPENDENCIES:`, error.dependencies)
              }
              if (error.origin) {
                console.error(`💥 ORIGIN:`, error.origin)
              }
            })
          })
          
          compiler.hooks.done.tap('DebugDone', (stats: any) => {
            if (stats.hasErrors()) {
              console.error('\n🚨🚨🚨 DETAILED COMPILATION ERRORS 🚨🚨🚨')
              stats.compilation.errors.forEach((error: any, index: number) => {
                console.error(`\n📍 ERROR #${index + 1}:`)
                console.error(`📄 FILE: ${error.file || 'Unknown file'}`)
                console.error(`📝 MESSAGE: ${error.message}`)
                console.error(`🔍 DETAILS: ${error.details || 'No details'}`)
                console.error(`📍 LOCATION: ${error.loc || 'No location'}`)
                if (error.module) {
                  console.error(`📦 MODULE: ${error.module.resource || error.module.identifier()}`)
                }
                console.error(`📚 STACK:`)
                console.error(error.stack)
                console.error(`${'='.repeat(80)}`)
              })
            }
          })
        }
      })
    }
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
