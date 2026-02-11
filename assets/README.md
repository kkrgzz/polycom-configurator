# Assets Directory

This directory contains logos and icons for the Polycom Configurator application.

## Required Files

### 1. **logo.png** (Required for header display)
- **Size**: 200x200 pixels or larger (will be auto-resized to 50x50)
- **Format**: PNG with transparent background (recommended)
- **Usage**: Displayed in the application header next to the title

### 2. **icon.ico** (Required for Windows icon)
- **Size**: 256x256 pixels (or multi-size ICO: 16x16, 32x32, 48x48, 256x256)
- **Format**: ICO (Windows Icon)
- **Usage**:
  - Window taskbar icon
  - Window title bar icon
  - Executable file icon (.exe)

### 3. **logo.png** (Fallback for icon)
- If `icon.ico` is not available, the system will use `logo.png` as fallback

## How to Add Your Logo

### Option 1: Using Existing Logo (PNG)

1. **Prepare your logo**:
   - Export your logo as PNG (transparent background recommended)
   - Recommended size: 512x512 or 1024x1024 pixels

2. **Save to this directory**:
   ```
   assets/logo.png
   ```

3. **Create ICO file** (for Windows icon):
   - Use an online converter: https://convertio.co/png-ico/
   - Or use GIMP, Photoshop, or other image editors
   - Save as: `assets/icon.ico`

### Option 2: Using Online Tools

**Create ICO from PNG:**
1. Go to: https://icoconvert.com/
2. Upload your logo PNG
3. Select multiple sizes (16, 32, 48, 256)
4. Download and save as `icon.ico`

**Optimize PNG:**
1. Go to: https://tinypng.com/
2. Upload your logo
3. Download optimized version
4. Save as `logo.png`

## File Structure

```
assets/
├── logo.png          # Main logo for header (200x200+)
├── icon.ico          # Windows icon for executable
└── README.md         # This file
```

## Testing Your Logo

### Development Mode:
```bash
python launcher.py
```
- Logo should appear in the header
- Window icon should appear in taskbar

### Production Build:
```bash
pyinstaller PolycomEditor.spec
```
- Check `dist/PolycomEditor.exe`
- Logo in header: ✓
- Window icon: ✓
- Executable icon: ✓

## Troubleshooting

### Logo not appearing in header?
- Check file exists: `assets/logo.png`
- Check file format: PNG
- Check file size: Not too large (< 5MB)
- Check console for errors: Run `python launcher.py` and check terminal

### Window icon not working?
- ICO format: Make sure it's a valid .ico file
- Multiple sizes: ICO should contain 16x16, 32x32, 48x48, 256x256
- Path: Verify `assets/icon.ico` exists

### Executable icon not showing?
- Rebuild: Delete `dist` and `build` folders, run PyInstaller again
- ICO path: Check `PolycomEditor.spec` has correct icon path
- Cache: Windows may cache icons, restart Explorer or reboot

## Recommended Specs

### For Best Quality:
- **Logo PNG**:
  - Size: 512x512 px
  - Format: PNG-24 with alpha transparency
  - Background: Transparent
  - Colors: RGB (not CMYK)

- **Icon ICO**:
  - Multi-size: 16, 32, 48, 256 px
  - Format: Windows ICO
  - Bit depth: 32-bit (for transparency)

## Example Logo Creation

If you don't have a logo yet, you can:
1. Use your company logo
2. Create one using: Canva, Figma, Adobe Illustrator
3. Commission a designer on Fiverr or Upwork
4. Use placeholder (text-based logo) temporarily

## Notes

- The application will work without logo/icon (falls back to text and default icon)
- Logo is automatically resized to 50x50 in the header
- Icon.ico is used for the executable file icon in Windows Explorer
- Logo.png is used as fallback if icon.ico is not found
