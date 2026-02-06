import chalk from 'chalk';
import inquirer from 'inquirer';
import { getUrls } from '../core/storage.js';
import { openUrl } from '../core/browser.js';

export async function resumeCommand(): Promise<void> {
  try {
    const urls = await getUrls();

    if (urls.length === 0) {
      console.log(chalk.yellow('No URLs saved yet. Add one with:'));
      console.log(chalk.dim('  read-later-today add <url>'));
      return;
    }

    const choices = urls.map((item) => ({
      name: `${item.title} - ${chalk.dim(item.url)}`,
      value: item.url,
      short: item.title,
    }));

    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'url',
        message: 'Select a URL to open:',
        choices,
        pageSize: 10,
      },
    ]);

    console.log(chalk.blue('Opening URL...'));
    await openUrl(answer.url);
    console.log(chalk.green('✓ URL opened in browser'));
  } catch (error) {
    if ((error as any).isTtyError) {
      console.error(chalk.red('Error: Interactive prompt not available in this environment'));
    } else {
      console.error(chalk.red('Error: Failed to open URL'));
      console.error(error instanceof Error ? error.message : 'Unknown error');
    }
    process.exit(1);
  }
}
