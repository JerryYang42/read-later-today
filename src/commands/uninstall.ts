import chalk from 'chalk';
import inquirer from 'inquirer';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { uninstall, isInstalled, getPlistPath } from '../core/launchd.js';
import { getDataFilePath } from '../core/storage.js';

export async function uninstallCommand(): Promise<void> {
  try {
    if (!isInstalled()) {
      console.log(chalk.yellow('Launch agent is not installed.'));
    } else {
      console.log(chalk.blue('Uninstalling launch agent...'));
      await uninstall();
      console.log(chalk.green('✓ Launch agent uninstalled'));
    }

    // Ask about data file
    const dataPath = getDataFilePath();
    if (existsSync(dataPath)) {
      const answer = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'deleteData',
          message: 'Do you want to delete the data file (~/.read-later-today.json)?',
          default: false,
        },
      ]);

      if (answer.deleteData) {
        await fs.unlink(dataPath);
        console.log(chalk.green('✓ Data file deleted'));
      } else {
        console.log(chalk.dim('Data file kept at:'), chalk.dim(dataPath));
      }
    }

    console.log(chalk.green('\nUninstall complete!'));
  } catch (error) {
    console.error(chalk.red('Error: Uninstall failed'));
    console.error(error instanceof Error ? error.message : 'Unknown error');
    console.log();
    console.log(chalk.yellow('You can manually remove these files:'));
    console.log(chalk.dim(`  ${getPlistPath()}`));
    console.log(chalk.dim(`  ${getDataFilePath()}`));
    process.exit(1);
  }
}
