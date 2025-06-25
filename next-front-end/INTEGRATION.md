# Integration Guide: Next.js Frontend with Python Backend

This guide explains how to integrate the new Next.js frontend with your existing Python backend that uses PyScript.

## Overview

The new Next.js frontend provides a modern, responsive interface for your Hand Pose Piano Machine. It's designed to work alongside your existing Python backend while providing a better user experience.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js       │    │   Python        │    │   SPIKE Prime   │
│   Frontend      │◄──►│   Backend       │◄──►│   Hardware      │
│                 │    │   (PyScript)    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Setup Instructions

### 1. Start the Next.js Frontend

```bash
cd next-front-end
pnpm dev
```

The frontend will be available at `http://localhost:3000`

### 2. Start the Python Backend

```bash
# From the root directory
python server.py
```

The Python backend will serve your existing `index.html` with PyScript integration.

### 3. Integration Options

#### Option A: Dual Server Setup (Recommended for Development)

Run both servers simultaneously:
- Next.js frontend: `http://localhost:3000`
- Python backend: `http://localhost:8000` (or whatever port your server.py uses)

The Next.js frontend will communicate with the Python backend via API calls.

#### Option B: Single Server Setup (Production)

Serve the Next.js build from your Python server by:
1. Building the Next.js app: `pnpm build`
2. Copying the build output to your Python server's static directory
3. Serving it alongside your existing files

## API Integration

### Current API Endpoints

The Next.js frontend includes API routes at `/api/pyscript` that can communicate with your Python backend:

- `POST /api/pyscript` - Execute Python functions
- `GET /api/pyscript` - Check API status

### Python Function Integration

The frontend is designed to call your existing Python functions:

```typescript
// These functions are exposed by your main.py
window.pyPlayNote(note: string, duration: string)
window.pyStopAll()
window.pyStopAllMotors()
```

### Adding New Python Functions

To add new Python functions that can be called from the frontend:

1. **In your `main.py`:**
```python
def new_function_py(param1, param2):
    # Your Python logic here
    console.log(f"Executing new function with {param1}, {param2}")
    # Return result or perform actions

# Expose to JavaScript
window.pyNewFunction = new_function_py
```

2. **In the Next.js frontend:**
```typescript
// Add to use-pyscript.ts
const newFunction = useCallback((param1: string, param2: string) => {
  return callPyScript('newFunction', { param1, param2 })
}, [callPyScript])

// Add to global declarations
declare global {
  interface Window {
    pyNewFunction?: (param1: string, param2: string) => void
  }
}
```

## Features Comparison

| Feature | Old Frontend | New Frontend | Status |
|---------|-------------|--------------|---------|
| Hand Detection | ✅ | ✅ | Migrated |
| Model Training | ✅ | ✅ | Migrated |
| Piano Player | ✅ | ✅ | Migrated |
| Motor Control | ✅ | ✅ | Migrated |
| UI/UX | Basic | Modern | ✅ Improved |
| Responsive Design | ❌ | ✅ | New |
| TypeScript | ❌ | ✅ | New |
| Component Architecture | ❌ | ✅ | New |

## Migration Path

### Phase 1: Parallel Development ✅
- Both frontends run simultaneously
- Test new features in Next.js
- Keep existing functionality in Python backend

### Phase 2: Feature Parity ✅
- All core features implemented in Next.js
- Same functionality as original app
- Better user experience

### Phase 3: Integration ✅
- Connect Next.js to Python backend
- Maintain PyScript integration
- Unified development workflow

### Phase 4: Optimization (Future)
- Performance improvements
- Advanced features
- Better error handling

## Development Workflow

### For Frontend Changes:
1. Edit files in `next-front-end/`
2. Changes auto-reload at `http://localhost:3000`
3. Test new features independently

### For Backend Changes:
1. Edit Python files in root directory
2. Restart Python server if needed
3. Test with both frontends

### For Integration Changes:
1. Update API routes in `next-front-end/app/api/`
2. Modify Python functions in `main.py`
3. Update TypeScript declarations

## Troubleshooting

### Common Issues:

1. **MediaPipe not loading:**
   - Check internet connection
   - Verify CDN URLs are accessible
   - Check browser console for errors

2. **Python functions not available:**
   - Ensure Python backend is running
   - Check that functions are properly exposed to `window`
   - Verify PyScript is loaded

3. **Camera access issues:**
   - Check browser permissions
   - Ensure HTTPS in production
   - Test with different browsers

4. **API communication errors:**
   - Check network tab for failed requests
   - Verify API routes are working
   - Check CORS settings if needed

## Next Steps

1. **Test the new frontend** - Navigate through all tabs and features
2. **Compare functionality** - Ensure all features work as expected
3. **Customize styling** - Adjust colors, layout, or add new components
4. **Add new features** - Extend the application with additional capabilities
5. **Deploy** - Choose your preferred deployment strategy

## Support

If you encounter issues:
1. Check the browser console for errors
2. Review the Python server logs
3. Verify all dependencies are installed
4. Test with a fresh browser session

The new Next.js frontend provides a solid foundation for future development while maintaining compatibility with your existing Python backend. 