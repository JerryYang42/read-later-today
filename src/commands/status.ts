import chalk from 'chalk';
import { readSafariReadingList, calculateTimeBreakdown } from '../integrations/safari.js';
import { SafariAccessError } from '../types/index.js';

interface StatusOptions {
  safari?: boolean;
  all?: boolean;
}

/**
 * Display Safari Reading List status
 */
function displaySafariStatus(items: any[]): void {
  const breakdown = calculateTimeBreakdown(items);

  console.log(chalk.bold(`Safari Reading List: ${breakdown.total} unread items`));

  if (breakdown.total > 0) {
    console.log(`  • ${breakdown.thisWeek} this week`);
    console.log(`  • ${breakdown.thisMonth} this month`);
    console.log(`  • ${breakdown.older} older`);
  }
}

/**
 * Status command handler
 */
export async function statusCommand(options: StatusOptions): Promise<void> {
  // Default to --all if no options specified
  const showAll = options.all || (!options.safari && !options.all);
  const showSafari = options.safari || showAll;

  try {
    if (showSafari) {
      const items = await readSafariReadingList();
      displaySafariStatus(items);
    }
  } catch (error) {
    if (error instanceof SafariAccessError) {
      if (error.code === 'PERMISSION') {
        console.error(chalk.yellow('⚠️  Cannot access Safari data.'));
        console.error('Please grant Full Disk Access:');
        console.error('System Settings → Privacy & Security → Full Disk Access → Terminal');
      } else if (error.code === 'NOT_FOUND') {
        console.error(chalk.yellow('⚠️  Safari bookmarks not found. Is Safari installed?'));
      } else {
        console.error(chalk.yellow('⚠️  Could not parse Safari bookmarks. File may be corrupted.'));
      }
    } else {
      console.error(chalk.red('Error reading Safari data:'), error instanceof Error ? error.message : error);
    }
    process.exit(1);
  }
}
