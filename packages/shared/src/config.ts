/**
 * Config loading utilities
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import type { Config } from './types.js';

export const CONFIG_DIR = path.join(os.homedir(), '.config', 'discord-tool');

let configCache: Config | null = null;

/**
 * Load configuration from CONFIG_DIR/config.json
 * Uses an in-memory cache for performance.
 */
export function loadConfig(): Config {
  if (configCache) return configCache;

  const configPath = path.join(CONFIG_DIR, 'config.json');
  if (!fs.existsSync(configPath)) {
    throw new Error(`Config not found at ${configPath}. Please create it.`);
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as Config;
  configCache = config;
  return config;
}

/**
 * Clear the config cache (useful for testing)
 */
export function clearConfigCache(): void {
  configCache = null;
}