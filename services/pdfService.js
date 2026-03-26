const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// pdfjs-dist v3 has a proper CommonJS legacy build for Node.js
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

/**
 * Custom canvas factory so pdfjs can create node-canvas instances.
 */
class NodeCanvasFactory {
  create(width, height) {
    const canvas = createCanvas(width, height);
    return { canvas, context: canvas.getContext('2d') };
  }
  reset(pair, width, height) {
    pair.canvas.width = width;
    pair.canvas.height = height;
  }
  destroy(pair) {
    pair.canvas.width = 0;
    pair.canvas.height = 0;
  }
}

/**
 * Convert a PDF file to individual images.
 * @param {string} pdfPath - Absolute path to the PDF file
 * @param {string} format - 'png' or 'jpeg'
 * @param {string} baseName - Base name for output images (without extension)
 * @param {string} outputDir - Directory to write images into
 * @param {function} [onProgress] - Callback (currentPage, totalPages)
 * @returns {Promise<string[]>} Array of output image file paths
 */
async function convertPdfToImages(pdfPath, format, baseName, outputDir, onProgress) {
  const data = new Uint8Array(fs.readFileSync(pdfPath));

  const doc = await pdfjsLib.getDocument({
    data,
    cMapUrl: undefined,
    cMapPacked: false,
    useSystemFonts: true,
    isEvalSupported: false,
  }).promise;

  const numPages = doc.numPages;
  const imagePaths = [];
  const ext = format === 'jpeg' ? 'jpg' : 'png';
  const scale = 2.0;

  for (let i = 1; i <= numPages; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale });

    const width = Math.floor(viewport.width);
    const height = Math.floor(viewport.height);
    const canvasFactory = new NodeCanvasFactory();
    const { canvas, context } = canvasFactory.create(width, height);

    await page.render({
      canvasContext: context,
      viewport,
      canvasFactory,
    }).promise;

    // Export to buffer
    const fileName = `${baseName}_${i}.${ext}`;
    const filePath = path.join(outputDir, fileName);

    let buffer;
    if (format === 'jpeg') {
      buffer = canvas.toBuffer('image/jpeg', { quality: 0.92 });
    } else {
      buffer = canvas.toBuffer('image/png');
    }

    fs.writeFileSync(filePath, buffer);
    imagePaths.push(filePath);

    if (onProgress) onProgress(i, numPages);

    page.cleanup();
  }

  doc.destroy();
  return imagePaths;
}

module.exports = { convertPdfToImages };
