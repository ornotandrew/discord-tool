import { Client, GatewayIntentBits, VoiceChannel } from 'discord.js';
import { createServer as createUnixServer, Socket } from 'net';
import { joinVoiceChannel, createAudioPlayer, VoiceConnectionStatus, entersState, DiscordGatewayAdapterCreator } from '@discordjs/voice';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const CONFIG_DIR = path.join(os.homedir(), '.config', 'discord-tool');
const SOCKET_DIR = '/tmp/discord-tool';

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

interface AudioQueueItem {
  id: string;
  type: 'file' | 'tts';
  path?: string;      // for file type
  text?: string;      // for tts type
  voice?: string;     // for tts type
}

interface ServerState {
  connected: boolean;
  guildId: string | null;
  channelId: string | null;
  currentTrack: AudioQueueItem | null;
  queue: AudioQueueItem[];
  paused: boolean;
}

const state: ServerState = {
  connected: false,
  guildId: null,
  channelId: null,
  currentTrack: null,
  queue: [],
  paused: false,
};

let voiceConnection: any = null;
let audioPlayer: any = null;

async function main() {
  const channelId = process.argv[2];
  if (!channelId) {
    console.error('Usage: server <channel_id>');
    process.exit(1);
  }

  console.log(`[Server] Starting for channel: ${channelId}`);
  
  const config = loadConfig();
  console.log('[Server] Config loaded');

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildVoiceStates,
    ],
  });

  client.once('ready', async () => {
    console.log(`[Server] Client ready as ${client.user?.tag}`);
    
    const channel = await client.channels.fetch(channelId);
    if (!channel || !channel.isVoiceBased()) {
      console.error(`[Server] Channel ${channelId} is not a voice channel`);
      process.exit(1);
    }
    
    const voiceChannel = channel as VoiceChannel;
    state.guildId = voiceChannel.guildId;
    state.channelId = channelId;
    
    console.log(`[Server] Guild: ${state.guildId}, Channel: ${channelId}`);
    
    // Get the guild's voice adapter
    const guild = client.guilds.cache.get(state.guildId);
    if (!guild) {
      console.error(`[Server] Guild ${state.guildId} not found`);
      process.exit(1);
    }
    
    // Join voice channel using @discordjs/voice
    // Cast adapterCreator to avoid version mismatch between discord.js and @discordjs/voice
    try {
      voiceConnection = joinVoiceChannel({
        channelId: channelId,
        guildId: state.guildId,
        adapterCreator: guild.voiceAdapterCreator as unknown as DiscordGatewayAdapterCreator,
        selfDeaf: true,
        selfMute: false,
      });
      
      // Create audio player
      audioPlayer = createAudioPlayer();
      voiceConnection.subscribe(audioPlayer);
      
      // Wait for connection to be ready
      await entersState(voiceConnection, VoiceConnectionStatus.Ready, 30_000);
      
      state.connected = true;
      console.log('[Server] Joined voice channel');
      
      // Create Unix socket
      const socketPath = path.join(SOCKET_DIR, `guild-${state.guildId}.sock`);
      await setupUnixSocket(socketPath);
    } catch (err) {
      console.error('[Server] Failed to join voice channel:', err);
      process.exit(1);
    }
  });

  await client.login(config.botToken);
}

async function setupUnixSocket(socketPath: string): Promise<void> {
  // Ensure directory exists
  await fs.promises.mkdir(SOCKET_DIR, { recursive: true });
  
  // Remove existing socket
  if (fs.existsSync(socketPath)) {
    await fs.promises.unlink(socketPath);
  }
  
  const server = createUnixServer((socket: Socket) => {
    console.log('[Server] Client connected');
    
    let buffer = '';
    socket.on('data', (data: Buffer) => {
      buffer += data.toString();
      // Simple JSON parsing - assume complete JSON per message
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (line.trim()) {
          handleCommand(line, socket);
        }
      }
    });
  });
  
  server.listen(socketPath);
  console.log(`[Server] Unix socket listening at ${socketPath}`);
}

function handleCommand(json: string, socket: Socket): void {
  try {
    const cmd = JSON.parse(json);
    console.log('[Server] Received command:', cmd);
    
    let response: any;
    
    switch (cmd.type) {
      case 'status':
        response = { 
          connected: state.connected, 
          guildId: state.guildId, 
          channelId: state.channelId,
          currentTrack: state.currentTrack,
          queueLength: state.queue.length,
          paused: state.paused,
        };
        break;
        
      case 'queue':
        response = { queue: state.queue };
        break;
        
      case 'play':
        // TODO: Add to queue
        response = { success: true, message: 'Added to queue' };
        break;
        
      case 'tts':
        // TODO: Generate TTS and add to queue
        response = { success: true, message: 'TTS queued' };
        break;
        
      case 'leave':
        // TODO: Leave channel and exit
        response = { success: true, message: 'Leaving' };
        break;
        
      default:
        response = { error: 'Unknown command' };
    }
    
    socket.write(JSON.stringify(response) + '\n');
  } catch (err) {
    console.error('[Server] Command error:', err);
    socket.write(JSON.stringify({ error: 'Invalid command' }) + '\n');
  }
}

main().catch(err => {
  console.error('[Server] Fatal error:', err);
  process.exit(1);
});
