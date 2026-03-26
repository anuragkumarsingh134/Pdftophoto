const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const archiver = require('archiver');

const DIST = path.join(__dirname, 'dist');
const APP_DIR = path.join(DIST, 'app');
const EXE_NAME = 'pdf-to-photo.exe';
const ZIP_PATH = path.join(DIST, 'payload.zip');

console.log('🧹 Cleaning dist folder...');
if (fs.existsSync(DIST)) fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(APP_DIR, { recursive: true });

console.log('📂 Copying files for packaging...');
const filesToCopy = ['app.js', 'package.json'];
filesToCopy.forEach(f => {
  if (fs.existsSync(path.join(__dirname, f))) fs.copyFileSync(path.join(__dirname, f), path.join(APP_DIR, f));
});

const dirsToCopy = ['routes', 'services', 'public', 'node_modules'];
dirsToCopy.forEach(d => {
  if (fs.existsSync(path.join(__dirname, d))) copyDirSync(path.join(__dirname, d), path.join(APP_DIR, d));
});

console.log('📦 Bundling portable Node.js executable...');
fs.copyFileSync(process.execPath, path.join(APP_DIR, 'node.exe'));

console.log('🗜️ Zipping payload for single-exe packaging... (this will take a minute)');
const output = fs.createWriteStream(ZIP_PATH);
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
  console.log('🛠️ Creating single .exe wrapper...');
  
  const csCode = `
using System;
using System.Diagnostics;
using System.IO;
using System.IO.Compression;
using System.Reflection;
using System.Threading;

class Program {
    static void Main() {
        string tempDir = Path.Combine(Path.GetTempPath(), "PdfToPhoto_" + Guid.NewGuid().ToString().Substring(0, 8));
        Directory.CreateDirectory(tempDir);
        
        try {
            Console.WriteLine("Extracting PDF to Photo Converter...");
            
            // Extract the embedded payload.zip
            using (var stream = Assembly.GetExecutingAssembly().GetManifestResourceStream("payload.zip")) {
                if (stream == null) throw new Exception("Payload not found.");
                string zipPath = Path.Combine(tempDir, "payload.zip");
                using (var fileStream = File.Create(zipPath)) {
                    stream.CopyTo(fileStream);
                }
                ZipFile.ExtractToDirectory(zipPath, tempDir);
                File.Delete(zipPath);
            }

            Console.WriteLine("Starting server...");
            string nodePath = Path.Combine(tempDir, "node.exe");
            string appPath = Path.Combine(tempDir, "app.js");

            ProcessStartInfo psi = new ProcessStartInfo();
            psi.FileName = nodePath;
            psi.Arguments = "\\"" + appPath + "\\"";
            psi.WorkingDirectory = tempDir;
            psi.UseShellExecute = false;

            Process p = Process.Start(psi);
            p.WaitForExit();

        } catch (Exception ex) {
            Console.WriteLine("Error: " + ex.Message);
            Console.ReadLine();
        } finally {
            // Cleanup extraction
            try { 
                Directory.Delete(tempDir, true); 
            } catch { } // Ignore cleanup errors if files are locked
        }
    }
}
  `;

  const csFile = path.join(DIST, 'launcher.cs');
  fs.writeFileSync(csFile, csCode);

  const cscPath = 'C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe';
  execSync(`"${cscPath}" /nologo /out:"${path.join(DIST, EXE_NAME)}" /resource:"${ZIP_PATH}",payload.zip /r:System.IO.Compression.dll /r:System.IO.Compression.FileSystem.dll "${csFile}"`, { stdio: 'inherit' });
  
  // Cleanup everything except the single exe
  fs.unlinkSync(csFile);
  fs.unlinkSync(ZIP_PATH);
  fs.rmSync(APP_DIR, { recursive: true, force: true });
  const testCsPath = path.join(__dirname, 'test.cs');
  if (fs.existsSync(testCsPath)) fs.unlinkSync(testCsPath);

  console.log(`\n✅ Build complete! You now have a SINGLE file: dist\\${EXE_NAME}`);
  console.log('   You can share this one file with anyone!\n');
});

archive.on('error', (err) => { throw err; });
archive.pipe(output);
archive.directory(APP_DIR, false);
archive.finalize();

function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
