import chalk from 'chalk';
import inquirer from 'inquirer';
import { install, isInstalled, getPlistPath } from '../core/launchd.js';

export async function setupCommand(): Promise<void> {
  try {
    // Check if already installed
    if (isInstalled()) {
      const answer = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'reinstall',
          message: 'Launch agent is already installed. Reinstall?',
          default: false,
        },
      ]);

      if (!answer.reinstall) {
        console.log(chalk.dim('Setup cancelled.'));
        return;
      }

      console.log(chalk.blue('Reinstalling launch agent...'));
    } else {
      console.log(chalk.blue('Installing launch agent...'));
    }

    const { nodePath, cliPath } = await install();

    console.log(chalk.green('✓ Launch agent installed successfully!'));
    console.log();
    console.log(chalk.bold('Configuration:'));
    console.log(chalk.dim(`  Plist file: ${getPlistPath()}`));
    console.log(chalk.dim(`  Node path: ${nodePath}`));
    console.log(chalk.dim(`  CLI path: ${cliPath}`));
    console.log(chalk.dim(`  Schedule: Daily at 5:00 AM`));
    console.log();
    console.log(chalk.yellow('Your reading list will be automatically cleared at 5:00 AM every day.'));
    console.log();
    console.log(chalk.dim('To manually trigger cleanup:'));
    console.log(chalk.dim('  launchctl start com.read-later-today.cleanup'));
    console.log();
    console.log(chalk.dim('To check logs:'));
    console.log(chalk.dim('  cat /tmp/read-later-today-cleanup.log'));
  } catch (error) {
    console.error(chalk.red('Error: Failed to install launch agent'));
    console.error(error instanceof Error ? error.message : 'Unknown error');
    console.log();
    console.log(chalk.yellow('Troubleshooting:'));
    console.log(chalk.dim('  1. Ensure you have permission to write to ~/Library/LaunchAgents/'));
    console.log(chalk.dim('  2. Check if launchctl is available on your system'));
    console.log(chalk.dim('  3. Run: npm run build (to ensure dist/index.js exists)'));
    process.exit(1);
  }
}
