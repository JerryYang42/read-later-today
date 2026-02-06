import open from 'open';

export async function openUrl(url: string): Promise<void> {
  try {
    await open(url);
  } catch (error) {
    throw new Error(`Failed to open URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
