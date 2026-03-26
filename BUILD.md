# Build Instructions — PDF to Photo (.exe)

## Prerequisites
- Node.js 18+ installed
- `npm install` completed

## Development
```bash
npm start
# Opens http://localhost:1000 in your browser
```

## Building Standalone .exe

### Option 1: Using `pkg` (recommended)
```bash
# Install pkg globally
npm install -g pkg

# Build the executable
pkg . --targets node18-win-x64 --output dist/pdf-to-photo.exe

# Or use the npm script
npm run build
```

### Option 2: Using `nexe`
```bash
npm install -g nexe
nexe app.js -t windows-x64 -o dist/pdf-to-photo.exe
```

### Important Notes
1. **Native modules**: The `canvas` package includes native bindings. When using `pkg`, you may need to copy the `node_modules/canvas/build/Release` folder alongside the `.exe`.
2. **Static assets**: The `public/` folder must be bundled (configured in `package.json` under `pkg.assets`).
3. **Temp folder**: The app creates a `temp/` directory at runtime — ensure the `.exe` has write permissions.

## Distribution
After building, distribute:
```
dist/
  pdf-to-photo.exe
  canvas/build/Release/  (native bindings, if needed)
```
