# Quick Start: Keyboard Shortcut Setup

Save this URL instantly: **[Read the full setup guide](SETUP.md)**

## 5-Minute Setup

### Step 1: Open Shortcuts.app
Press `Cmd+Space`, type "Shortcuts", press Enter

### Step 2: Create New Shortcut
Click the **+** button (top-right corner)

### Step 3: Add Two Actions

1. **Get Clipboard** (search and add this)
2. **Run Shell Script** with:
   - Command: `read-later-today add "$1" --silent --notify --source shortcut`
   - Change "Pass Input" to **"as arguments"**

### Step 4: Set Keyboard Shortcut
- Click **(i)** info button
- "Add Keyboard Shortcut"
- Press **Cmd+Shift+R** (or your preference)
- Click "Done"

### Step 5: Test It!
1. Copy this URL: `https://example.com`
2. Press **Cmd+Shift+R**
3. See notification: "✓ Saved: example.com"

**Done!** Now save URLs from anywhere with one keystroke.

---

## Troubleshooting

**"command not found"** → Run `npm link` in the project directory

**No notification** → Check System Settings > Notifications > Shortcuts

**See [full setup guide](SETUP.md) for details and advanced options**
