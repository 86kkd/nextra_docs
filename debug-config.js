// Debug configuration for detailed logging
module.exports = {
  // Enable all debug modes
  env: {
    NODE_ENV: 'development',
    DEBUG: '*',
    NEXT_DEBUG: '1',
    TURBOPACK_LOG_LEVEL: 'debug',
    RUST_LOG: 'debug',
  },
  
  // Webpack configuration for better error reporting
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Enable detailed error reporting
      config.optimization = {
        ...config.optimization,
        minimize: false,
      }
      
      // Better source maps for debugging
      config.devtool = 'eval-source-map'
      
      // Add error handling plugin
      config.plugins.push(
        new (class ErrorReportingPlugin {
          apply(compiler) {
            compiler.hooks.compilation.tap('ErrorReporting', (compilation) => {
              compilation.hooks.buildModule.tap('ErrorReporting', (module) => {
                console.log(`🔍 Building module: ${module.resource || module.identifier()}`)
              })
              
              compilation.hooks.failedModule.tap('ErrorReporting', (module, error) => {
                console.error(`❌ Module failed: ${module.resource || module.identifier()}`)
                console.error(`❌ Error: ${error.message}`)
                console.error(`❌ Stack: ${error.stack}`)
              })
            })
            
            compiler.hooks.done.tap('ErrorReporting', (stats) => {
              if (stats.hasErrors()) {
                console.error('🚨 COMPILATION ERRORS:')
                stats.compilation.errors.forEach((error, index) => {
                  console.error(`\n--- ERROR ${index + 1} ---`)
                  console.error(`Message: ${error.message}`)
                  console.error(`Module: ${error.module?.resource || 'Unknown'}`)
                  console.error(`Location: ${error.loc || 'Unknown'}`)
                  console.error(`Stack: ${error.stack}`)
                })
              }
              
              if (stats.hasWarnings()) {
                console.warn('⚠️ COMPILATION WARNINGS:')
                stats.compilation.warnings.forEach((warning, index) => {
                  console.warn(`\n--- WARNING ${index + 1} ---`)
                  console.warn(`Message: ${warning.message}`)
                  console.warn(`Module: ${warning.module?.resource || 'Unknown'}`)
                })
              }
            })
          }
        })()
      )
    }
    
    return config
  }
}