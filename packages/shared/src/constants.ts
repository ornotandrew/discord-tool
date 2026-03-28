/**
 * Shared constants
 */

import * as path from 'path';
import * as os from 'os';

/**
 * Unix socket path for client↔server communication
 */
export const SOCKET_PATH = '/tmp/discord-tool.sock';

/**
 * Get the TTS temporary directory
 */
export function TTS_DIR(): string {
  return path.join(os.tmpdir(), 'discord-tool-tts');
}