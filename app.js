const express = require('express');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 1000;

// Ensure temp directory exists
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// API routes
app.use('/api', apiRoutes);

// Fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`\n  ✅ PDF to Photo converter running at http://localhost:${PORT}\n`);
  // Open browser using Windows 'start' command (no extra dependencies)
  exec(`start http://localhost:${PORT}`);
});
