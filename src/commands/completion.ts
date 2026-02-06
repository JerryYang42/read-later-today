import chalk from 'chalk';
import { install, uninstall } from 'tabtab';

const COMPLETION_NAME = 'read-later-today';

export async function installCompletion(): Promise<void> {
  try {
    await install({
      name: COMPLETION_NAME,
      completer: COMPLETION_NAME,
    });

    console.log(chalk.green('✓ Tab completion installed successfully!'));
    console.log();
    console.log(chalk.yellow('Please restart your shell or run:'));
    console.log(chalk.dim('  source ~/.bashrc    # for bash'));
    console.log(chalk.dim('  source ~/.zshrc     # for zsh'));
    console.log();
    console.log(chalk.dim('Then try: read-later-today <TAB>'));
  } catch (error) {
    console.error(chalk.red('Error: Failed to install tab completion'));
    console.error(error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

export async function uninstallCompletion(): Promise<void> {
  try {
    await uninstall({
      name: COMPLETION_NAME,
    });

    console.log(chalk.green('✓ Tab completion uninstalled successfully!'));
  } catch (error) {
    console.error(chalk.red('Error: Failed to uninstall tab completion'));
    console.error(error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

export function getCompletions(): string[] {
  // Return only the main user-facing commands
  return ['add', 'resume', 'rm'];
}
