# Web to Video Converter

## Overview
A web application with Arabic interface that converts HTML/CSS/JavaScript code to high-quality videos (MP4/GIF) using Puppeteer and FFmpeg.

## Project Structure
```
├── backend/
│   ├── server.js          # Express server (main entry point)
│   ├── middleware/
│   │   └── auth.js        # Authentication middleware
│   ├── routes/
│   │   ├── render.js      # API routes for rendering
│   │   └── projects.js    # Project save/load API
│   ├── services/
│   │   ├── ffmpeg.js      # FFmpeg video processing
│   │   └── puppeteer.js   # Browser frame capture with virtual time
│   └── utils/
│       └── cleanup.js     # Temporary file cleanup
├── frontend/
│   ├── index.html         # Main web interface (Arabic)
│   ├── css/style.css      # Styling
│   └── js/
│       ├── app.js         # Main application logic
│       ├── api.js         # API communication with SSE progress
│       ├── preview.js     # Live preview management
│       ├── projects.js    # Project save/load UI
│       └── templates.js   # Animation templates
├── temp/                  # Temporary files (auto-created)
├── output/                # Generated videos (auto-created)
└── logs/                  # Application logs (auto-created)
```

## Tech Stack
- **Backend**: Node.js with Express
- **Database**: PostgreSQL (for saving projects)
- **Video Processing**: Puppeteer (browser automation) + FFmpeg (video encoding)
- **Frontend**: Vanilla HTML/CSS/JavaScript

## Running Locally
The application runs on port 5000. The workflow is configured to start automatically.

## Key Features
- Arabic user interface
- Code editor with tabs for HTML/CSS/JavaScript
- Live animation preview with restart control
- Virtual time control for accurate JavaScript animation capture
- Real-time progress bar using Server-Sent Events (SSE)
- Optimized JPEG frame capture for faster conversion
- Multiple output resolutions (Reels/TikTok, Square, Horizontal)
- MP4 and GIF formats
- Customizable duration and FPS
- Project saving/loading (code only, no output files)

## Technical Notes
- Virtual time system overrides setTimeout, setInterval, Date.now(), performance.now(), and requestAnimationFrame
- FFmpeg uses "veryfast" preset for faster encoding
- Frame capture uses JPEG (quality 95) instead of PNG for speed

## Dependencies
- Node.js 20
- FFmpeg (system)
- Chromium (system)
- PostgreSQL (database)
