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
