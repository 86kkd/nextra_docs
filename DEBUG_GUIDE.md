# Build Error Debug Guide

## The Error
`BuildError` occurring when loading the homepage at http://localhost:3000

## Root Cause Analysis

The error is caused by incompatible imports in the MDX file. Here's what's happening:

1. **MDX Server-Side Rendering**: Nextra processes MDX files on the server first
2. **Client-Only Components**: Our components use browser-only APIs:
   - `ParticleBackground` uses Canvas API and window object
   - `dynamic` import is being used incorrectly in MDX
   - `HeroSection` uses mouse events and window object

## The Problem Code

In `src/content/index.mdx`, we have:
```jsx
// ❌ INCORRECT - Can't use dynamic() directly in MDX
const LazyParticleBackground = dynamic(
  () => import('../app/_components/particle-background'),
  { ssr: false }
)
```

MDX files don't support defining variables like regular JSX files.

## Solutions

### Solution 1: Remove Problematic Imports (Quick Fix)
Remove the particle background and dynamic import from the MDX file temporarily.

### Solution 2: Create Wrapper Components (Recommended)
Create a single wrapper component that handles all client-side logic, then import only that wrapper.

### Solution 3: Use Client Boundary
Wrap client components in a client-only boundary component.

## Implementation Steps

### Step 1: Create a Client-Only Homepage Component
Create `src/app/_components/homepage-client.tsx`:
```tsx
'use client'
// All client-side imports and logic go here
```

### Step 2: Import Only the Wrapper in MDX
In `index.mdx`:
```jsx
import { HomepageClient } from '../app/_components/homepage-client'
<HomepageClient />
```

### Step 3: Move Dynamic Imports
Move all dynamic imports inside the client component, not in MDX.

## Technical Explanation

### Why This Happens
1. **Server vs Client**: MDX runs on Node.js server which doesn't have browser APIs
2. **Hydration Mismatch**: Server-rendered HTML must match client-rendered HTML
3. **Build Time vs Runtime**: Some code executes during build, not just runtime

### Browser-Only APIs That Cause Issues
- `window` object
- `document` object
- Canvas API (`getContext('2d')`)
- Mouse/keyboard events
- Local storage
- Geolocation

### How Next.js Handles This
- `'use client'` directive: Marks component as client-only
- `dynamic()` with `ssr: false`: Loads component only on client
- Conditional rendering: `typeof window !== 'undefined'`

## Prevention Tips

1. **Always mark interactive components with `'use client'`**
2. **Don't use dynamic imports directly in MDX files**
3. **Create wrapper components for complex client logic**
4. **Test both dev and production builds**
5. **Use `typeof window !== 'undefined'` checks when needed**

## Common Error Messages and Meanings

- `BuildError`: Component failed during build/compilation
- `ReferenceError: window is not defined`: Accessing browser API on server
- `Hydration failed`: Server and client HTML don't match
- `Cannot read property of undefined`: Often related to missing browser APIs

## Debugging Commands

```bash
# Clear cache and rebuild
rm -rf .next
bun run build

# Check for build errors
bun run build 2>&1 | grep -i error

# Run in production mode locally
bun run build && bun start
```

## The Fix Applied

### What Caused the Errors:
1. **MDX Comment Syntax**: Multi-line comments `{/* */}` in MDX can cause parsing errors
2. **PostCSS/Tailwind**: Using `@apply` with complex selectors can crash PostCSS
3. **Client Components in MDX**: Direct use of browser APIs in MDX files

### Solutions Implemented:

1. **Created Client Wrapper** (`homepage-client.tsx`):
   - Consolidated all client-side logic in one component
   - Marked with `'use client'` directive
   - Handles lazy loading internally

2. **Simplified MDX File**:
   - Removed multi-line comments
   - Single import of client wrapper
   - No direct browser API usage

3. **Fixed CSS**:
   - Replaced `@apply` directives with standard CSS
   - Used explicit color values instead of theme() function
   - Simplified Tailwind config paths

### Working Code Structure:
```
index.mdx → imports → HomepageClient (client component)
                           ↓
                    Contains all browser features:
                    - ParticleBackground
                    - HeroSection  
                    - EnhancedFeature cards
```

This architecture ensures server-side rendering works correctly while preserving all interactive features.