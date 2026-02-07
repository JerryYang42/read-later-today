import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import os from 'os';
import type { DataStore, ReadingItem } from '../types/index.js';

const DATA_FILE = path.join(os.homedir(), '.read-later-today.json');

const DEFAULT_DATA: DataStore = {
  version: '1.0.0',
  urls: [],
};

export async function loadData(): Promise<DataStore> {
  try {
    if (!existsSync(DATA_FILE)) {
      return { ...DEFAULT_DATA };
    }

    const content = await fs.readFile(DATA_FILE, 'utf-8');
    const data = JSON.parse(content) as DataStore;

    // Ensure the data has the correct structure
    if (!data.version || !Array.isArray(data.urls)) {
      return { ...DEFAULT_DATA };
    }

    return data;
  } catch (error) {
    // If file is corrupt or unreadable, return default data
    console.error('Warning: Could not load data file, using empty state');
    return { ...DEFAULT_DATA };
  }
}

export async function saveData(data: DataStore): Promise<void> {
  try {
    // Write atomically by writing to temp file first
    const tempFile = `${DATA_FILE}.tmp`;
    await fs.writeFile(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    await fs.rename(tempFile, DATA_FILE);
  } catch (error) {
    throw new Error(`Failed to save data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function addUrl(url: string, title: string, source?: 'cli' | 'shortcut'): Promise<ReadingItem> {
  const data = await loadData();

  const item: ReadingItem = {
    id: Date.now().toString(),
    url,
    title,
    addedAt: new Date().toISOString(),
    ...(source && { source }),
  };

  data.urls.push(item);
  await saveData(data);

  return item;
}

export async function getUrls(): Promise<ReadingItem[]> {
  const data = await loadData();
  return data.urls;
}

export async function removeUrl(id: string): Promise<boolean> {
  const data = await loadData();
  const initialLength = data.urls.length;

  data.urls = data.urls.filter((item) => item.id !== id);

  if (data.urls.length === initialLength) {
    return false; // URL not found
  }

  await saveData(data);
  return true;
}

export async function removeAllUrls(): Promise<number> {
  const data = await loadData();
  const count = data.urls.length;

  data.urls = [];
  await saveData(data);

  return count;
}

export function getDataFilePath(): string {
  return DATA_FILE;
}
