import chalk from 'chalk';
import inquirer from 'inquirer';
import { getUrls, removeAllUrls } from '../core/storage.js';

export async function removeAllCommand(): Promise<void> {
  try {
    const urls = await getUrls();

    if (urls.length === 0) {
      console.log(chalk.yellow('No URLs saved yet.'));
      return;
    }

    console.log(chalk.yellow(`You have ${urls.length} URL(s) saved.`));

    const answer = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message: 'Are you sure you want to remove all URLs?',
        default: false,
      },
    ]);

    if (!answer.confirmed) {
      console.log(chalk.dim('Cancelled.'));
      return;
    }

    const count = await removeAllUrls();
    console.log(chalk.green(`✓ Removed ${count} URL(s)`));
  } catch (error) {
    console.error(chalk.red('Error: Failed to remove URLs'));
    console.error(error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}
