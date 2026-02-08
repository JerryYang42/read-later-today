# Safari Reading List Monitoring - Design Document

**Date:** 2026-02-08
**Feature:** Option A - Track Safari Reading List Size (On-Demand Command)
**Status:** Design Complete

## Overview

Add a `status` command to `read-later-today` that displays Safari Reading List statistics with time-based breakdown. This is the first step in a three-phase plan to integrate Safari Reading List with the tool.

## Goals

- Monitor Safari Reading List backlog on-demand
- Show count + breakdown (this week, this month, older)
- No warnings/alerts - just neutral statistics
- Extensible design for future sources (Chrome, Pocket, etc.)

## Non-Goals

- Automatic/scheduled monitoring
- Real-time dashboard
- Integration with existing commands
- Warnings/threshold alerts

## Command Structure

### Syntax
```bash
read-later-today status [options]
```

### Options
- `--safari` - Show Safari Reading List status
- `--all` - Show all sources (currently equivalent to --safari)
- Default (no flags): Show `--all`

### Output Format

**Current (single source):**
```
Safari Reading List: 23 unread items
  • 5 this week
  • 10 this month
  • 8 older
```

**Future (multi-source):**
```
Safari Reading List: 23 unread items
  • 5 this week, 10 this month, 8 older

Local (read-later-today): 7 items
  • 7 today

Total: 30 items across 2 sources
```

## Data Model

### SafariReadingListItem Interface

```typescript
interface SafariReadingListItem {
  // Core fields
  title: string;
  url: string;                    // URLString from plist
  uuid: string;                   // WebBookmarkUUID

  // Timestamps
  dateAdded: Date;
  dateLastFetched?: Date;

  // Metadata (useful for frontend display)
  siteName?: string;              // Site name
  previewText?: string;           // Article preview/description
  imageURL?: string;              // Thumbnail/preview image

  // Technical fields (for sync/debugging)
  serverId?: string;              // ServerID
  webBookmarkType?: string;       // Usually "WebBookmarkTypeLeaf"
  fetchResult?: string;           // Success/failure status
  addedLocally?: boolean;         // Whether added on this device

  // Raw data (for future use)
  rawData?: any;                  // Keep original plist entry
}
```

### TimeBreakdown Interface

```typescript
interface TimeBreakdown {
  total: number;
  thisWeek: number;    // Last 7 days
  thisMonth: number;   // 8-30 days ago
  older: number;       // 31+ days ago
}
```

## Architecture

### File Structure

```
src/
  commands/
    status.ts              # New: status command handler
  integrations/
    safari.ts              # New: Safari Reading List logic
  types/
    index.ts              # Updated: Add Safari interfaces
```

### Data Flow

```
User runs: read-later-today status --safari
    ↓
status.ts command handler
    ↓
Call safari.readSafariReadingList()
    ↓
1. Copy ~/Library/Safari/Bookmarks.plist to /tmp/bookmarks-XXXXX.plist
2. Parse binary plist with 'plist' npm package
3. Recursively search for "ReadingList" or "ReadingListNonSync" keys
4. Extract items, parse dates, build SafariReadingListItem[]
5. Clean up temp file
    ↓
Calculate time breakdown:
  - this week: dateAdded >= (now - 7 days)
  - this month: dateAdded >= (now - 30 days) && < (now - 7 days)
  - older: dateAdded < (now - 30 days)
    ↓
Format and display output
```

### Key Functions

```typescript
// src/integrations/safari.ts
export async function readSafariReadingList(): Promise<SafariReadingListItem[]>
export function calculateTimeBreakdown(items: SafariReadingListItem[]): TimeBreakdown
function parseReadingListItem(item: any): SafariReadingListItem
function recursiveSearchForReadingList(obj: any): any[]

// src/commands/status.ts
export async function statusCommand(options: StatusOptions): Promise<void>
function displaySafariStatus(items: SafariReadingListItem[]): void
```

## Implementation Details

### Safari Reading List Access

**Data Source:** `~/Library/Safari/Bookmarks.plist` (binary plist format)

**Access Method:**
1. Copy plist to temp file (avoids locking issues)
2. Parse with Node.js `plist` package
3. Recursively search for objects with "ReadingList" or "ReadingListNonSync" keys
4. Extract reading list items from nested structure

**Logic Ported From:** [export-safari-reading-list](https://github.com/smrfeld/export-safari-reading-list)

### Parser Implementation

```typescript
function parseReadingListItem(item: any): SafariReadingListItem {
  return {
    title: item.URIDictionary?.title || item.URLString,
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
    rawData: item
  };
}
```

### Time Breakdown Logic

```typescript
function calculateTimeBreakdown(items: SafariReadingListItem[]): TimeBreakdown {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  return {
    total: items.length,
    thisWeek: items.filter(i => i.dateAdded >= oneWeekAgo).length,
    thisMonth: items.filter(i => i.dateAdded >= oneMonthAgo && i.dateAdded < oneWeekAgo).length,
    older: items.filter(i => i.dateAdded < oneMonthAgo).length
  };
}
```

## Error Handling

### Error Types

```typescript
export class SafariAccessError extends Error {
  constructor(message: string, public code: 'PERMISSION' | 'NOT_FOUND' | 'PARSE_ERROR') {
    super(message);
    this.name = 'SafariAccessError';
  }
}
```

### Error Scenarios

| Scenario | Error Code | User Message |
|----------|-----------|--------------|
| Bookmarks.plist not accessible | PERMISSION | "Cannot access Safari data. Please grant Full Disk Access to Terminal." |
| Bookmarks.plist not found | NOT_FOUND | "Safari bookmarks not found. Is Safari installed?" |
| Invalid plist format | PARSE_ERROR | "Could not parse Safari bookmarks. File may be corrupted." |
| No reading list items | - | "Safari Reading List: 0 items" |
| Temp file permission denied | - | Fallback to alternative temp directory |

### Error Handling Example

```typescript
try {
  const items = await readSafariReadingList();
  displaySafariStatus(items);
} catch (error) {
  if (error instanceof SafariAccessError) {
    if (error.code === 'PERMISSION') {
      console.error('⚠️  Cannot access Safari data.');
      console.error('Please grant Full Disk Access:');
      console.error('System Settings → Privacy & Security → Full Disk Access → Terminal');
    } else if (error.code === 'NOT_FOUND') {
      console.error('⚠️  Safari bookmarks not found. Is Safari installed?');
    } else {
      console.error('⚠️  Could not parse Safari bookmarks. File may be corrupted.');
    }
  } else {
    console.error('Error reading Safari data:', error.message);
  }
  process.exit(1);
}
```

## Dependencies

### New Dependencies
- `plist` - Parse binary plist files (MIT license)

### Installation
```bash
npm install plist
npm install -D @types/plist
```

## Prerequisites

### User Requirements
- **macOS only** (Safari is macOS-specific)
- **Full Disk Access** must be granted to Terminal (or the app running the CLI)

### Setup Instructions (to be added to README)
1. Open System Settings
2. Go to Privacy & Security → Full Disk Access
3. Click the "+" button
4. Add Terminal.app (or your terminal emulator)
5. Restart Terminal

## Testing

### Unit Tests
- `parseReadingListItem()` - Test data extraction from plist objects
- `calculateTimeBreakdown()` - Test date categorization logic
- `recursiveSearchForReadingList()` - Test plist traversal

### Integration Tests
- Create mock Bookmarks.plist with test data
- Verify end-to-end parsing
- Test with empty reading list
- Test with malformed plist

### Manual Testing Checklist
- [ ] Run with empty Safari Reading List
- [ ] Run with items from different time periods
- [ ] Test without Full Disk Access (verify error message)
- [ ] Test on fresh macOS install
- [ ] Verify temp file cleanup

### Test Data Structure
```typescript
const mockReadingListData = {
  Children: [{
    ReadingList: { /* ... */ },
    Children: [
      {
        URLString: 'https://example.com',
        DateAdded: new Date('2026-02-01'),
        URIDictionary: { title: 'Example Article' },
        WebBookmarkUUID: 'uuid-1',
        /* ... */
      },
      {
        URLString: 'https://test.com',
        DateAdded: new Date('2026-01-15'),
        URIDictionary: { title: 'Test Article' },
        WebBookmarkUUID: 'uuid-2',
        /* ... */
      }
    ]
  }]
};
```

## Future Extensibility

### Phase 2: Import from Safari (Option B)
- Add `import --safari` command
- Pull items from Safari into read-later-today
- Optionally mark as read in Safari

### Phase 3: Sync (Option C)
- Two-way sync between Safari and read-later-today
- Conflict resolution strategy
- Sync on schedule or on-demand

### Additional Sources
The `status` command is designed to support multiple sources:
- `--chrome` - Chrome reading list
- `--pocket` - Pocket integration
- `--instapaper` - Instapaper integration
- `--local` - read-later-today's own list

## Documentation Updates

### README.md Changes
- Add `status` command to Commands section
- Add Full Disk Access setup instructions
- Update Requirements section (mention Safari access)

### Example Usage Section
```bash
# Check Safari Reading List status
read-later-today status

# Explicitly check Safari only
read-later-today status --safari

# Future: check all sources
read-later-today status --all
```

## Open Questions

None - design is complete and approved.

## References

- [Safari Reading List Export Tool](https://github.com/smrfeld/export-safari-reading-list) - Core logic reference
- [macOS plist Format](https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/PropertyLists/) - Apple documentation
- [Node.js plist package](https://www.npmjs.com/package/plist) - Parser library
