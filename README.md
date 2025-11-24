# Video Browser for Kids

A simple, kid-friendly video browser application built with Electron. It scans a specified local directory for video files and displays them in an easy-to-navigate grid interface. Clicking a video plays it using the system's VLC media player.

## Features

- **Visual Interface**: Large thumbnails and titles for easy navigation by children.
- **Category Support**: Supports nested folders as categories.
- **External Player**: Launches videos in VLC for reliable playback.
- **Configurable**: Easily set the media folder location.
- **Auto-Discovery**: Scans and updates the library from the file system.

## Installation & Configuration

The primary way to use this application on Linux is via the AppImage.

### 1. Install Dependencies
The application relies on **VLC Media Player** to play videos and **FFmpeg** to generate thumbnails. Ensure these are installed on your system.

*   **Arch Linux**:
    ```bash
    sudo pacman -S vlc ffmpeg
    ```

*   **Debian/Ubuntu**:
    ```bash
    sudo apt update
    sudo apt install vlc ffmpeg
    ```

### 2. Download & Run AppImage
1.  Download the latest `Kids Video Browser-x.x.x.AppImage` from the releases (or `dist/` folder if you built it yourself).
2.  Make it executable:
    ```bash
    chmod +x "Kids Video Browser-1.0.0.AppImage"
    ```
3.  Run it:
    ```bash
    ./"Kids Video Browser-1.0.0.AppImage"
    ```

### 3. System Integration (.desktop file)
To make the application appear in your system menu, create a `.desktop` file.

1.  Create a file named `~/.local/share/applications/kids-video-browser.desktop`:
    ```ini
    [Desktop Entry]
    Name=Kids Video Browser
    Exec=/path/to/Kids Video Browser-1.0.0.AppImage
    Icon=/path/to/icon.png
    Type=Application
    Categories=Video;Education;
    Terminal=false
    ```
    *Replace `/path/to/...` with the actual paths to your AppImage and an icon.*

### 4. Configuration
1.  **First Run**: Launch the application.
2.  **Settings**: Click the Settings button in the top right corner.
3.  **Set Media Folder**: Enter the absolute path to the directory containing your videos.
4.  **Rescan**: Click "Start Rescan" to index the videos and generate thumbnails.

## Usage

-   **Browse**: Navigate through categories (folders) by clicking on them.
-   **Filter**: When viewing videos, use the filter input at the top to search for specific videos by name.
-   **Play**: Click on a video card to open it in VLC.
-   **Rescan**: If you add new videos to the folder, go to Settings and click "Start Rescan" to update the library.

## Build from Source

If you want to modify the application or build it for a different platform, follow these steps.

### Prerequisites
-   **Node.js** (v14+) and **npm**
-   **VLC** and **FFmpeg** (must be in your system PATH)

### Setup
1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd kids-video-browser
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    ```

### Build Process
To create the distributable AppImage:

```bash
npm run build
```

**How it works**:
-   The `build` script runs `electron-builder`.
-   It reads the configuration from `package.json` (specifically the `build` section).
-   It packages the application code, dependencies, and assets.
-   The output (AppImage for Linux) is placed in the `dist/` directory.

### Running Locally (Development)
To start the app without building:
```bash
npm start
```

## License

### Video Browser 

ISC License

Copyright (c) 2025, Martin Melmuk

Full license: `LICENSE` file in the root directory of this repository.

### Comic Neue Font

This license applies to the following files:
- `assets/fonts/ComicNeueAngular-Regular.woff`
- `assets/fonts/ComicNeueAngular-Regular.woff2`

Copyright 2014 The Comic Neue Project Authors (https://github.com/crozynski/comicneue)

This Font Software is licensed under the SIL Open Font License, Version 1.1.
