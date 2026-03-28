#!/usr/bin/env node
import { Command } from 'commander';
import { Socket } from 'net';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { listVoices, VoicesManager } from 'edge-tts-universal';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOCKET_PATH = '/tmp/discord-tool.sock';
const CONFIG_DIR = path.join(os.homedir(), '.config', 'discord-tool');

interface Config {
  botToken: string;
  guilds?: Record<string, string>;
  defaultTtsVoice?: string;
}

let configCache: Config | null = null;

function loadConfig(): Config {
  if (configCache) return configCache;
  
  const configPath = path.join(CONFIG_DIR, 'config.json');
  if (!fs.existsSync(configPath)) {
    throw new Error(`Config not found at ${configPath}. Please create it.`);
  }
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as Config;
  configCache = config;
  return config;
}

function resolveGuildId(input: string): string {
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

async function fetchGuildChannels(guildId: string): Promise<any[]> {
  const config = loadConfig();
  const url = `https://discord.com/api/v10/guilds/${guildId}/channels`;
  const response = await axios.get(url, {
    headers: {
      'Authorization': `Bot ${config.botToken}`
    }
  });
  return response.data;
}

async function sendCommand(cmd: any): Promise<any> {
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

async function ensureServerRunning(guildId: string, channelId: string): Promise<void> {
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

const program = new Command();

program
  .name('discord-tool')
  .description('CLI client for Discord voice bot')
  .version('1.0.0');

program
  .command('join')
  .description('Join a voice channel')
  .argument('<guild_id>', 'Guild ID (or name from config)')
  .argument('<channel_id>', 'Voice channel ID')
  .action(async (guildId: string, channelId: string) => {
    try {
      loadConfig();
      guildId = resolveGuildId(guildId);  // Resolve name to ID
      
      // Resolve channel name to ID if needed
      if (!/^\d+$/.test(channelId)) {
        const channels = await fetchGuildChannels(guildId);
        const channel = channels.find((ch: any) => 
          ch.name.toLowerCase() === channelId.toLowerCase() && ch.type === 2
        );
        if (!channel) {
          console.error(`Channel "${channelId}" not found in guild. Use numeric ID or exact name.`);
          process.exit(1);
        }
        channelId = channel.id;
        console.log(`[Client] Resolved "${channelId}" to channel ID ${channelId}`);
      }
      
      await ensureServerRunning(guildId, channelId);
      
      // Server socket only exists after voice connection is ready, so no extra wait needed
      const status = await sendCommand({ type: 'status' });
      console.log(JSON.stringify(status, null, 2));
      
      // Give the child process time to stabilize before exiting
      // Use setImmediate to ensure all async operations are flushed
      await new Promise(resolve => setTimeout(resolve, 1000));
      process.exit(0);
    } catch (err: any) {
      console.error('Error:', err.message);
      process.exit(1);
    }
  });

program
  .command('voices')
  .description('List all available Edge TTS voices')
  .option('-l, --lang <language>', 'Filter by language code (e.g., en, zh, de)')
  .option('-g, --gender <gender>', 'Filter by gender (Male, Female)')
  .option('-f, --full', 'Show full voice list without grouping')
  .action(async (options: any) => {
    try {
      console.log('Fetching available voices...');
      const voicesManager = await VoicesManager.create();
      
      let voices = voicesManager.find({});
      
      // Apply filters
      if (options.lang) {
        const langFilter = options.lang.toLowerCase();
        voices = voicesManager.find({ Language: langFilter });
      }
      
      if (options.gender) {
        const genderFilter = options.gender.charAt(0).toUpperCase() + options.gender.slice(1).toLowerCase();
        if (genderFilter === 'Male' || genderFilter === 'Female') {
          voices = voices.filter((v: any) => v.Gender === genderFilter);
        } else {
          console.error('Gender must be Male or Female');
          process.exit(1);
        }
      }
      
      if (options.full) {
        // Show full flat list
        console.log(`\n${voices.length} voices found:\n`);
        for (const voice of voices) {
          const genderIcon = voice.Gender === 'Female' ? '♀' : '♂';
          console.log(`  ${voice.ShortName.padEnd(40)} ${genderIcon} ${voice.Locale}`);
        }
        return;
      }
      
      // Group by language/region
      const byLocale: Record<string, any[]> = {};
      for (const voice of voices) {
        const locale = voice.Locale;
        if (!byLocale[locale]) byLocale[locale] = [];
        byLocale[locale].push(voice);
      }
      
      // Sort locales
      const sortedLocales = Object.keys(byLocale).sort();
      
      console.log(`\n${voices.length} voices found in ${sortedLocales.length} locales:\n`);
      
      for (const locale of sortedLocales) {
        const localeVoices = byLocale[locale];
        // Get language name from locale
        const langCode = locale.split('-')[0];
        
        console.log(`🌐 ${locale} (${langCode}) — ${localeVoices.length} voices`);
        for (const voice of localeVoices) {
          const genderIcon = voice.Gender === 'Female' ? '♀' : '♂';
          console.log(`   ${genderIcon} ${voice.ShortName}`);
        }
        console.log('');
      }
    } catch (err: any) {
      console.error('Error:', err.message);
      process.exit(1);
    }
  });

program
  .command('leave')
  .description('Leave the voice channel')
  .action(async () => {
    try {
      const result = await sendCommand({ type: 'leave' });
      console.log(JSON.stringify(result, null, 2));
    } catch (err: any) {
      console.error(JSON.stringify({ error: err.message }));
      process.exit(1);
    }
  });

program
  .command('play')
  .description('Play an audio file')
  .argument('<file>', 'Audio file path')
  .action(async (file: string) => {
    try {
      const result = await sendCommand({ type: 'play', file });
      console.log(JSON.stringify(result, null, 2));
    } catch (err: any) {
      console.error(JSON.stringify({ error: err.message }));
      process.exit(1);
    }
  });

program
  .command('tts')
  .description('Generate and play TTS')
  .argument('<text>', 'Text to speak')
  .option('-v, --voice <voice>', 'Voice to use')
  .action(async (text: string, options: any) => {
    try {
      const config = loadConfig();
      const result = await sendCommand({ 
        type: 'tts', 
        text,
        voice: options.voice || config.defaultTtsVoice || 'en-US-AriaNeural'
      });
      console.log(JSON.stringify(result, null, 2));
    } catch (err: any) {
      console.error(JSON.stringify({ error: err.message }));
      process.exit(1);
    }
  });

program
  .command('status')
  .description('Get current status')
  .action(async () => {
    try {
      const result = await sendCommand({ type: 'status' });
      console.log(JSON.stringify(result, null, 2));
    } catch (err: any) {
      console.error(JSON.stringify({ error: err.message }));
      process.exit(1);
    }
  });

program
  .command('queue')
  .description('Show current queue')
  .action(async () => {
    try {
      const result = await sendCommand({ type: 'queue' });
      console.log(JSON.stringify(result, null, 2));
    } catch (err: any) {
      console.error(JSON.stringify({ error: err.message }));
      process.exit(1);
    }
  });

program
  .command('skip')
  .description('Skip current track')
  .action(async () => {
    try {
      const result = await sendCommand({ type: 'skip' });
      console.log(JSON.stringify(result, null, 2));
    } catch (err: any) {
      console.error(JSON.stringify({ error: err.message }));
      process.exit(1);
    }
  });

program
  .command('pause')
  .description('Pause playback')
  .action(async () => {
    try {
      const result = await sendCommand({ type: 'pause' });
      console.log(JSON.stringify(result, null, 2));
    } catch (err: any) {
      console.error(JSON.stringify({ error: err.message }));
      process.exit(1);
    }
  });

program
  .command('resume')
  .description('Resume playback')
  .action(async () => {
    try {
      const result = await sendCommand({ type: 'resume' });
      console.log(JSON.stringify(result, null, 2));
    } catch (err: any) {
      console.error(JSON.stringify({ error: err.message }));
      process.exit(1);
    }
  });

program
  .command('clear')
  .description('Clear the queue')
  .action(async () => {
    try {
      const result = await sendCommand({ type: 'clear' });
      console.log(JSON.stringify(result, null, 2));
    } catch (err: any) {
      console.error(JSON.stringify({ error: err.message }));
      process.exit(1);
    }
  });

program
  .command('channels')
  .description('List all channels in a guild')
  .option('-g, --guild <guild_id>', 'Guild ID (or name from config). Uses connected guild if omitted.')
  .option('-t, --type <type>', 'Filter by channel type (text, voice, category)')
  .action(async (options: any) => {
    const inputGuildId = options.guild;
    try {
      let guildId = inputGuildId;
      
      // If no guild specified, try to get from current connection
      if (!guildId) {
        const status = await sendCommand({ type: 'status' });
        if (status.connected && status.guild?.id) {
          guildId = status.guild.id;
        } else {
          console.log(JSON.stringify({ error: 'Not connected. Specify a guild ID.' }));
          process.exit(1);
        }
      } else {
        guildId = resolveGuildId(guildId);
      }
      
      // Try to get voice channels with users from server first
      try {
        const status = await sendCommand({ type: 'status' });
        if (status.connected && status.guild?.id === guildId) {
          const result = await sendCommand({ type: 'guild-channels' });
          console.log(JSON.stringify(result, null, 2));
          return;
        }
      } catch (e) {
        // Server command failed, fall through to API
      }
      
      // Fall back to direct API call
      const channels = await fetchGuildChannels(guildId!);
      console.log(JSON.stringify({ channels }, null, 2));
    } catch (err: any) {
      console.error(JSON.stringify({ error: err.message }));
      process.exit(1);
    }
  });

program.parse();