/**
 * Enhanced logging utility similar to Python's loguru
 * Provides detailed context and formatting for debugging
 */

import React from 'react'

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'trace'

interface LogContext {
  component?: string
  file?: string
  function?: string
  line?: number
  userId?: string
  requestId?: string
  [key: string]: any
}

class Logger {
  private getTimestamp(): string {
    return new Date().toISOString()
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = this.getTimestamp()
    const levelEmoji = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      trace: '🔬'
    }[level]

    const contextStr = context ? ` | ${JSON.stringify(context)}` : ''
    return `${levelEmoji} [${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`
  }

  private log(level: LogLevel, message: string, context?: LogContext, ...args: any[]): void {
    const formattedMessage = this.formatMessage(level, message, context)
    
    const consoleMethods = {
      debug: console.debug,
      info: console.info,
      warn: console.warn,
      error: console.error,
      trace: console.trace
    }

    consoleMethods[level](formattedMessage, ...args)

    // Add stack trace for errors
    if (level === 'error') {
      console.trace('Stack trace:')
    }

    // In browser, also try to store in sessionStorage for persistence
    if (typeof window !== 'undefined') {
      try {
        const logs = JSON.parse(sessionStorage.getItem('debug_logs') || '[]')
        logs.push({
          timestamp: this.getTimestamp(),
          level,
          message,
          context,
          args: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg))
        })
        
        // Keep only last 100 logs
        if (logs.length > 100) {
          logs.splice(0, logs.length - 100)
        }
        
        sessionStorage.setItem('debug_logs', JSON.stringify(logs))
      } catch (e) {
        // Ignore storage errors
      }
    }
  }

  debug(message: string, context?: LogContext, ...args: any[]): void {
    this.log('debug', message, context, ...args)
  }

  info(message: string, context?: LogContext, ...args: any[]): void {
    this.log('info', message, context, ...args)
  }

  warn(message: string, context?: LogContext, ...args: any[]): void {
    this.log('warn', message, context, ...args)
  }

  error(message: string, context?: LogContext, ...args: any[]): void {
    this.log('error', message, context, ...args)
  }

  trace(message: string, context?: LogContext, ...args: any[]): void {
    this.log('trace', message, context, ...args)
  }

  // Component lifecycle logging
  componentMount(componentName: string, props?: any): void {
    this.info(`Component mounted: ${componentName}`, { 
      component: componentName, 
      props: typeof props === 'object' ? JSON.stringify(props) : props 
    })
  }

  componentUnmount(componentName: string): void {
    this.info(`Component unmounted: ${componentName}`, { component: componentName })
  }

  componentError(componentName: string, error: Error): void {
    this.error(`Component error in ${componentName}: ${error.message}`, { 
      component: componentName,
      errorName: error.name,
      errorStack: error.stack
    })
  }

  // API and request logging
  apiRequest(url: string, method: string, data?: any): void {
    this.info(`API Request: ${method} ${url}`, { 
      url, 
      method, 
      data: data ? JSON.stringify(data) : undefined 
    })
  }

  apiResponse(url: string, status: number, responseTime?: number): void {
    this.info(`API Response: ${status} ${url}`, { 
      url, 
      status, 
      responseTime: responseTime ? `${responseTime}ms` : undefined 
    })
  }

  // Performance logging
  performance(label: string, duration: number): void {
    this.info(`Performance: ${label} took ${duration}ms`, { 
      performance: true, 
      label, 
      duration 
    })
  }

  // Export logs for debugging
  exportLogs(): string[] {
    if (typeof window === 'undefined') return []
    
    try {
      return JSON.parse(sessionStorage.getItem('debug_logs') || '[]')
    } catch {
      return []
    }
  }

  clearLogs(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('debug_logs')
    }
  }
}

// Export singleton instance
export const logger = new Logger()

// Export helper functions for common use cases
export const logComponentMount = (name: string, props?: any) => logger.componentMount(name, props)
export const logComponentError = (name: string, error: Error) => logger.componentError(name, error)
export const logError = (message: string, context?: LogContext) => logger.error(message, context)
export const logInfo = (message: string, context?: LogContext) => logger.info(message, context)
export const logDebug = (message: string, context?: LogContext) => logger.debug(message, context)

// Performance timing helper
export function withPerformanceLogging<T>(label: string, fn: () => T): T {
  const start = performance.now()
  const result = fn()
  const duration = performance.now() - start
  logger.performance(label, duration)
  return result
}

// React component wrapper for automatic logging
export function withLogging<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  const name = componentName || Component.displayName || Component.name || 'Unknown'
  
  return function LoggedComponent(props: P) {
    logger.componentMount(name, props)
    
    React.useEffect(() => {
      return () => {
        logger.componentUnmount(name)
      }
    }, [])

    try {
      return React.createElement(Component, props)
    } catch (error) {
      logger.componentError(name, error as Error)
      throw error
    }
  }
}