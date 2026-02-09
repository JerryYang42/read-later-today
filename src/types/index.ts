export interface ReadingItem {
  id: string;
  url: string;
  title: string;
  addedAt: string;
  source?: 'cli' | 'shortcut'; // Track entry method
}

export interface DataStore {
  version: string;
  urls: ReadingItem[];
}

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
