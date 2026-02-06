import chalk from 'chalk';
import { addUrl } from '../core/storage.js';

function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function extractTitle(url: string): string {
  try {
    const urlObj = new URL(url);
    // Use hostname as title for simplicity
    return urlObj.hostname;
  } catch {
    return url;
  }
}

export async function addCommand(url: string): Promise<void> {
  // Validate URL
  if (!isValidUrl(url)) {
    console.error(chalk.red('Error: Invalid URL. Please provide a valid HTTP or HTTPS URL.'));
    process.exit(1);
  }

  try {
    const title = extractTitle(url);
    const item = await addUrl(url, title);

    console.log(chalk.green('✓ URL added successfully!'));
    console.log(chalk.dim(`  ${item.title}`));
    console.log(chalk.dim(`  ${item.url}`));
  } catch (error) {
    console.error(chalk.red('Error: Failed to add URL'));
    console.error(error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}
