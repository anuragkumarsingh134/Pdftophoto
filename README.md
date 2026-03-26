# PDF to Photo Converter 📄 ➡️ 🖼️

A standalone, locally-hosted web application that easily and quickly converts PDF files into high-quality images (PNG/JPEG) and neatly packages them into a compressed ZIP file for easy downloading.

## 🚀 Features

- **Blazing Fast Conversion**: Convert any PDF document into individual images.
- **Image Formats**: Supports output to both PNG and JPEG formats.
- **ZIP Compression**: Automatically zips all converted images into a single file for convenience.
- **Clean Modern UI**: Accessible via a simple, dark mode web interface.
- **Standalone Executable**: Run it instantly without needing to install Node.js, Python, or any other dependencies.
- **Complete Offline Support**: All processing happens entirely strictly locally on your machine—no cloud uploads are required, meaning complete privacy for your sensitive documents.

---

## 📥 Download PDFtoPhoto Server (Recommended)

You don't need to be a developer to use this application! You can simply download the pre-compiled, portable Windows executable (`.exe`) and start converting immediately.

👉 **[Download PDFtoPhoto.exe (Google Drive)](https://drive.google.com/file/d/1JE64pIaZSoofqD71nplepavqIPs_lsZw/view?usp=drive_link)**

### How to use the executable:
1. Download the `.exe` file from the link above.
2. Double-click to run the application. It will open a background terminal.
3. Open your favorite web browser and navigate to `http://localhost:1000`.
4. Upload your PDF and convert!
5. When finished, simply close the open terminal window to stop the server.

---

## 💻 Running from Source Code (For Developers)

If you prefer to run the application from the source code, inspect the backend, or contribute to the project:

### Prerequisites:
- [Node.js](https://nodejs.org/) installed
- [Git](https://git-scm.com/) installed

### Setup Instructions:
1. Clone this repository:
   ```bash
   git clone https://github.com/anuragkumarsingh134/Pdftophoto.git
   ```
2. Navigate into the project directory:
   ```bash
   cd Pdftophoto
   ```
3. Install the dependencies:
   ```bash
   npm install
   ```
4. Start the application server:
   ```bash
   node app.js
   ```
   *(Or run `npm start`)*
5. Open your web browser and go to `http://localhost:1000`.

## 🛠️ Built With

- **[Node.js](https://nodejs.org/)**: Backend server runtime.
- **[Express](https://expressjs.com/)**: Fast, unopinionated web framework.
- **[Archiver](https://www.npmjs.com/package/archiver)**: Streamable ZIP archive generation.
- **Vanilla HTML/CSS/JS**: For the clean UI interface.
