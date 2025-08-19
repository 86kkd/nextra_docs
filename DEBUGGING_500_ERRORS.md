# Debugging 500 Server Errors in Next.js/Nextra

## What 500 Errors Mean

A **500 Internal Server Error** means the server encountered an unexpected condition that prevented it from fulfilling the request. In Next.js/Nextra, this usually indicates:

1. **Compilation failure** - TypeScript errors, import issues, syntax errors
2. **Runtime errors** - Code that crashes during server-side rendering
3. **Missing dependencies** - Imports that can't be resolved
4. **Configuration issues** - Invalid config files

## Step-by-Step Debugging Process

### Step 1: Check Terminal Output
Look at your `bun dev` terminal for detailed error messages:

```bash
# Look for these patterns:
- "Error: Cannot resolve module"
- "SyntaxError: Unexpected token"  
- "TypeError: Cannot read property"
- "Module not found"
- "Failed to compile"
```

### Step 2: Simplify the Problem
Reduce your code to the minimum that reproduces the error:

```mdx
---
title: "Test"
---

# Hello World

This is a test.
```

If this works, gradually add back complexity until you find the breaking change.

### Step 3: Check Import Paths
Verify all imports are correct:

```tsx
// ❌ Common mistakes:
import { Component } from '../wrong/path'
import Component from './nonexistent-file'

// ✅ Correct patterns:
import { Component } from '../app/_components/component'
import Component from '../components/Component'
```

### Step 4: Validate Component Exports
Ensure all imported components are properly exported:

```tsx
// ❌ Missing export:
function MyComponent() {
  return <div>Hello</div>
}

// ✅ Proper export:
export function MyComponent() {
  return <div>Hello</div>
}

// ✅ Default export:
export default function MyComponent() {
  return <div>Hello</div>
}
```

### Step 5: Check for Client-Only Code
Server-side rendering fails if components use browser APIs:

```tsx
// ❌ Will cause 500 error:
const width = window.innerWidth

// ✅ Safe approach:
const [width, setWidth] = useState(0)
useEffect(() => {
  setWidth(window.innerWidth)
}, [])
```

## Common Causes & Fixes

### Cause 1: Import Path Issues
**Error**: `Module not found: Can't resolve '../components/MyComponent'`

**Fix**: 
- Check file actually exists at that path
- Verify file extension (.tsx, .ts, .jsx, .js)
- Use relative paths correctly (`../` vs `./`)

### Cause 2: TypeScript Errors
**Error**: `Type 'string' is not assignable to type 'number'`

**Fix**:
- Check TypeScript compiler output
- Fix type mismatches
- Add proper type annotations

### Cause 3: CSS Import Issues
**Error**: `Module parse failed: Unexpected character '@'`

**Fix**:
- Ensure CSS files are in correct location
- Check if PostCSS is configured properly
- Verify Tailwind config is valid

### Cause 4: Circular Dependencies
**Error**: `ReferenceError: Cannot access 'X' before initialization`

**Fix**:
- Check for circular imports between files
- Refactor to break circular dependencies
- Use dynamic imports if necessary

## Debugging Commands

### Clear Everything and Restart
```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules (if needed)
rm -rf node_modules
bun install

# Restart dev server
bun dev
```

### Check Build Process
```bash
# Try building (often shows clearer errors)
bun run build

# Check TypeScript compilation
bunx tsc --noEmit
```

### Analyze Bundle
```bash
# Check for problematic imports
bun run build && bun run analyze
```

## Browser Console Debugging

Open Developer Tools (F12) and check:

1. **Console tab** - JavaScript errors
2. **Network tab** - Failed requests
3. **Sources tab** - Source maps and breakpoints

Common browser errors that accompany 500s:
- `ChunkLoadError: Loading chunk failed`
- `SyntaxError: Unexpected token`
- `TypeError: Cannot read properties of undefined`

## MDX-Specific Issues

### Problem: Comments in MDX
```mdx
{/* 
Multi-line comments can cause parsing errors
in some MDX configurations
*/}
```

**Fix**: Use single-line comments or remove comments

### Problem: Complex JSX in MDX
```mdx
{/* ❌ Complex expressions may fail */}
<div>{someComplexFunction()}</div>

{/* ✅ Keep MDX simple */}
<SimpleComponent />
```

### Problem: Import Order
```mdx
{/* ❌ Imports after content */}
# My Title
import { Component } from './component'

{/* ✅ Imports at top */}
import { Component } from './component'
# My Title
```

## Recovery Strategy

When facing persistent 500 errors:

1. **Backup current code**
2. **Revert to last working state**
3. **Apply changes incrementally**
4. **Test after each change**
5. **Identify exact breaking change**

## Test Checklist

Before adding complex features:

- [ ] Basic MDX renders correctly
- [ ] Simple imports work
- [ ] CSS imports resolve
- [ ] TypeScript compiles without errors
- [ ] No circular dependencies
- [ ] Client-only code is properly guarded
- [ ] All components export correctly

## Getting Help

When asking for help, provide:

1. **Exact error message** from terminal
2. **Browser console errors**
3. **Minimal reproduction case**
4. **File structure** of imports
5. **Next.js/Nextra version**

Remember: 500 errors are often compilation issues, not runtime issues. Fix the build first, then worry about functionality!