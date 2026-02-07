# Setting Up macOS Keyboard Shortcut for Read Later Today

This guide shows you how to create a system-wide keyboard shortcut (e.g., Cmd+Shift+R) to instantly save URLs from your browser without opening the terminal.

## Quick Setup Instructions

### Step 1: Create the Shortcut in Shortcuts.app

1. **Open Shortcuts.app** (press Cmd+Space and type "Shortcuts")

2. **Click the "+" button** in the top-right corner to create a new shortcut

3. **Add these actions in order:**

   a. **Get Clipboard**
      - Click "Add Action" and search for "Get Clipboard"
      - Add this action

   b. **Run Shell Script**
      - Search for "Run Shell Script" and add it
      - In the shell script box, paste this command:
        ```bash
        read-later-today add "$1" --silent --notify --source shortcut
        ```
      - Change "Pass Input" to **"as arguments"** (very important!)

4. **Name your shortcut** (top center): "Read Later Today" or "Save URL"

5. **Add a keyboard shortcut:**
   - Click the (i) info button in the top-right
   - Click "Add Keyboard Shortcut"
   - Press your desired key combination (e.g., **Cmd+Shift+R**)
   - Click "Done"

### Step 2: Test It

1. Copy a URL to your clipboard (e.g., `https://example.com`)
2. Press your keyboard shortcut (e.g., Cmd+Shift+R)
3. You should see a notification: "✓ Saved: example.com"

### Step 3: Use It Anywhere

Now from any browser or app:
1. Copy a URL (or have one already copied)
2. Press your keyboard shortcut
3. Continue working - no terminal needed!

## Troubleshooting

### "command not found: read-later-today"

The CLI tool isn't in your PATH. Solutions:

1. **If installed locally in this project:**
   ```bash
   npm link
   ```

2. **If using directly with npm:**
   Change the shell script to:
   ```bash
   npx read-later-today add "$1" --silent --notify --source shortcut
   ```

3. **Use absolute path:**
   Find the path with `which read-later-today` and use it:
   ```bash
   /absolute/path/to/read-later-today add "$1" --silent --notify --source shortcut
   ```

### No notification appears

- Make sure you granted Shortcuts.app notification permissions
- Go to System Settings > Notifications > Shortcuts and enable notifications

### "Invalid URL" notification

- The clipboard doesn't contain a valid HTTP/HTTPS URL
- Make sure you copied the full URL including `https://`

### Shortcut doesn't run

- Check System Settings > Privacy & Security > Shortcuts
- Make sure "Run Shell Script" permission is enabled

## Alternative: Use with Browser Extensions

For even better integration, combine this with browser extensions that copy URLs:

- **Safari:** Right-click tab → "Copy Link"
- **Chrome/Firefox:** Use extensions like "Copy URL" or "Tab Copy"
- Then press your keyboard shortcut!

## Advanced: Customize the Notification

Edit the shell script to customize messages:

```bash
# Show just the domain name
read-later-today add "$1" --silent --notify --source shortcut

# Or capture the full output for debugging
read-later-today add "$1" --notify --source shortcut
```
