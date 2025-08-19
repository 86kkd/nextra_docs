'use client'

import React, { ErrorInfo, ReactNode } from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

interface ErrorBoundaryProps {
  children: ReactNode
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    console.error('🚨 Error Boundary Caught Error:', error)
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 ERROR BOUNDARY DETAILS:')
    console.error('📝 Error:', error)
    console.error('📝 Error Message:', error.message)
    console.error('📝 Error Stack:', error.stack)
    console.error('📝 Component Stack:', errorInfo.componentStack)
    console.error('📝 Error Boundary Props:', this.props)
    
    // Log to browser console with more details
    console.group('🔍 DETAILED ERROR ANALYSIS')
    console.error('Error Name:', error.name)
    console.error('Error Cause:', (error as any).cause)
    console.error('Error Info:', errorInfo)
    console.error('Current Props:', this.props)
    console.error('Current State:', this.state)
    console.groupEnd()

    this.setState({ error, errorInfo })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 dark:bg-red-900/20 p-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-red-600 mb-4">
              🚨 Component Error Detected
            </h1>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg mb-6">
              <h2 className="text-xl font-semibold mb-2">Error Message:</h2>
              <pre className="bg-red-100 dark:bg-red-900/30 p-4 rounded text-sm overflow-auto">
                {this.state.error?.message}
              </pre>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg mb-6">
              <h2 className="text-xl font-semibold mb-2">Error Stack:</h2>
              <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded text-xs overflow-auto max-h-64">
                {this.state.error?.stack}
              </pre>
            </div>

            {this.state.errorInfo && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg mb-6">
                <h2 className="text-xl font-semibold mb-2">Component Stack:</h2>
                <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded text-xs overflow-auto max-h-64">
                  {this.state.errorInfo.componentStack}
                </pre>
              </div>
            )}

            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-2 text-blue-800 dark:text-blue-200">
                Debugging Steps:
              </h2>
              <ol className="list-decimal list-inside space-y-2 text-blue-700 dark:text-blue-300">
                <li>Check the browser console for additional error details</li>
                <li>Look at the component stack to identify the failing component</li>
                <li>Check for missing imports or incorrect prop types</li>
                <li>Verify all required dependencies are installed</li>
                <li>Check for client-side code running on server</li>
              </ol>
            </div>

            <button
              onClick={() => this.setState({ hasError: false, error: undefined, errorInfo: undefined })}
              className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              🔄 Try Again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}