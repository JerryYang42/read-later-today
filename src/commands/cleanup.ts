import { removeAllUrls } from '../core/storage.js';

export async function cleanupCommand(): Promise<void> {
  try {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Running cleanup...`);

    const count = await removeAllUrls();
    console.log(`[${timestamp}] Removed ${count} URL(s)`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Cleanup failed:`, error);
    process.exit(1);
  }
}
