import chalk from 'chalk';
import inquirer from 'inquirer';
import { getUrls, removeUrl } from '../core/storage.js';

export async function removeCommand(): Promise<void> {
  try {
    const urls = await getUrls();

    if (urls.length === 0) {
      console.log(chalk.yellow('No URLs saved yet.'));
      return;
    }

    const choices = urls.map((item) => ({
      name: `${item.title} - ${chalk.dim(item.url)}`,
      value: item.id,
      short: item.title,
    }));

    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'id',
        message: 'Select a URL to remove:',
        choices,
        pageSize: 10,
      },
    ]);

    const removed = await removeUrl(answer.id);

    if (removed) {
      console.log(chalk.green('✓ URL removed successfully'));
    } else {
      console.log(chalk.yellow('URL not found'));
    }
  } catch (error) {
    if ((error as any).isTtyError) {
      console.error(chalk.red('Error: Interactive prompt not available in this environment'));
    } else {
      console.error(chalk.red('Error: Failed to remove URL'));
      console.error(error instanceof Error ? error.message : 'Unknown error');
    }
    process.exit(1);
  }
}
