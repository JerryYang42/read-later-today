export interface ReadingItem {
  id: string;
  url: string;
  title: string;
  addedAt: string;
}

export interface DataStore {
  version: string;
  urls: ReadingItem[];
}
