# Web to Video Converter

## Overview
A web application that converts HTML/CSS/JavaScript code to high-quality videos (MP4/GIF) using Puppeteer and FFmpeg.

## Project Structure
```
├── backend/
│   ├── server.js          # Express server (main entry point)
│   ├── middleware/
│   │   └── auth.js        # Authentication middleware
│   ├── routes/
│   │   └── render.js      # API routes for rendering
│   ├── services/
│   │   ├── ffmpeg.js      # FFmpeg video processing
│   │   └── puppeteer.js   # Browser frame capture
│   └── utils/
│       └── cleanup.js     # Temporary file cleanup
├── frontend/
│   ├── index.html         # Main web interface
│   ├── css/style.css      # Styling
│   └── js/                # Frontend JavaScript
├── temp/                  # Temporary files (auto-created)
├── output/                # Generated videos (auto-created)
└── logs/                  # Application logs (auto-created)
```

## Tech Stack
- **Backend**: Node.js with Express
- **Video Processing**: Puppeteer (browser automation) + FFmpeg (video encoding)
- **Frontend**: Vanilla HTML/CSS/JavaScript

## Running Locally
The application runs on port 5000. The workflow is configured to start automatically.

## Key Features
- Code editor with tabs for HTML/CSS/JavaScript
- Live preview
- Multiple output resolutions (Reels/TikTok, Square, Horizontal)
- MP4 and GIF formats
- Customizable duration and FPS

## Dependencies
- Node.js 20
- FFmpeg (system)
- Chromium (system)
