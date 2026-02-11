"""
Polycom Configurator - GUI Launcher
Desktop application wrapper with Tkinter interface
"""
import sys
import os
import threading
import webbrowser
import tkinter as tk
from tkinter import messagebox
from PIL import Image, ImageTk
import socket

# Handle PyInstaller paths
if getattr(sys, 'frozen', False):
    BASE_DIR = sys._MEIPASS
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

from app import app


class PolycomLauncher:
    def __init__(self, root):
        self.root = root
        self.root.title("MagEES | Poly Fleet Manager")
        self.root.geometry("500x600")
        self.root.resizable(False, False)

        # Set window icon
        self.set_window_icon()

        # Center window
        self.center_window()

        # Server state
        self.server_thread = None
        self.server_running = False
        self.port = 5000
        self.host = '127.0.0.1'

        # Load logo
        self.logo_image = None
        self.load_logo()

        # Setup UI
        self.setup_ui()

        # Handle window close
        self.root.protocol("WM_DELETE_WINDOW", self.on_closing)

    def set_window_icon(self):
        """Set the window icon"""
        try:
            icon_path = os.path.join(BASE_DIR, 'assets', 'icon.ico')
            if os.path.exists(icon_path):
                self.root.iconbitmap(icon_path)
            else:
                # Try PNG as fallback
                icon_png_path = os.path.join(BASE_DIR, 'assets', 'logo.png')
                if os.path.exists(icon_png_path):
                    icon_img = Image.open(icon_png_path)
                    icon_photo = ImageTk.PhotoImage(icon_img)
                    self.root.iconphoto(True, icon_photo)
        except Exception as e:
            print(f"Could not load icon: {e}")

    def load_logo(self):
        """Load the logo image for display in header"""
        try:
            logo_path = os.path.join(BASE_DIR, 'assets', 'logo.png')
            if os.path.exists(logo_path):
                logo_img = Image.open(logo_path)
                # Resize logo to fit header (height ~50px)
                logo_img = logo_img.resize((50, 50), Image.Resampling.LANCZOS)
                self.logo_image = ImageTk.PhotoImage(logo_img)
        except Exception as e:
            print(f"Could not load logo: {e}")
            self.logo_image = None

    def center_window(self):
        """Center the window on screen"""
        self.root.update_idletasks()
        width = self.root.winfo_width()
        height = self.root.winfo_height()
        x = (self.root.winfo_screenwidth() // 2) - (width // 2)
        y = (self.root.winfo_screenheight() // 2) - (height // 2)
        self.root.geometry(f'{width}x{height}+{x}+{y}')

    def setup_ui(self):
        """Setup the user interface"""
        # Header Frame
        header_frame = tk.Frame(self.root, bg="#f1f1f1", height=80)
        header_frame.pack(fill=tk.X)
        header_frame.pack_propagate(False)

        # Logo and Title Container
        header_container = tk.Frame(header_frame, bg="#f1f1f1")
        header_container.pack(expand=True)

        # Logo (if available)
        if self.logo_image:
            logo_label = tk.Label(
                header_container,
                image=self.logo_image,
                bg="#f1f1f1"
            )
            logo_label.pack(side=tk.LEFT, padx=(0, 10))

        # Title
        title_label = tk.Label(
            header_container,
            text="MagEES | Poly Fleet Manager",
            font=("Arial", 18, "bold"),
            bg="#f1f1f1",
            fg="#0d6efd"
        )
        title_label.pack(side=tk.LEFT)

        # Main Content Frame
        content_frame = tk.Frame(self.root, bg="white")
        content_frame.pack(fill=tk.BOTH, expand=True, padx=20, pady=20)

        # Status Frame
        status_frame = tk.Frame(content_frame, bg="#f8f9fa", relief=tk.RIDGE, borderwidth=2)
        status_frame.pack(fill=tk.X, pady=(0, 20))

        tk.Label(
            status_frame,
            text="Server Status:",
            font=("Arial", 10, "bold"),
            bg="#f8f9fa"
        ).pack(pady=(10, 5))

        self.status_label = tk.Label(
            status_frame,
            text="⚫ Stopped",
            font=("Arial", 12),
            bg="#f8f9fa",
            fg="#dc3545"
        )
        self.status_label.pack(pady=(0, 10))

        # URL Display
        self.url_label = tk.Label(
            content_frame,
            text="",
            font=("Arial", 9),
            fg="#6c757d",
            bg="white"
        )
        self.url_label.pack(pady=(0, 20))

        # Buttons Frame
        button_frame = tk.Frame(content_frame, bg="white")
        button_frame.pack(pady=10)

        # Start Button
        self.start_button = tk.Button(
            button_frame,
            text="▶ Start Server",
            font=("Arial", 11, "bold"),
            bg="#28a745",
            fg="white",
            activebackground="#218838",
            activeforeground="white",
            width=15,
            height=2,
            relief=tk.FLAT,
            cursor="hand2",
            command=self.start_server
        )
        self.start_button.pack(side=tk.LEFT, padx=5)

        # Stop Button
        self.stop_button = tk.Button(
            button_frame,
            text="⬛ Stop Server",
            font=("Arial", 11, "bold"),
            bg="#dc3545",
            fg="white",
            activebackground="#c82333",
            activeforeground="white",
            width=15,
            height=2,
            relief=tk.FLAT,
            cursor="hand2",
            command=self.stop_server,
            state=tk.DISABLED
        )
        self.stop_button.pack(side=tk.LEFT, padx=5)

        # Open Browser Button
        self.browser_button = tk.Button(
            content_frame,
            text="🌐 Open in Browser",
            font=("Arial", 10),
            bg="#0d6efd",
            fg="white",
            activebackground="#0b5ed7",
            activeforeground="white",
            width=20,
            relief=tk.FLAT,
            cursor="hand2",
            command=self.open_browser,
            state=tk.DISABLED
        )
        self.browser_button.pack(pady=10)

        # Footer
        footer_label = tk.Label(
            content_frame,
            text="MagEES | Polycom Phone Configuration Manager v1.0",
            font=("Arial", 8),
            fg="#6c757d",
            bg="white"
        )
        footer_label.pack(side=tk.BOTTOM, pady=10)

    def is_port_available(self, port):
        """Check if port is available"""
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        try:
            sock.bind((self.host, port))
            sock.close()
            return True
        except OSError:
            return False

    def find_available_port(self):
        """Find an available port starting from 5000"""
        for port in range(5000, 5100):
            if self.is_port_available(port):
                return port
        return None

    def run_flask(self):
        """Run Flask server in thread"""
        try:
            app.run(host=self.host, port=self.port, debug=False, use_reloader=False)
        except Exception as e:
            print(f"Server error: {e}")

    def start_server(self):
        """Start the Flask server"""
        if self.server_running:
            return

        # Find available port
        if not self.is_port_available(self.port):
            new_port = self.find_available_port()
            if new_port:
                self.port = new_port
            else:
                messagebox.showerror(
                    "Port Error",
                    "No available ports found in range 5000-5099.\nPlease close other applications and try again."
                )
                return

        # Start server in thread
        self.server_thread = threading.Thread(target=self.run_flask, daemon=True)
        self.server_thread.start()

        # Update UI
        self.server_running = True
        self.status_label.config(text="🟢 Running", fg="#28a745")
        url = f"http://{self.host}:{self.port}"
        self.url_label.config(text=f"Access at: {url}")
        self.start_button.config(state=tk.DISABLED)
        self.stop_button.config(state=tk.NORMAL)
        self.browser_button.config(state=tk.NORMAL)

        # Auto-open browser
        self.root.after(1000, self.open_browser)

    def stop_server(self):
        """Stop the Flask server"""
        if not self.server_running:
            return

        # Note: Flask development server doesn't support graceful shutdown
        # In production, you'd use a proper WSGI server with shutdown capability
        messagebox.showinfo(
            "Server Stop",
            "To stop the server, please close this application.\nThe server will shut down automatically."
        )

    def open_browser(self):
        """Open web browser to application URL"""
        if self.server_running:
            url = f"http://{self.host}:{self.port}"
            webbrowser.open(url)

    def on_closing(self):
        """Handle window close event"""
        if self.server_running:
            if messagebox.askokcancel("Quit", "Server is running. Close application?"):
                self.root.destroy()
                sys.exit(0)
        else:
            self.root.destroy()
            sys.exit(0)


def main():
    """Main entry point"""
    root = tk.Tk()
    app_launcher = PolycomLauncher(root)
    root.mainloop()


if __name__ == '__main__':
    main()
