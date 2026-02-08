# Safari Reading List Status Command Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add `status` command to display Safari Reading List count with time-based breakdown

**Architecture:** Create Safari integration module to parse Bookmarks.plist, extract reading list items, and display stats via new status command with extensible design for future sources

**Tech Stack:** TypeScript, plist parser, Node.js fs/child_process, Commander.js

---

## Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install plist packages**

Run: `npm install plist`
Run: `npm install -D @types/plist`

Expected: Both packages installed successfully

**Step 2: Rebuild**

Run: `npm run build`

Expected: Build succeeds with no errors

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "build: add plist dependency for Safari integration"
```

---

## Task 2: Add Safari Type Definitions

**Files:**
- Modify: `src/types/index.ts`

**Step 1: Add Safari interfaces to types**

Append to `src/types/index.ts`:

```typescript
export interface SafariReadingListItem {
  // Core fields
  title: string;
  url: string;
  uuid: string;

  // Timestamps
  dateAdded: Date;
  dateLastFetched?: Date;

  // Metadata (useful for frontend display)
  siteName?: string;
  previewText?: string;
  imageURL?: string;

  // Technical fields (for sync/debugging)
  serverId?: string;
  webBookmarkType?: string;
  fetchResult?: string;
  addedLocally?: boolean;

  // Raw data (for future use)
  rawData?: any;
}

export interface TimeBreakdown {
  total: number;
  thisWeek: number;    // Last 7 days
  thisMonth: number;   // 8-30 days ago
  older: number;       // 31+ days ago
}

export class SafariAccessError extends Error {
  constructor(message: string, public code: 'PERMISSION' | 'NOT_FOUND' | 'PARSE_ERROR') {
    super(message);
    this.name = 'SafariAccessError';
  }
}
```

**Step 2: Verify build**

Run: `npm run build`

Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add Safari Reading List type definitions"
```

---

## Task 3: Create Safari Integration Module (Part 1 - Parser)

**Files:**
- Create: `src/integrations/safari.ts`

**Step 1: Create integrations directory**

Run: `mkdir -p src/integrations`

**Step 2: Create safari.ts with parsing logic**

Create `src/integrations/safari.ts`:

```typescript
import * as plist from 'plist';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';
import { SafariReadingListItem, TimeBreakdown, SafariAccessError } from '../types/index.js';

/**
 * Recursively search for reading list items in plist structure
 */
function recursiveSearchForReadingList(obj: any): any[] {
  const results: any[] = [];

  if (typeof obj !== 'object' || obj === null) {
    return results;
  }

  // Check if this object has ReadingList or ReadingListNonSync key
  if ('ReadingList' in obj || 'ReadingListNonSync' in obj) {
    results.push(obj);
  }

  // Recursively search Children arrays
  if (Array.isArray(obj.Children)) {
    for (const child of obj.Children) {
      results.push(...recursiveSearchForReadingList(child));
    }
  }

  // Search all object values
  for (const key in obj) {
    if (typeof obj[key] === 'object') {
      results.push(...recursiveSearchForReadingList(obj[key]));
    }
  }

  return results;
}

/**
 * Parse a raw plist item into SafariReadingListItem
 */
function parseReadingListItem(item: any): SafariReadingListItem {
  return {
    title: item.URIDictionary?.title || item.URLString || 'Untitled',
    url: item.URLString,
    uuid: item.WebBookmarkUUID,
    dateAdded: new Date(item.DateAdded),
    dateLastFetched: item.DateLastFetched ? new Date(item.DateLastFetched) : undefined,
    siteName: item.siteName,
    previewText: item.PreviewText,
    imageURL: item.imageURL,
    serverId: item.ServerID,
    webBookmarkType: item.WebBookmarkType,
    fetchResult: item.FetchResult,
    addedLocally: item.AddedLocally,
    rawData: item,
  };
}

/**
 * Read Safari's Reading List from Bookmarks.plist
 */
export async function readSafariReadingList(): Promise<SafariReadingListItem[]> {
  const bookmarksPath = path.join(os.homedir(), 'Library', 'Safari', 'Bookmarks.plist');

  // Check if file exists
  if (!fs.existsSync(bookmarksPath)) {
    throw new SafariAccessError(
      'Safari bookmarks not found. Is Safari installed?',
      'NOT_FOUND'
    );
  }

  // Create temp file path
  const tempPath = path.join(os.tmpdir(), `bookmarks-${Date.now()}.plist`);

  try {
    // Copy to temp file to avoid locking issues
    try {
      execSync(`cp "${bookmarksPath}" "${tempPath}"`, { stdio: 'pipe' });
    } catch (error: any) {
      if (error.message?.includes('Permission denied') || error.message?.includes('Operation not permitted')) {
        throw new SafariAccessError(
          'Cannot access Safari data. Please grant Full Disk Access to Terminal.',
          'PERMISSION'
        );
      }
      throw error;
    }

    // Parse plist
    let data: any;
    try {
      const fileContent = fs.readFileSync(tempPath, 'utf8');
      data = plist.parse(fileContent);
    } catch (error) {
      throw new SafariAccessError(
        'Could not parse Safari bookmarks. File may be corrupted.',
        'PARSE_ERROR'
      );
    }

    // Find reading list items
    const readingListObjects = recursiveSearchForReadingList(data);
    const items: SafariReadingListItem[] = [];

    for (const obj of readingListObjects) {
      // Extract items from Children array
      if (Array.isArray(obj.Children)) {
        for (const child of obj.Children) {
          if (child.URLString) {
            items.push(parseReadingListItem(child));
          }
        }
      }
    }

    return items;
  } finally {
    // Clean up temp file
    try {
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  }
}

/**
 * Calculate time-based breakdown of reading list items
 */
export function calculateTimeBreakdown(items: SafariReadingListItem[]): TimeBreakdown {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  return {
    total: items.length,
    thisWeek: items.filter(i => i.dateAdded >= oneWeekAgo).length,
    thisMonth: items.filter(i => i.dateAdded >= oneMonthAgo && i.dateAdded < oneWeekAgo).length,
    older: items.filter(i => i.dateAdded < oneMonthAgo).length,
  };
}
```

**Step 3: Verify build**

Run: `npm run build`

Expected: Build succeeds, creates `dist/integrations/safari.js`

**Step 4: Commit**

```bash
git add src/integrations/safari.ts
git commit -m "feat: add Safari Reading List parser and integration"
```

---

## Task 4: Create Status Command

**Files:**
- Create: `src/commands/status.ts`

**Step 1: Create status command with display logic**

Create `src/commands/status.ts`:

```typescript
import chalk from 'chalk';
import { readSafariReadingList, calculateTimeBreakdown } from '../integrations/safari.js';
import { SafariAccessError } from '../types/index.js';

interface StatusOptions {
  safari?: boolean;
  all?: boolean;
}

/**
 * Display Safari Reading List status
 */
function displaySafariStatus(items: any[]): void {
  const breakdown = calculateTimeBreakdown(items);

  console.log(chalk.bold(`Safari Reading List: ${breakdown.total} unread items`));

  if (breakdown.total > 0) {
    console.log(`  • ${breakdown.thisWeek} this week`);
    console.log(`  • ${breakdown.thisMonth} this month`);
    console.log(`  • ${breakdown.older} older`);
  }
}

/**
 * Status command handler
 */
export async function statusCommand(options: StatusOptions): Promise<void> {
  // Default to --all if no options specified
  const showAll = options.all || (!options.safari && !options.all);
  const showSafari = options.safari || showAll;

  try {
    if (showSafari) {
      const items = await readSafariReadingList();
      displaySafariStatus(items);
    }
  } catch (error) {
    if (error instanceof SafariAccessError) {
      if (error.code === 'PERMISSION') {
        console.error(chalk.yellow('⚠️  Cannot access Safari data.'));
        console.error('Please grant Full Disk Access:');
        console.error('System Settings → Privacy & Security → Full Disk Access → Terminal');
      } else if (error.code === 'NOT_FOUND') {
        console.error(chalk.yellow('⚠️  Safari bookmarks not found. Is Safari installed?'));
      } else {
        console.error(chalk.yellow('⚠️  Could not parse Safari bookmarks. File may be corrupted.'));
      }
    } else {
      console.error(chalk.red('Error reading Safari data:'), error instanceof Error ? error.message : error);
    }
    process.exit(1);
  }
}
```

**Step 2: Verify build**

Run: `npm run build`

Expected: Build succeeds, creates `dist/commands/status.js`

**Step 3: Commit**

```bash
git add src/commands/status.ts
git commit -m "feat: add status command for reading list monitoring"
```

---

## Task 5: Wire Status Command to CLI

**Files:**
- Modify: `src/index.ts`

**Step 1: Import status command**

Add import after line 12:

```typescript
import { statusCommand } from './commands/status.js';
```

**Step 2: Register status command**

Add before `program.parse()` (after line 81):

```typescript
program
  .command('status')
  .description('Show reading list status from various sources')
  .option('--safari', 'Show Safari Reading List status')
  .option('--all', 'Show all sources (default)')
  .action(statusCommand);
```

**Step 3: Verify build**

Run: `npm run build`

Expected: Build succeeds

**Step 4: Test command registration**

Run: `node dist/index.js status --help`

Expected output:
```
Usage: read-later-today status [options]

Show reading list status from various sources

Options:
  --safari     Show Safari Reading List status
  --all        Show all sources (default)
  -h, --help   display help for command
```

**Step 5: Commit**

```bash
git add src/index.ts
git commit -m "feat: wire status command to CLI"
```

---

## Task 6: Manual Testing

**Files:**
- None (testing only)

**Step 1: Test with Safari Reading List (requires Full Disk Access)**

Run: `node dist/index.js status`

Expected: Either displays Safari Reading List stats OR shows permission error

**Step 2: Test --safari flag**

Run: `node dist/index.js status --safari`

Expected: Same as above

**Step 3: Test --all flag**

Run: `node dist/index.js status --all`

Expected: Same as above

**Step 4: Test without Full Disk Access (if not granted)**

Run: `node dist/index.js status`

Expected output:
```
⚠️  Cannot access Safari data.
Please grant Full Disk Access:
System Settings → Privacy & Security → Full Disk Access → Terminal
```

**Step 5: Document test results**

Create a file `TESTING.md` documenting what you tested and results.

---

## Task 7: Update README Documentation

**Files:**
- Modify: `README.md`

**Step 1: Add status command to Commands section**

After the `add` command section (around line 62), add:

```markdown
### `status`

Show reading list status from various sources.

```bash
read-later-today status
```

By default, shows all available sources (currently Safari Reading List only).

**Options:**
- `--safari` - Show Safari Reading List status only
- `--all` - Show all sources (default)

**Output:**
```
Safari Reading List: 23 unread items
  • 5 this week
  • 10 this month
  • 8 older
```

**Prerequisites:**
- macOS only (Safari is macOS-specific)
- Requires Full Disk Access for Terminal (see Setup below)
```

**Step 2: Add Full Disk Access setup section**

Before the "Debugging" section (around line 182), add:

```markdown
## Safari Reading List Integration

The `status` command can monitor your Safari Reading List backlog. This requires granting Full Disk Access to your terminal.

### Granting Full Disk Access

1. Open **System Settings**
2. Go to **Privacy & Security** → **Full Disk Access**
3. Click the **"+"** button
4. Navigate to and add **Terminal.app** (or your terminal emulator)
5. Restart your terminal application

### Troubleshooting Safari Access

If you see "Cannot access Safari data":
- Verify Full Disk Access is granted to your terminal
- Restart your terminal completely (quit and reopen)
- Try running: `ls ~/Library/Safari/Bookmarks.plist` to test access
```

**Step 3: Update Requirements section**

Modify the Requirements section (around line 251):

```markdown
## Requirements

- **Node.js:** >= 18.0.0
- **Platform:** macOS (uses launchd for cleanup, Safari for reading list)
- **Optional:** Full Disk Access for Safari Reading List integration
```

**Step 4: Verify build**

Run: `npm run build`

Expected: Build succeeds

**Step 5: Commit**

```bash
git add README.md
git commit -m "docs: add status command and Safari integration instructions"
```

---

## Task 8: Final Build and Verification

**Files:**
- None (verification only)

**Step 1: Clean build**

Run: `rm -rf dist && npm run build`

Expected: Clean build succeeds

**Step 2: Link CLI globally (optional)**

Run: `npm link`

Expected: Command linked successfully

**Step 3: Test via global command (if linked)**

Run: `read-later-today status`

Expected: Works as tested earlier

**Step 4: Verify all commands still work**

Run: `read-later-today --help`

Expected: Shows `status` in command list

**Step 5: Check git status**

Run: `git status`

Expected: Working directory clean

---

## Success Criteria

- [ ] `npm run build` succeeds with no errors
- [ ] `read-later-today status` command exists and shows help
- [ ] Safari Reading List can be read (with Full Disk Access)
- [ ] Time breakdown calculates correctly (this week, this month, older)
- [ ] Error handling works for permission denied
- [ ] Error handling works for file not found
- [ ] README documents the new command and setup requirements
- [ ] All changes committed with clear messages

## Future Work (Not in this plan)

- Phase 2: Import from Safari (`import --safari`)
- Phase 3: Two-way sync
- Additional sources: Chrome, Pocket, Instapaper
- Unit tests for parsing logic
- Integration tests with mock plist files
