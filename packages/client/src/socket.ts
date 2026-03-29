import { Socket } from 'net';
import * as fs from 'fs';
import { spawn } from 'child_process';
import axios from 'axios';
import { loadConfig, SOCKET_PATH, Config } from '@discord-tool/shared';

export function resolveGuildId(input: string): string {
  const config = loadConfig();
  
  // Handle empty input
  if (!input || input === '') {
    throw new Error('Guild ID or name required. Use -g flag or specify as argument.');
  }
  
  // If input looks like a number, assume it's already an ID
  if (/^\d+$/.test(input)) {
    return input;
  }
  
  // Check if it's a named guild in config
  if (config.guilds && input in config.guilds) {
    return config.guilds[input];
  }
  
  // Not found
  throw new Error(`Unknown guild: ${input}. Add it to config.json under "guilds" or use the numeric ID.`);
}

function resolveChannelId(guildId: string, input: string): string {
  // If input looks like a number, assume it's already an ID
  if (/^\d+$/.test(input)) {
    return input;
  }
  
  // Note: Channel resolution requires API call, handled in join action
  // This function just validates the format
  return input;  // Will be resolved via API in the action
}

export async function fetchGuildChannels(guildId: string): Promise<any[]> {
  const config = loadConfig();
  const url = `https://discord.com/api/v10/guilds/${guildId}/channels`;
  const response = await axios.get(url, {
    headers: {
      'Authorization': `Bot ${config.botToken}`
    }
  });
  return response.data;
}

export async function sendCommand(cmd: any): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(SOCKET_PATH)) {
      reject(new Error('Server not running. Use "join" to start the server.'));
      return;
    }
    
    const socket = new Socket();
    let resolved = false;
    
    const finish = (response: any) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeoutId);
      socket.destroy();
      resolve(response);
    };
    
    socket.connect(SOCKET_PATH, () => {
      socket.write(JSON.stringify(cmd) + '\n');
      // Don't call end() - let server close the connection
    });
    
    let data = '';
    socket.on('data', (chunk: Buffer) => {
      data += chunk.toString();
      // Try to parse immediately
      try {
        const response = JSON.parse(data.trim());
        finish(response);
      } catch (e) {
        // Not complete yet
      }
    });
    
    socket.on('end', () => {
      try {
        const response = JSON.parse(data.trim());
        finish(response);
      } catch (e) {
        reject(new Error('Invalid server response'));
      }
    });
    
    socket.on('error', (err: Error) => {
      finish({ error: err.message });
    });
    
    // Timeout after 5 seconds
    const timeoutId = setTimeout(() => {
      finish({ error: 'Request timeout' });
    }, 5000);
  });
}

export async function ensureServerRunning(guildId: string, channelId: string): Promise<void> {
  if (fs.existsSync(SOCKET_PATH)) {
    // Socket exists - check if already in the right channel
    try {
      const status = await sendCommand({ type: 'status' });
      if (status.channel?.id === channelId) {
        console.log('[Client] Already in channel');
        return;
      }
      // Different channel - need to leave and rejoin
      console.log('[Client] Leaving current channel to join new one...');
      await sendCommand({ type: 'leave' });
      // Wait for socket to be cleaned up
      for (let i = 0; i < 10; i++) {
        await new Promise(r => setTimeout(r, 100));
        if (!fs.existsSync(SOCKET_PATH)) break;
      }
    } catch (e) {
      // Socket exists but server not responding - probably stale, remove and restart
      fs.unlinkSync(SOCKET_PATH);
    }
  }
  
  console.log('[Client] Starting server...');
  
  return new Promise((resolve, reject) => {
    // Spawn detached so CLI can exit while server runs
    const child = spawn('discord-tool-daemon', [channelId], {
      stdio: 'ignore',
      detached: true,
    });
    
    child.unref();
    
    child.on('error', (err) => {
      console.error('[Client] Spawn error:', err.message);
    });
    
    const waitForSocket = async () => {
      for (let i = 0; i < 60; i++) {  // 60 * 100ms = 6s max wait
        await new Promise(r => setTimeout(r, 100));  // 100ms polling for faster feedback
        if (fs.existsSync(SOCKET_PATH)) {
          console.log('[Client] Server started (running in background)');
          resolve();
          return;
        }
      }
      reject(new Error('Server failed to start'));
    };
    
    waitForSocket();
  });
}