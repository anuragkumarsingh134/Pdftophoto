const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { convertPdfToImages } = require('../services/pdfService');
const { createZip } = require('../services/zipService');

const router = express.Router();

// Configure multer for PDF uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(__dirname, '..', 'temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    // Preserve original name with timestamp to avoid collisions
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e6);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || path.extname(file.originalname).toLowerCase() === '.pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
});

/**
 * POST /api/convert
 * Body: multipart form with "pdf" file and "format" field (png|jpeg)
 */
router.post('/convert', upload.single('pdf'), async (req, res) => {
  try {
    // Validate file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file selected. Please choose a file.' });
    }

    const format = (req.body.format || 'png').toLowerCase();
    if (!['png', 'jpeg'].includes(format)) {
      return res.status(400).json({ error: 'Invalid format. Choose PNG or JPEG.' });
    }

    const pdfPath = req.file.path;
    const originalName = path.parse(req.file.originalname).name; // e.g. "sample"
    const tempDir = path.join(__dirname, '..', 'temp');

    // Convert PDF to images
    const imagePaths = await convertPdfToImages(pdfPath, format, originalName, tempDir);

    // Create ZIP
    const zipFileName = `${originalName}.zip`;
    const zipPath = path.join(tempDir, zipFileName);
    await createZip(imagePaths, zipPath, true);

    // Delete uploaded PDF
    try { fs.unlinkSync(pdfPath); } catch (e) { /* ignore */ }

    // Respond with download info
    res.json({
      success: true,
      message: 'Conversion complete!',
      downloadUrl: `/api/download/${encodeURIComponent(zipFileName)}`,
      fileName: zipFileName,
      pageCount: imagePaths.length,
    });
  } catch (err) {
    console.error('Conversion error:', err);

    // Clean up uploaded file on error
    if (req.file && req.file.path) {
      try { fs.unlinkSync(req.file.path); } catch (e) { /* ignore */ }
    }

    res.status(500).json({
      error: err.message || 'Conversion failed. Please try again with a valid PDF.',
    });
  }
});

/**
 * GET /api/download/:filename
 * Serves the ZIP file and cleans up after download
 */
router.get('/download/:filename', (req, res) => {
  const fileName = req.params.filename;
  const filePath = path.join(__dirname, '..', 'temp', fileName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found. It may have been already downloaded or expired.' });
  }

  res.download(filePath, fileName, (err) => {
    // Clean up ZIP after download (or on error)
    try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }
    if (err && !res.headersSent) {
      res.status(500).json({ error: 'Download failed.' });
    }
  });
});

// Multer error handler
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 200 MB.' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

module.exports = router;
