/**
 * PDF to Photo — Frontend Logic
 * Handles file selection, format toggle, conversion, and download.
 */

(function () {
  'use strict';

  // --- DOM Elements ---
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const fileInfo = document.getElementById('fileInfo');
  const fileName = document.getElementById('fileName');
  const removeFile = document.getElementById('removeFile');

  const btnPng = document.getElementById('btnPng');
  const btnJpeg = document.getElementById('btnJpeg');
  const convertBtn = document.getElementById('convertBtn');

  const step1 = document.getElementById('step1');
  const step2 = document.getElementById('step2');
  const step3 = document.getElementById('step3');

  const progressSection = document.getElementById('progressSection');
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');

  const resultSection = document.getElementById('resultSection');
  const resultDetail = document.getElementById('resultDetail');
  const downloadBtn = document.getElementById('downloadBtn');
  const convertAnotherBtn = document.getElementById('convertAnotherBtn');

  const errorSection = document.getElementById('errorSection');
  const errorText = document.getElementById('errorText');
  const retryBtn = document.getElementById('retryBtn');

  // --- State ---
  let selectedFile = null;
  let selectedFormat = 'png';
  let downloadUrl = null;

  // --- File Selection ---
  dropZone.addEventListener('click', () => fileInput.click());

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      handleFileSelect(fileInput.files[0]);
    }
  });

  removeFile.addEventListener('click', (e) => {
    e.stopPropagation();
    clearFile();
  });

  function handleFileSelect(file) {
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      showError('Please select a valid PDF file.');
      return;
    }
    selectedFile = file;
    fileName.textContent = file.name;
    fileInfo.classList.add('visible');
    dropZone.style.display = 'none';
    activateStep(2);
    activateStep(3);
    convertBtn.disabled = false;
  }

  function clearFile() {
    selectedFile = null;
    fileInput.value = '';
    fileInfo.classList.remove('visible');
    dropZone.style.display = '';
    deactivateStep(2);
    deactivateStep(3);
    convertBtn.disabled = true;
    hideAllSections();
  }

  // --- Format Toggle ---
  btnPng.addEventListener('click', () => setFormat('png'));
  btnJpeg.addEventListener('click', () => setFormat('jpeg'));

  function setFormat(fmt) {
    selectedFormat = fmt;
    btnPng.classList.toggle('active', fmt === 'png');
    btnJpeg.classList.toggle('active', fmt === 'jpeg');
  }

  // --- Step Activation ---
  function activateStep(num) {
    document.getElementById('step' + num).classList.add('active');
  }

  function deactivateStep(num) {
    document.getElementById('step' + num).classList.remove('active');
  }

  // --- Conversion ---
  convertBtn.addEventListener('click', startConversion);

  async function startConversion() {
    if (!selectedFile) {
      showError('Please select a PDF file first.');
      return;
    }

    // Show progress
    hideAllSections();
    showProgress();
    setStepsInteractive(false);

    const formData = new FormData();
    formData.append('pdf', selectedFile);
    formData.append('format', selectedFormat);

    try {
      progressText.textContent = 'Uploading and converting…';
      progressBar.classList.add('indeterminate');

      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Conversion failed.');
      }

      // Success
      downloadUrl = data.downloadUrl;
      progressBar.classList.remove('indeterminate');
      progressBar.style.width = '100%';
      progressText.textContent = 'Complete!';

      setTimeout(() => {
        hideAllSections();
        showResult(data);
      }, 500);
    } catch (err) {
      hideAllSections();
      showError(err.message || 'Something went wrong. Please try again.');
      setStepsInteractive(true);
    }
  }

  // --- Download ---
  let downloadFileName = 'download.zip';

  downloadBtn.addEventListener('click', async () => {
    if (!downloadUrl) return;

    try {
      // Fetch the ZIP as a blob
      const response = await fetch(downloadUrl);
      const blob = await response.blob();

      // Try native OS save dialog (File System Access API)
      if (window.showSaveFilePicker) {
        try {
          const handle = await window.showSaveFilePicker({
            suggestedName: downloadFileName,
            types: [{
              description: 'ZIP Archive',
              accept: { 'application/zip': ['.zip'] },
            }],
          });
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
          return;
        } catch (pickerErr) {
          // User cancelled the picker — do nothing
          if (pickerErr.name === 'AbortError') return;
          // If API fails, fall through to standard download
        }
      }

      // Fallback: standard browser download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = downloadFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      showError('Download failed. Please try again.');
    }
  });

  // --- Convert Another ---
  convertAnotherBtn.addEventListener('click', resetAll);
  retryBtn.addEventListener('click', resetAll);

  function resetAll() {
    clearFile();
    hideAllSections();
    setStepsInteractive(true);
  }

  // --- UI Helpers ---
  function showProgress() {
    progressSection.classList.add('visible');
    progressBar.style.width = '0%';
  }

  function showResult(data) {
    resultSection.classList.add('visible');
    resultDetail.textContent = `${data.pageCount} page${data.pageCount !== 1 ? 's' : ''} converted to ${selectedFormat.toUpperCase()} — ${data.fileName}`;
    downloadFileName = data.fileName || 'download.zip';
  }

  function showError(msg) {
    errorSection.classList.add('visible');
    errorText.textContent = msg;
  }

  function hideAllSections() {
    progressSection.classList.remove('visible');
    resultSection.classList.remove('visible');
    errorSection.classList.remove('visible');
    progressBar.classList.remove('indeterminate');
    progressBar.style.width = '0%';
  }

  function setStepsInteractive(enabled) {
    [step1, step2, step3].forEach((s) => {
      if (enabled) {
        s.style.pointerEvents = '';
        s.style.opacity = '';
      } else {
        s.style.pointerEvents = 'none';
        s.style.opacity = '0.4';
      }
    });
  }
})();
