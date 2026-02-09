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
