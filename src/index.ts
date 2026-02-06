#!/usr/bin/env node

import { Command } from 'commander';
import { addCommand } from './commands/add.js';
import { resumeCommand } from './commands/resume.js';
import { removeCommand } from './commands/remove.js';
import { removeAllCommand } from './commands/removeAll.js';
import { setupCommand } from './commands/setup.js';
import { uninstallCommand } from './commands/uninstall.js';
import { cleanupCommand } from './commands/cleanup.js';

const program = new Command();

program
  .name('read-later-today')
  .description('CLI tool to manage reading material URLs with automatic daily cleanup')
  .version('1.0.0');

program
  .command('add')
  .description('Add a URL to your reading list')
  .argument('<url>', 'URL to add')
  .action(addCommand);

program
  .command('resume')
  .description('Open a saved URL in your browser')
  .action(resumeCommand);

program
  .command('remove')
  .description('Remove a URL from your reading list')
  .action(removeCommand);

program
  .command('removeAll')
  .description('Remove all URLs from your reading list')
  .action(removeAllCommand);

program
  .command('setup')
  .description('Install the launch agent for automatic daily cleanup at 5AM')
  .action(setupCommand);

program
  .command('uninstall')
  .description('Remove the launch agent and optionally delete data')
  .action(uninstallCommand);

program
  .command('cleanup')
  .description('Internal command used by the launch agent (clears all URLs)')
  .action(cleanupCommand);

program.parse();
