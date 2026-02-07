# read-later-today

A CLI tool to manage reading material URLs throughout the day with automatic daily cleanup at 5AM.

## Overview

`read-later-today` helps you maintain a focused, "today only" reading list that automatically resets each morning. Save interesting articles during the day, and the list clears at 5AM automatically via macOS's native `launchd` scheduler.

## Features

- 📝 Save URLs with a simple command
- ⌨️ **Quick Add with Keyboard Shortcuts** - Save URLs instantly from any app (no terminal needed!)
- 🔍 Interactive terminal UI with arrow-key navigation
- 🌅 Automatic cleanup at 5AM daily (via launchd)
- 💾 Local storage in `~/.read-later-today.json`
- 🧹 Clean uninstallation with no system pollution

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/read-later-today.git
cd read-later-today

# Install dependencies
npm install

# Build the project
npm run build

# Link globally (makes the CLI available system-wide)
npm link
```

## Quick Start

```bash
# Add URLs to your reading list
read-later-today add https://example.com/article

# Open a saved URL interactively
read-later-today resume

# Set up automatic daily cleanup at 5AM
read-later-today setup
```

### ⚡ Quick Add with Keyboard Shortcut (Recommended!)

Save URLs instantly from any browser without opening the terminal:

1. Copy a URL (Cmd+C in your browser)
2. Press your keyboard shortcut (e.g., **Cmd+Shift+R**)
3. See notification: "✓ Saved to Read Later"

**[→ Setup instructions for macOS Shortcuts](shortcuts/SETUP.md)**

This is much faster than switching to the terminal! The keyboard shortcut works system-wide from any application.

## Commands

### `add <url>`

Add a URL to your reading list.

```bash
read-later-today add https://example.com/interesting-article
```

The URL must be a valid HTTP or HTTPS URL.

**Options:**
- `-s, --silent` - Suppress terminal output (useful for background execution)
- `-n, --notify` - Show macOS notification on success/failure
- `--source <source>` - Track entry method (`cli` or `shortcut`)

**Examples:**

```bash
# Standard usage
read-later-today add https://example.com

# With notification (useful for scripts)
read-later-today add https://example.com --notify

# Silent mode with notification (used by keyboard shortcuts)
read-later-today add https://example.com --silent --notify --source shortcut
```

### `resume`

Open a saved URL in your default browser. Displays an interactive list to choose from.

```bash
read-later-today resume
```

Use arrow keys to navigate and press Enter to open the selected URL.

### `remove`

Remove a URL from your reading list. Displays an interactive list to choose from.

```bash
read-later-today remove
```

### `removeAll`

Clear all URLs from your reading list (with confirmation prompt).

```bash
read-later-today removeAll
```

### `setup`

Install the launchd agent for automatic daily cleanup at 5:00 AM.

```bash
read-later-today setup
```

This command:
- Creates a launch agent plist file at `~/Library/LaunchAgents/com.read-later-today.cleanup.plist`
- Configures it to run the cleanup command daily at 5:00 AM
- Loads the agent into launchd

**Note:** You must run `npm run build` before running setup to ensure the compiled CLI exists.

### `uninstall`

Remove the launch agent and optionally delete your data file.

```bash
read-later-today uninstall
```

This command:
- Unloads the launch agent from launchd
- Removes the plist file
- Optionally deletes `~/.read-later-today.json`

## How It Works

### Data Storage

URLs are stored in a JSON file at `~/.read-later-today.json`:

```json
{
  "version": "1.0.0",
  "urls": [
    {
      "id": "1707289234567",
      "url": "https://example.com/article",
      "title": "example.com",
      "addedAt": "2026-02-06T10:30:00.000Z"
    }
  ]
}
```

### Automatic Cleanup

The `setup` command installs a macOS launch agent that runs daily at 5:00 AM. The launch agent:

1. Executes the `cleanup` command
2. Clears all URLs from your reading list
3. Logs output to `/tmp/read-later-today-cleanup.log`
4. Logs errors to `/tmp/read-later-today-cleanup.err`

### Launch Agent Configuration

Location: `~/Library/LaunchAgents/com.read-later-today.cleanup.plist`

The plist file configures:
- **Label:** `com.read-later-today.cleanup`
- **Schedule:** Daily at 5:00 AM
- **Command:** Runs `node /path/to/read-later-today/dist/index.js cleanup`

## Debugging

### Check if the launch agent is installed

```bash
launchctl list | grep read-later-today
```

### Manually trigger cleanup

```bash
launchctl start com.read-later-today.cleanup
```

### View cleanup logs

```bash
# Standard output
cat /tmp/read-later-today-cleanup.log

# Errors
cat /tmp/read-later-today-cleanup.err
```

### Check launch agent status

```bash
launchctl print gui/$(id -u)/com.read-later-today.cleanup
```

## Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Watch mode for development
npm run dev

# Link for local testing
npm link
```

## File Locations

- **Data file:** `~/.read-later-today.json`
- **Launch agent:** `~/Library/LaunchAgents/com.read-later-today.cleanup.plist`
- **Cleanup logs:** `/tmp/read-later-today-cleanup.log`
- **Error logs:** `/tmp/read-later-today-cleanup.err`

## Uninstalling

To completely remove read-later-today:

```bash
# Uninstall launch agent and optionally delete data
read-later-today uninstall

# Unlink the global command
npm unlink -g read-later-today

# Remove the project directory
cd ..
rm -rf read-later-today
```

## Requirements

- **Node.js:** >= 18.0.0
- **Platform:** macOS (uses launchd)

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Troubleshooting

### "Command not found" after npm link

Make sure your npm global bin directory is in your PATH:

```bash
npm config get prefix
# Add /bin to this path in your shell profile
```

### Launch agent not running

1. Check if it's loaded: `launchctl list | grep read-later-today`
2. Check logs: `cat /tmp/read-later-today-cleanup.err`
3. Verify the plist file exists: `ls ~/Library/LaunchAgents/com.read-later-today.cleanup.plist`
4. Try reloading: `launchctl unload ~/Library/LaunchAgents/com.read-later-today.cleanup.plist && launchctl load ~/Library/LaunchAgents/com.read-later-today.cleanup.plist`

### Permission errors

Ensure you have write permissions:
- `~/.read-later-today.json`
- `~/Library/LaunchAgents/`
- `/tmp/` (for logs)
