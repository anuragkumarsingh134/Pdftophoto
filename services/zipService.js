const archiver = require('archiver');
const fs = require('fs');
const path = require('path');

/**
 * Compress an array of image files into a ZIP archive.
 * @param {string[]} imagePaths - Array of absolute paths to image files
 * @param {string} zipPath - Absolute path for the output ZIP
 * @param {boolean} cleanupImages - Whether to delete source images after zipping
 * @returns {Promise<string>} Resolves with the ZIP file path
 */
function createZip(imagePaths, zipPath, cleanupImages = true) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 6 } });

    output.on('close', () => {
      // Clean up source images
      if (cleanupImages) {
        for (const imgPath of imagePaths) {
          try {
            fs.unlinkSync(imgPath);
          } catch (e) {
            // Ignore cleanup errors
          }
        }
      }
      resolve(zipPath);
    });

    archive.on('error', (err) => reject(err));
    archive.pipe(output);

    for (const imgPath of imagePaths) {
      archive.file(imgPath, { name: path.basename(imgPath) });
    }

    archive.finalize();
  });
}

module.exports = { createZip };
