import chalk from 'chalk';
import { execSync } from 'child_process';
import { addUrl } from '../core/storage.js';

interface AddCommandOptions {
  silent?: boolean;
  notify?: boolean;
  source?: 'cli' | 'shortcut';
}

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

function showNotification(title: string, message: string): void {
  try {
    // Escape double quotes in message and title
    const escapedTitle = title.replace(/"/g, '\\"');
    const escapedMessage = message.replace(/"/g, '\\"');
    execSync(`osascript -e 'display notification "${escapedMessage}" with title "${escapedTitle}"'`);
  } catch (error) {
    // Silently fail if notification system unavailable
  }
}

export async function addCommand(url: string, options: AddCommandOptions = {}): Promise<void> {
  // Validate URL
  if (!isValidUrl(url)) {
    const errorMsg = `Invalid URL: ${url}`;

    if (options.notify) {
      showNotification('Read Later Today - Error', errorMsg);
    }

    if (!options.silent) {
      console.error(chalk.red(`Error: ${errorMsg}`));
      console.error(chalk.dim('Please provide a valid HTTP or HTTPS URL.'));
    }

    process.exit(1);
  }

  try {
    const title = extractTitle(url);
    const item = await addUrl(url, title, options.source);

    if (options.notify) {
      showNotification('Read Later Today', `✓ Saved: ${item.title}`);
    }

    if (!options.silent) {
      console.log(chalk.green('✓ URL added successfully!'));
      console.log(chalk.dim(`  ${item.title}`));
      console.log(chalk.dim(`  ${item.url}`));
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';

    if (options.notify) {
      showNotification('Read Later Today - Error', `Failed to save: ${url}`);
    }

    if (!options.silent) {
      console.error(chalk.red(`Error: Failed to add URL: ${url}`));
      console.error(errorMsg);
    }

    process.exit(1);
  }
}
