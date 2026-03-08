#!/usr/bin/env node
import { Command } from 'commander';
import { Socket } from 'net';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { spawn } from 'child_process';

const SOCKET_DIR = '/tmp/discord-tool';
const CONFIG_DIR = path.join(os.homedir(), '.config', 'discord-tool');

interface Config {
  botToken: string;
}

function loadConfig(): Config {
  const configPath = path.join(CONFIG_DIR, 'config.json');
  if (!fs.existsSync(configPath)) {
    throw new Error(`Config not found at ${configPath}. Please create it.`);
  }
  return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

async function sendCommand(guildId: string, cmd: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const socketPath = path.join(SOCKET_DIR, `guild-${guildId}.sock`);
    
    if (!fs.existsSync(socketPath)) {
      reject(new Error('Server not running. Use "join" to start the server.'));
      return;
    }
    
    const socket = new Socket();
    
    socket.connect(socketPath, () => {
      socket.write(JSON.stringify(cmd) + '\n');
    });
    
    let data = '';
    socket.on('data', (chunk: Buffer) => {
      data += chunk.toString();
    });
    
    socket.on('end', () => {
      socket.destroy();
      try {
        const response = JSON.parse(data.trim());
        resolve(response);
      } catch (e) {
        reject(new Error('Invalid server response'));
      }
    });
    
    socket.on('error', (err: Error) => {
      socket.destroy();
      reject(err);
    });
    
    // Timeout after 10 seconds
    setTimeout(() => {
      socket.destroy();
      reject(new Error('Request timeout'));
    }, 10000);
  });
}

async function ensureServerRunning(guildId: string, channelId: string): Promise<void> {
  const socketPath = path.join(SOCKET_DIR, `guild-${guildId}.sock`);
  
  if (fs.existsSync(socketPath)) {
    return; // Server already running
  }
  
  console.log('[Client] Starting server...');
  
  return new Promise((resolve, reject) => {
    const serverPath = path.join(__dirname, '../server/dist/index.js');
    
    // Try compiled version first, then source
    let execPath = serverPath;
    if (!fs.existsSync(execPath)) {
      execPath = path.join(__dirname, '../../server/src/index.ts');
    }
    
    const child = spawn('npx', ['tsx', execPath, channelId], {
      cwd: path.join(__dirname, '../../..'),
      stdio: 'inherit',
      detached: false,
    });
    
    // Wait for socket to appear
    const waitForSocket = async () => {
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 500));
        if (fs.existsSync(socketPath)) {
          console.log('[Client] Server started');
          resolve();
          return;
        }
      }
      reject(new Error('Server failed to start'));
    };
    
    waitForSocket();
  });
}

async function findChannelByName(guildId: string, name: string): Promise<string | null> {
  // For now, require explicit channel ID
  // Could extend to fetch channels via API
  return null;
}

const program = new Command();

program
  .name('discord-tool')
  .description('CLI client for Discord voice bot')
  .version('1.0.0');

program
  .command('join')
  .description('Join a voice channel')
  .argument('<channel_id>', 'Voice channel ID')
  .option('-g, --guild <guild_id>', 'Guild ID (defaults to first available)')
  .action(async (channelId: string, options: any) => {
    try {
      const config = loadConfig();
      
      // For now, use a simple approach - prompt for guild ID if not provided
      let guildId = options.guild;
      
      if (!guildId) {
        console.log('Guild ID required. You can get it from Discord (Developer Mode -> Copy ID)');
        console.log('Usage: discord-tool join <channel_id> -g <guild_id>');
        process.exit(1);
      }
      
      await ensureServerRunning(guildId, channelId);
      
      // Wait a moment for server to be ready
      await new Promise(r => setTimeout(r, 1000));
      
      const status = await sendCommand(guildId, { type: 'status' });
      console.log('Joined!', status);
    } catch (err: any) {
      console.error('Error:', err.message);
      process.exit(1);
    }
  });

program
  .command('leave')
  .description('Leave the voice channel')
  .argument('<guild_id>', 'Guild ID')
  .action(async (guildId: string) => {
    try {
      const result = await sendCommand(guildId, { type: 'leave' });
      console.log(result);
    } catch (err: any) {
      console.error('Error:', err.message);
      process.exit(1);
    }
  });

program
  .command('play')
  .description('Play an audio file')
  .argument('<guild_id>', 'Guild ID')
  .argument('<file>', 'Audio file path')
  .action(async (guildId: string, file: string) => {
    try {
      const result = await sendCommand(guildId, { type: 'play', file });
      console.log(result);
    } catch (err: any) {
      console.error('Error:', err.message);
      process.exit(1);
    }
  });

program
  .command('tts')
  .description('Generate and play TTS')
  .argument('<guild_id>', 'Guild ID')
  .argument('<text>', 'Text to speak')
  .option('-v, --voice <voice>', 'Voice to use (default: en-US-AriaNeural)')
  .action(async (guildId: string, text: string, options: any) => {
    try {
      const result = await sendCommand(guildId, { 
        type: 'tts', 
        text,
        voice: options.voice || 'en-US-AriaNeural'
      });
      console.log(result);
    } catch (err: any) {
      console.error('Error:', err.message);
      process.exit(1);
    }
  });

program
  .command('status')
  .description('Get current status')
  .argument('<guild_id>', 'Guild ID')
  .action(async (guildId: string) => {
    try {
      const result = await sendCommand(guildId, { type: 'status' });
      console.log(JSON.stringify(result, null, 2));
    } catch (err: any) {
      console.error('Error:', err.message);
      process.exit(1);
    }
  });

program
  .command('queue')
  .description('Show current queue')
  .argument('<guild_id>', 'Guild ID')
  .action(async (guildId: string) => {
    try {
      const result = await sendCommand(guildId, { type: 'queue' });
      console.log(JSON.stringify(result, null, 2));
    } catch (err: any) {
      console.error('Error:', err.message);
      process.exit(1);
    }
  });

program
  .command('skip')
  .description('Skip current track')
  .argument('<guild_id>', 'Guild ID')
  .action(async (guildId: string) => {
    try {
      const result = await sendCommand(guildId, { type: 'skip' });
      console.log(result);
    } catch (err: any) {
      console.error('Error:', err.message);
      process.exit(1);
    }
  });

program
  .command('pause')
  .description('Pause playback')
  .argument('<guild_id>', 'Guild ID')
  .action(async (guildId: string) => {
    try {
      const result = await sendCommand(guildId, { type: 'pause' });
      console.log(result);
    } catch (err: any) {
      console.error('Error:', err.message);
      process.exit(1);
    }
  });

program
  .command('resume')
  .description('Resume playback')
  .argument('<guild_id>', 'Guild ID')
  .action(async (guildId: string) => {
    try {
      const result = await sendCommand(guildId, { type: 'resume' });
      console.log(result);
    } catch (err: any) {
      console.error('Error:', err.message);
      process.exit(1);
    }
  });

program
  .command('clear')
  .description('Clear the queue')
  .argument('<guild_id>', 'Guild ID')
  .action(async (guildId: string) => {
    try {
      const result = await sendCommand(guildId, { type: 'clear' });
      console.log(result);
    } catch (err: any) {
      console.error('Error:', err.message);
      process.exit(1);
    }
  });

program.parse();
