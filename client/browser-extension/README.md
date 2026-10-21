# WordVeil browser bridge

This extension sends the selected text from the browser to the local Tauri app running on http://127.0.0.1:8765.

## Load in Chrome

1. Open Chrome and go to chrome://extensions
2. Enable Developer mode
3. Click Load unpacked
4. Select this folder: browser-extension
5. Open any website and press Ctrl + Shift + 1, then select text with the mouse
6. The selected word should appear in the Tauri app popup

## Notes

- The Tauri app must already be running.
- This is a browser bridge, not a universal cross-app solution for native games or all desktop applications.
