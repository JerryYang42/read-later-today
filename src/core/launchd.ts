import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);

const PLIST_LABEL = 'com.read-later-today.cleanup';
const PLIST_PATH = path.join(
  os.homedir(),
  'Library',
  'LaunchAgents',
  `${PLIST_LABEL}.plist`
);

export function getPlistPath(): string {
  return PLIST_PATH;
}

export function isInstalled(): boolean {
  return existsSync(PLIST_PATH);
}

function getCliPath(): string {
  // Get the directory where this file is located
  const currentFile = fileURLToPath(import.meta.url);
  const coreDir = path.dirname(currentFile);
  const srcDir = path.dirname(coreDir);
  const projectDir = path.dirname(srcDir);

  // Path to the compiled index.js in dist
  return path.join(projectDir, 'dist', 'index.js');
}

function generatePlist(): string {
  const nodePath = process.execPath;
  const cliPath = getCliPath();

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${PLIST_LABEL}</string>
    <key>ProgramArguments</key>
    <array>
        <string>${nodePath}</string>
        <string>${cliPath}</string>
        <string>cleanup</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>5</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
    <key>StandardOutPath</key>
    <string>/tmp/read-later-today-cleanup.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/read-later-today-cleanup.err</string>
</dict>
</plist>`;
}

export async function install(): Promise<{ nodePath: string; cliPath: string }> {
  const plistContent = generatePlist();
  const nodePath = process.execPath;
  const cliPath = getCliPath();

  // Ensure LaunchAgents directory exists
  const launchAgentsDir = path.dirname(PLIST_PATH);
  await fs.mkdir(launchAgentsDir, { recursive: true });

  // Write plist file
  await fs.writeFile(PLIST_PATH, plistContent, 'utf-8');

  // Load the agent
  try {
    await execAsync(`launchctl load "${PLIST_PATH}"`);
  } catch (error) {
    // If load fails, remove the plist file
    await fs.unlink(PLIST_PATH).catch(() => {});
    throw new Error(`Failed to load launch agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return { nodePath, cliPath };
}

export async function uninstall(): Promise<void> {
  const errors: string[] = [];

  // Try to unload the agent
  if (isInstalled()) {
    try {
      await execAsync(`launchctl unload "${PLIST_PATH}"`);
    } catch (error) {
      // Best effort - continue even if unload fails
      errors.push(`Failed to unload agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Remove plist file
    try {
      await fs.unlink(PLIST_PATH);
    } catch (error) {
      errors.push(`Failed to remove plist file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  if (errors.length > 0) {
    console.warn('Some cleanup operations failed:', errors.join(', '));
  }
}
