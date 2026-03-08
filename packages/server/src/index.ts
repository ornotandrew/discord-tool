import { Client, GatewayIntentBits, VoiceChannel } from 'discord.js';
import { createServer as createUnixServer, Socket } from 'net';
import { joinVoiceChannel, createAudioPlayer, VoiceConnectionStatus, entersState, DiscordGatewayAdapterCreator, AudioResource, createAudioResource } from '@discordjs/voice';
import { Communicate } from 'edge-tts-universal';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { randomUUID } from 'crypto';

const CONFIG_DIR = path.join(os.homedir(), '.config', 'discord-tool');
const SOCKET_DIR = '/tmp/discord-tool';
const TTS_DIR = path.join(os.tmpdir(), 'discord-tool-tts');

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
let client: any = null;
let currentResource: AudioResource | null = null;

async function main() {
  const channelId = process.argv[2];
  if (!channelId) {
    console.error('Usage: server <channel_id>');
    process.exit(1);
  }

  console.log(`[Server] Starting for channel: ${channelId}`);
  
  const config = loadConfig();
  console.log('[Server] Config loaded');

  // Ensure TTS directory exists
  await fs.promises.mkdir(TTS_DIR, { recursive: true });

  client = new Client({
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
    
    const guild = client.guilds.cache.get(state.guildId);
    if (!guild) {
      console.error(`[Server] Guild ${state.guildId} not found`);
      process.exit(1);
    }
    
    try {
      voiceConnection = joinVoiceChannel({
        channelId: channelId,
        guildId: state.guildId,
        adapterCreator: guild.voiceAdapterCreator as unknown as DiscordGatewayAdapterCreator,
        selfDeaf: true,
        selfMute: false,
      });
      
      audioPlayer = createAudioPlayer();
      voiceConnection.subscribe(audioPlayer);
      
      // Debug: log audio player state changes
      audioPlayer.on('stateChange', (oldState: any, newState: any) => {
        console.log(`[Audio Player] State change: ${oldState.status} -> ${newState.status}`);
      });
      
      audioPlayer.on('speaking', (speaking: any) => {
        console.log(`[Audio Player] Speaking: ${speaking}`);
      });
      
      // Debug: log voice connection events
      voiceConnection.on('debug', (msg: string) => console.log('[Voice Debug]:', msg));
      voiceConnection.on('error', (err: Error) => console.error('[Voice Error]:', err));
      voiceConnection.on('stateChange', (oldState: any, newState: any) => {
        console.log(`[Voice Connection] State change: ${oldState.status} -> ${newState.status}`);
      });
      
      // Set up event listener for when track finishes
      audioPlayer.on('idle', () => {
        console.log('[Server] Track finished, playing next');
        playNextInQueue();
      });
      
      audioPlayer.on('error', (error: Error) => {
        console.error('[Server] Audio player error:', error);
        playNextInQueue();
      });
      
      console.log('[Server] Waiting for voice connection (60s timeout)...');
      await entersState(voiceConnection, VoiceConnectionStatus.Ready, 60_000);
      
      state.connected = true;
      console.log('[Server] Joined voice channel');
      
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
  await fs.promises.mkdir(SOCKET_DIR, { recursive: true });
  
  if (fs.existsSync(socketPath)) {
    await fs.promises.unlink(socketPath);
  }
  
  const server = createUnixServer((socket: Socket) => {
    console.log('[Server] Client connected');
    
    let buffer = '';
    socket.on('data', (data: Buffer) => {
      buffer += data.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (line.trim()) {
          handleCommand(line, socket);
        }
      }
    });
    
    socket.on('close', () => {
      console.log('[Server] Client disconnected');
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
        if (!cmd.file) {
          response = { error: 'Missing file path' };
        } else if (!fs.existsSync(cmd.file)) {
          response = { error: 'File not found' };
        } else {
          const item: AudioQueueItem = {
            id: randomUUID(),
            type: 'file',
            path: cmd.file,
          };
          state.queue.push(item);
          response = { success: true, message: 'Added to queue', item };
          
          // Start playing if nothing is playing
          if (!state.currentTrack && state.connected) {
            playNextInQueue();
          }
        }
        break;
        
      case 'tts':
        if (!cmd.text) {
          response = { error: 'Missing text' };
        } else {
          const item: AudioQueueItem = {
            id: randomUUID(),
            type: 'tts',
            text: cmd.text,
            voice: cmd.voice || 'en-US-AriaNeural',
          };
          state.queue.push(item);
          response = { success: true, message: 'TTS queued', item };
          
          // Start playing if nothing is playing
          if (!state.currentTrack && state.connected) {
            playNextInQueue();
          }
        }
        break;
        
      case 'skip':
        if (state.currentTrack) {
          audioPlayer.stop();
          response = { success: true, message: 'Skipped' };
        } else {
          response = { error: 'Nothing playing' };
        }
        break;
        
      case 'pause':
        if (audioPlayer) {
          audioPlayer.pause();
          state.paused = true;
          response = { success: true, message: 'Paused' };
        } else {
          response = { error: 'Not playing' };
        }
        break;
        
      case 'resume':
        if (audioPlayer) {
          audioPlayer.unpause();
          state.paused = false;
          response = { success: true, message: 'Resumed' };
        } else {
          response = { error: 'Not playing' };
        }
        break;
        
      case 'clear':
        state.queue = [];
        response = { success: true, message: 'Queue cleared' };
        break;
        
      case 'leave':
        if (voiceConnection) {
          voiceConnection.destroy();
          voiceConnection = null;
        }
        state.connected = false;
        state.queue = [];
        state.currentTrack = null;
        
        if (client) {
          client.destroy();
          client = null;
        }
        
        response = { success: true, message: 'Left channel' };
        
        // Exit process after a short delay
        setTimeout(() => {
          process.exit(0);
        }, 500);
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

async function playNextInQueue(): Promise<void> {
  if (state.queue.length === 0) {
    state.currentTrack = null;
    console.log('[Server] Queue empty');
    return;
  }
  
  const item = state.queue.shift()!;
  state.currentTrack = item;
  console.log(`[Server] Playing: ${item.type} - ${item.id}`);
  
  try {
    let audioPath: string;
    
    if (item.type === 'file' && item.path) {
      audioPath = item.path;
    } else if (item.type === 'tts' && item.text) {
      // Generate TTS audio
      audioPath = await generateTTS(item.text, item.voice || 'en-US-AriaNeural');
    } else {
      console.error('[Server] Invalid queue item');
      playNextInQueue();
      return;
    }
    
    // Clean up old TTS files after some time
    if (item.type === 'tts') {
      setTimeout(() => {
        if (fs.existsSync(audioPath)) {
          fs.unlink(audioPath, () => {});
        }
      }, 60000); // Clean up after 1 minute
    }
    
    // Create and play audio resource
    currentResource = createAudioResource(audioPath);
    
    audioPlayer.play(currentResource);
    console.log(`[Server] Started playing: ${audioPath}`);
    
  } catch (err) {
    console.error('[Server] Error playing track:', err);
    playNextInQueue();
  }
}

async function generateTTS(text: string, voice: string): Promise<string> {
  const outputPath = path.join(TTS_DIR, `tts-${randomUUID()}.mp3`);
  
  console.log(`[Server] Generating TTS: "${text.substring(0, 50)}..." with voice ${voice}`);
  
  const tts = new Communicate(text, { voice });
  const stream = await tts.stream();
  
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    if (chunk.data) {
      chunks.push(chunk.data);
    }
  }
  
  const buffer = Buffer.concat(chunks);
  await fs.promises.writeFile(outputPath, buffer);
  
  console.log(`[Server] TTS generated: ${outputPath}`);
  return outputPath;
}

main().catch(err => {
  console.error('[Server] Fatal error:', err);
  process.exit(1);
});
