# macOS Shortcuts Integration

Save URLs to Read Later Today with a single keystroke from anywhere on your Mac.

## Why Use Keyboard Shortcuts?

**Before:** Copy URL → Switch to terminal → Type command → Paste URL → Enter → Switch back
**After:** Press Cmd+Shift+R → Done!

## Getting Started

### Quick Setup (5 minutes)
→ **[Follow the Quick Start guide](QUICKSTART.md)**

### Detailed Setup (with troubleshooting)
→ **[Read the complete setup guide](SETUP.md)**

## How It Works

The keyboard shortcut runs this command behind the scenes:

```bash
read-later-today add "$clipboard" --silent --notify --source shortcut
```

- `--silent`: No terminal output (runs in background)
- `--notify`: Shows macOS notification
- `--source shortcut`: Tracks that this URL came from a keyboard shortcut

## Command Line Usage

All the new flags work from the terminal too:

```bash
# Show notification when saving
read-later-today add https://example.com --notify

# Silent mode (no terminal output)
read-later-today add https://example.com --silent

# Combined (for scripts/automation)
read-later-today add https://example.com --silent --notify
```

## Examples

### Save Current URL from Safari
1. Copy URL: `Cmd+L`, `Cmd+C`
2. Press your shortcut: `Cmd+Shift+R`
3. See notification: "✓ Saved: example.com"

### Save Multiple Tabs Quickly
1. Copy first URL → Press shortcut
2. Copy second URL → Press shortcut
3. Copy third URL → Press shortcut
4. Open them later: `read-later-today resume`

### Integration with Browser Extensions
Use "Copy URL" extensions to copy links without switching tabs, then press your shortcut.

## Notifications

You'll see macOS notifications for:
- ✓ Success: "✓ Saved: example.com"
- ✗ Error: "Invalid URL: not-a-url"

## Data Storage

URLs saved via keyboard shortcut include a `source` field:

```json
{
  "id": "1770484603084",
  "url": "https://example.com",
  "title": "example.com",
  "addedAt": "2026-02-07T17:16:43.084Z",
  "source": "shortcut"
}
```

This lets you track which URLs were saved via shortcuts vs. the CLI.

## Tips & Tricks

### Choose Your Keyboard Shortcut
Recommended shortcuts:
- `Cmd+Shift+R` (R for Read)
- `Cmd+Shift+L` (L for Later)
- `Cmd+Shift+S` (S for Save)

### Use with Alfred/Raycast
Create workflows in these tools that copy URLs and trigger the shortcut.

### Automation
Since it's just a shell command, you can use it in any macOS automation:
- Keyboard Maestro macros
- Automator workflows
- Shell scripts

## Troubleshooting

### Command not found
```bash
# Option 1: Link the CLI globally
cd /path/to/read-later-today
npm link

# Option 2: Use absolute path in shortcut
/absolute/path/to/read-later-today add "$1" --silent --notify
```

### No notifications appearing
1. System Settings → Notifications
2. Find "Shortcuts"
3. Enable "Allow Notifications"

### Invalid URL errors
Make sure you're copying complete URLs including `https://`

### More help
See [SETUP.md](SETUP.md) for detailed troubleshooting.

## What's Next?

After setting up your shortcut:

1. **Test it**: Copy `https://example.com` and press your shortcut
2. **Verify it saved**: Run `cat ~/.read-later-today.json`
3. **Open URLs**: Run `read-later-today resume`
4. **Set up auto-cleanup**: Run `read-later-today setup` (clears list at 5 AM daily)

## Learn More

- [Main README](../README.md) - Full CLI documentation
- [Quick Start](QUICKSTART.md) - 5-minute setup guide
- [Setup Guide](SETUP.md) - Detailed instructions
- [Implementation Summary](../IMPLEMENTATION_SUMMARY.md) - Technical details

---

**Enjoy saving URLs with a single keystroke!** 🚀
