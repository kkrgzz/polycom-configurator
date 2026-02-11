# Polycom Configurator - Build Instructions

## Running the Application

### Development Mode (with Python)

**Option 1: GUI Launcher (Recommended)**
```bash
python launcher.py
```
This will open a Tkinter window where you can start/stop the server.

**Option 2: Direct Flask (Development)**
```bash
python app.py
```
Then open browser to `http://localhost:5000`

### Production Mode (Executable)

Build the standalone executable with:
```bash
pyinstaller BuildApplication.spec
```

The executable will be in the `dist` folder: `dist/BuildApplication.exe`

## Features of GUI Launcher

- ✅ **Start/Stop Server** - Control the Flask server with buttons
- ✅ **Auto Port Detection** - Automatically finds available port (5000-5099)
- ✅ **Auto Browser Launch** - Opens browser automatically when server starts
- ✅ **Server Status Display** - Shows current server state (Running/Stopped)
- ✅ **Clean Shutdown** - Properly handles application exit
- ✅ **No Console Window** - Runs as a windowed application

## How to Use the GUI

1. **Launch the application**
   - Double-click `BuildApplication.exe` (or run `python launcher.py`)

2. **Start the server**
   - Click "▶ Start Server" button
   - Status will change to "🟢 Running"
   - Browser opens automatically to the app

3. **Access the application**
   - Use the opened browser window
   - Or click "🌐 Open in Browser" to open another window

4. **Stop the server**
   - Close the GUI window
   - Server shuts down automatically

## Requirements

### For Development
- Python 3.8+
- Flask
- All dependencies in requirements.txt (if exists)

### For Building Executable
```bash
pip install pyinstaller
```

## Troubleshooting

### Port Already in Use
- The launcher will automatically try ports 5000-5099
- If all ports are busy, close other applications

### PyInstaller Build Fails
- Make sure `templates` and `static` folders exist
- Verify all Python dependencies are installed

### Server Won't Stop
- Close the GUI window to force shutdown
- The server runs in a daemon thread and exits with the GUI

## File Structure

```
polycom-configurator/
├── launcher.py              # GUI launcher (Tkinter)
├── app.py                   # Flask application
├── BuildApplication.spec       # PyInstaller configuration
├── templates/               # HTML templates
│   ├── base.html
│   ├── index.html
│   └── components/
└── static/                  # CSS, JS, assets
    ├── css/
    └── js/
```

## Notes

- The GUI launcher uses threading to run Flask without blocking
- Console mode is disabled for cleaner executable experience
- Server runs on localhost (127.0.0.1) only for security
- All configuration data is managed through the web interface
